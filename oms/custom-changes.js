import { customShipmentStops, customCargoRoute, customCargoIdentities, addressTypes, packaging, serviceOptions, unitSettings, displayMeasurement, hazardClasses, packingGroups } from './model.js?v=account-layout';

const sides = ['origin', 'destination'];
const regulated = { hazmat: '危险品', alcohol: '酒类', tobacco: '烟草／尼古丁' };
const pieces = { carton: '纸箱', box: '箱', bag: '袋', piece: '件' };
const hazardLabels = { hazardClass: '危险品类别', hazardId: 'UN / NA 编号', hazardPackage: '危险品包装类型', hazardQuantity: '危险品包装数量', shippingName: '正式运输名称', packingGroup: '包装等级', emergencyFirstName: '紧急联系人名', emergencyLastName: '紧急联系人姓', emergencyCompany: '紧急联系公司', emergencyPhone: '紧急联系电话' };
const text = value => String(value ?? '').trim();
const numeric = value => value === '' || value == null ? '' : Number(value);
const phone = value => text(value).replace(/[^+0-9]/g, '');
const selected = value => [...new Set(value ?? [])].sort();
const equivalent = (a, b) => typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-6 : JSON.stringify(a) === JSON.stringify(b);
const names = (ids, options) => (ids ?? []).map(id => options[id] ?? id).join('、');
const stopPin = (side, index) => (side === 'origin' ? 'A' : 'B') + (index + 1);
const stopName = (side, index) => (side === 'origin' ? '提货点 ' : '送货点 ') + stopPin(side, index);
const shownStop = stop => [stop.address, stop.date && '日期 ' + stop.date, stop.contact && '联系人 ' + stop.contact, stop.phone, stop.reference && '参考号 ' + stop.reference, stop.notes].filter(Boolean).join('\n');

function fingerprint(value) {
  if (Array.isArray(value)) return value.map(fingerprint);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).filter(key => key !== 'customId').sort().flatMap(key => {
    const next = fingerprint(value[key]);
    return next === '' || next == null || typeof next === 'object' && !Object.keys(next).length ? [] : [[key, next]];
  }));
  return typeof value === 'string' ? value.trim() : value;
}
// Earlier saved tickets predate cargo identities. Match unchanged entries first.
function matchingFields(first, second) {
  if (first && second && typeof first === 'object' && typeof second === 'object') {
    return Object.keys(first).filter(key => key !== 'customId').reduce((sum, key) => sum + matchingFields(first[key], second[key]), 0);
  }
  return first !== '' && first != null && text(first) === text(second) ? 1 : 0;
}
function alignLegacyEntries(original, normalized, raw) {
  const used = new Set(raw.map(entry => entry.customId).filter(Boolean));
  const matches = new Map();
  raw.forEach((entry, index) => {
    if (entry.customId) return;
    const match = original.find(previous => !used.has(previous.customId) && JSON.stringify(fingerprint(previous)) === JSON.stringify(fingerprint(normalized[index])));
    if (match) { used.add(match.customId); matches.set(index, match.customId); }
  });
  return normalized.map((entry, index) => {
    if (raw[index]?.customId) return entry;
    if (matches.has(index)) return { ...entry, customId: matches.get(index) };
    const match = [original[index], ...original].filter(previous => previous && !used.has(previous.customId))
      .sort((first, second) => matchingFields(second, entry) - matchingFields(first, entry))[0];
    if (match) used.add(match.customId);
    return { ...entry, customId: match?.customId ?? 'legacy-added-' + index };
  });
}

export function customRequestChanges({ before = {}, after = {} } = {}) {
  const rows = [];
  const add = (group, label, old, next, target, normalize = text, format = text) => {
    if (equivalent(normalize(old), normalize(next))) return;
    rows.push({ kind: 'changed', group, label, before: format(old), after: format(next), target });
  };
  for (const [name, label] of Object.entries({ contact: '询价联系人', email: '联系邮箱', phone: '联系电话', requirements: '需求说明' })) {
    add('询价资料', label, before[name], after[name], { scope: 'request', name }, name === 'phone' ? phone : text);
  }
  const shipment = request => request.shipment || { origin: request.origin ?? '', destination: request.destination ?? '' };
  const oldStops = customShipmentStops(shipment(before), before.details ?? {});
  const newStops = customShipmentStops(shipment(after), after.details ?? {});
  const stopFields = { address: '地址', addressType: '地址类型', date: '期望日期', contact: '现场联系人', phone: '联系电话', phoneExtension: '分机号', company: '公司名称', unit: '套间／单元', email: '联系邮箱', reference: '参考单号', notes: '备注', services: '附加服务' };
  for (const side of sides) {
    const original = oldStops[side], updated = newStops[side];
    const samePoints = original.length === updated.length && original.every(stop => updated.some(next => next.id === stop.id));
    if (samePoints) add('运输路线', side === 'origin' ? '提货顺序' : '送货顺序', original.map(stop => stop.id), updated.map(stop => stop.id), { scope: 'route', side }, value => value,
      ids => ids.map(id => original.find(stop => stop.id === id)?.address || '未填写地址').join(' → '));
    original.filter(stop => !updated.some(next => next.id === stop.id)).forEach(stop => rows.push({ kind: 'removed', group: stopName(side, original.indexOf(stop)), label: '删除地点', before: shownStop(stop), after: '', target: { scope: 'stop', id: stop.id, side } }));
    updated.forEach((stop, index) => {
      const previous = original.find(entry => entry.id === stop.id);
      const originalIndex = previous ? original.indexOf(previous) : index;
      const group = previous && originalIndex !== index ? stopName(side, originalIndex) + '（现为 ' + stopPin(side, index) + '）' : stopName(side, index);
      if (!previous) { rows.push({ kind: 'added', group, label: '新增地点', before: '', after: shownStop(stop), target: { scope: 'stop', id: stop.id, side } }); return; }
      for (const [name, label] of Object.entries(stopFields)) {
        const format = name === 'addressType' ? value => addressTypes[value] ?? text(value)
          : name === 'services' ? value => (value ?? []).map(id => serviceOptions[side].find(service => service.id === id)?.label ?? id).join('、') || '无' : text;
        add(group, label, previous[name], stop[name], { scope: 'stop', id: stop.id, side, name }, name === 'phone' ? phone : name === 'services' ? selected : text, format);
      }
    });
  }
  const oldCargo = customCargoIdentities(shipment(before)).items;
  const newRaw = shipment(after).items ?? [];
  const newCargo = alignLegacyEntries(oldCargo, customCargoIdentities(shipment(after)).items, newRaw);
  const units = unitSettings[after.units ?? before.units] ?? unitSettings.imperial;
  const measure = (value, factor, unit) => value === '' || value == null ? '' : displayMeasurement(value, factor) + ' ' + unit;
  const cargoSummary = item => [packaging[item.type] ?? item.type, item.quantity + ' 件', item.weight === '' || item.weight == null ? '重量待填' : '单件 ' + measure(item.weight, units.weightFactor, units.weight), [item.length, item.width, item.height].every(value => value !== '' && value != null) ? [item.length, item.width, item.height].map(value => displayMeasurement(value, units.lengthFactor)).join(' × ') + ' ' + units.length : '尺寸待填', ...(item.commodities ?? []).map(commodity => commodity.description)].filter(Boolean).join(' · ');
  oldCargo.filter(item => !newCargo.some(next => next.customId === item.customId)).forEach(item => rows.push({ kind: 'removed', group: '货物 ' + (oldCargo.indexOf(item) + 1), label: '删除货物', before: cargoSummary(item), after: '', target: { scope: 'cargo', id: item.customId } }));
  newCargo.forEach((item, index) => {
    const previous = oldCargo.find(entry => entry.customId === item.customId);
    const originalIndex = previous ? oldCargo.indexOf(previous) : index;
    const group = previous && originalIndex !== index ? '货物 ' + (originalIndex + 1) + '（现为货物 ' + (index + 1) + '）' : '货物 ' + (index + 1);
    const target = { scope: 'cargo', id: item.customId };
    if (!previous) { rows.push({ kind: 'added', group, label: '新增货物', before: '', after: cargoSummary(item), target }); return; }
    for (const [name, label] of Object.entries({ type: '包装类型', quantity: '件数', weight: '单件重量', length: '长', width: '宽', height: '高' })) {
      const format = name === 'type' ? value => packaging[value] ?? text(value) : name === 'weight' ? value => measure(value, units.weightFactor, units.weight) : ['length', 'width', 'height'].includes(name) ? value => measure(value, units.lengthFactor, units.length) : text;
      add(group, label, previous[name], item[name], { ...target, name }, name === 'type' ? text : numeric, format);
    }
    for (const side of sides) {
      const name = side + 'StopId';
      const oldRoute = customCargoRoute(previous, oldStops), newRoute = customCargoRoute(item, newStops);
      if (oldRoute[name] !== newRoute[name]) {
        const routeText = (id, groups) => { const position = groups[side].findIndex(stop => stop.id === id); return position < 0 ? '未选择' : stopPin(side, position) + ' · ' + groups[side][position].address; };
        rows.push({ kind: 'changed', group, label: side === 'origin' ? '对应提货点' : '对应送货点', before: routeText(oldRoute[name], oldStops), after: routeText(newRoute[name], newStops), target: { ...target, name } });
      }
    }
    const oldProducts = previous.commodities, newProducts = alignLegacyEntries(oldProducts, item.commodities, newRaw[index]?.commodities ?? item.commodities);
    const productSummary = commodity => [commodity.description || '未填写描述', commodity.declaredValue && '申报 USD ' + commodity.declaredValue, commodity.nmfc && 'NMFC ' + commodity.nmfc, commodity.freightClass && 'Class ' + commodity.freightClass].filter(Boolean).join(' · ');
    oldProducts.filter(commodity => !newProducts.some(next => next.customId === commodity.customId)).forEach(commodity => rows.push({ kind: 'removed', group: group + ' / 货品 ' + (oldProducts.indexOf(commodity) + 1), label: '删除货品', before: productSummary(commodity), after: '', target: { scope: 'commodity', itemId: item.customId, id: commodity.customId } }));
    newProducts.forEach((commodity, position) => {
      const original = oldProducts.find(entry => entry.customId === commodity.customId);
      const originalPosition = original ? oldProducts.indexOf(original) : position;
      const subgroup = group + ' / 货品 ' + (original && originalPosition !== position ? (originalPosition + 1) + '（现为货品 ' + (position + 1) + '）' : position + 1);
      const productTarget = { scope: 'commodity', itemId: item.customId, id: commodity.customId };
      if (!original) { rows.push({ kind: 'added', group: subgroup, label: '新增货品', before: '', after: productSummary(commodity), target: productTarget }); return; }
      for (const [name, label] of Object.entries({ description: '货品描述', declaredValue: '货值申报 (USD)', nmfc: 'NMFC 编码', freightClass: '货运等级', regulated: '受管制货物申报', pieceType: '内包装类型', pieceCount: '每单位内包装件数' })) {
        const format = name === 'regulated' ? value => names(value, regulated) || '无' : name === 'pieceType' ? value => pieces[value] ?? text(value) : text;
        add(subgroup, label, original[name], commodity[name], { ...productTarget, name: name === 'description' ? 'commodity' : name }, name === 'regulated' ? selected : ['declaredValue', 'pieceCount', 'freightClass'].includes(name) ? numeric : text, format);
      }
      if ((commodity.regulated ?? []).includes('hazmat')) for (const [name, label] of Object.entries(hazardLabels)) {
        const originalHazmat = (original.regulated ?? []).includes('hazmat') ? original.hazmat ?? {} : {};
        add(subgroup, label, originalHazmat[name], commodity.hazmat?.[name], { ...productTarget, name }, name === 'emergencyPhone' ? phone : text,
          name === 'hazardClass' ? value => value ? value + ' · ' + (hazardClasses[value] ?? '') : '' : name === 'packingGroup' ? value => packingGroups[value] ?? text(value) : text);
      }
    });
  });
  return rows;
}
