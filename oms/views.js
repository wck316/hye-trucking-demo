import {
  serviceOptions, selectedServices, addressTypes, addressTypeFor, zones, unitSettings, packaging, orderStatuses, orderTypes, orderType, orderRoute, orderRecordHref, billStatuses,
  dateInZone, totals, displayAddress, shortAddress, addressValue, invoiceId, money, displayMeasurement,
  carrierProfiles, selectedRate, quoteStatus, postalCode, stopDetailsReady, itemCommodities,
  hazardClasses, packingGroups, hazardIdPattern, stopSupplement, cargoReady, estimatedLinearFeet, orderDocuments,
  quoteModes, shipmentMode, quoteEntry, equipmentTypes, equipmentSummary, addressContactFields, ticketStatuses, ticketCategories, billHref,
  caseTypes, caseKind, caseRoute, caseHref, caseCategory, disputeReasons, claimReasons, billingRecords
} from './model.js?v=campaigns';

export const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
export const icon = (name, className = '') => '<svg class="icon ' + className + '" aria-hidden="true"><use href="#' + name + '"/></svg>';
const requiredMark = '<span class="require" aria-hidden="true">*</span>';
const workflowSteps = [
  ['quote', '快速查价'], ['rates', '报价比较'], ['details', '完善并下单']
];
const unitNames = { imperial: '英制 (lb / in)', metric: '公制 (kg / cm)' };
const addressTypeOptions = { '': '请选择地址类型', ...addressTypes };
const regulatedCargo = { hazmat: '危险品', alcohol: '酒类', tobacco: '烟草／尼古丁' };
const pieceTypes = { '': '请选择', carton: '纸箱', box: '箱', bag: '袋', piece: '件' };
const freightClasses = ['50', '55', '60', '65', '70', '77.5', '85', '92.5', '100', '110', '125', '150', '175', '200', '250', '300', '400', '500'];
const cargoNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const hazardClassOptions = Object.entries(hazardClasses).sort(([first], [second]) => Number(first) - Number(second));
const rateSortOptions = { 'price-asc': '价格从低到高', 'price-desc': '价格从高到低', 'time-asc': '时效从快到慢', 'time-desc': '时效从慢到快' };
const ftlVehicles = { van: 'Dry Van', box: '箱式货车', flatbed: 'Flatbed', sprinter: '高顶货运面包车' };

function pageHead(title) {
  return `<header class="page-head"><h1 tabindex="-1">${title}</h1></header>`;
}
export function workflowHeader(section, quote, booked, mode) {
  const active = workflowSteps.findIndex(([id]) => id === section);
  if (active < 0) return null;

  const links = workflowSteps.map(([id, name], index) => {
    const canNavigate = quote && (index < active || (section === 'rates' && id === 'details' && quote.selectedRateId && !booked));
    const label = index === active ? `<span aria-current="step">${name}</span>`
      : canNavigate ? `<a href="#${id === 'quote' ? quoteEntry(quote.shipment) : id}/${e(quote.id)}">${name}</a>` : `<span class="flow-pending">${name}</span>`;
    return `<li>${index ? icon('chev') : ''}${label}</li>`;
  }).join('');
  const action = {
    quote: '<button type="button" class="btn small" data-action="fill-example">填入示例</button>',
    rates: booked || section !== 'rates' ? '' : `<button type="button" class="btn small" data-action="refresh-rates" data-quote="${e(quote.id)}">更新报价</button>`,
    details: '<button type="button" class="btn small" data-action="fill-details-example">填入示例资料</button>'
  }[section];
  return {
    path: `<span class="flow-title">${quoteModes[mode]}</span><nav aria-label="发货步骤"><ol class="flow-crumbs">${links}</ol></nav>`,
    action
  };
}
function option(value, label, current) {
  return `<option value="${e(value)}"${value === current ? ' selected' : ''}>${e(label)}</option>`;
}
function field({ label, name, value = '', type = 'text', attributes = '', required = false, placeholder = '', className = '' }) {
  return `<label class="field ${className}"><span>${label}${required ? ' ' + requiredMark : ''}</span><input name="${name}" type="${type}" value="${e(value)}"${placeholder ? ' placeholder="' + e(placeholder) + '"' : ''}${required ? ' required' : ''} ${attributes}></label>`;
}
function selectField(label, name, values, current, required = false) {
  return `<label class="field"><span>${label}${required ? ' ' + requiredMark : ''}</span><select name="${name}"${required ? ' required' : ''}>${Object.entries(values).map(([id, value]) => option(id, value, current)).join('')}</select></label>`;
}
function pickupDateField(shipment, label = '提货日期') {
  return field({ label, name: 'pickupDate', value: shipment.pickupDate, type: 'date', attributes: `min="${dateInZone()}"`, required: true });
}
function pickupTimeFields(shipment, details) {
  return `<fieldset class="stop-time-group">
    <legend>提货窗口（当地）</legend>
    <div class="stop-time-grid pickup-window">
      ${pickupDateField(shipment)}
      ${field({ label: '最早提货', name: 'pickupTime', value: shipment.pickupTime, type: 'time', required: true })}
      ${field({ label: '最晚提货', name: 'pickupEnd', value: details.pickupEnd, type: 'time', required: true })}
    </div>
  </fieldset>`;
}
export function serviceSelectionText(shipment, side) {
  return selectedServices(shipment, side).map(service => service.label).join('、') || '未选择';
}
function serviceFields(shipment, side, label, collapsible = false) {
  const fields = `<fieldset class="services"${collapsible ? ` aria-label="${label}"` : ''}>
    ${collapsible ? '' : `<legend>${label} <span>可多选</span></legend>`}
    <div class="service-options">${serviceOptions[side].map(service => {
      const helpId = `service-help-${side}-${service.id}`;
      return `<div class="check-option">
        <label><input type="checkbox" name="${side}-services" value="${service.id}"${shipment.services[side].includes(service.id) ? ' checked' : ''}><span>${service.label}</span></label>
        <button type="button" class="service-help" aria-label="${service.label}说明" aria-describedby="${helpId}" data-service-help="${helpId}">?</button>
        <span id="${helpId}" hidden>${e(service.description)}</span>
      </div>`;
    }).join('')}</div>
  </fieldset>`;
  if (!collapsible) return fields;
  return `<details class="stop-service-disclosure">
    <summary class="sub-disclosure"><strong>${label}</strong><small class="service-preview" data-service-preview>${e(serviceSelectionText(shipment, side))}</small>${icon('chev')}</summary>
    ${fields}
  </details>`;
}
function stopHoursFields(details, side) {
  const { opensAt, closesAt } = stopSupplement(details, side);
  return `<fieldset class="stop-time-group">
    <legend>营业时间（当地）</legend>
    <div class="stop-time-grid">
      ${field({ label: '营业开始', name: side + 'OpensAt', type: 'time', value: opensAt, required: true })}
      ${field({ label: '营业结束', name: side + 'ClosesAt', type: 'time', value: closesAt, required: true })}
    </div>
  </fieldset>`;
}
function stopSupplementFields(details, side) {
  const { reference, notes } = stopSupplement(details, side);
  return `<div class="stop-supplement">
    ${field({ label: '参考单号（可选）', name: side + 'Reference', value: reference, attributes: 'maxlength="80"', placeholder: side === 'origin' ? '例如提货号或 PO 号' : '例如送货号或预约号' })}
    <label class="field"><span>备注（可选）</span><textarea name="${side}Notes" rows="2" maxlength="1000" placeholder="例如进门指引、交接说明">${e(notes)}</textarea></label>
  </div>`;
}
function stopContactFields(details, side) {
  return `<div class="contact-fields">
    ${field({ label: side === 'origin' ? '公司或发货方' : '公司或收件方', name: side + 'Company', value: details[side + 'Company'], required: true, attributes: 'maxlength="100"' })}
    ${field({ label: '套间 / 单元（可选）', name: side + 'Unit', value: details[side + 'Unit'], attributes: 'maxlength="30"' })}
    ${field({ label: '联系人', name: side + 'Contact', value: details[side + 'Contact'], required: true, attributes: 'maxlength="70"' })}
    ${field({ label: '现场联系邮箱', name: side + 'Email', value: details[side + 'Email'], type: 'email', required: true, attributes: 'maxlength="100"', className: 'contact-email' })}
    <div class="contact-phone">
      ${field({ label: '联系电话', name: side + 'Phone', value: details[side + 'Phone'], type: 'tel', required: true, attributes: 'maxlength="40"' })}
      ${field({ label: '分机号（可选）', name: side + 'PhoneExtension', value: details[side + 'PhoneExtension'], type: 'tel', attributes: 'maxlength="12"', placeholder: '例如 123' })}
    </div>
  </div>`;
}
function stopAddressFields(shipment, side, mode) {
  const pickup = side === 'origin';
  const stopLabel = pickup ? '提货' : '送货';
  const quick = mode === 'quick';
  const custom = mode === 'custom';
  const label = stopLabel + (quick ? '地址或 ZIP' : custom ? '地点' : '完整地址');
  const address = displayAddress(shipment[side]);
  const addressAttributes = quick ? `role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${side}-address-options" data-quick-address` : 'list="address-suggestions"';
  const placeholder = quick || custom ? '街道、城市或 ZIP' : '街道、城市、州、ZIP';
  return `<div class="address-line">
      <div class="address-field${quick ? ' address-field-with-map' : ''}">
        <label class="field" for="${side}"><span>${label} ${requiredMark}</span><span class="with-icon">${icon('search')}<input id="${side}" name="${side}" ${addressAttributes} value="${e(address)}" placeholder="${placeholder}" autocomplete="off" maxlength="220" required></span></label>
        <button class="icon-button" type="button" data-action="choose-address" data-side="${side}" aria-label="从地址簿选择${stopLabel}地址">${icon('book')}</button>
        ${quick ? `<button type="button" class="link satellite-trigger" data-action="show-satellite" data-side="${side}" aria-label="查看${stopLabel}卫星图" aria-haspopup="dialog" aria-controls="satellite-drawer">卫星图</button>` : ''}
        ${quick ? `<div class="address-suggestions" hidden><div id="${side}-address-options" role="listbox" aria-label="${stopLabel}地址建议"></div><div class="address-suggestion-foot note" role="status"></div></div>` : ''}
      </div>
      ${selectField(custom ? '地址类型（可选）' : '地址类型', side + '-type', addressTypeOptions, addressTypeFor(shipment, side), !custom)}
    </div>`;
}

function addressSuggestions(addresses) {
  return `<datalist id="address-suggestions">${addresses.map(address => option(addressValue(address), address.label)).join('')}</datalist>`;
}

function sideFields(shipment, side, details = null, complete = false) {
  const pickup = side === 'origin';
  const stopLabel = pickup ? '提货' : '送货';
  const addressFields = stopAddressFields(shipment, side, details ? 'complete' : 'quick');
  if (details) {
    return `<section class="panel stop-panel${pickup ? ' pickup-stop' : ''}" data-stop="${side}" aria-labelledby="${side}-heading">
      <header class="stop-panel-head">
        <h2 class="stop-heading" id="${side}-heading">${stopLabel}信息</h2>
        <small class="stop-location" data-stop-location>${e(shortAddress(shipment[side]) || '待填地址')}</small>
        <span class="status ${complete ? 'paid' : ''}" data-stop-status>${complete ? '已填写' : '待填写'}</span>
      </header>
      <section class="stop-section" aria-labelledby="${side}-contact-heading">
        <h3 id="${side}-contact-heading">地址与联系人</h3>
        ${addressFields}
        ${stopContactFields(details, side)}
      </section>
      <section class="stop-section" aria-labelledby="${side}-time-heading">
        <h3 id="${side}-time-heading">时间安排</h3>
        ${stopHoursFields(details, side)}
        ${pickup ? pickupTimeFields(shipment, details) : ''}
      </section>
      <section class="stop-section" aria-labelledby="${side}-handoff-heading">
        <h3 id="${side}-handoff-heading">交接信息</h3>
        ${serviceFields(shipment, side, '附加服务', true)}
        ${stopSupplementFields(details, side)}
      </section>
    </section>`;
  }
  return `<section class="route-stop${pickup ? ' pickup-stop' : ''}" aria-labelledby="${side}-heading">
    <header class="stop-header">
      <h3 class="stop-heading" id="${side}-heading">${stopLabel}信息</h3>
      ${pickup ? `<div class="quick-pickup-date">${pickupDateField(shipment, '提货日期（当地）')}</div>` : ''}
    </header>
    <div class="stop-body">
      ${addressFields}
      ${serviceFields(shipment, side, stopLabel + '服务')}
    </div>
  </section>`;
}
function cargoFields(item, units) {
  const { weight, length, weightFactor, lengthFactor } = unitSettings[units];
  const number = (label, name, value, max, placeholder) => field({
    label, name, value, type: 'number', attributes: 'min="0.0001" max="' + max + '" step="any"', required: true, placeholder
  });
  return `${selectField('包装类型', 'type', packaging, item.type, true)}
    ${field({ label: '件数', name: 'quantity', value: item.quantity, type: 'number', attributes: 'min="1" max="1000" step="1"', required: true })}
    ${number('单件重量 (' + weight + ')', 'weight', displayMeasurement(item.weight, weightFactor), Math.ceil(80000 * weightFactor), units === 'metric' ? '181.44' : '400')}
    ${number('长 (' + length + ')', 'length', displayMeasurement(item.length, lengthFactor), Math.ceil(900 * lengthFactor), units === 'metric' ? '121.92' : '48')}
    ${number('宽 (' + length + ')', 'width', displayMeasurement(item.width, lengthFactor), Math.ceil(900 * lengthFactor), units === 'metric' ? '101.6' : '40')}
    ${number('高 (' + length + ')', 'height', displayMeasurement(item.height, lengthFactor), Math.ceil(900 * lengthFactor), units === 'metric' ? '121.92' : '48')}`;
}
function removeCargoButton(index, count) {
  return `<button type="button" class="icon-button" data-action="remove-cargo" data-index="${index}" aria-label="移除第 ${index + 1} 项货物"${count === 1 ? ' disabled' : ''}>${icon('close')}</button>`;
}
function cargoUnits(units) {
  return `<div class="segmented" role="group" aria-label="计量单位">${Object.entries(unitNames).map(([id, name]) => `<button type="button" data-action="units" data-units="${id}" aria-pressed="${id === units}">${name}</button>`).join('')}</div>`;
}
function equipmentPicker(current) {
  return `<fieldset class="equipment-picker">
    <legend>车型 ${requiredMark}</legend>
    <div class="equipment-grid">${Object.entries(ftlVehicles).map(([value, caption]) => `<label class="equipment-card">
      <input type="radio" name="equipment" value="${value}" required${value === current ? ' checked' : ''}>
      <img src="../assets/equipment/${value}.webp" alt="" width="600" height="400">
      <span class="equipment-name">${equipmentTypes[value]}</span><small>${caption}</small>
    </label>`).join('')}</div>
    ${current && !Object.hasOwn(ftlVehicles, current) ? `<p class="note">历史车型：${e(equipmentTypes[current] ?? current)}</p>` : ''}
  </fieldset>`;
}
export function quoteView(shipment, units, hasAssistantDetails = false) {
  const mode = shipmentMode(shipment);
  return `<h1 class="sr-only" tabindex="-1">${quoteModes[mode]}询价</h1>
    <form id="quote-form" class="stack">
      <section class="panel panel-inset" aria-labelledby="route-heading">
        <div class="panel-head">
          <h2 id="route-heading" class="panel-title">提送货信息</h2>
          <button type="button" class="btn small assistant-trigger" data-action="open-assistant" aria-haspopup="dialog" aria-controls="dialog"><span aria-hidden="true">✦</span> AI 快速填单</button>
        </div>
        <div class="route-grid">${sideFields(shipment, 'origin')}${icon('arrow', 'route-arrow')}${sideFields(shipment, 'destination')}</div>
      </section>
      ${mode === 'ftl' ? `<section class="panel panel-inset" aria-labelledby="equipment-heading">
        <h2 id="equipment-heading" class="panel-title">车辆信息</h2>
        ${equipmentPicker(shipment.equipment)}
        <div class="ftl-options">
          ${field({ label: '车辆数量', name: 'vehicleCount', value: shipment.vehicleCount, type: 'number', attributes: 'min="1" step="1"', required: true })}
        </div>
      </section>` : ''}
      <section class="panel panel-inset" aria-labelledby="cargo-heading">
        <div class="panel-head"><h2 id="cargo-heading" class="panel-title">货物明细</h2>${cargoUnits(units)}</div>
        <div class="cargo-rows">${shipment.items.map((item, index) => `<div class="cargo-row" data-cargo-row>${cargoFields(item, units)}${removeCargoButton(index, shipment.items.length)}</div>`).join('')}</div>
        <button type="button" class="btn small" data-action="add-cargo">${icon('plus')}添加一项货物</button>
      </section>
      <div>
        <p class="error" role="alert" id="quote-error"></p>
        <div class="actions end"><p class="note">${hasAssistantDetails ? '交接资料将在查看报价时保存，选定报价后自动带入订单。' : quoteModes[mode] + ' · 美国境内运输演示'}</p><button class="btn primary shipment-submit" type="submit">查看报价 ${icon('arrow')}</button></div>
      </div>
    </form>`;
}

export function quoteAssistantForm(mode, description) {
  const cargo = mode === 'ftl'
    ? '用 1 辆 53ft 干柜车，20 个托盘，每托盘 400 lb，48 × 40 × 48 in。'
    : '2 个托盘，每托盘 400 lb，48 × 40 × 48 in，需要预约送货。';
  const example = [
    '明天从 120 Demo Way, Los Angeles, CA 90001（商业地址有卸货平台）送到 85 Sample Drive, Chicago, IL 60601（商业地址无卸货平台）。',
    cargo,
    '提货联系人：张三；电话：+1 213-555-0101 转 123；邮箱：pickup@example.com；提货码：PU-DEMO-001；提货备注：从西门进入，抵达后联系仓库。',
    '送货联系人：李四；电话：+1 312-555-0102；邮箱：delivery@example.com；参考单号：DEL-DEMO-001；送货备注：请到收货窗口登记。'
  ].join('\n');
  return `<form id="quote-assistant-form">
      <label class="field"><span>运输需求描述</span><textarea name="description" rows="4" maxlength="2500" required placeholder="描述提送货地点、日期、货物件数、重量和尺寸">${e(description)}</textarea></label>
      <div class="actions end"><button type="button" class="link assistant-example" data-action="assistant-example" data-text="${e(example)}">填入示例描述</button><button class="btn primary small" type="submit">识别并预览</button></div>
    </form>
    <div id="quote-assistant-result" class="assistant-result" aria-live="polite" hidden></div>`;
}

export function quoteAssistantResult(result, shipment, units) {
  const { weight, length, weightFactor, lengthFactor } = unitSettings[units];
  const labels = { origin: '提货地址', destination: '送货地址', pickupDate: '提货日期', equipment: '车型', vehicleCount: '车辆数量' };
  const rows = Object.entries(result.fields).map(([name, value]) => [labels[name], e(name === 'equipment' ? equipmentTypes[value] : value)]);
  const missing = [];
  const details = [];
  const detailNames = { Contact: '联系人', Phone: '联系电话', PhoneExtension: '分机', Email: '邮箱', Reference: '提货码 / 参考单号', Notes: '备注' };
  for (const side of ['origin', 'destination']) {
    const label = side === 'origin' ? '提货' : '送货';
    if (result.types[side]) rows.push([label + '地址类型', e(addressTypes[result.types[side]])]);
    if (result.services[side]) rows.push([label + '附加服务', e(result.services[side].map(id => serviceOptions[side].find(service => service.id === id).label).join('、'))]);
    if (!postalCode(shipment[side])) missing.push(label + '地址或 ZIP');
    if (!addressTypeFor(shipment, side)) missing.push(label + '地址类型');
    for (const [field, name] of Object.entries(detailNames)) {
      const value = result.details[side + field];
      if (value) details.push([label + ' · ' + (side === 'destination' && field === 'Reference' ? '送货码 / 参考单号' : name), e(value), field === 'Notes' ? 'stop-note' : '']);
    }
  }
  if (!shipment.pickupDate || shipment.pickupDate < dateInZone()) missing.push('有效提货日期');
  if (shipmentMode(shipment) === 'ftl' && !shipment.equipment) missing.push('车型');
  if (!cargoReady(shipment)) missing.push('货物件数、重量或尺寸');
  for (const [index, item] of result.items.entries()) {
    const size = item.length && item.width && item.height ? [item.length, item.width, item.height].map(value => cargoNumber.format(value * lengthFactor)).join(' × ') + ' ' + length : '';
    rows.push(['货物 ' + (index + 1), e([item.quantity + ' ' + packaging[item.type], item.weight ? '单件 ' + cargoNumber.format(item.weight * weightFactor) + ' ' + weight : '', size].filter(Boolean).join(' · '))]);
  }
  const unassigned = result.unassigned ? '<p class="note">有交接资料尚未注明提货或送货，请补上对应地点后再识别。</p>' : '';
  if (!rows.length && !details.length) return unassigned || '<p class="note">暂未识别到可填写的信息。可补充地址或 ZIP、日期、重量和尺寸。</p>';
  return `<h3 class="subhead">核对识别结果</h3>${rows.length ? detailList(rows) : ''}
    ${details.length ? `<h4 class="subhead">完善订单时带入</h4>${detailList(details)}` : ''}
    ${unassigned}
    ${missing.length ? `<p class="note">还需确认或补填：${missing.join('、')}</p>` : ''}
    <div class="actions end"><button type="button" class="btn primary small" data-action="assistant-apply">${rows.length ? '应用到查价表单' : '应用交接资料'}</button></div>`;
}

function customStopFields(shipment, details, side) {
  const pickup = side === 'origin';
  const name = pickup ? '提货' : '送货';
  const dateName = pickup ? 'pickupDate' : 'deliveryDate';
  return `<section class="panel stop-panel${pickup ? ' pickup-stop' : ''}" aria-labelledby="${side}-heading">
    <header class="stop-panel-head"><h2 class="stop-heading" id="${side}-heading">${name}信息</h2></header>
    <div class="stop-section">
      ${stopAddressFields(shipment, side, 'custom')}
      <div class="custom-stop-fields">
        ${field({ label: `期望${name}日期（可选）`, name: dateName, type: 'date', value: shipment[dateName], attributes: `min="${dateInZone()}"` })}
        ${field({ label: '现场联系人（可选）', name: side + 'Contact', value: details[side + 'Contact'], attributes: 'maxlength="70"' })}
        ${field({ label: '现场电话（可选）', name: side + 'Phone', type: 'tel', value: details[side + 'Phone'], attributes: 'maxlength="40"' })}
      </div>
      ${serviceFields(shipment, side, '附加服务', true)}
    </div>
  </section>`;
}

function customReceipt(request, heading) {
  const shipment = request.shipment;
  const details = request.details ?? {};
  return `${heading}<div class="stack custom-quote">
    <section class="panel panel-inset" aria-labelledby="custom-receipt-heading">
      <div class="panel-head"><div><h2 class="panel-title" id="custom-receipt-heading">定制询价已保存</h2><p class="note">${e(request.date)} · 此记录保存在当前浏览器</p></div><span class="status paid">${e(request.id)}</span></div>
      <div class="custom-quote-fields">${detailList([
        ...(!shipment ? [['提货地点', e(request.origin)], ['送货地点', e(request.destination)]] : []),
        ['联系人', e(request.contact)], ['联系邮箱', e(request.email)], ...(request.phone ? [['联系电话', e(request.phone)]] : []),
        ['需求说明', e(request.requirements), 'stop-note']
      ])}</div>
    </section>
    ${shipment ? `<div class="details-stops">${shipmentStopCard(shipment, details, 'origin', 'custom')}${shipmentStopCard(shipment, details, 'destination', 'custom')}</div>
      ${shipmentCargoCard(shipment, details, 'custom', request.units)}` : ''}
    <div class="actions end"><a class="btn" href="#custom">返回定制询价</a></div>
  </div>`;
}

export function customQuoteView(profile, requests, request, addresses, draft) {
  const heading = '<h1 class="sr-only" tabindex="-1">定制询价</h1>';
  if (request) return customReceipt(request, heading);
  const { shipment, details, units, fields } = draft;
  return `${heading}<div class="stack custom-quote">
    <form id="custom-quote-form" class="stack">
      <div class="details-stops">${customStopFields(shipment, details, 'origin')}${customStopFields(shipment, details, 'destination')}</div>
      ${addressSuggestions(addresses)}
      ${cargoEditor({ shipment }, units)}
      <section class="panel panel-inset" aria-labelledby="custom-needs-heading">
        <h2 class="panel-title" id="custom-needs-heading">定制需求与联系方式</h2>
        <label class="field custom-quote-fields"><span>需求说明 ${requiredMark}</span><textarea name="requirements" rows="3" maxlength="1500" placeholder="例如多点配送、超长货物、温控要求或预约交接" required>${e(fields.requirements)}</textarea></label>
        <div class="custom-contact-fields custom-quote-fields">
          ${field({ label: '询价联系人', name: 'contact', value: fields.contact ?? profile.contact, attributes: 'maxlength="70"', required: true })}
          ${field({ label: '联系邮箱', name: 'email', type: 'email', value: fields.email ?? profile.email, attributes: 'maxlength="100"', required: true })}
          ${field({ label: '联系电话（可选）', name: 'phone', type: 'tel', value: fields.phone ?? profile.phone, attributes: 'maxlength="40"' })}
        </div>
      </section>
      <div>
        <p class="error" id="custom-quote-error" role="alert"></p>
        <div class="actions end"><p class="note">演示询价保存在当前浏览器</p><button class="btn primary shipment-submit" type="submit">提交定制询价 ${icon('arrow')}</button></div>
      </div>
    </form>
    ${requests.length ? `<section class="panel panel-inset" aria-labelledby="custom-history-heading"><h2 class="subhead" id="custom-history-heading">定制询价记录</h2>
      <ul class="order-files">${requests.map(record => `<li><div><a class="link" href="#custom/${e(record.id)}">${e(record.id)}</a><p class="note">${routeLabel(record.shipment ?? record)}</p></div><time class="note" datetime="${e(record.date)}">${e(record.date)}</time></li>`).join('')}</ul></section>` : ''}
  </div>`;
}

function routeLabel(shipment) {
  return e(shortAddress(shipment.origin)) + ' → ' + e(shortAddress(shipment.destination));
}
function cargoLabel(shipment) {
  const { quantity, weight } = totals(shipment);
  const type = shipment.items.every(item => item.type === shipment.items[0].type) ? packaging[shipment.items[0].type] : '件';
  return quantity + ' ' + type + ' · ' + cargoNumber.format(weight) + ' lb';
}
function timeText(shipment) {
  return e(shipment.pickupDate + ' ' + shipment.pickupTime + ' · ' + (zones[shipment.timezone] ?? '提货当地时间'));
}
function detailList(fields, className = '') {
  return `<dl class="detail-list ${className}">${fields.map(([label, value, rowClass]) =>
    `<div${rowClass ? ' class="' + rowClass + '"' : ''}><dt>${label}</dt><dd>${value}</dd></div>`
  ).join('')}</dl>`;
}
function feeRows(rate) {
  return [['运输费用', money(rate.freight)], ['附加服务', money(rate.accessorial)]];
}
function feeBreakdown(rate, estimate = false) {
  return detailList([...feeRows(rate), [estimate ? '预计合计 (USD)' : '合计 (USD)', money(rate.total), 'detail-total']], 'fees');
}
const validUntil = rate => rate.expiresAt
  ? new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(rate.expiresAt)
  : '需更新';

function arrivalText(quote, rate) {
  const date = quote.shipment.pickupDate;
  if (!date || !rate.businessDays?.length) return '待确认提货日期';
  return [...new Set(rate.businessDays)].map(days => {
    const arrival = new Date(date + 'T00:00:00Z');
    while (days > 0) {
      arrival.setUTCDate(arrival.getUTCDate() + 1);
      if (arrival.getUTCDay() % 6) days--;
    }
    return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', timeZone: 'UTC' }).format(arrival);
  }).join(' – ');
}

function carrierName(rate) {
  return carrierProfiles[rate.carrierId]?.name ?? '承运商未记录';
}

function carrierIdentity(rate) {
  const carrier = carrierProfiles[rate.carrierId];
  return `<span class="carrier-identity">${carrier?.logo ? '<img src="../assets/carriers/' + carrier.logo + '" alt="">' : ''}<span><strong>${e(carrierName(rate))}</strong><small>${e(rate.reference ?? '历史报价')}</small></span></span>`;
}

export function compareRates(rates, { carrier = '', service = '', sort = 'price-asc' } = {}) {
  return rates.filter(rate => (!carrier || rate.carrierId === carrier) && (!service || rate.name === service)).sort((first, second) => {
    const priceDifference = first.total - second.total;
    if (!sort.startsWith('time')) return sort === 'price-desc' ? -priceDifference : priceDifference;
    const a = first.businessDays;
    const b = second.businessDays;
    if (!a?.length || !b?.length) return Number(!a?.length) - Number(!b?.length) || priceDifference;
    const difference = a.at(-1) - b.at(-1) || a[0] - b[0];
    return (sort === 'time-desc' ? -difference : difference) || priceDifference;
  });
}

export function carrierQuotes(quote, booked = null, rates = quote.rates) {
  const blocked = ['stale', 'expired'].includes(quoteStatus(quote));
  const cards = rates.map(rate => {
    const action = booked
      ? '<a class="link" href="#orders/' + e(booked.id) + '">查看运单</a>'
      : `<button class="btn primary small" type="button" data-action="select-rate" data-quote="${e(quote.id)}" data-rate="${e(rate.id)}" aria-label="选用 ${e(carrierName(rate))} ${e(rate.name)}报价"${blocked || !(rate.expiresAt > Date.now()) ? ' disabled' : ''}>选用报价</button>`;
    return `<article class="panel carrier-rate${rate.id === quote.selectedRateId ? ' selected' : ''}" aria-label="${e(carrierName(rate))} 报价">
      <div class="carrier-rate-main">
        ${carrierIdentity(rate)}
        <dl class="rate-meta">
          <div><dt>运输方案</dt><dd>${e(rate.name)}</dd></div>
          <div><dt>预计时效</dt><dd>${e(rate.days)}</dd></div>
          <div><dt>预计送达</dt><dd>${e(arrivalText(quote, rate))}</dd></div>
          <div><dt>报价有效至</dt><dd>${e(validUntil(rate))}</dd></div>
        </dl>
        <div class="rate-amount"><strong>${money(rate.total)}</strong><span class="note">USD</span>${action}</div>
      </div>
      <div class="rate-costs"><span>运输费 <strong>${money(rate.freight)}</strong></span><span>附加费 <strong>${money(rate.accessorial)}</strong></span></div>
    </article>`;
  }).join('');
  const empty = quote.rates.length ? '没有符合筛选条件的报价' : '暂无可选报价';
  return `<div class="carrier-quotes" role="region" aria-label="承运商模拟报价">${cards || `<p class="panel empty">${empty}</p>`}</div>`;
}

function includedServiceNames(shipment, side) {
  const labels = selectedServices(shipment, side).map(service => service.label);
  if (addressTypeFor(shipment, side) === 'residential') labels.push('住宅地址');
  return labels;
}

function includedServices(shipment) {
  const names = ['origin', 'destination'].flatMap(side => {
    const prefix = side === 'origin' ? '提货 ' : '送货 ';
    return includedServiceNames(shipment, side).map(label => prefix + label);
  });
  return e(names.join('、') || '无');
}

function rateFilters(quote, filters) {
  const carriers = Object.fromEntries(quote.rates.filter(rate => rate.carrierId).map(rate => [rate.carrierId, carrierName(rate)]));
  const services = Object.fromEntries(quote.rates.map(rate => [rate.name, rate.name.replace(/^FedEx Freight /, '')]));
  const control = (label, name, options, value) => `<select class="select-input" aria-label="${label}" name="${name}">${Object.entries(options).map(([id, text]) => option(id, text, value)).join('')}</select>`;
  return `<div class="rate-filters" role="group" aria-label="报价筛选与排序" data-rate-filters>
    ${control('承运商', 'carrier', { '': '全部承运商', ...carriers }, filters.carrier ?? '')}
    ${control('服务等级', 'service', { '': '全部等级', ...services }, filters.service ?? '')}
    ${control('排序', 'sort', rateSortOptions, filters.sort ?? 'price-asc')}
  </div>`;
}

function shipmentOverview(quote, units, booked) {
  const { shipment } = quote;
  const { weight, length, weightFactor, lengthFactor } = unitSettings[units];
  const cargo = totals(shipment);
  const completeCargo = cargoReady(shipment);
  const linearFeet = completeCargo ? estimatedLinearFeet(shipment) : Infinity;
  const showMeasurement = (value, factor) => value > 0 ? cargoNumber.format(value * factor) : '—';
  const cargoItems = shipment.items.map(item => `<li>
    <strong>${e(item.quantity || '—')} × ${e(packaging[item.type] ?? '包装待填')}</strong>
    <span>${[item.length, item.width, item.height].map(value => showMeasurement(value, lengthFactor)).join(' × ')} ${length} · 单件 ${showMeasurement(item.weight, weightFactor)} ${weight}</span>
  </li>`).join('');
  const stops = [['origin', 'A', '提货'], ['destination', 'B', '送货']];
  return `<aside class="panel shipment-overview" aria-labelledby="shipment-overview-heading">
    <header class="panel-head ruled"><h2 class="panel-title" id="shipment-overview-heading">运输详情</h2><a class="link" href="#${quoteEntry(shipment)}/${e(quote.id)}">${booked ? '复用运输信息' : '修改查价信息'}</a></header>
    <section class="overview-section" aria-labelledby="route-overview-heading" data-route-map data-from="${e(postalCode(shipment.origin))}" data-to="${e(postalCode(shipment.destination))}">
      <div class="panel-head"><h3 class="subhead" id="route-overview-heading">运输线路</h3><strong class="route-distance" data-route-distance role="status">里程加载中</strong></div>
      <ol class="overview-stops">${stops.map(([side, mark, label]) => `<li>
        <span class="overview-pin${side === 'destination' ? ' destination' : ''}" aria-hidden="true">${mark}</span>
        <span class="note">${label}</span><strong>${e(shortAddress(shipment[side]) || '待填写')}</strong>
      </li>`).join('')}</ol>
      ${shipment.pickupDate ? `<p class="note">提货日期 <time datetime="${e(shipment.pickupDate)}">${e(shipment.pickupDate)}</time>（当地）</p>` : ''}
      <figure class="route-figure"><div class="route-art" data-route-art>地图加载中</div><figcaption class="note" data-route-source></figcaption></figure>
    </section>
    <section class="overview-section" aria-labelledby="cargo-overview-heading">
      <h3 class="subhead" id="cargo-overview-heading">货物明细</h3>
      ${shipmentMode(shipment) === 'ftl' ? `<p class="note">${e(equipmentSummary(shipment))}</p>` : ''}
      <dl class="overview-metrics">
        <div><dt>总重</dt><dd>${showMeasurement(cargo.weight, weightFactor)} ${weight}</dd></div>
        <div><dt>线性英尺</dt><dd>${Number.isFinite(linearFeet) ? `${cargoNumber.format(linearFeet)} ft` : '—'}</dd></div>
        <div><dt>密度</dt><dd>${completeCargo ? `${cargoNumber.format(cargo.weight / cargo.volume)} lb/ft³` : '—'}</dd></div>
      </dl>
      <ul class="overview-cargo">${cargoItems}</ul>
      <p class="note">线性英尺按 96 in 可用车厢宽度、不叠放估算</p>
    </section>
    <section class="overview-section" aria-labelledby="services-overview-heading">
      <h3 class="subhead" id="services-overview-heading">附加服务</h3>
      <dl class="overview-services">${stops.map(([side, , label]) => `<div><dt>${label}</dt><dd>${e(includedServiceNames(shipment, side).join('、') || '无')}</dd></div>`).join('')}</dl>
    </section>
  </aside>`;
}

export function ratesView(quote, booked, message, units, filters) {
  const state = quoteStatus(quote);
  const pending = ['stale', 'expired'].includes(state);
  const rates = compareRates(quote.rates, filters);
  return `<h1 class="sr-only" tabindex="-1">报价比较</h1>
    <div class="rates-layout">
      ${shipmentOverview(quote, units, booked)}
      <section class="rate-comparison" aria-labelledby="rate-comparison-heading">
        <div class="panel rate-toolbar"><div class="rate-toolbar-heading"><h2 class="panel-title" id="rate-comparison-heading">承运商报价</h2><p class="note" id="rate-result-count" role="status">${rates.length} 条报价</p></div>${rateFilters(quote, filters)}</div>
        <div class="rate-list-scroll" tabindex="0" role="region" aria-label="报价列表">
          ${booked ? '<p class="notice">这条报价已生成运单。</p>' : ''}
          ${!booked && pending ? '<p class="notice">当前报价需要更新，更新后即可选用。</p>' : ''}
          ${message ? '<p class="notice">' + e(message) + '</p>' : ''}
          <div id="rate-results">${carrierQuotes(quote, booked, rates)}</div>
          <p class="note">报价与时效为模拟数据 · 有效期按当前浏览器时间显示</p>
        </div>
      </section>
    </div>`;
}

function rateActions(quote, review) {
  return `<div class="actions rate-actions">
    <button type="button" class="btn small" data-action="change-rate" data-quote="${e(quote.id)}">${review ? '更换报价' : '查看完整报价'}</button>
    <button type="button" class="btn small" data-action="refresh-rates" data-quote="${e(quote.id)}">更新报价</button>
  </div>`;
}

function quickRates(quote, state) {
  const blocked = ['stale', 'expired'].includes(state);
  const carriers = new Set([selectedRate(quote)?.carrierId]);
  const alternatives = [];
  for (const rate of compareRates(quote.rates)) {
    if (carriers.has(rate.carrierId) || !(rate.expiresAt > Date.now())) continue;
    carriers.add(rate.carrierId);
    alternatives.push(rate);
    if (alternatives.length === 3) break;
  }
  if (!alternatives.length) return '';
  return `<div class="detail-block quick-rates">
    <h3 class="subhead">更换承运商</h3>
    ${alternatives.map(rate => {
      const logo = carrierProfiles[rate.carrierId]?.logo;
      return `<button type="button" class="quick-rate" aria-pressed="${quote.selectedRateId === rate.id}" aria-label="快速选用 ${e(carrierName(rate))}" data-action="select-rate" data-quote="${e(quote.id)}" data-rate="${e(rate.id)}"${blocked || !(rate.expiresAt > Date.now()) ? ' disabled' : ''}>
        <span class="quick-rate-carrier">${logo ? '<img src="../assets/carriers/' + logo + '" alt="">' : ''}<span><strong>${e(carrierName(rate))}</strong><small>${e(rate.name)} · ${e(rate.days)}</small></span></span><b>${money(rate.total)}</b>
      </button>`;
    }).join('')}
  </div>`;
}

export function quoteSummary(quote, message = '', review = false) {
  const state = quoteStatus(quote);
  const current = selectedRate(quote);
  const rate = state === 'valid' ? current : quote.acceptedRate ?? current;
  const titles = { valid: '报价有效', stale: '报价待更新', expired: '报价已过期', changed: '报价有变化', unavailable: '原报价不可用', unselected: '请选择报价' };
  const priceChange = state === 'changed' && current && rate;
  const arrival = rate ? arrivalText(quote, rate) : '';
  const timing = rate ? [['预计时效', e(rate.days)], ['预计送达', e(arrival)], ['有效至', e(validUntil(rate))]] : [];
  const breakdown = rate ? detailList(timing) + feeBreakdown(rate, true) : '';
  const compactPrice = rate ? `<div class="quote-total"><span class="note">预计合计 (USD)</span><strong>${money(rate.total)}</strong><p class="note">${e(rate.days)}${quote.shipment.pickupDate && rate.businessDays?.length ? ' · 预计 ' + e(arrival) + ' 送达' : ''}</p></div>
    <details class="quote-fees"><summary class="sub-disclosure"><strong>费用明细与有效期</strong>${icon('chev')}</summary><div class="quote-fees-body">${breakdown}</div></details>` : '';
  const reviewPrice = rate ? `<div class="review-price"><span class="note">${state === 'valid' ? '预计合计 (USD)' : '已选报价合计 (USD)'}</span><strong>${money(rate.total)}</strong></div>
    ${detailList(timing, 'review-rate-timing')}${detailList(feeRows(rate), 'fees review-fees')}` : '';
  return `
    <div class="detail-block">
      <div class="panel-head">${rate ? carrierIdentity(rate) : ''}<span class="status ${state === 'valid' ? 'paid' : 'ready'}">${titles[state]}</span></div>
      ${rate ? `<p class="note">${e(rate.name)}</p>` : ''}
      ${review ? reviewPrice : compactPrice}
      ${priceChange ? `<div class="notice price-change"><strong>${rate.total === current.total ? '费用或时效已更新 · ' + money(current.total) : money(rate.total) + ' → ' + money(current.total)}</strong><span>${e(quote.changeReason ? '已复核 · ' + quote.changeReason : '报价条件有变化')}</span><button type="button" class="btn primary small" data-action="select-rate" data-quote="${e(quote.id)}" data-rate="${e(current.id)}">接受新报价</button></div>` : ''}
      ${message ? '<p class="note" role="status">' + e(message) + '</p>' : ''}
      ${rateActions(quote, review)}
    </div>
    ${review
      ? `<button class="btn primary" type="button" data-action="confirm-booking" data-quote="${e(quote.id)}"${state === 'valid' ? '' : ' disabled'}>确认演示下单</button>`
      : quickRates(quote, state) + '<button class="btn primary" type="submit" form="details-form">核对订单</button>'}`;
}

export function cargoTotalsText(shipment, units) {
  const { quantity, weight } = totals(shipment);
  const settings = unitSettings[units];
  return `${cargoNumber.format(quantity)} 件 · 总重 ${cargoNumber.format(weight * settings.weightFactor)} ${settings.weight}`;
}

export function cargoItemMetrics(item, units) {
  const { weight, volume } = totals({ items: [item] });
  if (!weight || !volume) return '';
  const settings = unitSettings[units];
  return `小计 ${cargoNumber.format(weight * settings.weightFactor)} ${settings.weight} · 密度 ${cargoNumber.format(weight / volume)} lb/ft³`;
}

function hazmatFields(id, checked, values = {}) {
  return `<fieldset id="${id}" class="hazmat-fields" aria-label="危险品详情" data-hazmat${checked ? '' : ' hidden disabled'}>
    <div class="hazmat-grid">
      <label class="field"><span>危险品类别 ${requiredMark}</span><select name="hazardClass" required>${option('', '请选择', values.hazardClass)}${hazardClassOptions.map(([value, label]) => option(value, value + ' · ' + label, values.hazardClass)).join('')}</select></label>
      ${field({ label: 'UN / NA 编号', name: 'hazardId', value: values.hazardId, required: true, attributes: `pattern="${hazardIdPattern}" maxlength="12" title="例如 UN1234 或 NA1234"`, placeholder: '例如 UN1234' })}
      ${field({ label: '包装类型', name: 'hazardPackage', value: values.hazardPackage, required: true, attributes: 'maxlength="60"', placeholder: '例如箱、桶' })}
      ${field({ label: '包装数量', name: 'hazardQuantity', value: values.hazardQuantity, type: 'number', required: true, attributes: 'min="1" step="1" max="9007199254740991"' })}
      ${field({ label: '正式运输名称', name: 'shippingName', value: values.shippingName, required: true, attributes: 'maxlength="120"' })}
      ${selectField('包装等级（可选）', 'packingGroup', { '': '请选择', ...packingGroups }, values.packingGroup)}
      ${field({ label: '紧急联系人名', name: 'emergencyFirstName', value: values.emergencyFirstName, required: true, attributes: 'maxlength="70"' })}
      ${field({ label: '紧急联系人姓', name: 'emergencyLastName', value: values.emergencyLastName, required: true, attributes: 'maxlength="70"' })}
      ${field({ label: '紧急联系公司全称', name: 'emergencyCompany', value: values.emergencyCompany, required: true, attributes: 'maxlength="100"' })}
      ${field({ label: '紧急联系电话', name: 'emergencyPhone', value: values.emergencyPhone, type: 'tel', required: true, attributes: 'maxlength="40"', placeholder: '含国家区号' })}
    </div>
  </fieldset>`;
}

function commodityFields(commodity, index, count, itemIndex) {
  const hazmatId = `hazmat-${itemIndex}-${index}`;
  return `<div class="commodity" data-commodity>
    ${count > 1 ? `<div class="panel-head"><h4>货品 ${index + 1}</h4><button type="button" class="link" data-action="remove-commodity" data-index="${itemIndex}" data-commodity-index="${index}" aria-label="移除货品 ${index + 1}">移除</button></div>` : ''}
    <div class="commodity-fields">
      ${field({ label: '货品描述', name: 'commodity', value: commodity.description, attributes: 'maxlength="120"', placeholder: '例如服装' })}
      ${field({ label: 'NMFC 编码', name: 'nmfc', value: commodity.nmfc, attributes: 'maxlength="20"', placeholder: '如已知请填写' })}
      <label class="field"><span>货运等级</span><select name="freightClass">${option('', '请选择', commodity.freightClass)}${freightClasses.map(value => option(value, 'Class ' + value, commodity.freightClass)).join('')}</select></label>
      <fieldset class="cargo-declaration"><legend>受管制货物申报</legend><div class="declaration-options">${Object.entries(regulatedCargo).map(([value, label]) => `<label><input type="checkbox" name="regulated" value="${value}"${value === 'hazmat' ? ` aria-controls="${hazmatId}"` : ''}${commodity.regulated.includes(value) ? ' checked' : ''}><span>${label}</span></label>`).join('')}</div></fieldset>
      <div class="piece-fields" role="group" aria-label="每个装运单位的内包装">
        ${selectField('内包装类型', 'pieceType', pieceTypes, commodity.pieceType)}
        ${field({ label: '每单位内包装件数', name: 'pieceCount', type: 'number', value: commodity.pieceCount, attributes: 'min="1" step="1"', placeholder: '例如 12' })}
      </div>
      ${hazmatFields(hazmatId, commodity.regulated.includes('hazmat'), commodity.hazmat)}
    </div>
  </div>`;
}

export function cargoEditor(quote, units) {
  const { shipment, details = {} } = quote;
  const groups = shipment.items.map((item, index) => {
    const commodities = itemCommodities(item, index === 0 ? details.commodity : '');
    return `<section class="cargo-item" data-cargo-row aria-labelledby="cargo-item-${index}">
      <div class="panel-head cargo-item-head">
        <h3 class="subhead" id="cargo-item-${index}">货物 ${index + 1}</h3>
        <p class="note" data-cargo-metrics>${cargoItemMetrics(item, units)}</p>
        ${shipment.items.length > 1 ? removeCargoButton(index, shipment.items.length) : ''}
      </div>
      <div class="cargo-row">${cargoFields(item, units)}</div>
      <div class="cargo-commodities">${commodities.map((commodity, position) => commodityFields(commodity, position, commodities.length, index)).join('')}
        <button type="button" class="link" data-action="add-commodity" data-index="${index}">${icon('plus')}添加一种货品</button>
      </div>
    </section>`;
  }).join('');
  return `<section class="panel cargo-editor" id="cargo-editor" aria-labelledby="cargo-heading">
    <header class="panel-head ruled"><div><h2 class="panel-title" id="cargo-heading">货物明细</h2><p class="note" id="cargo-total">${cargoTotalsText(shipment, units)}</p></div>${cargoUnits(units)}</header>
    <div class="cargo-items">${groups}</div>
    <div class="cargo-editor-footer"><button type="button" class="btn small" data-action="add-cargo">${icon('plus')}添加一项货物</button></div>
  </section>`;
}

export function detailsView(quote, addresses, units) {
  const { shipment } = quote;
  const details = { ...quote.details };
  for (const side of ['origin', 'destination']) {
    const saved = addresses.find(address => addressValue(address) === displayAddress(shipment[side]));
    if (!saved) continue;
    for (const [key, field] of Object.entries(addressContactFields)) details[side + field] ??= saved[key] ?? '';
  }
  const pickupComplete = stopDetailsReady({ ...quote, details }, 'origin');
  const deliveryComplete = stopDetailsReady({ ...quote, details }, 'destination');
  return `<h1 class="sr-only" tabindex="-1">完善并下单</h1>
    <div class="split has-detail details-layout">
      <form id="details-form" class="stack" data-quote="${e(quote.id)}">
        <div class="details-stops">
          ${sideFields(shipment, 'origin', details, pickupComplete)}
          ${sideFields(shipment, 'destination', details, deliveryComplete)}
        </div>
        ${addressSuggestions(addresses)}
        ${cargoEditor(quote, units)}
        <p id="details-error" class="error" role="alert"></p>
      </form>
      <aside class="panel selected-quote" aria-labelledby="selected-heading">
        <header class="panel-head ruled"><h2 id="selected-heading" class="panel-title">已选报价</h2></header>
        <div id="selected-quote-body" class="detail-body">${quoteSummary(quote)}</div>
      </aside>
    </div>`;
}

function contactPhone(details, side) {
  const phone = details?.[side + 'Phone'];
  const extension = details?.[side + 'PhoneExtension'];
  return phone && extension ? `${phone} 转 ${extension}` : phone;
}
function pickupWindowText(shipment, details) {
  return details?.pickupEnd
    ? e(shipment.pickupDate + ' · ' + shipment.pickupTime + '–' + details.pickupEnd + '（当地）')
    : timeText(shipment);
}

function stopSupplementRows(details, side) {
  const { reference, notes, opensAt, closesAt } = stopSupplement(details, side);
  const hours = opensAt && closesAt ? `${opensAt}–${closesAt <= opensAt ? '次日 ' : ''}${closesAt}（当地）` : '';
  return [
    ['营业时间', e(hours)],
    ['参考单号', e(reference)],
    ['备注', e(notes), 'stop-note']
  ].filter(([, value]) => value);
}

function cargoDetailRows(shipment, details, units = 'imperial') {
  const { weight, length, weightFactor, lengthFactor } = unitSettings[units];
  return shipment.items.map((item, index) => {
    const size = [item.length, item.width, item.height].map(value => cargoNumber.format(value * lengthFactor)).join(' × ');
    const line = `${item.quantity} ${packaging[item.type]} · 单件 ${cargoNumber.format(item.weight * weightFactor)} ${weight} · ${size} ${length}`;
    const commodities = itemCommodities(item, index === 0 ? details?.commodity : '').flatMap(commodity => {
      const regulated = commodity.regulated.map(value => regulatedCargo[value]).filter(Boolean).join('、');
      const pieceType = commodity.pieceType && pieceTypes[commodity.pieceType];
      const pieces = commodity.pieceCount ? `${commodity.pieceCount} ${pieceType || '件'}` : pieceType;
      const description = [commodity.description, commodity.nmfc && 'NMFC ' + commodity.nmfc, commodity.freightClass && 'Class ' + commodity.freightClass,
        regulated && '申报 ' + regulated, pieces && '内包装 ' + pieces + ' / 装运单位'].filter(Boolean).join(' · ');
      const hazmat = commodity.regulated.includes('hazmat') && commodity.hazmat;
      if (!hazmat) return [description];
      return [description,
        [hazmat.hazardId, hazmat.shippingName, '危险品类别 ' + hazmat.hazardClass,
          `${hazmat.hazardQuantity} ${hazmat.hazardPackage}`, hazmat.packingGroup && '包装等级 ' + hazmat.packingGroup].filter(Boolean).join(' · '),
        `紧急联系 ${hazmat.emergencyFirstName} ${hazmat.emergencyLastName} · ${hazmat.emergencyCompany} · ${hazmat.emergencyPhone}`];
    }).filter(Boolean);
    return ['货物 ' + (index + 1), e(line) + commodities.map(text => '<small class="cargo-detail-line">' + e(text) + '</small>').join('')];
  });
}

function shipmentStopCard(shipment, details, side, scope) {
  const pickup = side === 'origin';
  const label = pickup ? '提货' : '送货';
  const unit = details[side + 'Unit'];
  const type = addressTypes[addressTypeFor(shipment, side)];
  const heading = `${scope}-${side}-heading`;
  const company = details[side + 'Company'];
  const date = pickup ? shipment.pickupDate : shipment.deliveryDate;
  const schedule = scope === 'custom' ? [['期望日期（当地）', e(date)]] : pickup ? [['提货窗口', pickupWindowText(shipment, details)]] : [];
  return `<section class="panel review-stop" aria-labelledby="${heading}">
    <header class="review-stop-heading"><span class="overview-pin${pickup ? '' : ' destination'}" aria-hidden="true">${pickup ? 'A' : 'B'}</span><h3 class="subhead" id="${heading}">${label}信息</h3></header>
    <div class="review-stop-body">
      <div class="review-address">${company ? `<strong>${e(company)}</strong>` : ''}<p>${e(displayAddress(shipment[side]))}${unit ? ' · ' + e(unit) : ''}</p>${type ? `<p class="note">${e(type)}</p>` : ''}</div>
      ${detailList([
        ['联系人', e(details[side + 'Contact'])], ['电话', e(contactPhone(details, side))], ['邮箱', e(details[side + 'Email'])],
        ...schedule, ...stopSupplementRows(details, side),
        ['附加服务', e(includedServiceNames(shipment, side).join('、') || '无')]
      ].filter(([, value]) => value))}
    </div>
  </section>`;
}

function shipmentCargoCard(shipment, details, scope, units = 'imperial') {
  return `<section class="panel review-cargo" aria-labelledby="${scope}-cargo-heading">
    <header class="panel-head ruled"><h3 class="subhead" id="${scope}-cargo-heading">货物明细</h3><p class="note">${units === 'imperial' ? cargoLabel(shipment) : cargoTotalsText(shipment, units)}</p></header>
    ${detailList(cargoDetailRows(shipment, details, units), 'review-cargo-list')}
  </section>`;
}

export function confirmationView(quote, message = '') {
  const { shipment, details = {} } = quote;
  return `<div class="confirmation-grid">
    <div class="review-shipment">
      <div class="review-stops">${shipmentStopCard(shipment, details, 'origin', 'review')}${shipmentStopCard(shipment, details, 'destination', 'review')}</div>
      ${shipmentCargoCard(shipment, details, 'review')}
    </div>
    <section class="panel panel-inset detail-block review-quote" aria-labelledby="review-quote-heading"><h3 class="subhead" id="review-quote-heading">报价与费用</h3>${quoteSummary(quote, message, true)}</section>
  </div>`;
}

function status(value, mapping) {
  return '<span class="status ' + value + '">' + mapping[value] + '</span>';
}
function emptyRow(columns, message) {
  return `<tr><td class="empty" colspan="${columns}">${message}</td></tr>`;
}
const campaigns = {
  'ltl-first': {
    title: 'LTL 首单优惠', offer: '减 $50',
    terms: ['适用于新客户的第一票美国境内 LTL 运单。', '运费满 $300 减 $50。起运和派送附加费单独计算。'],
    href: '#quote', action: '开始 LTL 询价'
  },
  'ftl-west': {
    title: '西部整车线路优惠', offer: '减 $150',
    terms: ['适用于加州提货、内华达州或亚利桑那州送货的 53ft 干柜车。', '每张符合条件的整车订单减 $150。'],
    href: '#ftl', action: '开始 FTL 询价'
  },
  'custom-multistop': {
    title: '多点配送方案', offer: '免费评估',
    terms: ['适用于同一批货需要送往两个及以上地点的需求。', '请在需求说明中填写各送货点的 ZIP 和预约时间。方案评估免费，运输费用另行报价。'],
    href: '#custom', action: '提交定制询价'
  }
};

export function campaignDetails(id) {
  if (!Object.hasOwn(campaigns, id)) return null;
  const { title, offer, terms, href, action } = campaigns[id];
  return { title, body: `<div class="campaign-details">
    <p class="campaign-offer">${offer}</p>
    <section aria-labelledby="campaign-terms"><h3 class="subhead" id="campaign-terms">适用条件</h3><ul>${terms.map(term => `<li>${term}</li>`).join('')}</ul></section>
    <p class="note">活动仅供演示。报价及账单金额按现有流程计算。</p>
    <div class="actions end"><a class="btn primary" href="${href}">${action} ${icon('arrow')}</a></div>
  </div>` };
}

export function dashboardView({ orders, quotes, tickets }) {
  const booked = new Set(orders.map(order => order.quoteId));
  const drafts = quotes.filter(quote => quote.stage === 'details' && quote.selectedRateId && !booked.has(quote.id));
  const due = billingRecords(orders).filter(bill => bill.status === 'due');
  const invoices = due.filter(bill => !bill.originalId);
  const rebills = due.filter(bill => bill.originalId);
  const openCases = tickets.filter(ticket => ticket.status !== 'closed').sort((a, b) => b.updatedAt - a.updatedAt);
  const billLink = (items, kind, href, label) => items.length
    ? `<a class="link" href="${href}" data-action="dashboard-due" data-kind="${kind}">${label} ${items.length} 笔 ${icon('chev')}</a>` : '';
  const dueLinks = billLink(invoices, 'bills', '#billing', '账单') + billLink(rebills, 'rebills', '#billing/rebills', '补收');
  const tasks = [
    ['待完善订单', String(drafts.length), drafts.length
      ? `<a class="link" href="#details/${e(drafts[0].id)}">继续最近一票 ${icon('chev')}</a>` : '<span class="note">暂无待完善订单</span>'],
    ['待支付账单', money(due.reduce((sum, bill) => sum + bill.total, 0)), dueLinks || '<span class="note">暂无待支付账单</span>'],
    ['未关闭工单与申诉', String(openCases.length), openCases.length
      ? `<a class="link" href="${e(caseHref(openCases[0]))}">查看最近一条 ${icon('chev')}</a>` : '<span class="note">暂无未关闭记录</span>']
  ];
  const updates = [
    ['订单管理支持按运输类型查看', '在 LTL、FTL 和定制服务之间切换，各标签独立保留筛选。', '#orders', '查看订单'],
    ['线上提交账单申诉与运输索赔', '从账单或运单详情发起，在工单与申诉中跟进。', '#tickets/disputes', '查看申诉']
  ];
  const { 'ltl-first': featured, ...otherOffers } = campaigns;
  return `<div class="dashboard">
    <h1 class="sr-only" tabindex="-1">工作台</h1>
    <section class="dashboard-offers" aria-label="运输优惠与服务">
      <button class="dashboard-feature" type="button" data-action="view-campaign" data-id="ltl-first" aria-haspopup="dialog">
        <img src="../assets/dashboard/western-freight.jpg" width="1280" height="853" alt="">
        <span class="dashboard-feature-copy"><strong>LTL 首单${featured.offer}</strong><span>查看条件 ${icon('arrow')}</span></span>
      </button>
      <ul class="dashboard-campaigns">${Object.entries(otherOffers).map(([id, { title, offer }]) => `<li>
        <button class="link campaign-entry" type="button" data-action="view-campaign" data-id="${id}" aria-haspopup="dialog">
          <span>${title} · <strong>${offer}</strong></span>${icon('arrow')}
        </button>
      </li>`).join('')}</ul>
    </section>
    <div class="dashboard-columns">
      <div class="dashboard-main">
        <section class="dashboard-section" aria-labelledby="dashboard-tasks">
          <header class="panel-head"><h2 class="subhead" id="dashboard-tasks">待办事项</h2></header>
          <div class="dashboard-tasks">${tasks.map(([label, value, links]) => `<div class="dashboard-task">
            <h3 class="dashboard-task-label">${label}</h3><p class="dashboard-task-value">${e(value)}</p>
            <div class="dashboard-task-links">${links}</div>
          </div>`).join('')}</div>
        </section>
        <section class="dashboard-section" aria-labelledby="dashboard-orders">
          <header class="panel-head"><h2 class="subhead" id="dashboard-orders">近期运单</h2><a class="link" href="#orders">订单管理 ${icon('arrow')}</a></header>
          <div class="dashboard-table">
            <table aria-labelledby="dashboard-orders"><thead><tr><th scope="col">运单号 / 路线</th><th scope="col">状态</th><th scope="col">预计送达</th></tr></thead>
            <tbody>${orders.slice(0, 5).map(order => {
              const kind = orderType(order);
              const arrival = order.status === 'delivered'
                ? '—'
                : order.shipment.pickupDate && order.rate?.businessDays?.length ? e(arrivalText(order, order.rate)) : '待确认';
              return `<tr><td><a class="link" href="${e(orderRecordHref(kind, order))}">${e(order.id)}</a><small>${routeLabel(order.shipment)}</small></td>
                <td>${status(order.status, orderStatuses)}</td><td class="dashboard-arrival">${arrival}</td></tr>`;
            }).join('') || emptyRow(3, '暂无运单')}</tbody></table>
          </div>
        </section>
      </div>
      <section class="dashboard-section dashboard-updates" aria-labelledby="dashboard-updates">
        <header class="panel-head"><h2 class="subhead" id="dashboard-updates">公告与更新</h2></header>
        <ul>${updates.map(([title, summary, href, label]) => `<li><h3>${title}</h3><p>${summary}</p><a class="link" href="${href}">${label} ${icon('chev')}</a></li>`).join('')}</ul>
      </section>
    </div>
  </div>`;
}
function recordLink(href, label, selected) {
  return `<a class="link management-record" href="${e(href)}"${selected ? ' aria-current="true"' : ''}>${e(label)}</a>`;
}
const customOrderStatuses = { inquiry: '已提交询价', ...orderStatuses };

export function orderRows(orders, selectedId, kind) {
  const statuses = kind === 'custom' ? customOrderStatuses : orderStatuses;
  return orders.map(order => {
    const references = [order.details?.originReference && '提货 ' + order.details.originReference,
      order.details?.destinationReference && '送货 ' + order.details.destinationReference].filter(Boolean);
    if (!references.length && order.reference) references.push(order.reference);
    return `<tr${order.id === selectedId ? ' class="table-row-selected"' : ''}>
    <td>${recordLink(orderRecordHref(kind, order), order.id, order.id === selectedId)}${references.map(value => `<small>${e(value)}</small>`).join('')}</td>
    <td class="order-table-route">${routeLabel(order.shipment)}</td><td>${status(order.status, statuses)}</td>
    <td class="list-table-date">${order.shipment.pickupDate ? `<time datetime="${e(order.shipment.pickupDate)}">${e(order.shipment.pickupDate)}</time>` : '—'}</td>
  </tr>`;
  }).join('') || emptyRow(4, kind === 'custom' ? '没有符合条件的定制服务记录' : '没有符合条件的运单');
}
export function billRows(bills, selectedId, type) {
  return bills.map(bill => `<tr${bill.id === selectedId ? ' class="table-row-selected"' : ''}>
    <td>${recordLink(billHref(bill), bill.id, bill.id === selectedId)}${bill.originalId ? `<small>${e(bill.charges[0][0])}</small>` : ''}</td>
    ${bill.originalId ? `<td class="bill-table-original"><a class="link" href="#billing/${e(bill.orderId)}">${e(bill.originalId)}</a></td>` : ''}
    <td class="bill-table-order"><a class="link" href="#orders/${e(bill.orderId)}">${e(bill.orderId)}</a></td>
    <td class="list-table-date">${bill.issued ? `<time datetime="${e(bill.issued)}">${e(bill.issued)}</time>` : '—'}</td>
    <td class="list-table-amount">${bill.issued ? `<strong class="amount">${money(bill.total)}</strong>` : '<span class="note">待出账</span>'}</td>
    <td>${status(bill.status, billStatuses)}</td>
  </tr>`).join('') || emptyRow(type === 'rebills' ? 6 : 5, type === 'rebills' ? '没有符合条件的补收账单' : '没有符合条件的账单');
}
function tracking(order) {
  const stages = Object.entries(orderStatuses);
  const progress = stages.findIndex(([id]) => id === order.status);
  const descriptions = ['已收到运输需求，等待提货', '货物已交给承运商', '货物正在运往送货地点', '货物已完成签收'];
  return '<ol class="timeline">' + stages.map(([id, name], index) =>
    `<li${index <= progress ? ' class="done"' : ''}${id === order.status ? ' aria-current="step"' : ''}><strong>${name}</strong><small>${index <= progress ? descriptions[index] : '待更新'}</small></li>`
  ).join('') + '</ol>';
}
function orderOverview(order) {
  const returned = Boolean(order.podReceived);
  const podStatus = returned ? '已回传' : order.status === 'delivered' ? '待回传' : '待签收';
  const podMessage = returned ? `回传日期 ${e(order.podReceived)}` : order.status === 'delivered' ? '等待承运商回传签收凭证' : '签收后更新回单状态';
  return `<section class="detail-block"><h3 class="subhead">承运商</h3><div class="order-carrier">${carrierIdentity(order.rate)}<span class="note">${e(order.rate.name || order.rate.days)}</span></div></section>
    <section class="detail-block"><h3 class="subhead">轨迹动态</h3>${tracking(order)}</section>
    <section class="detail-block"><div class="panel-head"><h3 class="subhead">返单动态</h3><span class="status${returned ? ' paid' : ''}">${podStatus}</span></div><p class="note">${podMessage}</p></section>
    <section class="detail-block"><div class="panel-head"><h3 class="subhead">账单状态</h3>${status(order.billing, billStatuses)}</div><a class="link" href="#billing/${e(order.id)}">查看关联账单 ${icon('arrow')}</a></section>`;
}

function orderInformation(order) {
  const { shipment, details = {} } = order;
  const hasStopReference = stopSupplement(details, 'origin').reference || stopSupplement(details, 'destination').reference;
  return `<section class="detail-block"><h3 class="subhead">订单信息</h3>${detailList([
    ['运单号', e(order.id)], ['创建日期', e(order.date || '—')], ['运输线路', routeLabel(shipment)],
    ...(shipmentMode(shipment) === 'ftl' ? [['运输类型', 'FTL 整车'], ['车辆', e(equipmentSummary(shipment))]] : []),
    ...(!hasStopReference && order.reference ? [['客户参考号', e(order.reference)]] : [])
  ])}</section>
  ${shipmentStopCard(shipment, details, 'origin', 'order')}${shipmentStopCard(shipment, details, 'destination', 'order')}
  ${shipmentCargoCard(shipment, details, 'order')}`;
}

function orderFiles(order) {
  return `<ul class="order-files">${Object.entries(orderDocuments).map(([kind, [name, label]]) => {
    const available = kind !== 'invoice' || Boolean(order.issued);
    return `<li><div class="order-file-name">${icon('bill')}<div><strong>${name}</strong><p class="note">${label}${kind === 'invoice' && order.issued ? ' · ' + e(invoiceId(order)) : ''}</p></div></div>
      ${available ? `<div class="actions"><button class="link" type="button" data-action="order-file" data-order="${e(order.id)}" data-kind="${kind}" data-mode="preview" aria-label="预览 ${name}">预览</button><button class="btn small" type="button" data-action="order-file" data-order="${e(order.id)}" data-kind="${kind}" data-mode="download" aria-label="下载 ${name}">下载</button></div>` : '<span class="status">待出账</span>'}</li>`;
  }).join('')}</ul>`;
}

const orderTabs = { overview: '总览', details: '详情', files: '文件' };

function tabList(scope, label, tabs, activeTab) {
  return `<div class="tab-list" role="tablist" aria-label="${label}">${Object.entries(tabs).map(([tab, name]) =>
    `<button type="button" id="${scope}-tab-${tab}" role="tab" aria-selected="${tab === activeTab}" aria-controls="${scope}-panel-${tab}" tabindex="${tab === activeTab ? '0' : '-1'}" data-action="${scope}-tab" data-tab="${tab}">${name}</button>`).join('')}</div>`;
}
function tabPanels(scope, sections, activeTab, className) {
  return Object.entries(sections).map(([tab, content]) => `<div class="${className}" id="${scope}-panel-${tab}" role="tabpanel" aria-labelledby="${scope}-tab-${tab}" tabindex="0"${tab === activeTab ? '' : ' hidden'}>${content}</div>`).join('');
}

function caseEntry(kind, record, existing) {
  const isClaim = kind === 'claims';
  const label = isClaim ? '查看索赔' : '查看申诉';
  if (existing && existing.status !== 'closed') return `<a class="btn small" href="${e(caseHref(existing))}">${label} · ${ticketStatuses[existing.status]}</a>`;
  const button = `<button class="btn small" type="button" data-action="new-case" data-kind="${kind}" data-record="${e(record.id)}">${caseTypes[kind].action}</button>`;
  return button + (existing ? `<a class="link" href="${e(caseHref(existing))}">${label}记录</a>` : '');
}

export function orderDetail(order, activeTab, totalCount, claim, kind) {
  const title = kind === 'custom' ? '定制服务详情' : '运单详情';
  if (!order) {
    const emptyMessage = totalCount ? '没有符合条件的记录'
      : { ltl: '暂无 LTL 运单', ftl: '暂无 FTL 运单', custom: '暂无定制服务记录' }[kind];
    const entry = { ftl: ['#ftl', '前往 FTL 询价'], custom: ['#custom', '提交定制询价'] }[kind];
    const body = `<div class="empty"><p>${emptyMessage}</p>${!totalCount && entry
      ? `<a class="link order-empty-link" href="${entry[0]}">${entry[1]} ${icon('arrow')}</a>` : ''}</div>`;
    return managementDetail(title, body);
  }
  if (order.status === 'inquiry') {
    const body = `<div class="detail-body">
        <section class="detail-block"><h3 class="subhead">询价信息</h3>${detailList([
          ['运输线路', routeLabel(order.shipment)], ['提交日期', e(order.date)],
          ['期望提货', e(order.shipment.pickupDate)], ['联系人', e(order.contact)], ['联系邮箱', e(order.email)]
        ].filter(([, value]) => value))}</section>
        <section class="detail-block"><h3 class="subhead">需求说明</h3><p class="order-inquiry-notes">${e(order.requirements)}</p></section>
        <a class="link" href="#custom/${e(order.id)}">查看完整询价 ${icon('arrow')}</a>
      </div>`;
    return managementDetail('定制询价详情', body, order.id, status(order.status, customOrderStatuses));
  }
  const sections = { overview: orderOverview(order), details: orderInformation(order), files: orderFiles(order) };
  const actions = `<button class="btn small" type="button" data-action="new-ticket" data-order="${e(order.id)}">${icon('plus')} 创建工单</button>` + (order.status !== 'ready' ? caseEntry('claims', order, claim) : '');
  const controls = `<div class="management-detail-controls">${tabList('order', '运单详情标签', orderTabs, activeTab)}<div class="actions">${actions}</div></div>`;
  return managementDetail(title, tabPanels('order', sections, activeTab, 'detail-body order-tab-body'),
    order.id, status(order.status, orderStatuses), controls);
}
export function billDetail(bill, billing, dispute) {
  const label = billing.type === 'rebills' ? '补收账单' : '账单';
  const title = label + '详情';
  if (!bill) return managementDetail(title, `<p class="empty">${billing.bills.length ? '没有符合条件的' : '暂无'}${label}</p>`);
  const related = billing.records.filter(entry => entry.originalId === bill.id);
  const amount = `<dl class="bill-detail-amount${bill.issued ? '' : ' estimate'}"><dt>${bill.issued ? '账单金额 (USD)' : '预计费用 (USD)'}</dt><dd>${money(bill.total)}</dd></dl>`;
  const body = `<div class="detail-body">
    ${bill.issued ? '' : '<p class="note bill-estimate-note">正式金额以出账为准。出账后可下载账单明细。</p>'}
    <section class="detail-block">${detailList([
      ['关联运单', `<a class="link" href="#orders/${e(bill.orderId)}">${e(bill.orderId)}</a>`],
      ...(bill.originalId ? [['原账单', `<a class="link" href="#billing/${e(bill.orderId)}">${e(bill.originalId)}</a>`]] : []),
      ...(bill.issued ? [['出账日期', e(bill.issued)]] : [])
    ])}</section>
    ${bill.reason ? `<section class="detail-block"><h3 class="subhead">补收原因</h3><p>${e(bill.reason)}</p></section>` : ''}
    <section class="detail-block"><h3 class="subhead">费用明细</h3>${detailList(bill.charges.map(([label, amount]) => [label, money(amount)]), 'fees')}</section>
    ${related.length ? `<section class="detail-block"><h3 class="subhead">关联补收账单</h3>${related.map(entry => `<div class="panel-head"><a class="link" href="${e(billHref(entry))}">${e(entry.id)}</a><span>${money(entry.total)}</span></div>`).join('')}</section>` : ''}
    ${bill.issued
      ? `<div class="actions end bill-detail-actions">${caseEntry('disputes', bill, dispute)}<button type="button" class="btn primary small" data-action="download-bill" data-bill="${e(bill.id)}">下载账单明细</button></div>`
      : ''}
    </div>`;
  return managementDetail(title, body, bill.id, status(bill.status, billStatuses) + amount);
}
function listingSearch(placeholder, query) {
  return `<label class="with-icon"><span class="sr-only">${placeholder}</span>${icon('search')}<input class="text-input" type="search" name="query" placeholder="${placeholder}" value="${e(query)}"></label>`;
}
function managementToolbar(statuses, filter, counts, placeholder, action = '') {
  return `<div class="management-toolbar">
    <div class="management-status-tabs" role="group" aria-label="按状态筛选">${[['', '全部'], ...Object.entries(statuses)].map(([value, name]) =>
      `<button type="button" data-action="list-status-filter" data-status="${value}" aria-pressed="${filter.status === value}">${name} <span class="management-status-count">${counts[value] ?? 0}</span></button>`).join('')}</div>
    <div class="management-search">${listingSearch(placeholder, filter.query)}${action}</div>
  </div>`;
}
function managementTabs(label, tabs, active, summary = '') {
  return `<div class="management-tabs-bar"><nav class="management-tabs" aria-label="${label}">
    ${tabs.map(([key, href, name]) => `<a href="${href}"${key === active ? ' aria-current="page"' : ''}>${name}</a>`).join('')}
  </nav>${summary}</div>`;
}
function managementDetail(title, body, id, actions = '', tabs = '') {
  return `<div class="management-detail-head">
    <header class="panel-head"><div><h2 class="panel-title" id="detail-title" tabindex="-1">${title}</h2>${id ? `<p class="note">${e(id)}</p>` : ''}</div>
      ${actions ? `<div class="actions management-detail-actions">${actions}</div>` : ''}</header>${tabs}
  </div><div class="management-detail-scroll"${tabs ? '' : ' tabindex="0" role="region" aria-labelledby="detail-title"'}>${body}</div>`;
}
function managementPage({ title, kind, label, tabs = '', toolbar, headers, rows, detail, result }) {
  return `<h1 class="sr-only" tabindex="-1">${title}</h1>
    <div class="panel management-tools" data-filters="${kind}">${tabs}${toolbar}</div>
    <div class="management-workspace">
      <div class="panel management-list"><div class="table-wrap" tabindex="0" role="region" aria-label="${label}"><table aria-label="${label}">
        <thead><tr>${headers.map(header => {
          const [name, className] = typeof header === 'string' ? [header] : header;
          return `<th scope="col"${className ? ` class="${className}"` : ''}>${name}</th>`;
        }).join('')}</tr></thead>
        <tbody id="listing-rows">${rows}</tbody>
      </table></div></div>
      <aside class="panel detail management-detail" aria-labelledby="detail-title">${detail}</aside>
    </div>${paginationControls(kind, result)}`;
}

export const pageSizes = [20, 50, 100];

export function paginationControls(kind, { page, size, pageCount, total, offset, rows }) {
  const numberedPages = new Set([1, pageCount]);
  const start = Math.max(1, Math.min(page - 1, pageCount - 2));
  for (let number = start; number <= Math.min(start + 2, pageCount); number++) numberedPages.add(number);
  let previous = 0;
  const numbered = [...numberedPages].sort((a, b) => a - b).map(number => {
    const gap = number - previous > 1 ? '<span class="page-gap" aria-hidden="true">…</span>' : '';
    previous = number;
    return `${gap}<button class="page-number" type="button" data-action="list-page" data-list="${kind}" data-page="${number}" aria-label="第 ${number} 页"${number === page ? ' aria-current="page" disabled' : ''}>${number}</button>`;
  }).join('');
  return `<footer class="list-pagination">
    <div class="pagination-inner">
    <p class="note" role="status">${total ? `第 ${offset + 1}–${offset + rows.length} 条，共 ${total} 条` : '共 0 条'}</p>
    <label class="page-size"><span class="sr-only">每页条数</span><select data-page-size="${kind}">${pageSizes.map(number => option(number, `每页 ${number} 条`, size)).join('')}</select></label>
    <nav class="page-links" aria-label="列表分页">
      <button type="button" data-action="list-page" data-list="${kind}" data-page="${page - 1}" aria-label="上一页"${page === 1 ? ' disabled' : ''}>${icon('chev', 'page-prev')}</button>
      <span class="page-numbers">${numbered}</span><span class="page-position" aria-label="第 ${page} 页，共 ${pageCount} 页">${page} / ${pageCount}</span>
      <button type="button" data-action="list-page" data-list="${kind}" data-page="${page + 1}" aria-label="下一页"${page === pageCount ? ' disabled' : ''}>${icon('chev')}</button>
    </nav>
    </div>
  </footer>`;
}

export function ordersView(result, filter, detail, totalCount, activeTab, counts, claim, kind) {
  return managementPage({
    title: '订单管理', kind, label: orderTypes[kind] + '列表', result,
    tabs: managementTabs('运输类型', Object.entries(orderTypes).map(([key, label]) => [key, orderRoute(key), label]), kind),
    toolbar: kind === 'custom'
      ? managementToolbar(customOrderStatuses, filter, counts, '搜索记录编号、线路或需求')
      : managementToolbar(orderStatuses, filter, counts, '搜索运单号、参考号或线路'),
    headers: [kind === 'custom' ? '记录编号' : '运单号', ['运输线路', 'order-table-route'], '状态',
      [kind === 'custom' ? '提货日期（当地）' : '提货日期', 'list-table-date']],
    rows: orderRows(result.rows, detail?.id, kind), detail: orderDetail(detail, activeTab, totalCount, claim, kind)
  });
}

const ticketDateFormat = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function ticketTime(timestamp) {
  return `<time datetime="${new Date(timestamp).toISOString()}">${ticketDateFormat.format(timestamp)}</time>`;
}
export function ticketRows(tickets, selectedId, kind = 'tickets') {
  return tickets.map(ticket => {
    const selected = ticket.id === selectedId;
    const category = e(caseCategory(ticket));
    const order = e(ticket.billId || ticket.orderId);
    return `<tr${selected ? ' class="table-row-selected"' : ''}>
      <td>${recordLink(caseHref(ticket), ticket.subject, selected)}<small>${e(ticket.id)}</small><small class="ticket-mobile-meta">${category}${order ? ` · ${order}` : ''}</small></td>
      <td class="ticket-table-context">${category}${order ? `<small>${order}</small>` : ''}</td>
      <td>${status(ticket.status, ticketStatuses)}</td><td class="list-table-date">${ticketTime(ticket.updatedAt)}</td>
    </tr>`;
  }).join('') || emptyRow(4, '没有符合条件的' + caseTypes[kind].label);
}

function evidenceField() {
  return `<label class="field"><span>相关凭证（选填）</span><input name="evidence" type="file" multiple accept="image/png,image/jpeg,application/pdf"><small class="note">最多 3 个 JPG、PNG 或 PDF，每个不超过 2 MB。</small></label>`;
}

export function ticketDetail(ticket, order, emptyMessage, kind, bill) {
  const title = (kind === 'tickets' ? '工单' : caseTypes[kind].label) + '详情';
  if (!ticket) return managementDetail(title, `<p class="empty">${emptyMessage}</p>`);
  const names = { customer: '你', support: 'HYE 客服', system: '系统' };
  const rows = [
    ...(bill ? [['关联账单', `<a class="link" href="${e(billHref(bill))}">${e(bill.id)}</a>`], ['争议费用项', e(ticket.charge === 'all' ? '整张账单' : ticket.charge)]] : []),
    ...(bill?.originalId ? [['原账单', `<a class="link" href="#billing/${e(bill.orderId)}">${e(bill.originalId)}</a>`]] : []),
    ...(kind === 'claims' && order ? [['承运商', e(carrierName(order.rate))]] : []),
    ...(ticket.requestedAmount ? [['申请金额', money(ticket.requestedAmount)]] : [])
  ];
  const body = `<div class="detail-body">
    <section class="detail-block ticket-context">
      <div><h3 class="subhead">${e(ticket.subject)}</h3><p class="note">${e(caseCategory(ticket))}</p></div>
      ${order ? `<a class="ticket-linked-order" href="#orders/${e(order.id)}">${icon('order')}<span><strong>${e(order.id)}</strong><small>${routeLabel(order.shipment)}</small></span>${icon('chev')}</a>` : ''}
    </section>
    ${rows.length ? `<section class="detail-block">${detailList(rows)}</section>` : ''}
    <section class="detail-block" aria-labelledby="ticket-activity-heading"><h3 class="subhead" id="ticket-activity-heading">沟通记录</h3>
      <ol class="ticket-activity">${ticket.messages.map(message => `<li class="ticket-message ${message.by === 'support' ? 'ticket-message-support' : ''}">
        <div class="panel-head"><strong>${names[message.by]}</strong><span class="note">${ticketTime(message.at)}</span></div>${message.text ? `<p>${e(message.text)}</p>` : ''}
        ${message.files?.map(file => `<button class="link" type="button" data-action="download-evidence" data-id="${e(file.id)}" data-name="${e(file.name)}">${e(file.name)}</button>`).join('') ?? ''}
      </li>`).join('')}</ol>
    </section>
    ${ticket.status === 'closed' ? '' : `<form class="detail-block" id="ticket-reply-form" data-id="${e(ticket.id)}">
      <label class="field"><span>补充说明</span><textarea name="reply" rows="2" ${kind === 'tickets' ? 'required' : ''} maxlength="2000" placeholder="输入要补充的信息"></textarea></label>
      ${kind === 'tickets' ? '' : evidenceField()}
      <p class="error" role="alert" id="ticket-reply-error"></p>
      <div class="panel-head"><button class="link ticket-close" type="button" data-action="close-ticket" data-id="${e(ticket.id)}">关闭${kind === 'tickets' ? '工单' : kind === 'claims' ? '索赔' : '申诉'}</button><button class="btn primary small" type="submit">添加回复</button></div>
    </form>`}
  </div>`;
  return managementDetail(title, body, ticket.id, status(ticket.status, ticketStatuses));
}

export function ticketsView(result, filter, selected, order, counts, emptyMessage, kind, bill) {
  const { label, action } = caseTypes[kind];
  const search = kind === 'disputes' ? '搜索申诉号、账单号或主题' : '搜索编号、主题或运单号';
  return managementPage({
    title: '工单与申诉', kind, label: label + '列表', result,
    tabs: managementTabs('工单与申诉类型', Object.entries(caseTypes).map(([key, tab]) => [key, caseRoute(key), tab.label]), kind),
    toolbar: managementToolbar(ticketStatuses, filter, counts, search,
      `<button class="btn primary small" type="button" data-action="${kind === 'tickets' ? 'new-ticket' : 'new-case'}" data-kind="${kind}">${icon('plus')} ${action}</button>`),
    headers: ['主题', ['类型 / 关联记录', 'ticket-table-context'], '状态', ['最近更新', 'list-table-date']],
    rows: ticketRows(result.rows, selected?.id, kind), detail: ticketDetail(selected, order, emptyMessage, kind, bill)
  });
}

export function ticketForm(orders, order) {
  const orderField = order ? `<div class="ticket-linked-order">${icon('order')}<span><strong>关联运单 ${e(order.id)}</strong><small>${routeLabel(order.shipment)}</small></span></div><input type="hidden" name="orderId" value="${e(order.id)}">`
    : selectField('关联运单（可选）', 'orderId', Object.fromEntries([['', '选择运单'], ...orders.map(entry => [entry.id, `${entry.id} · ${shortAddress(entry.shipment.origin)} → ${shortAddress(entry.shipment.destination)}`])]), '');
  return `<form class="ticket-form" id="new-ticket-form">
    ${orderField}
    ${selectField('问题类型', 'category', { '': '选择问题类型', ...ticketCategories, billing: '账单费用咨询', damage: '货损理赔咨询' }, '', true)}
    ${field({ label: '工单主题', name: 'subject', placeholder: '例如确认预计送达时间', required: true, attributes: 'maxlength="80"' })}
    <label class="field"><span>问题描述 ${requiredMark}</span><textarea name="description" rows="4" maxlength="2000" required placeholder="请描述遇到的问题和需要的协助"></textarea></label>
    <p class="error" role="alert" id="ticket-form-error"></p>
    <div class="actions end"><button class="btn" type="button" data-action="close-dialog">取消</button><button class="btn primary" type="submit">提交工单</button></div>
  </form>`;
}

export function caseChargeOptions(bill) {
  if (!bill) return option('', '请先选择账单', '');
  return option('all', '整张账单 · ' + money(bill.total), 'all') + bill.charges
    .filter(([, amount]) => amount > 0)
    .map(([label, amount]) => option(label, label + ' · ' + money(amount), '')).join('');
}

export function caseForm(kind, records, selected) {
  const dispute = kind === 'disputes';
  const key = dispute ? 'billId' : 'orderId';
  const recordLabel = dispute ? '关联账单' : '关联运单';
  const detail = record => dispute
    ? [record.orderId, record.originalId && '原账单 ' + record.originalId, money(record.total)].filter(Boolean).join(' · ')
    : carrierName(record.rate);
  const recordFields = selected
    ? `<div class="ticket-linked-order">${icon(dispute ? 'bill' : 'order')}<span><strong>${recordLabel} ${e(selected.id)}</strong><small>${e(detail(selected))}</small></span></div><input type="hidden" name="${key}" value="${e(selected.id)}">`
    : selectField(recordLabel, key, Object.fromEntries([['', '请选择'], ...records.map(record => [record.id, record.id + ' · ' + detail(record)])]), '', true);
  return `<form class="ticket-form" id="new-case-form">
    <input type="hidden" name="kind" value="${kind}">
    ${recordFields}
    ${selectField(dispute ? '申诉原因' : '索赔类型', 'category', { '': '请选择', ...(dispute ? disputeReasons : claimReasons) }, '', true)}
    ${dispute ? `<label class="field"><span>争议费用项 ${requiredMark}</span><select name="charge" required>${caseChargeOptions(selected)}</select></label>` : field({ label: '申请金额（USD，选填）', name: 'requestedAmount', type: 'number', attributes: 'min="0.01" max="999999999.99" step="0.01"' })}
    ${field({ label: '主题', name: 'subject', required: true, attributes: 'maxlength="80"', placeholder: dispute ? '例如账单多收尾板费' : '例如签收时发现两箱破损' })}
    <label class="field"><span>情况说明 ${requiredMark}</span><textarea name="description" rows="3" maxlength="2000" required></textarea></label>
    ${evidenceField()}
    <p class="error" role="alert" id="ticket-form-error"></p>
    <div class="actions end"><button class="btn" type="button" data-action="close-dialog">取消</button><button class="btn primary" type="submit">提交${dispute ? '申诉' : '索赔'}</button></div>
  </form>`;
}

export function billingView(billing, result, selected, counts, dispute) {
  const { type, bills, filter } = billing;
  const rebills = type === 'rebills';
  const due = bills.filter(bill => bill.status === 'due');
  const dueAmount = due.reduce((sum, bill) => sum + bill.total, 0);
  const pending = bills.filter(bill => bill.status === 'pending').length;
  const summary = `<div class="billing-summary" aria-label="${rebills ? '补收账单汇总' : '账单汇总'}">
    <button class="billing-metric" type="button" data-action="billing-summary-filter" data-status="due">
      <span>待支付总额</span><strong>${money(dueAmount)}</strong><span>· ${due.length} 笔</span>
    </button>
    ${rebills ? '' : `<button class="billing-metric" type="button" data-action="billing-summary-filter" data-status="pending"><span>待出账</span><strong>${pending} 笔</strong></button>`}
  </div>`;
  return managementPage({
    title: '账单管理', kind: type, label: rebills ? '补收账单列表' : '账单列表', result,
    tabs: managementTabs('账单类型', [['bills', '#billing', 'Bills <small>账单</small>'], ['rebills', '#billing/rebills', 'Rebills <small>补收账单</small>']], type, summary),
    toolbar: managementToolbar(rebills ? { due: billStatuses.due, paid: billStatuses.paid } : billStatuses, filter, counts,
      rebills ? '搜索补收单号、原单号或运单' : '搜索账单号或关联运单'),
    headers: [rebills ? '补收账单号' : '账单号', ...(rebills ? [['原账单号', 'bill-table-original']] : []),
      ['关联运单', 'bill-table-order'], ['出账日期', 'list-table-date'], ['金额 (USD)', 'list-table-amount'], '状态'],
    rows: billRows(result.rows, selected?.id, type), detail: billDetail(selected, billing, dispute)
  });
}

export function addressRows(addresses, mode, side = '') {
  return addresses.map(address => {
    const action = mode === 'pick'
      ? `<button class="btn small" type="button" data-action="apply-address" data-id="${e(address.id)}" data-side="${side}">选用</button>`
      : `<div class="actions"><button class="link" type="button" data-action="edit-address" data-id="${e(address.id)}" aria-label="编辑地址 ${e(address.label)}">编辑</button><button class="link" type="button" data-action="delete-address" data-id="${e(address.id)}" aria-label="删除地址 ${e(address.label)}">删除</button></div>`;
    const location = [addressValue(address), address.unit].filter(Boolean).join(' · ');
    const phone = address.phone && address.phoneExtension ? `${address.phone} 转 ${address.phoneExtension}` : address.phone;
    const contact = [address.company, address.contact, phone, address.email].filter(Boolean).join(' · ');
    return `<li><div class="address-summary"><strong>${e(address.label)}</strong><small>${e(location)}</small>${contact ? `<small>${e(contact)}</small>` : ''}</div>${action}</li>`;
  }).join('') || '<li class="empty">地址簿暂无地址</li>';
}
export function addressForm(address = {}) {
  return `<form id="address-form" data-address="${e(address.id)}">
    <h3 class="subhead address-form-heading">地址</h3>
    <div class="account-fields">
      ${field({ label: '地址名称', name: 'label', value: address.label, required: true, placeholder: '例如西部仓库', attributes: 'maxlength="50"' })}
      ${selectField('地址类型', 'type', addressTypeOptions, address.type ?? '', true)}
      ${field({ label: '街道地址', name: 'street', value: address.street, required: true, placeholder: '例如 120 Demo Way', attributes: 'maxlength="100"', className: 'full' })}
      ${field({ label: '城市', name: 'city', value: address.city, required: true, attributes: 'maxlength="50"' })}
      ${field({ label: '州 (两位代码)', name: 'region', value: address.region, required: true, attributes: 'pattern="[A-Za-z]{2}" maxlength="2"', placeholder: 'CA' })}
      ${field({ label: '邮编', name: 'zip', value: address.zip, required: true, attributes: 'pattern="[0-9]{5}" maxlength="5" inputmode="numeric"', placeholder: '90001' })}
      ${field({ label: '套间 / 单元', name: 'unit', value: address.unit, attributes: 'maxlength="30"' })}
    </div>
    <h3 class="subhead address-form-heading contact">联系人（可选）</h3>
    <div class="account-fields">
      ${field({ label: '公司名称', name: 'company', value: address.company, attributes: 'maxlength="100"' })}
      ${field({ label: '联系人', name: 'contact', value: address.contact, attributes: 'maxlength="70"' })}
      ${field({ label: '联系电话', name: 'phone', value: address.phone, type: 'tel', attributes: 'maxlength="40"' })}
      ${field({ label: '分机号', name: 'phoneExtension', value: address.phoneExtension, type: 'tel', attributes: 'maxlength="12"' })}
      ${field({ label: '联系邮箱', name: 'email', value: address.email, type: 'email', attributes: 'maxlength="100"', className: 'full' })}
    </div>
    <div class="actions end account-actions"><button class="btn primary" type="submit">保存地址</button></div>
  </form>`;
}
export function apiKeyForm() {
  return `<form id="api-key-form">${field({ label: '密钥名称', name: 'name', required: true, placeholder: '例如 OMS 测试', attributes: 'maxlength="70"' })}
    <div class="actions end account-actions"><button type="submit" class="btn primary">创建密钥</button></div></form>`;
}
export function apiKeyResult(token) {
  return `<p class="note">完整密钥仅在创建时显示，请先复制。</p><label class="field"><span>演示 API 密钥</span><input id="api-key-value" value="${e(token)}" readonly></label>
    <div class="actions end"><p class="note" id="api-key-copy-status" role="status"></p><button class="btn primary" type="button" data-action="copy-api-key">复制密钥</button></div>`;
}

function apiKeyList(keys) {
  return `<div class="panel-head account-tab-heading"><p class="note">演示密钥在当前浏览器管理。</p><button class="btn small" type="button" data-action="new-api-key">${icon('plus')}创建密钥</button></div>
    <ul class="api-key-list">${keys.map(key => `<li><div class="address-summary"><strong>${e(key.name)}</strong><code>${e(key.preview)}</code><p class="note">创建于 ${e(key.date)}${key.revokedOn ? ' · 停用于 ' + e(key.revokedOn) : ''}</p></div>
      ${key.revokedOn ? '<span class="status">已停用</span>' : `<div class="actions"><span class="status paid">已启用</span><button class="link" type="button" data-action="revoke-api-key" data-id="${e(key.id)}" aria-label="停用密钥 ${e(key.name)}">停用</button></div>`}</li>`).join('') || '<li class="empty">暂无演示 API 密钥</li>'}</ul>`;
}

const accountTabs = { profile: '用户基本信息', addresses: '地址簿', api: 'API 管理' };

export function accountView(profile, addresses, keys, activeTab) {
  const sections = {
    profile: `<form id="profile-form">
          <div class="account-fields">
            ${field({ label: '公司名称', name: 'company', value: profile.company, required: true, attributes: 'maxlength="100"' })}
            ${field({ label: '联系人', name: 'contact', value: profile.contact, required: true, attributes: 'maxlength="70"' })}
            ${field({ label: '联系邮箱', name: 'email', value: profile.email, type: 'email', required: true, attributes: 'maxlength="100"' })}
            ${field({ label: '电话', name: 'phone', value: profile.phone, type: 'tel', required: true, attributes: 'maxlength="40"' })}
            ${field({ label: '账单邮箱', name: 'billingEmail', value: profile.billingEmail, type: 'email', required: true, attributes: 'maxlength="100"' })}
            ${selectField('首选单位', 'units', unitNames, profile.units, true)}
          </div>
          <div class="actions end account-actions"><button class="btn primary" type="submit">保存修改</button></div>
        </form>`,
    addresses: `<div class="panel-head account-tab-heading"><p class="note">${addresses.length} 个地址</p><button class="btn small" type="button" data-action="new-address">${icon('plus')}添加地址</button></div>
      <ul class="address-book account-address-book">${addressRows(addresses, 'manage')}</ul>`,
    api: apiKeyList(keys)
  };
  return `${pageHead('账号管理')}<section class="panel account-panel">
    ${tabList('account', '账号管理标签', accountTabs, activeTab)}
    ${tabPanels('account', sections, activeTab, 'panel-inset account-tab-panel')}
  </section>`;
}
