import {
  serviceOptions, selectedServices, addressTypes, addressTypeFor, zones, unitSettings, packaging, orderStatuses, orderTypes, orderType, orderRoute, orderRecordHref, rebillStatuses, rebillCollectionRule, billStatusText, billAmountLabel, rebillCountdownText, rebillMethodText, walletKinds,
  dateInZone, totals, displayAddress, shortAddress, addressValue, invoiceId, billingRecords, money, displayMeasurement,
  carrierProfiles, selectedRate, quoteStatus, postalCode, stopDetailsReady, itemCommodities, itemFreightClasses,
  hazardClasses, packingGroups, hazardIdPattern, stopSupplement, cargoReady, pricingReady, estimatedLinearFeet, orderDocuments,
  quoteModes, shipmentMode, quoteEntry, equipmentTypes, equipmentSummary, addressContactFields, ticketStatuses, ticketCategories, billHref,
  caseTypes, caseKind, caseRoute, caseHref, caseCategory, disputeReasons, claimReasons,
  canClaimOrder, canRequestOrderChange, editableOrderStops, orderStopValues, orderChangeLabels, orderStopLabel, customShipmentStops, customCargoRoute, customRequestStatuses, customRequestStatus, customChangeTicket
} from './model.js?v=account-layout';
import { customRequestChanges } from './custom-changes.js?v=account-layout';
import { callingCodes, parsePhone } from './phone-input.js?v=phone-input-2';

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
  const quoteNumber = quote && section !== 'quote'
    ? `<span class="workflow-quote-number">询价编号 <strong>${e(quote.id)}</strong></span>`
    : '';
  return {
    path: `<span class="flow-title">${quoteModes[mode]}</span><nav aria-label="发货步骤"><ol class="flow-crumbs">${links}</ol></nav>${quoteNumber}`,
    action
  };
}
function option(value, label, current) {
  return `<option value="${e(value)}"${value === current ? ' selected' : ''}>${e(label)}</option>`;
}
function field({ label, name, value = '', type = 'text', attributes = '', required = false, placeholder = '', className = '' }) {
  if (type === 'tel' && !/Extension$/i.test(name)) return phoneField({ label, name, value, required, className });
  if (/Extension$/i.test(name)) {
    type = 'text';
    attributes = 'maxlength="12" inputmode="numeric" pattern="[0-9]*" autocomplete="tel-extension"';
    placeholder = '选填';
  }
  return `<label class="field ${className}"><span>${label}${required ? ' ' + requiredMark : ''}</span><input name="${name}" type="${type}" value="${e(value)}"${placeholder ? ' placeholder="' + e(placeholder) + '"' : ''}${required ? ' required' : ''} ${attributes}></label>`;
}
let phoneFieldSequence = 0;
function phoneField({ label, name, value, required, className }) {
  const id = `phone-field-${++phoneFieldSequence}`;
  const { country } = parsePhone(value);
  const codes = callingCodes.some(([code]) => code === country) ? callingCodes : [...callingCodes, [country, '其他地区']];
  return `<div class="field phone-field ${className}" data-phone-field>
    <label for="${id}">${label}${required ? ' ' + requiredMark : ''}</label>
    <div class="phone-input-group">
      <select data-phone-country autocomplete="tel-country-code" aria-label="${e(label)}国家区号">${codes.map(([code, countryName]) => option(code, code ? `+${code} ${countryName}` : '国际号码', country)).join('')}</select>
      <input id="${id}" name="${name}" type="tel" value="${e(value)}" data-phone-number inputmode="tel" autocomplete="tel-national" maxlength="60" aria-describedby="${id}-error"${required ? ' required' : ''}>
    </div>
    <small class="phone-error" id="${id}-error" data-phone-error aria-live="polite" hidden></small>
  </div>`;
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
      ${field({ label: '最早提货', name: 'pickupTime', value: shipment.pickupTime ?? '09:00', type: 'time', required: true })}
      ${field({ label: '最晚提货', name: 'pickupEnd', value: details.pickupEnd ?? '17:00', type: 'time', required: true })}
    </div>
  </fieldset>`;
}
export function serviceSelectionText(shipment, side) {
  return selectedServices(shipment, side).map(service => service.label).join('、') || '未选择';
}
function serviceFields(shipment, side, label, collapsible = false, key = side) {
  const fields = `<fieldset class="services"${collapsible ? ` aria-label="${label}"` : ''}>
    ${collapsible ? '' : `<legend>${label} <span>可多选</span></legend>`}
    <div class="service-options">${serviceOptions[side].map(service => {
      const helpId = `service-help-${key}-${service.id}`;
      return `<div class="check-option">
        <label><input type="checkbox" name="${key}-services" value="${service.id}"${shipment.services[side].includes(service.id) ? ' checked' : ''}><span>${service.label}</span></label>
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
  const opensAt = details[side + 'OpensAt'] ?? '09:00';
  const closesAt = details[side + 'ClosesAt'] ?? '17:00';
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
      ${field({ label: '分机号', name: side + 'PhoneExtension', value: details[side + 'PhoneExtension'], type: 'tel' })}
    </div>
  </div>`;
}
function stopAddressFields(shipment, side, mode, key = side) {
  const pickup = side === 'origin';
  const stopLabel = pickup ? '提货' : '送货';
  const quick = mode === 'quick';
  const custom = mode === 'custom';
  const label = custom ? '地址' : stopLabel + (quick ? '地址或 ZIP' : '完整地址');
  const address = displayAddress(shipment[side]);
  const addressAttributes = quick ? `role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${side}-address-options" data-quick-address` : 'list="address-suggestions"';
  const placeholder = quick || custom ? '街道、城市或 ZIP' : '街道、城市、州、ZIP';
  return `<div class="address-line">
      <div class="address-field${quick ? ' address-field-with-map' : ''}">
        <label class="field" for="${key}"><span>${label} ${requiredMark}</span><span class="with-icon">${icon('search')}<input id="${key}" name="${key}" ${addressAttributes} value="${e(address)}" placeholder="${placeholder}" autocomplete="off" maxlength="220" required></span></label>
        <button class="icon-button" type="button" data-action="choose-address" data-side="${key}" aria-label="从地址簿选择${stopLabel}地址">${icon('book')}</button>
        ${quick ? `<button type="button" class="link satellite-trigger" data-action="show-satellite" data-side="${side}" aria-label="查看${stopLabel}卫星图" aria-haspopup="dialog" aria-controls="satellite-drawer">卫星图</button>` : ''}
        ${quick ? `<div class="address-suggestions" hidden><div id="${side}-address-options" role="listbox" aria-label="${stopLabel}地址建议"></div><div class="address-suggestion-foot note" role="status"></div></div>` : ''}
      </div>
      ${selectField('地址类型', key + '-type', addressTypeOptions, addressTypeFor(shipment, side), !custom)}
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
function freightClassField(value, quick = false) {
  return `<label class="field"${quick ? ' data-quick-freight-class' : ''}><span>${quick ? 'Class（选填）' : '货运等级'}</span>
    <select name="freightClass">${option('', '请选择', value)}${freightClasses.map(entry => option(entry, 'Class ' + entry, value)).join('')}</select></label>`;
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
  const classField = item => mode === 'ltl' ? freightClassField(itemCommodities(item)[0]?.freightClass, true) : '';
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
      <section class="panel panel-inset quote-cargo-panel" aria-labelledby="cargo-heading">
        <div class="panel-head"><h2 id="cargo-heading" class="panel-title">货物明细</h2>${cargoUnits(units)}</div>
        <div class="cargo-rows">${shipment.items.map((item, index) => `<div class="cargo-row${mode === 'ltl' ? ' cargo-row-with-class' : ''}" data-cargo-row>${cargoFields(item, units)}${classField(item)}${removeCargoButton(index, shipment.items.length)}</div>`).join('')}</div>
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

export function quoteAssistantResult(result, shipment, units, onDashboard = false) {
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
  if (onDashboard && shipmentMode(shipment) === 'ftl' && !result.fields.vehicleCount) {
    rows.push(['车辆数量', e(shipment.vehicleCount) + '（默认）']);
  }
  const ready = onDashboard && pricingReady(shipment);
  const actions = onDashboard
    ? `${ready ? '<button type="button" class="btn small" data-action="dashboard-quote" data-next="form">带入查价表单</button>' : ''}
      <button type="button" class="btn primary small" data-action="dashboard-quote" data-next="${ready ? 'rates' : 'form'}">${ready ? '查看演示报价' : '补全查价信息'} ${icon('arrow')}</button>`
    : `<button type="button" class="btn primary small" data-action="assistant-apply">${rows.length ? '应用到查价表单' : '应用交接资料'}</button>`;
  return `<h3 class="subhead">核对识别结果</h3>${rows.length ? detailList(rows) : ''}
    ${details.length ? `<h4 class="subhead">完善订单时带入</h4>${detailList(details)}` : ''}
    ${unassigned}
    ${missing.length ? `<p class="note">还需确认或补填：${missing.join('、')}</p>` : ''}
    <div class="actions end">${actions}</div>`;
}

function customStopFields(stop, side, index, count, fullShipment, units) {
  const pickup = side === 'origin';
  const name = pickup ? '提货' : '送货';
  const key = 'custom-' + stop.id;
  const shipment = { [side]: stop.address, addressTypes: { [side]: stop.addressType }, services: { [side]: stop.services } };
  return `<section class="panel stop-panel custom-stop${pickup ? ' pickup-stop' : ''}" data-custom-stop="${key}" data-stop-id="${e(stop.id)}" data-side="${side}" aria-labelledby="${key}-heading">
    <header class="stop-panel-head">
      <span class="overview-pin${pickup ? '' : ' destination'}" aria-hidden="true">${pickup ? 'A' : 'B'}${index + 1}</span>
      <h3 class="stop-heading" id="${key}-heading">${e(stop.address ? shortAddress(stop.address) : `${name}点 ${index + 1}`)}</h3>
      <div class="custom-stop-actions" role="group" aria-label="${name}点 ${index + 1} 操作">
        <button class="icon-button" type="button" data-action="custom-stop" data-operation="up" data-side="${side}" data-index="${index}" aria-label="上移${name}点 ${index + 1}"${index === 0 ? ' disabled' : ''}>${icon('arrow', 'custom-stop-up')}</button>
        <button class="icon-button" type="button" data-action="custom-stop" data-operation="down" data-side="${side}" data-index="${index}" aria-label="下移${name}点 ${index + 1}"${index === count - 1 ? ' disabled' : ''}>${icon('arrow', 'custom-stop-down')}</button>
        <button class="icon-button" type="button" data-action="custom-stop" data-operation="remove" data-side="${side}" data-index="${index}" aria-label="移除${name}点 ${index + 1}"${count === 1 ? ' disabled' : ''}>${icon('close')}</button>
      </div>
    </header>
    <div class="stop-section">
      ${stopAddressFields(shipment, side, 'custom', key)}
      <div class="custom-stop-fields">
        ${field({ label: '期望日期', name: key + 'Date', type: 'date', value: stop.date, attributes: `min="${dateInZone()}"` })}
        ${field({ label: '联系人', name: key + 'Contact', value: stop.contact, attributes: 'maxlength="70"' })}
        <div class="contact-phone">
          ${field({ label: '联系电话', name: key + 'Phone', type: 'tel', value: stop.phone })}
          ${field({ label: '分机号', name: key + 'PhoneExtension', type: 'tel', value: stop.phoneExtension })}
        </div>
        ${field({ label: '参考单号', name: key + 'Reference', value: stop.reference, attributes: 'maxlength="80"' })}
        ${field({ label: '备注', name: key + 'Notes', value: stop.notes, attributes: 'maxlength="1000"' })}
      </div>
      ${serviceFields(shipment, side, '附加服务', true, key)}
      <div data-stop-cargo>${customStopCargo(fullShipment, side, stop, units)}</div>
    </div>
  </section>`;
}

export function customRouteSummary(stops, shipment, units = 'imperial') {
  return `<header class="panel-head custom-route-head"><h2 class="subhead">运输路线</h2><span class="note">${stops.origin.length} 个提货点 · ${stops.destination.length} 个送货点${shipment?.items?.length ? ' · ' + cargoTotalsText(shipment, units) : ''}</span></header>
    <ol class="custom-route-points">${['origin', 'destination'].flatMap(side => stops[side].map((stop, index) => {
      const pickup = side === 'origin';
      return `<li><span class="overview-pin${pickup ? '' : ' destination'}" aria-hidden="true">${pickup ? 'A' : 'B'}${index + 1}</span><span>${e(stop.address ? shortAddress(stop.address) : `填写${pickup ? '提货' : '送货'}地址`)}</span></li>`;
    })).join('')}</ol>`;
}

export function customStopLabel(stop, side, index) {
  return `${side === 'origin' ? 'A' : 'B'}${index + 1} · ${stop.address ? shortAddress(stop.address) : '未填写地址'}`;
}

function customCargoRouteText(item, stops) {
  const route = customCargoRoute(item, stops);
  return ['origin', 'destination'].map(side => {
    const index = stops[side].findIndex(stop => stop.id === route[side + 'StopId']);
    return index < 0 ? (side === 'origin' ? '提货点未记录' : '送货点未记录') : customStopLabel(stops[side][index], side, index);
  }).join(' → ');
}

export function customStopCargo(shipment, side, stop, units = 'imperial') {
  if (!shipment?.items?.length) return '';
  const stops = customShipmentStops(shipment);
  const items = shipment.items.flatMap((item, index) => customCargoRoute(item, stops)[side + 'StopId'] === stop.id ? [{ item, index }] : []);
  return `<div class="custom-stop-cargo">
    <div class="panel-head"><strong>${side === 'origin' ? '待提货物' : '待卸货物'}</strong>${items.length ? `<small class="note">${cargoTotalsText({ items: items.map(entry => entry.item) }, units)}</small>` : ''}</div>
    ${items.length ? `<ul>${items.map(({ item, index }) => {
      const description = itemCommodities(item).map(commodity => commodity.description).filter(Boolean).join('、');
      return `<li><span title="${e(description)}">货物 ${index + 1}${description ? ' · ' + e(description) : ''}</span><strong>${e(item.quantity || '—')} ${e(packaging[item.type])}</strong></li>`;
    }).join('')}</ul>` : '<p class="note">暂无关联货物</p>'}
  </div>`;
}

function customStopReceipt(stop, side, index, shipment, units) {
  const pickup = side === 'origin';
  const name = pickup ? '提货' : '送货';
  const services = serviceOptions[side].filter(service => stop.services.includes(service.id)).map(service => service.label).join('、');
  return `<article class="panel review-stop">
    <header class="review-stop-heading"><span class="overview-pin${pickup ? '' : ' destination'}" aria-hidden="true">${pickup ? 'A' : 'B'}${index + 1}</span><h3 class="subhead">${name}点 ${index + 1}</h3></header>
    <div class="review-stop-body"><div class="review-address">${stop.company ? `<strong>${e(stop.company)}</strong>` : ''}<p>${e(stop.address)}${stop.unit ? ' · ' + e(stop.unit) : ''}</p>${addressTypes[stop.addressType] ? `<p class="note">${e(addressTypes[stop.addressType])}</p>` : ''}</div>
      ${detailList([
        ['期望日期', e(stop.date)], ['现场联系人', e(stop.contact)],
        ['联系电话', e([stop.phone, stop.phoneExtension && '转 ' + stop.phoneExtension].filter(Boolean).join(' '))],
        ['联系邮箱', e(stop.email)], ['参考单号', e(stop.reference)], ['交接备注', e(stop.notes), 'stop-note'],
        ['附加服务', e(services || '无')]
      ].filter(([, value]) => value))}
      ${customStopCargo(shipment, side, stop, units)}
    </div></article>`;
}

export function customInquiryNavigation(active) {
  return [['new', '#custom', '新建询价'], ['records', '#custom/records', '询价记录']].map(([key, href, label]) => `<a href="${href}"${key === active ? ' aria-current="page"' : ''}>${label}</a>`).join('');
}

export function customRequestSnapshot(request) {
  const shipment = request.shipment;
  const details = request.details ?? {};
  const stops = customShipmentStops(shipment ?? request, details);
  return `<div class="stack custom-request-snapshot">
    <section class="custom-request-contact">${detailList([['询价联系人', e(request.contact)], ['联系邮箱', e(request.email)], ...(request.phone ? [['联系电话', e(request.phone)]] : []), ['需求说明', e(request.requirements), 'stop-note']])}</section>
    <section class="custom-route-overview">${customRouteSummary(stops, shipment, request.units)}</section>
    <div class="details-stops custom-stop-columns">${['origin', 'destination'].map(side => `<div class="custom-stops-list">${stops[side].map((stop, index) => customStopReceipt(stop, side, index, shipment, request.units)).join('')}</div>`).join('')}</div>
    ${shipment?.items?.length ? shipmentCargoCard(shipment, details, 'custom', request.units) : ''}
  </div>`;
}
export function customChangeComparison(change, heading = '本次变更') {
  const rows = customRequestChanges(change);
  const groups = new Map();
  rows.forEach(row => { if (!groups.has(row.group)) groups.set(row.group, []); groups.get(row.group).push(row); });
  const types = { changed: '已修改', added: '新增', removed: '删除' };
  return `<section class="custom-diff" aria-label="${e(heading)}">
    <header class="panel-head"><h3 class="subhead">${e(heading)}</h3><span class="note">${rows.length ? rows.length + ' 项变更' : '暂无变更'}</span></header>
    ${rows.length ? [...groups].map(([group, entries]) => `<section class="custom-diff-group"><h4>${e(group)}</h4><ul class="custom-diff-list">${entries.map(row => `<li class="custom-diff-row" data-change-kind="${row.kind}"><div class="custom-diff-field"><strong>${e(row.label)}</strong><span class="custom-diff-tag ${row.kind}">${types[row.kind]}</span></div><div class="custom-diff-value before"><small>修改前</small>${row.before ? `<del>${e(row.before)}</del>` : '<span class="note">未填写</span>'}</div><div class="custom-diff-value after"><small>修改后</small>${row.after ? `<ins>${e(row.after)}</ins>` : `<span class="note">${row.kind === 'removed' ? '已删除' : row.kind === 'added' ? '待填写' : '已清空'}</span>`}</div></li>`).join('')}</ul></section>`).join('') : '<p class="note">修改字段后，这里将自动列出原内容和新内容。</p>'}
  </section>`;
}

function customStatusBadge(request, tickets) {
  const status = customRequestStatus(request, tickets);
  return `<span class="status ${status === 'quoted' || status === 'booked' ? 'paid' : status === 'reviewing' ? 'pending' : 'ready'}">${customRequestStatuses[status]}</span>`;
}
function customRecordDisclosure(key, title, preview, body, { open = false, meta = '', className = '' } = {}) {
  return `<details class="custom-record-disclosure ${className}" data-record-section="${key}"${open ? ' open' : ''}>
    <summary><span class="custom-record-disclosure-copy"><span class="custom-record-section-title">${title}${meta ? `<small>${meta}</small>` : ''}</span>${preview ? `<span class="custom-record-section-preview">${preview}</span>` : ''}</span>${icon('chev')}</summary>
    <div class="custom-record-disclosure-body">${body}</div>
  </details>`;
}
function customRecordInformation(request, stops) {
  const shipment = request.shipment;
  const units = request.units ?? 'imperial';
  const contact = [request.contact, request.email].filter(Boolean).join(' · ');
  const requirements = request.requirements || '未填写需求说明';
  const cargoPreview = shipment?.items?.map((item, index) => {
    const route = customCargoRoute(item, stops);
    const pins = ['origin', 'destination'].map(side => {
      const position = stops[side].findIndex(stop => stop.id === route[side + 'StopId']);
      return position < 0 ? '未指定' : (side === 'origin' ? 'A' : 'B') + (position + 1);
    }).join(' → ');
    return `货物 ${index + 1}：${pins} · ${item.quantity} ${packaging[item.type] ?? '件'}`;
  }).join('；');
  return `<div class="custom-record-stops">${['origin', 'destination'].map(side => {
    const title = side === 'origin' ? '提货信息' : '送货信息';
    const preview = stops[side].map(stop => shortAddress(stop.address) || '地址未填写').join(' / ');
    return customRecordDisclosure(side, title, e(preview), `<div class="custom-stops-list">${stops[side].map((stop, index) => customStopReceipt(stop, side, index, shipment, units)).join('')}</div>`, { meta: stops[side].length + ' 个地点' });
  }).join('')}</div>
  ${shipment?.items?.length ? customRecordDisclosure('cargo', '货物明细', e(cargoPreview), shipmentCargoCard(shipment, request.details ?? {}, 'custom', units), { meta: e(cargoTotalsText(shipment, units)) }) : ''}
  ${customRecordDisclosure('contact', '需求与联系', e(requirements), `<p class="custom-record-requirements">${e(requirements)}</p>${detailList([['询价联系人', e(request.contact || '未填写')], ['联系邮箱', e(request.email || '未填写')], ...(request.phone ? [['联系电话', e(request.phone)]] : [])])}`, { meta: e(contact), className: 'custom-record-contact' })}`;
}
function customRecordQuote(request, state, quoteCurrent) {
  const quote = request.quote;
  const blocked = state === 'reviewing' || state === 'expired';
  const heading = state === 'booked' ? '已确认报价' : quoteCurrent ? '客服报价' : '等待客服报价';
  const subtitle = state === 'reviewing' ? '资料审核通过后将更新报价' : state === 'expired' ? '报价已过期，请更新后下单' : state === 'booked' ? '已下单并模拟扣款' : quoteCurrent ? '核对方案后即可下单' : '客服核对需求后，在这里返回运输方案';
  return `<aside class="panel custom-record-quote" aria-labelledby="custom-record-quote-title">
    <header><h2 class="subhead" id="custom-record-quote-title">${heading}</h2><p class="note">${subtitle}</p></header>
    ${quoteCurrent ? `<div class="custom-record-price${blocked ? ' is-outdated' : ''}"><span class="note">${state === 'reviewing' ? '原报价合计' : state === 'booked' ? '已扣款合计' : '报价合计'} (USD)</span><strong>${money(quote.total)}</strong><p>${e(quote.name)}</p><p class="note">${e(quote.days)}</p>${state === 'booked' ? '' : `<p class="note">有效至 ${ticketTime(quote.expiresAt)}</p>`}</div>
      ${customRecordDisclosure('quote-fees', '费用与报价信息', '', `${detailList([['运输费用', money(quote.freight)], ['附加服务', money(quote.accessorial)], ['报价编号', e(quote.id)], ['对应资料', 'V' + quote.revision]])}`, { className: 'custom-record-quote-fees' })}
      ${quote.simulated ? '<p class="note custom-record-demo-note">演示报价 · 模拟下单与扣款</p>' : ''}` : '<div class="custom-record-quote-waiting"><span aria-hidden="true">—</span><p class="note">返回报价后，可在此确认金额并下单。</p></div>'}
    <div class="custom-record-quote-actions">${state === 'quoted' ? `<button type="button" class="btn primary" data-action="custom-book" data-id="${e(request.id)}">确认报价并下单 ${icon('arrow')}</button>` : ''}
      ${!request.orderId ? `<button type="button" class="link custom-demo-action" data-action="custom-support" data-id="${e(request.id)}">${state === 'reviewing' ? '模拟客服审核' : state === 'expired' ? '模拟客服更新报价' : '模拟客服返回报价'}</button>` : `<a class="link" href="#orders/custom/${e(request.orderId)}">前往订单管理 ${icon('arrow')}</a>`}
    </div>
  </aside>`;
}
function customReceipt(request, heading, tickets) {
  const pending = customChangeTicket(request, tickets);
  const lastChange = tickets.find(ticket => ticket.customRequestId === request.id && ticket.customChange);
  const state = customRequestStatus(request, tickets);
  const quoteCurrent = request.quote && request.quote.revision === (request.revision ?? 1);
  const stops = customShipmentStops(request.shipment ?? request, request.details ?? {});
  const changes = lastChange ? customRequestChanges(lastChange.customChange) : [];
  const changeResult = lastChange ? pending ? '等待客服审核' : ({ approved: '审核通过，资料与报价已更新', rejected: '审核未通过，保留原资料' })[lastChange.resolution] ?? '修改申请已撤回' : '';
  const changePreview = [...new Set(changes.map(change => change.group + ' · ' + change.label))].join('、');
  return `${heading}<div class="custom-quote custom-record-detail">
    <section class="panel custom-record-header">
      <div class="panel-head"><div class="custom-record-heading"><h2 class="panel-title">${e(request.id)}</h2>${customStatusBadge(request, tickets)}<p class="note">${e(request.date)} · 资料版本 V${request.revision ?? 1}</p></div>
        <div class="actions"><a class="link" href="#custom/records">← 询价记录</a>${request.orderId ? `<a class="btn small" href="#orders/custom/${e(request.orderId)}">查看运单</a>` : pending ? '<span class="note">资料审核中</span>' : `<a class="btn small" href="#custom/change/${e(request.id)}">修改资料</a>`}</div>
      </div>
      ${pending ? `<div class="custom-request-pending"><p>修改申请审核中，审核通过后更新资料与报价。</p><a class="link" href="${caseHref(pending)}">查看工单 ${e(pending.id)} →</a></div>` : request.orderId ? `<p class="note custom-record-order-reference">关联运单 <a class="link" href="#orders/custom/${e(request.orderId)}">${e(request.orderId)}</a></p>` : ''}
    </section>
    <div class="custom-record-layout">
      <section class="panel custom-record-main" aria-label="询价运输资料">
        <section class="custom-record-route">${customRouteSummary(stops, request.shipment, request.units ?? 'imperial')}</section>
        ${lastChange ? customRecordDisclosure('changes', pending ? '待审核变更' : '最近修改记录', e(changeResult + (changePreview ? ' · ' + changePreview : '')), `<div class="custom-record-change-link"><span class="note">基于资料 V${lastChange.customChange.revision} 提交</span><a class="link" href="${caseHref(lastChange)}">查看修改工单 →</a></div>${customChangeComparison(lastChange.customChange)}`, { open: Boolean(pending), meta: changes.length + ' 项变更', className: 'custom-record-changes' }) : ''}
        ${customRecordInformation(request, stops)}
      </section>
      ${customRecordQuote(request, state, quoteCurrent)}
    </div>
  </div>`;
}

export function customRecordsView(result, filter, tickets) {
  const counts = { '': result.requests.length };
  result.requests.forEach(request => { const key = customRequestStatus(request, tickets); counts[key] = (counts[key] ?? 0) + 1; });
  const rows = result.rows.map(request => {
    const state = customRequestStatus(request, tickets);
    const pending = customChangeTicket(request, tickets);
    const shipment = request.shipment ?? request;
    return `<tr><td><a class="link" href="#custom/${e(request.id)}">${e(request.id)}</a><small>${e(request.contact)} · ${e(request.date)}</small></td>
      <td><span class="list-cell-value">${routeLabel(shipment)}</span>${shipment.items?.length ? `<small>${e(cargoLabel(shipment))}</small>` : ''}</td>
      <td>${customStatusBadge(request, tickets)}${request.quote ? `<small>${money(request.quote.total)}${state === 'reviewing' ? ' · 审核后重报' : ''}</small>` : ''}</td>
      <td class="custom-record-actions"><a class="link" href="#custom/${e(request.id)}">详情</a>${request.orderId ? `<a class="link" href="#orders/custom/${e(request.orderId)}">查看订单</a>` : pending ? `<a class="link" href="${caseHref(pending)}">查看工单</a>` : `<a class="link" href="#custom/change/${e(request.id)}">修改资料</a>`}${state === 'quoted' ? `<button class="btn primary small" type="button" data-action="custom-book" data-id="${e(request.id)}">下单</button>` : ''}</td></tr>`;
  }).join('') || emptyRow(4, '暂无符合条件的询价记录');
  return `<h1 class="sr-only" tabindex="-1">定制询价记录</h1><div class="panel management-tools" data-filters="customRecords">${managementToolbar(customRequestStatuses, filter, counts, '搜索询价编号、地点或联系人')}</div>
    <div class="management-workspace custom-records-workspace"><div class="panel management-list"><div class="table-wrap" tabindex="0" role="region" aria-label="定制询价记录"><table aria-label="定制询价记录"><thead><tr><th>询价编号 / 联系人</th><th>提送货路线 / 货物</th><th>状态 / 报价</th><th>操作</th></tr></thead><tbody id="listing-rows">${rows}</tbody></table></div></div></div>${paginationControls('customRecords', result)}`;
}

export function customQuoteView(profile, requests, request, addresses, draft, tickets = [], editing) {
  const heading = '<h1 class="sr-only" tabindex="-1">定制询价</h1>';
  if (request && !editing) return customReceipt(request, heading, tickets);
  const { shipment, details, units, fields } = draft;
  const stops = customShipmentStops(shipment, details);
  return `${heading}<div class="stack custom-quote custom-quote-editor">
    ${editing ? `<div class="custom-edit-banner"><div><strong>修改询价资料 · ${e(editing.id)}</strong><p class="note">修改字段会标注「已修改」，提交后生成工单，审核通过后生效。<span id="custom-change-count"></span></p></div><a class="link" href="#custom/${e(editing.id)}">返回记录</a></div>` : ''}
    <form id="custom-quote-form" class="stack" data-draft-key="${e(editing?.id ?? 'new')}"${editing ? ` data-request="${e(editing.id)}"` : ''}>
      <section class="panel panel-inset custom-route-overview" id="custom-route-preview">${customRouteSummary(stops, shipment, units)}</section>
      <div class="details-stops custom-stop-columns">${['origin', 'destination'].map(side => {
        const name = side === 'origin' ? '提货' : '送货';
        return `<section class="custom-stops-group" aria-labelledby="custom-${side}-title">
          <header class="panel-head"><h2 class="subhead" id="custom-${side}-title">${name}地点 <span class="note">(${stops[side].length})</span></h2><button class="btn small" type="button" data-action="custom-stop" data-operation="add" data-side="${side}">${icon('plus')}添加${name}点</button></header>
          <div class="custom-stops-list">${stops[side].map((stop, index) => customStopFields(stop, side, index, stops[side].length, shipment, units)).join('')}</div>
        </section>`;
      }).join('')}</div>
      ${addressSuggestions(addresses)}
      ${cargoEditor({ shipment }, units, stops)}
      <section class="panel panel-inset custom-needs" aria-labelledby="custom-needs-heading">
        <h2 class="panel-title" id="custom-needs-heading">定制需求与联系方式</h2>
        <div class="custom-needs-content">
        <label class="field custom-quote-fields"><span>需求说明 ${requiredMark}</span><textarea name="requirements" rows="3" maxlength="1500" placeholder="例如多点配送、超长货物、温控要求或预约交接" required>${e(fields.requirements)}</textarea></label>
        <div class="custom-contact-fields custom-quote-fields">
          ${field({ label: '询价联系人', name: 'contact', value: fields.contact ?? (editing ? '' : profile.contact), attributes: 'maxlength="70"', required: true })}
          ${field({ label: '联系邮箱', name: 'email', type: 'email', value: fields.email ?? (editing ? '' : profile.email), attributes: 'maxlength="100"', required: true })}
          ${field({ label: '联系电话（可选）', name: 'phone', type: 'tel', value: fields.phone ?? (editing ? '' : profile.phone), attributes: 'maxlength="40"' })}
        </div>
        </div>
      </section>
      ${editing ? `<div id="custom-live-changes" aria-live="off">${customChangeComparison({ before: editing, after: { ...fields, shipment, details, units } }, '核对本次变更')}</div>` : ''}
      ${editing ? `<label class="field custom-change-reason"><span>修改说明 ${requiredMark}</span><textarea name="changeReason" required rows="2" maxlength="1500" placeholder="请简要说明本次修改的内容和原因">${e(draft.reason)}</textarea></label>` : ''}
      <div class="custom-submit">
        <p class="error" id="custom-quote-error" role="alert"></p>
        <div class="actions end"><p class="note">演示询价保存在当前浏览器</p><button class="btn primary shipment-submit" type="submit">${editing ? '提交修改申请' : '提交定制询价'} ${icon('arrow')}</button></div>
      </div>
    </form>

  </div>`;
}

function routeLabel(shipment) {
  const stops = shipment.stops;
  const count = stops ? ` · ${stops.origin.length} 提 ${stops.destination.length} 卸` : '';
  return e(shortAddress(shipment.origin)) + ' → ' + e(shortAddress(shipment.destination)) + count;
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

const arrivalDateFormat = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', timeZone: 'UTC' });
function arrivalText(quote, rate) {
  const date = quote.shipment.pickupDate;
  if (!date || !rate.businessDays?.length) return '待确认提货日期';
  return [...new Set(rate.businessDays)].map(days => {
    const arrival = new Date(date + 'T00:00:00Z');
    while (days > 0) {
      arrival.setUTCDate(arrival.getUTCDate() + 1);
      if (arrival.getUTCDay() % 6) days--;
    }
    return arrivalDateFormat.format(arrival);
  }).join(' – ');
}

function carrierName(rate) {
  return carrierProfiles[rate.carrierId]?.name ?? rate.carrierName ?? '承运商未记录';
}

function carrierIdentity(rate, subtitle = rate.reference ?? '历史报价') {
  const carrier = carrierProfiles[rate.carrierId];
  return `<span class="carrier-identity">${carrier?.logo ? '<img src="../assets/carriers/' + carrier.logo + '" alt="">' : ''}<span><strong>${e(carrierName(rate))}</strong>${subtitle ? `<small>${e(subtitle)}</small>` : ''}</span></span>`;
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
  const cargoItems = shipment.items.map(item => {
    const classes = shipmentMode(shipment) === 'ltl' ? itemFreightClasses(item) : [];
    return `<li>
      <strong>${e(item.quantity || '—')} × ${e(packaging[item.type] ?? '包装待填')}</strong>
      <span>${[item.length, item.width, item.height].map(value => showMeasurement(value, lengthFactor)).join(' × ')} ${length} · 单件 ${showMeasurement(item.weight, weightFactor)} ${weight}</span>
      ${classes.length ? `<span>Class ${e(classes.join(' / '))}</span>` : ''}
    </li>`;
  }).join('');
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
  const reviewPrice = rate ? `<div class="review-price"><span class="note">${state === 'valid' ? '本次扣款金额 (USD)' : '已选报价合计 (USD)'}</span><strong>${money(rate.total)}</strong></div>
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
      ? `<p class="note">确认下单时按所选报价扣款。本页面仅模拟扣款。</p><button class="btn primary" type="button" data-action="confirm-booking" data-quote="${e(quote.id)}"${state === 'valid' ? '' : ' disabled'}>确认下单并扣款</button>`
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
  return `<div class="commodity" data-commodity${commodity.customId ? ` data-custom-id="${e(commodity.customId)}"` : ''}>
    ${count > 1 ? `<div class="panel-head"><h4>货品 ${index + 1}</h4><button type="button" class="link" data-action="remove-commodity" data-index="${itemIndex}" data-commodity-index="${index}" aria-label="移除货品 ${index + 1}">移除</button></div>` : ''}
    <div class="commodity-fields">
      ${field({ label: '货品描述', name: 'commodity', value: commodity.description, attributes: 'maxlength="120"', placeholder: '例如服装' })}
      ${field({ label: '货值申报 (USD)', name: 'declaredValue', type: 'number', value: commodity.declaredValue, attributes: 'min="0" step="0.01" inputmode="decimal"', placeholder: '例如 1250.00' })}
      ${field({ label: 'NMFC 编码', name: 'nmfc', value: commodity.nmfc, attributes: 'maxlength="20"', placeholder: '如已知请填写' })}
      ${freightClassField(commodity.freightClass)}
      <fieldset class="cargo-declaration"><legend>受管制货物申报</legend><div class="declaration-options">${Object.entries(regulatedCargo).map(([value, label]) => `<label><input type="checkbox" name="regulated" value="${value}"${value === 'hazmat' ? ` aria-controls="${hazmatId}"` : ''}${commodity.regulated.includes(value) ? ' checked' : ''}><span>${label}</span></label>`).join('')}</div></fieldset>
      <div class="piece-fields" role="group" aria-label="每个装运单位的内包装">
        ${selectField('内包装类型', 'pieceType', pieceTypes, commodity.pieceType)}
        ${field({ label: '每单位内包装件数', name: 'pieceCount', type: 'number', value: commodity.pieceCount, attributes: 'min="1" step="1"', placeholder: '例如 12' })}
      </div>
      ${hazmatFields(hazmatId, commodity.regulated.includes('hazmat'), commodity.hazmat)}
    </div>
  </div>`;
}

function customCargoRouteFields(item, stops) {
  const route = customCargoRoute(item, stops);
  return `<div class="custom-cargo-route" data-cargo-route>
    <div class="custom-cargo-route-fields">${['origin', 'destination'].map(side => {
      const label = side === 'origin' ? '提货点' : '送货点';
      const options = Object.fromEntries([['', '请选择' + label], ...stops[side].map((stop, index) => [stop.id, customStopLabel(stop, side, index)])]);
      return selectField(label, side + 'StopId', options, route[side + 'StopId'], true);
    }).join(`<span class="custom-cargo-route-arrow" aria-hidden="true">${icon('arrow')}</span>`)}</div>
    <p class="note" data-cargo-route-error${route.originStopId && route.destinationStopId ? ' hidden' : ''}>请补齐本批货物的提货点和送货点</p>
  </div>`;
}

export function cargoEditor(quote, units, stops = null) {
  const { shipment, details = {} } = quote;
  const groups = shipment.items.map((item, index) => {
    const commodities = itemCommodities(item, index === 0 ? details.commodity : '');
    return `<section class="cargo-item" data-cargo-row${item.customId ? ` data-custom-id="${e(item.customId)}"` : ''} aria-labelledby="cargo-item-${index}">
      <div class="panel-head cargo-item-head">
        <h3 class="subhead" id="cargo-item-${index}">货物 ${index + 1}</h3>
        <p class="note" data-cargo-metrics>${cargoItemMetrics(item, units)}</p>
        ${shipment.items.length > 1 ? removeCargoButton(index, shipment.items.length) : ''}
      </div>
      ${stops ? customCargoRouteFields(item, stops) : ''}
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

function cargoDetailRows(shipment, details, units = 'imperial', stops = null) {
  const { weight, length, weightFactor, lengthFactor } = unitSettings[units];
  return shipment.items.map((item, index) => {
    const size = [item.length, item.width, item.height].map(value => cargoNumber.format(value * lengthFactor)).join(' × ');
    const line = `${item.quantity} ${packaging[item.type]} · 单件 ${cargoNumber.format(item.weight * weightFactor)} ${weight} · ${size} ${length}`;
    const commodities = itemCommodities(item, index === 0 ? details?.commodity : '').flatMap(commodity => {
      const regulated = commodity.regulated.map(value => regulatedCargo[value]).filter(Boolean).join('、');
      const pieceType = commodity.pieceType && pieceTypes[commodity.pieceType];
      const pieces = commodity.pieceCount ? `${commodity.pieceCount} ${pieceType || '件'}` : pieceType;
      const declaredValue = commodity.declaredValue && '申报货值 ' + money(Math.round(Number(commodity.declaredValue) * 100));
      const description = [commodity.description, declaredValue, commodity.nmfc && 'NMFC ' + commodity.nmfc, commodity.freightClass && 'Class ' + commodity.freightClass,
        regulated && '申报 ' + regulated, pieces && '内包装 ' + pieces + ' / 装运单位'].filter(Boolean).join(' · ');
      const hazmat = commodity.regulated.includes('hazmat') && commodity.hazmat;
      if (!hazmat) return [description];
      return [description,
        [hazmat.hazardId, hazmat.shippingName, '危险品类别 ' + hazmat.hazardClass,
          `${hazmat.hazardQuantity} ${hazmat.hazardPackage}`, hazmat.packingGroup && '包装等级 ' + hazmat.packingGroup].filter(Boolean).join(' · '),
        `紧急联系 ${hazmat.emergencyFirstName} ${hazmat.emergencyLastName} · ${hazmat.emergencyCompany} · ${hazmat.emergencyPhone}`];
    }).filter(Boolean);
    const route = stops ? `<strong class="cargo-detail-line cargo-route-label">${e(customCargoRouteText(item, stops))}</strong>` : '';
    return ['货物 ' + (index + 1), route + e(line) + commodities.map(text => '<small class="cargo-detail-line">' + e(text) + '</small>').join('')];
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
  const stops = scope === 'custom' || shipment.stops ? customShipmentStops(shipment, details) : null;
  return `<section class="panel review-cargo" aria-labelledby="${scope}-cargo-heading">
    <header class="panel-head ruled"><h3 class="subhead" id="${scope}-cargo-heading">货物明细</h3><p class="note">${units === 'imperial' ? cargoLabel(shipment) : cargoTotalsText(shipment, units)}</p></header>
    ${detailList(cargoDetailRows(shipment, details, units, stops), 'review-cargo-list')}
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
const billStatusBadge = bill => `<span class="status ${bill.workflowStatus === 'disputing' ? 'transit' : bill.paymentStatus === 'scheduled' ? 'ready' : 'paid'}">${billStatusText(bill)}</span>`;
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

function dashboardAssistant({ mode, description }) {
  return `<section class="dashboard-assistant" aria-labelledby="dashboard-assistant-title">
    <header class="dashboard-assistant-head">
      <span class="dashboard-assistant-icon">${icon('sparkles')}</span>
      <div><h2 id="dashboard-assistant-title">AI 快速查价</h2><p>描述运输需求，自动填入路线和货物信息。</p></div>
    </header>
    <form id="dashboard-quote-form">
      <fieldset class="dashboard-mode">
        <legend class="sr-only">运输方式</legend>
        ${Object.entries(quoteModes).map(([value, label]) => `<label><input class="sr-only" type="radio" name="mode" value="${value}"${value === mode ? ' checked' : ''}><span>${label}</span></label>`).join('')}
      </fieldset>
      <label class="sr-only" for="dashboard-quote-description">运输需求描述</label>
      <textarea id="dashboard-quote-description" name="description" rows="3" maxlength="2500" required placeholder="输入提送货 ZIP、提货日期、地址类型、货物件数、重量和尺寸">${e(description)}</textarea>
      <div class="dashboard-assistant-actions">
        <button type="button" class="link" data-action="dashboard-quote-example">${icon('book')} 填入示例</button>
        <button type="submit" class="btn primary">识别运输需求 ${icon('arrow')}</button>
      </div>
    </form>
    <div id="dashboard-quote-result" class="assistant-result" aria-live="polite" hidden></div>
  </section>`;
}

function dashboardShortcuts() {
  const shortcuts = [
    ['quote', 'order', 'LTL 零担', '按托盘或件数询价'],
    ['ftl', 'truck', 'FTL 整车', '按车型和线路询价'],
    ['custom', 'book', '定制询价', '多点提送货及特殊需求']
  ];
  return `<section class="dashboard-section dashboard-shortcuts" aria-labelledby="dashboard-shortcuts">
    <h2 class="subhead" id="dashboard-shortcuts">手动询价</h2>
    <ul>${shortcuts.map(([route, symbol, title, description]) => `<li><a href="#${route}">
      <span class="dashboard-shortcut-icon">${icon(symbol)}</span><span><strong>${title}</strong><small>${description}</small></span>${icon('chev')}
    </a></li>`).join('')}</ul>
  </section>`;
}

function dashboardOffers() {
  const { 'ltl-first': featured, ...otherOffers } = campaigns;
  return `<section class="dashboard-offers" aria-label="运输优惠与服务">
    <button class="dashboard-feature" type="button" data-action="view-campaign" data-id="ltl-first" aria-haspopup="dialog">
      <img src="../assets/dashboard/western-freight.jpg" width="1280" height="853" alt="">
      <span class="dashboard-feature-copy">
        <span class="dashboard-feature-title">${featured.title}</span>
        <strong>${featured.offer}</strong>
        <span class="dashboard-feature-action">查看优惠条件 ${icon('arrow')}</span>
      </span>
    </button>
    <ul class="dashboard-campaigns">${Object.entries(otherOffers).map(([id, { title, offer }]) => `<li>
      <button class="campaign-entry" type="button" data-action="view-campaign" data-id="${id}" aria-haspopup="dialog">
        <span>${title}<strong>${offer}</strong></span>${icon('chev')}
      </button>
    </li>`).join('')}</ul>
  </section>`;
}

export function dashboardView({ orders, quotes, tickets }, assistant) {
  const booked = new Set(orders.map(order => order.quoteId));
  const drafts = quotes.filter(quote => quote.stage === 'details' && quote.selectedRateId && !booked.has(quote.id));
  const unselected = quotes.filter(quote => quote.stage === 'compare' && !booked.has(quote.id));
  const openCases = tickets.filter(ticket => ticket.status !== 'closed').sort((a, b) => b.updatedAt - a.updatedAt);
  const tasks = [
    ['order', '待完善订单', drafts.length, drafts.length ? '#details/' + drafts[0].id : '', '继续最近一票'],
    ['search', '待选报价', unselected.length, unselected.length ? '#rates/' + unselected[0].id : '', '比较最新报价'],
    ['ticket', '未关闭工单与申诉', openCases.length, openCases.length ? caseHref(openCases[0]) : '', '查看最近一条']
  ];
  const updates = [
    ['订单管理支持按运输类型查看', '在 LTL、FTL 和定制服务之间切换，各标签独立保留筛选。', '#orders', '查看订单'],
    ['线上提交账单申诉与运输索赔', '从账单或运单详情发起，在工单与申诉中跟进。', '#tickets/disputes', '查看申诉']
  ];
  return `<div class="dashboard">
    ${pageHead('工作台')}
    <div class="dashboard-columns dashboard-top">
      ${dashboardAssistant(assistant)}
      ${dashboardOffers()}
      ${dashboardShortcuts()}
    </div>
    <section aria-labelledby="dashboard-tasks">
      <h2 class="subhead dashboard-tasks-title" id="dashboard-tasks">待办事项</h2>
      <ul class="dashboard-tasks">${tasks.map(([symbol, label, value, href, action]) => `<li class="dashboard-task">
        <span class="dashboard-task-icon">${icon(symbol)}</span>
        <div><h3>${label}</h3><p class="dashboard-task-value">${value}</p></div>
        ${href ? `<a class="link" href="${e(href)}">${action} ${icon('chev')}</a>` : ''}
      </li>`).join('')}</ul>
    </section>
    <div class="dashboard-columns">
      <section class="dashboard-section dashboard-orders" aria-labelledby="dashboard-orders">
        <header class="panel-head"><h2 class="subhead" id="dashboard-orders">近期运单</h2><a class="link" href="#orders">全部运单 ${icon('arrow')}</a></header>
        <div class="dashboard-table">
          <table aria-labelledby="dashboard-orders"><thead><tr><th scope="col">运单号 / 路线</th><th scope="col">状态</th><th scope="col">预计送达</th></tr></thead>
          <tbody>${orders.slice(0, 5).map(order => {
            const kind = orderType(order);
            const arrival = ['delivered', 'cancelled'].includes(order.status)
              ? '—'
              : order.shipment.pickupDate && order.rate?.businessDays?.length ? e(arrivalText(order, order.rate)) : '待确认';
            return `<tr><td><a class="link" href="${e(orderRecordHref(kind, order))}">${e(order.id)}</a><small>${routeLabel(order.shipment)}</small></td>
              <td>${status(order.status, orderStatuses)}</td><td class="dashboard-arrival">${arrival}</td></tr>`;
          }).join('') || emptyRow(3, '暂无运单')}</tbody></table>
        </div>
      </section>
      <section class="dashboard-section dashboard-updates" aria-labelledby="dashboard-updates">
        <h2 class="subhead" id="dashboard-updates">公告与更新</h2>
        <ul>${updates.map(([title, summary, href, label]) => `<li><h3>${title}</h3><p>${summary}</p><a class="link" href="${href}">${label} ${icon('chev')}</a></li>`).join('')}</ul>
      </section>
    </div>
  </div>`;
}
function recordLink(href, label, selected) {
  return `<a class="link management-record" href="${e(href)}"${selected ? ' aria-current="true"' : ''}>${e(label)}</a>`;
}
const customOrderStatuses = { ...orderStatuses };

function orderListTiming(order) {
  let timing;
  if (order.status === 'inquiry') timing = order.shipment.pickupDate ? ['期望提货', order.shipment.pickupDate] : ['提交日期', order.date || '—'];
  else if (order.status === 'cancelled') timing = ['', '—'];
  else {
    [timing] = orderOverviewSchedule(order);
    if (timing[0] === '签收结果') timing = ['签收时间', '未记录'];
  }
  const [label, value, note] = timing;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `<time datetime="${e(value)}">${e(value)}</time>` : e(value);
  return `<span class="list-cell-value">${date}</span>${label ? `<small>${e(label)}${note ? ` · ${e(note)}` : ''}</small>` : ''}`;
}

export function orderRows(orders, selectedId, kind) {
  const statuses = kind === 'custom' ? customOrderStatuses : orderStatuses;
  return orders.map(order => {
    const references = [order.details?.originReference && '提货 ' + order.details.originReference,
      order.details?.destinationReference && '送货 ' + order.details.destinationReference].filter(Boolean);
    if (!references.length && order.reference) references.push(order.reference);
    const route = routeLabel(order.shipment);
    const timing = orderListTiming(order);
    const number = String(order.proNumber ?? '').trim();
    const context = order.status === 'inquiry' ? `<span class="list-cell-preview" title="${e(order.requirements)}">${e(order.requirements || '定制询价')}</span>`
      : `<span class="list-cell-value">${e(carrierName(order.rate ?? {}))}</span>${number ? `<small>PRO ${e(number)}</small>` : ''}`;
    return `<tr${order.id === selectedId ? ' class="table-row-selected"' : ''}>
    <td>${recordLink(orderRecordHref(kind, order), order.id, order.id === selectedId)}${references.length ? `<small>${e(references.join(' · '))}</small>` : ''}
      <div class="list-summary-narrow list-row-context">${route}</div><div class="list-summary-compact list-row-context">${context}</div></td>
    <td class="list-table-medium">${route}</td><td class="list-table-wide">${context}</td>
    <td class="list-table-status">${status(order.status, statuses)}<div class="list-summary-narrow list-row-context">${timing}</div></td>
    <td class="list-table-medium list-table-time">${timing}</td>
  </tr>`;
  }).join('') || emptyRow(5, kind === 'custom' ? '没有符合条件的定制服务记录' : '没有符合条件的运单');
}
function billOrderCargo(order) {
  const { shipment } = order;
  return orderType(order) === 'ftl' && !shipment.items?.length ? equipmentSummary(shipment)
    : shipment.items?.length ? cargoLabel(shipment) : '';
}

export function billRows(bills, selectedId, { type, ordersById }) {
  return bills.map(bill => {
    const order = ordersById.get(bill.orderId);
    const kind = order ? orderType(order) : 'ltl';
    const orderLink = `<a class="link" href="${e(orderRecordHref(kind, { id: bill.orderId }))}">${e(bill.orderId)}</a>`;
    const summary = order ? `<small>${routeLabel(order.shipment)}</small><small>${e([quoteModes[kind] ?? orderTypes[kind], billOrderCargo(order)].filter(Boolean).join(' · '))}</small>` : '';
    const dateValue = bill.originalId ? bill.issuedOn : bill.chargedOn;
    const date = dateValue ? `<time datetime="${e(dateValue)}">${e(dateValue)}</time>` : '—';
    const collectionDate = bill.originalId ? (bill.paymentStatus === 'collected' ? '扣款 ' + (bill.collectedOn || '—') : rebillCountdownText(bill)) : '';
    const payment = bill.originalId ? `<span class="bill-row-payment">${billStatusBadge(bill)}</span>` : '';
    const cause = bill.reason || bill.charges.map(([label]) => label).join('、');
    const reason = `<span class="list-cell-preview" title="${e(cause)}">${e(cause || '—')}</span>`;
    return `<tr${bill.id === selectedId ? ' class="table-row-selected"' : ''}>
    <td>${recordLink(billHref(bill), bill.id, bill.id === selectedId)}${bill.originalId ? `<small>原账单 <a class="link" href="#billing/${e(bill.orderId)}">${e(bill.originalId)}</a></small>` : ''}
      <div class="list-summary-narrow list-row-context">${orderLink}${summary}</div>
      ${bill.originalId ? `<div class="list-summary-compact list-row-context">${reason}</div>` : ''}</td>
    <td class="list-table-medium">${orderLink}${summary}</td>
    ${bill.originalId ? `<td class="list-table-wide">${reason}</td>` : ''}
    <td class="list-table-medium list-table-time">${date}${collectionDate ? `<small>${e(collectionDate)}</small>` : ''}</td>
    <td class="list-table-amount"><strong class="amount">${money(bill.total)}</strong>${payment}<small class="list-summary-narrow">${collectionDate ? e(collectionDate) : date}</small></td>
  </tr>`;
  }).join('') || emptyRow(type === 'rebills' ? 5 : 4, type === 'rebills' ? '没有符合条件的补收账单' : '没有符合条件的账单');
}
function tracking(order) {
  if (order.status === 'cancelled') return '';
  const stages = Object.entries(orderStatuses).filter(([id]) => id !== 'cancelled');
  const progress = stages.findIndex(([id]) => id === order.status);
  return `<ol class="order-progress" aria-label="运输节点">${stages.map(([id, name], index) =>
    `<li${index <= progress ? ' class="done"' : ''}${id === order.status ? ' aria-current="step"' : ''}><span class="order-progress-dot" aria-hidden="true"></span><span>${name}</span></li>`
  ).join('')}</ol>`;
}

function orderOverviewSchedule(order) {
  if (order.status === 'cancelled') return [['运输状态', '运单已取消。']];
  if (order.status === 'delivered') {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(order.deliveredAt);
    const delivered = new Date(order.deliveredAt ?? NaN);
    if (!Number.isFinite(delivered.getTime())) return [['签收结果', '已签收']];
    if (dateOnly) return [['签收日期', order.deliveredAt]];
    return [['签收时间', new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' }).format(delivered)]];
  }
  const { shipment, rate, details } = order;
  const eta = shipment.pickupDate && rate.businessDays?.length ? arrivalText(order, rate) : '待确认';
  if (order.status !== 'ready') return [['预计送达', shipment.mode === 'custom' ? shipment.deliveryDate || '待确认' : eta]];
  const time = shipment.mode !== 'custom' && shipment.pickupTime && [shipment.pickupTime, details?.pickupEnd].filter(Boolean).join('–');
  return [['计划提货', shipment.pickupDate || '待确认', shipment.pickupDate && time ? `${time}（当地）` : ''], ['预计送达', shipment.mode === 'custom' ? shipment.deliveryDate || '待确认' : eta]];
}

function orderOverview(order, tickets, claim) {
  const { shipment, rate } = order;
  const proNumber = String(order.proNumber ?? '').trim();
  const pending = tickets.filter(ticket => ticket.status !== 'closed');
  const resolved = tickets.filter(ticket => ticket.status === 'closed');
  const needsAttention = ticket => ticket.customerActionRequired === true || ticket.orderChange?.side === 'cancel' || ticket.orderChange?.addressChange;
  const priority = pending.filter(needsAttention).sort((first, second) => Number(second.customerActionRequired === true) - Number(first.customerActionRequired === true));
  const endpoint = (side, pin, label) => `<div class="order-overview-stop"><span class="overview-pin${side === 'destination' ? ' destination' : ''}" aria-hidden="true">${pin}</span><div><span class="note">${label}</span><strong>${e(shortAddress(shipment[side]) || '—')}</strong></div></div>`;
  return `<div class="order-overview">
    <section class="order-overview-schedule" aria-label="运输时间和进度">
      <dl class="order-overview-times">${orderOverviewSchedule(order).map(([label, value, note]) =>
        `<div><dt>${label}</dt><dd><strong>${e(value)}</strong>${note ? `<small class="note">${e(note)}</small>` : ''}</dd></div>`
      ).join('')}</dl>${tracking(order)}
    </section>
    ${orderOverviewActivity(priority, '需关注', true)}
    <section class="order-overview-section" aria-labelledby="order-overview-route-title">
      <h3 class="subhead" id="order-overview-route-title">运输概况</h3>
      ${shipment.mode === 'custom' && shipment.stops ? customRouteSummary(customShipmentStops(shipment, order.details), shipment, order.units) : `<div class="order-overview-route">${endpoint('origin', 'A', '提货地')}${icon('arrow', 'order-overview-arrow')}${endpoint('destination', 'B', '送货地')}</div>`}
      <dl class="order-overview-carrier">
        <div><dt class="note">承运商</dt><dd>${carrierIdentity(rate, rate.name || rate.days || '')}</dd></div>
        <div class="order-overview-pro"><dt class="note">PRO 号</dt><dd${proNumber ? ' class="order-pro-number"' : ' class="note"'}>${e(proNumber || (order.status === 'cancelled' ? '未记录' : '待回传'))}</dd></div>
      </dl>
    </section>
    ${orderOverviewActivity(pending.filter(ticket => !needsAttention(ticket)), '变更申请')}
    ${orderOverviewActivity(resolved, '变更记录')}
    ${claim?.status === 'closed' ? `<a class="link order-claim-history" href="${e(caseHref(claim))}">查看索赔记录 ${icon('arrow')}</a>` : ''}
  </div>`;
}

function orderChangeStatus(ticket) {
  if (ticket.orderChange.result === 'approved') return '<span class="status paid">审核通过</span>';
  if (ticket.orderChange.result === 'rejected') return '<span class="status closed">审核驳回</span>';
  if (ticket.status === 'closed') return '<span class="status closed">已撤回</span>';
  return '<span class="status ready">待审核</span>';
}

function ticketStatusBadge(ticket) {
  if (ticket.customerActionRequired === true && ticket.status !== 'closed') return '<span class="status ready">需你处理</span>';
  return ticket.orderChange ? orderChangeStatus(ticket) : status(ticket.status, ticketStatuses);
}

function orderChangeDiff(plan, historical = false) {
  if (plan.side === 'cargo') {
    return `<div class="order-cargo-compare">${[[historical ? '修改前' : '当前生效', plan.beforeItems], ['申请改为', plan.afterItems]].map(([label, items]) =>
      `<section><h3 class="subhead">${label}</h3>${detailList(cargoDetailRows({ items }))}</section>`
    ).join('')}</div>`;
  }
  if (plan.side === 'cancel') return detailList([
    ['申请时状态', e(orderStatuses[plan.status])], ['取消原因', e(plan.reason || '未填写')]
  ]);
  return `<div class="order-change-diff"><table>
    <thead><tr><th scope="col">变更项目</th><th scope="col">${historical ? '修改前' : '当前生效'}</th><th scope="col">申请改为</th></tr></thead>
    <tbody>${plan.changes.map(({ key, before, after }) => {
      const display = value => e((key === 'addressType' ? addressTypes[value] : value) || '未填写');
      return `<tr><th scope="row">${e(orderChangeLabels[key])}</th><td>${display(before)}</td><td>${display(after)}</td></tr>`;
    }).join('')}</tbody></table></div>`;
}

function orderOverviewActivity(tickets, title, priority = false) {
  if (!tickets.length) return '';
  return `<section class="order-overview-section${priority ? ' order-overview-attention' : ''}"><h3 class="subhead">${title}</h3><div class="order-change-list">
    ${tickets.map(ticket => `<div class="order-change-record">
      <a class="link order-change-ticket" href="${e(caseHref(ticket))}" aria-label="查看工单 ${e(ticket.id)} · ${e(ticket.subject)}">${e(ticket.subject)}</a>
      ${ticketStatusBadge(ticket)}
      ${ticket.orderChange && ticket.status !== 'closed' ? `<details class="order-change-disclosure"><summary class="sub-disclosure" aria-label="查看申请内容">详情 ${icon('chev')}</summary>${orderChangeDiff(ticket.orderChange)}</details>` : ''}
    </div>`).join('')}</div></section>`;
}

const orderChangePaneLabel = side => side === 'cargo' ? '货物明细' : `${orderStopLabel(side)}信息`;

export function orderChangeEditor(order, initialSide, drafts, cargoDraft) {
  const editable = editableOrderStops(order);
  const forms = editable.map(side => {
    const values = { ...orderStopValues(order, side), ...drafts[side] };
    const label = orderStopLabel(side);
    const editField = (name, attributes, type = 'text') => field({ label: orderChangeLabels[name], name, value: values[name], type, attributes });
    return `<form class="order-change-form" id="order-change-${side}" data-order-change-form="${side}"${side === initialSide ? '' : ' hidden'}>
      <section class="detail-block" aria-label="${label}地址">
        <h3 class="subhead">${label}地址</h3>
        ${field({ label: orderChangeLabels.address, name: 'address', value: values.address, placeholder: '街道、城市、州、ZIP', attributes: 'maxlength="220"', required: true })}
        <div class="order-change-fields">
          ${selectField(orderChangeLabels.addressType, 'addressType', addressTypeOptions, values.addressType)}
          ${editField('Unit', 'maxlength="30"')}
        </div>
      </section>
      <section class="detail-block" aria-label="${label}交接信息">
        <h3 class="subhead">交接信息</h3>
        <div class="order-change-fields">
          ${editField('Company', 'maxlength="100"')}
          ${editField('Contact', 'maxlength="70"')}
          <div class="contact-phone">
            ${editField('Phone', '', 'tel')}
            ${editField('PhoneExtension', '')}
          </div>
          ${editField('Email', 'maxlength="100"', 'email')}
          ${editField('Reference', 'maxlength="60"')}
        </div>
        <label class="field"><span>${orderChangeLabels.Notes}</span><textarea name="Notes" rows="2" maxlength="500">${e(values.Notes)}</textarea></label>
      </section>
      <p class="error" role="alert" data-order-change-error></p>
      <div class="actions end"><button class="btn primary" type="submit">核对变更</button></div>
    </form>`;
  }).join('');
  const cargo = `<form class="order-change-form" id="order-change-cargo" data-order-change-form="cargo"${initialSide === 'cargo' ? '' : ' hidden'}>
      ${cargoEditor({ ...order, shipment: { ...order.shipment, items: cargoDraft.items } }, cargoDraft.units)}
      <p class="error" role="alert" data-order-change-error></p>
      <div class="actions end"><button class="btn primary" type="submit">核对变更</button></div>
    </form>`;
  const options = `<div class="segmented order-change-side" role="group" aria-label="选择修改内容">${[...editable, 'cargo'].map(side =>
    `<button type="button" data-action="order-change-side" data-side="${side}" aria-controls="order-change-${side}" aria-pressed="${side === initialSide}">${orderChangePaneLabel(side)}</button>`
  ).join('')}</div>`;
  return `<p class="order-change-context"><strong>${e(order.id)}</strong>${status(order.status, orderStatuses)}</p>
    <p class="note">审核通过后，提交的修改才会更新到运单。</p>${options}${forms}${cargo}`;
}

export function orderChangeReview(order, plan) {
  const impact = plan.side === 'cargo' ? '货物明细变更可能影响费用和运输安排，具体影响由客服和承运商审核确认。'
    : plan.addressChange ? '调整地址可能影响费用、时效或附加服务，具体影响由客服和承运商审核确认。' : '';
  return `<p class="order-change-context"><strong>${e(order.id)}</strong><span class="note">${orderChangePaneLabel(plan.side)}</span></p>
    ${orderChangeDiff(plan)}
    <p class="note">提交后会创建审核工单。审核通过后，申请的修改才会更新到运单。</p>
    ${impact ? `<div class="notice"><strong>当前已扣款 ${money(order.rate.total)} USD</strong><p>${impact}</p></div>` : ''}
    <p class="error" role="alert" data-order-change-error></p>
    <div class="actions end"><button class="btn" type="button" data-action="back-order-change">返回编辑</button><button class="btn primary" type="button" data-action="submit-order-change">提交审核</button></div>`;
}

export function orderCancellationForm(order) {
  return `<form id="cancel-order-form" class="order-change-form" data-order="${e(order.id)}" data-status="${e(order.status)}">
    <p class="order-change-context"><strong>${e(order.id)}</strong>${status(order.status, orderStatuses)}</p>
    ${detailList([['运输线路', routeLabel(order.shipment)], ['当前已扣款', money(order.rate.total) + ' USD']])}
    <div class="notice"><p>审核通过后才会取消运单。${order.status === 'ready' ? '' : '货物已交给承运商，能否停止运输由审核确认。'}费用和退款安排将在工单中通知。</p></div>
    <label class="field"><span>取消原因（选填）</span><textarea name="reason" rows="3" maxlength="500" placeholder="例如收货方调整了计划"></textarea></label>
    <p class="error" role="alert" data-order-change-error></p>
    <div class="actions end"><button class="btn" type="button" data-action="close-dialog">返回运单</button><button class="btn primary" type="submit">提交取消申请</button></div>
  </form>`;
}

function orderInformation(order) {
  const { shipment, details = {} } = order;
  const hasStopReference = stopSupplement(details, 'origin').reference || stopSupplement(details, 'destination').reference;
  return `<section class="detail-block"><h3 class="subhead">订单信息</h3>${detailList([
    ['运单号', e(order.id)], ['创建日期', e(order.date || '—')], ['运输线路', routeLabel(shipment)],
    ...(shipmentMode(shipment) === 'ftl' ? [['运输类型', 'FTL 整车'], ['车辆', e(equipmentSummary(shipment))]] : []),
    ...(!hasStopReference && order.reference ? [['客户参考号', e(order.reference)]] : [])
  ])}</section>
  ${shipment.mode === 'custom' && shipment.stops ? `${['origin', 'destination'].map(side => shipment.stops[side].map((stop, index) => customStopReceipt(stop, side, index, shipment, order.units)).join('')).join('')}` : `${shipmentStopCard(shipment, details, 'origin', 'order')}${shipmentStopCard(shipment, details, 'destination', 'order')}`}
  ${order.requirements ? `<section class="detail-block"><h3 class="subhead">定制需求</h3><p>${e(order.requirements)}</p></section>` : ''}
  ${shipmentCargoCard(shipment, details, 'order', order.units)}`;
}

function orderFiles(order) {
  const rebills = billingRecords([order]).filter(bill => bill.originalId);
  const files = Object.keys(orderDocuments).flatMap(kind => kind === 'rebill'
    ? rebills.map(bill => ({ kind, billId: bill.id }))
    : [{ kind }]);
  return `<ul class="order-files">${files.map(({ kind, billId }) => {
    const [name, label] = orderDocuments[kind];
    const available = kind !== 'pod' || Boolean(order.podReceived);
    const title = e(billId ? `${name} ${billId}` : name);
    const fileAttributes = `data-action="order-file" data-order="${e(order.id)}" data-kind="${kind}"${billId ? ` data-bill="${e(billId)}"` : ''}`;
    const actions = available ? `<div class="actions"><button class="link" type="button" ${fileAttributes} data-mode="preview" aria-label="预览 ${title}">预览</button><button class="btn small" type="button" ${fileAttributes} data-mode="download" aria-label="下载 ${title}">下载</button></div>`
      : `<span class="status">${{ delivered: '待回传', cancelled: '已取消' }[order.status] ?? '待签收'}</span>`;
    const reference = billId ?? (kind === 'invoice' ? invoiceId(order) : kind === 'pod' ? order.podReceived : '');
    return `<li><div class="order-file-name">${icon('bill')}<div><strong>${name}</strong><p class="note">${label}${reference ? ' · ' + e(reference) : ''}</p></div></div>
      ${actions}</li>`;
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

function orderActionText(label, shortLabel) {
  return `<span class="order-action-full">${label}</span><span class="order-action-short" aria-hidden="true">${shortLabel}</span>`;
}

function caseEntry(kind, record, existing, shortLabel = '') {
  const isClaim = kind === 'claims';
  const label = isClaim ? '查看索赔' : '查看申诉';
  if (existing && existing.status !== 'closed') {
    const statusLabel = `${label} · ${ticketStatuses[existing.status]}`;
    return `<a class="btn small" href="${e(caseHref(existing))}"${shortLabel ? ` aria-label="${e(statusLabel)}" title="${e(statusLabel)}"` : ''}>${shortLabel ? orderActionText(label, shortLabel) : statusLabel}</a>`;
  }
  const action = caseTypes[kind].action;
  const button = `<button class="btn small" type="button" data-action="new-case" data-kind="${kind}" data-record="${e(record.id)}"${shortLabel ? ` aria-label="${action}"` : ''}>${shortLabel ? orderActionText(action, shortLabel) : action}</button>`;
  return button + (existing && !shortLabel ? `<a class="link" href="${e(caseHref(existing))}">${label}记录</a>` : '');
}

export function orderDetail(order, activeTab, totalCount, claim, kind, changes) {
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
        <section class="detail-block">${customRouteSummary(customShipmentStops(order.shipment, order.details), order.shipment, order.units)}</section>
        <section class="detail-block"><h3 class="subhead">询价信息</h3>${detailList([
          ['运输线路', routeLabel(order.shipment)], ['提交日期', e(order.date)],
          ['期望提货', e(order.shipment.pickupDate)], ['联系人', e(order.contact)], ['联系邮箱', e(order.email)]
        ].filter(([, value]) => value))}</section>
        <section class="detail-block"><h3 class="subhead">需求说明</h3><p class="order-inquiry-notes">${e(order.requirements)}</p></section>
        <a class="link" href="#custom/${e(order.id)}">查看完整询价 ${icon('arrow')}</a>
      </div>`;
    return managementDetail('定制询价详情', body, order.id, status(order.status, customOrderStatuses));
  }
  const sections = { overview: orderOverview(order, changes, claim), details: orderInformation(order), files: orderFiles(order) };
  const canEdit = canRequestOrderChange(order);
  const edit = canEdit ? `<button class="btn order-edit-action" type="button" data-action="edit-order" data-order="${e(order.id)}" aria-label="修改订单" aria-haspopup="dialog">${orderActionText('修改订单', '修改')}</button>` : '';
  const cancel = canEdit ? `<button class="link order-cancel-action" type="button" data-action="cancel-order" data-order="${e(order.id)}" aria-label="取消订单" aria-haspopup="dialog">${orderActionText('取消订单', '取消')}</button>` : '';
  const claims = canClaimOrder(order) ? caseEntry('claims', order, claim, '索赔') : '';
  const controls = `<div class="order-toolbar">${tabList('order', '运单详情标签', orderTabs, activeTab)}
    <div class="order-toolbar-actions" role="group" aria-label="运单操作">${edit}
      <button class="link" type="button" data-action="new-ticket" data-order="${e(order.id)}" aria-label="创建工单" aria-haspopup="dialog">${orderActionText('创建工单', '工单')}</button>${claims}${cancel}
    </div>
  </div>`;
  return managementDetail(title, tabPanels('order', sections, activeTab, 'detail-body order-tab-body'),
    order.id, status(order.status, orderStatuses), controls);
}
function billDisclosure(title, preview, content) {
  return `<details class="bill-disclosure">
    <summary class="sub-disclosure"><span class="bill-disclosure-label"><strong>${title}</strong><small>${preview}</small></span>${icon('chev')}</summary>
    <div class="bill-disclosure-body">${content}</div>
  </details>`;
}

function billOrderDisclosure(order) {
  const { shipment } = order;
  const kind = orderType(order);
  return billDisclosure('关联运单', e(order.id) + ' · ' + routeLabel(shipment), `${detailList([
    ['运输类型', e(quoteModes[kind] ?? orderTypes[kind])], ['运单状态', e(orderStatuses[order.status])],
    ['提货地址', e(displayAddress(shipment.origin))], ['送货地址', e(displayAddress(shipment.destination))],
    ['提货日期', e(shipment.pickupDate)], ['货物', e(billOrderCargo(order))],
    ...(kind === 'ftl' && shipment.items?.length ? [['车型与数量', e(equipmentSummary(shipment))]] : [])
  ].filter(([, value]) => value))}
  <a class="link" href="${e(orderRecordHref(kind, order))}">查看运单详情 ${icon('arrow')}</a>`);
}

function billAdjustmentDisclosure(bill, linkToBill) {
  const items = bill.charges.map(([label]) => label).join('、');
  return billDisclosure(linkToBill ? e(bill.id) : '补收说明', e(items) + ' · ' + money(bill.total), `
    ${bill.reason ? `<p>${e(bill.reason)}</p>` : ''}
    ${linkToBill ? detailList([['出账日期', e(bill.issuedOn || '—')], ['处理状态', billStatusBadge(bill)], [bill.paymentStatus === 'collected' ? '扣款日期' : '申诉截止（PT）', e((bill.paymentStatus === 'collected' ? bill.collectedOn : bill.appealDeadline && bill.appealDeadline + ' 00:00') || '待确认')]]) : ''}
    ${linkToBill ? `<a class="link" href="${e(billHref(bill))}">查看补收账单详情 ${icon('arrow')}</a>` : ''}`);
}

export function billDetail(bill, billing, dispute) {
  const label = billing.type === 'rebills' ? '补收账单' : '账单';
  const title = label + '详情';
  if (!bill) return managementDetail(title, `<p class="empty">${billing.bills.length ? '没有符合条件的' : '暂无'}${label}</p>`);
  const related = billing.records.filter(entry => entry.originalId === bill.id);
  const order = billing.ordersById.get(bill.orderId);
  const amount = `<dl class="bill-detail-amount"><dt>${billAmountLabel(bill)} (USD)</dt><dd>${money(bill.total)}</dd></dl>`;
  const body = `<div class="detail-body">
    <section class="detail-block">${detailList([
      ...(bill.originalId ? [['原账单', `<a class="link" href="#billing/${e(bill.orderId)}">${e(bill.originalId)}</a>`]] : []),
      ...(bill.originalId ? [['出账日期', e(bill.issuedOn || '—')],
        [bill.paymentStatus === 'collected' ? '扣款日期' : '申诉截止（PT）', e((bill.paymentStatus === 'collected' ? bill.collectedOn : bill.appealDeadline && bill.appealDeadline + ' 00:00') || '待确认')],
        ['扣款说明', e(rebillMethodText(bill))],
        ...(bill.collectionId ? [['扣款记录', e(bill.collectionId)]] : [])] : [['扣款日期', e(bill.chargedOn || '—')]])
    ])}</section>
    ${bill.originalId ? `<section class="bill-collection-notice"><strong>${e(rebillCountdownText(bill))}</strong><p>${bill.workflowStatus === 'disputing' ? (bill.paymentStatus === 'collected' ? '账单已扣款，请在工单与申诉中跟进处理进度。' : '已收到申诉，处理期间暂缓扣款，请在工单与申诉中跟进进度。') : bill.paymentStatus === 'collected' ? e(rebillMethodText(bill)) + '。' : '请在期限内发起申诉，逾期未申诉将自动扣款。您也可提前确认扣款。'}<span class="note">演示账单流程</span></p></section>` : ''}
    <section class="detail-block"><h3 class="subhead">费用明细</h3>${detailList(bill.charges.map(([label, amount]) => [label, money(amount)]), 'fees')}</section>
    ${order ? billOrderDisclosure(order) : detailList([['关联运单', e(bill.orderId)]])}
    ${bill.originalId ? billAdjustmentDisclosure(bill, false) : ''}
    ${related.length ? `<section class="detail-block"><h3 class="subhead">关联补收账单</h3>${related.map(entry => billAdjustmentDisclosure(entry, true)).join('')}</section>` : ''}
    <div class="actions end bill-detail-actions">${bill.originalId && bill.paymentStatus === 'scheduled' ? `<button type="button" class="btn primary small" data-action="collect-rebill-early" data-bill="${e(bill.id)}">提前确认扣款</button>` : ''}${caseEntry('disputes', bill, dispute)}<button type="button" class="btn ${bill.originalId && bill.paymentStatus === 'scheduled' ? '' : 'primary'} small" data-action="download-bill" data-bill="${e(bill.id)}">下载账单明细</button></div>
    </div>`;
  return managementDetail(title, body, bill.id, billStatusBadge(bill) + amount);
}
function listingSearch(placeholder, query) {
  return `<label class="with-icon"><span class="sr-only">${placeholder}</span>${icon('search')}<input class="text-input" type="search" name="query" placeholder="${placeholder}" value="${e(query)}"></label>`;
}
function managementToolbar(statuses, filter, counts, placeholder, action = '', allLabel = '全部') {
  return `<div class="management-toolbar">
    ${statuses ? `<div class="management-status-tabs" role="group" aria-label="按状态筛选">${[['', allLabel], ...Object.entries(statuses)].map(([value, name]) =>
      `<button type="button" data-action="list-status-filter" data-status="${value}" aria-pressed="${filter.status === value}">${name} <span class="management-status-count">${counts[value] ?? 0}</span></button>`).join('')}</div>` : ''}
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
    <header class="panel-head"><div><h2 class="panel-title" id="detail-title" tabindex="-1"${id ? ' aria-describedby="detail-record-id"' : ''}>${title}</h2>${id ? `<p class="note" id="detail-record-id">${e(id)}</p>` : ''}</div>
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

export function ordersView(result, filter, detail, totalCount, activeTab, counts, claim, kind, changes) {
  return managementPage({
    title: '订单管理', kind, label: orderTypes[kind] + '列表', result,
    tabs: managementTabs('运输类型', Object.entries(orderTypes).map(([key, label]) => [key, orderRoute(key), label]), kind),
    toolbar: kind === 'custom'
      ? managementToolbar(customOrderStatuses, filter, counts, '搜索记录编号、线路或需求')
      : managementToolbar(orderStatuses, filter, counts, '搜索运单号、PRO、参考号或线路'),
    headers: [kind === 'custom' ? '记录编号' : '运单号', ['提送货路线', 'list-table-medium'],
      [kind === 'custom' ? '需求 / 承运商' : '承运商 / PRO', 'list-table-wide'], ['状态', 'list-table-status'], ['关键时间', 'list-table-medium list-table-time']],
    rows: orderRows(result.rows, detail?.id, kind), detail: orderDetail(detail, activeTab, totalCount, claim, kind, changes)
  });
}

const ticketDateFormat = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function ticketTime(timestamp) {
  const date = new Date(timestamp ?? NaN);
  return Number.isFinite(date.getTime()) ? `<time datetime="${date.toISOString()}">${ticketDateFormat.format(date)}</time>` : '—';
}
export function ticketRows(tickets, selectedId, kind = 'tickets') {
  return tickets.map(ticket => {
    const selected = ticket.id === selectedId;
    const category = e(ticket.customChange ? '定制询价修改' : caseCategory(ticket));
    const record = ticket.billId || ticket.orderId || ticket.customRequestId;
    const related = record ? `<span class="list-cell-value">${e(record)}</span>${ticket.billId && ticket.orderId ? `<small>${e(ticket.orderId)}</small>` : ''}` : '—';
    const message = ticket.messages?.at(-1);
    const text = message?.text?.trim() || (message?.files?.length ? `添加了 ${message.files.length} 个凭证` : '');
    const author = { customer: '你', support: '客服', system: '系统' }[message?.by];
    const summary = text && [author, text].filter(Boolean).join(' · ');
    const activity = summary ? `<small class="list-cell-preview" title="${e(summary)}">${e(summary)}</small>` : '';
    const updated = ticketTime(ticket.updatedAt ?? message?.at);
    return `<tr${selected ? ' class="table-row-selected"' : ''}>
      <td>${recordLink(caseHref(ticket), ticket.subject, selected)}<small>${e(ticket.id)}${category ? ` · ${category}` : ''}</small>
        ${record ? `<div class="list-summary-compact list-row-context">${related}</div>` : ''}<div class="list-summary-narrow">${activity}</div></td>
      <td class="list-table-wide">${related}</td>
      <td class="list-table-status">${ticketStatusBadge(ticket)}<small class="list-summary-narrow">${updated}</small></td>
      <td class="list-table-medium ticket-table-activity">${updated}${activity}</td>
    </tr>`;
  }).join('') || emptyRow(4, '没有符合条件的' + caseTypes[kind].label);
}

function evidenceField() {
  return `<label class="field"><span>相关凭证（选填）</span><input name="evidence" type="file" multiple accept="image/png,image/jpeg,application/pdf"><small class="note">最多 3 个 JPG、PNG 或 PDF，每个不超过 2 MB。</small></label>`;
}

export function ticketDetail(ticket, order, emptyMessage, kind, bill, customRequest) {
  const title = (kind === 'tickets' ? '工单' : caseTypes[kind].label) + '详情';
  if (!ticket) return managementDetail(title, `<p class="empty">${emptyMessage}</p>`);
  const names = { customer: '你', support: 'HYE Freight 客服', system: '系统' };
  const rows = [
    ...(bill ? [['关联账单', `<a class="link" href="${e(billHref(bill))}">${e(bill.id)}</a>`], ['争议费用项', e(ticket.charge === 'all' ? '整张账单' : ticket.charge)]] : []),
    ...(bill?.originalId ? [['原账单', `<a class="link" href="#billing/${e(bill.orderId)}">${e(bill.originalId)}</a>`]] : []),
    ...(kind === 'claims' && order ? [['承运商', e(carrierName(order.rate))]] : []),
    ...(ticket.requestedAmount ? [['申请金额', money(ticket.requestedAmount)]] : [])
  ];
  const body = `<div class="detail-body">
    <section class="detail-block ticket-context">
      <div><h3 class="subhead">${e(ticket.subject)}</h3><p class="note">${e(ticket.customChange ? '定制询价修改' : caseCategory(ticket))}</p></div>
      ${customRequest ? `<a class="ticket-linked-order" href="#custom/${e(customRequest.id)}">${icon('order')}<span><strong>关联询价 ${e(customRequest.id)}</strong><small>${routeLabel(customRequest.shipment ?? customRequest)}</small></span>${icon('chev')}</a>` : ''}
      ${order ? `<a class="ticket-linked-order" href="${e(orderRecordHref(orderType(order), order))}">${icon('order')}<span><strong>${e(order.id)}</strong><small>${routeLabel(order.shipment)}</small></span>${icon('chev')}</a>` : ''}
    </section>
    ${rows.length ? `<section class="detail-block">${detailList(rows)}</section>` : ''}
    ${ticket.customChange ? `<section class="detail-block custom-change-review"><h3 class="subhead">${({ approved: '已审核通过', rejected: '未通过审核' })[ticket.resolution] ?? (ticket.status === 'closed' ? '已撤回修改' : '待审核修改')}</h3><p class="note">基于资料版本 V${ticket.customChange.revision} 提交</p>${customChangeComparison(ticket.customChange)}<details><summary>查看本次提交的完整资料</summary>${customRequestSnapshot(ticket.customChange.after)}</details><details><summary>对照原资料</summary>${customRequestSnapshot(ticket.customChange.before)}</details></section>` : ''}
    ${ticket.orderChange ? `<section class="detail-block"><h3 class="subhead">申请内容</h3>${orderChangeDiff(ticket.orderChange, ticket.status === 'closed')}</section>` : ''}
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
      <div class="panel-head"><button class="link ticket-close" type="button" data-action="close-ticket" data-id="${e(ticket.id)}">${ticket.orderChange || ticket.customChange ? '撤回申请' : '关闭' + (kind === 'tickets' ? '工单' : kind === 'claims' ? '索赔' : '申诉')}</button><button class="btn primary small" type="submit">添加回复</button></div>
    </form>`}
  </div>`;
  return managementDetail(title, body, ticket.id, ticketStatusBadge(ticket));
}

export function ticketsView(result, filter, selected, order, counts, emptyMessage, kind, bill, customRequest) {
  const { label, action } = caseTypes[kind];
  const search = kind === 'disputes' ? '搜索申诉号、账单号或主题' : '搜索编号、主题或关联记录';
  return managementPage({
    title: '工单与申诉', kind, label: label + '列表', result,
    tabs: managementTabs('工单与申诉类型', Object.entries(caseTypes).map(([key, tab]) => [key, caseRoute(key), tab.label]), kind),
    toolbar: managementToolbar(ticketStatuses, filter, counts, search,
      `<button class="btn primary small" type="button" data-action="${kind === 'tickets' ? 'new-ticket' : 'new-case'}" data-kind="${kind}">${icon('plus')} ${action}</button>`),
    headers: ['主题 / 编号', [kind === 'disputes' ? '关联账单 / 运单' : '关联记录', 'list-table-wide'], ['处理状态', 'list-table-status'], ['最近动态', 'list-table-medium ticket-table-activity']],
    rows: ticketRows(result.rows, selected?.id, kind), detail: ticketDetail(selected, order, emptyMessage, kind, bill, customRequest)
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

export function billingView(billing, result, selected, dispute) {
  const { type, bills, filter } = billing;
  const rebills = type === 'rebills';
  const collected = bills.filter(bill => ['charged', 'collected'].includes(bill.paymentStatus));
  const scheduled = bills.filter(bill => ['scheduled', 'held'].includes(bill.paymentStatus));
  const totalCharged = collected.reduce((sum, bill) => sum + bill.total, 0);
  const pendingTotal = scheduled.reduce((sum, bill) => sum + bill.total, 0);
  const summary = `<div class="billing-summary" aria-label="${rebills ? '补收账单汇总' : '账单汇总'}">
    ${rebills ? `<p class="billing-metric"><span>待处理金额</span><strong>${money(pendingTotal)}</strong><span>· ${scheduled.length} 笔</span></p>` : ''}
    <p class="billing-metric"><span>累计已扣款</span><strong>${money(totalCharged)}</strong><span>· ${collected.length} 笔</span></p>
  </div>`;
  return managementPage({
    title: '账单管理', kind: type, label: rebills ? '补收账单列表' : '账单列表', result,
    tabs: managementTabs('账单类型', [['bills', '#billing', 'Bills <small>账单</small>'], ['rebills', '#billing/rebills', 'Rebills <small>补收账单</small>']], type, summary),
    toolbar: managementToolbar(rebills ? rebillStatuses : null, filter, billing.counts, '搜索账单号、运单号、费用项或路线', '', rebills ? '全部账单' : '全部') + (rebills ? `<p class="billing-collection-rule">${e(rebillCollectionRule)}申诉期限按美国太平洋时间（PT）计算。</p>` : ''),
    headers: [rebills ? '补收账单号' : '账单号', ['运单 / 摘要', 'list-table-medium'], ...(rebills ? [['补收原因', 'list-table-wide']] : []),
      [rebills ? '出账 / 申诉期限' : '扣款日期', 'list-table-medium list-table-time'], [rebills ? '金额 / 状态 (USD)' : '已扣款 (USD)', 'list-table-amount']],
    rows: billRows(result.rows, selected?.id, billing), detail: billDetail(selected, billing, dispute)
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
    if (mode === 'manage') return `<li class="account-address-row"><div class="address-summary"><strong>${e(address.label)}</strong><small>${e(addressTypes[address.type] ?? '')}</small></div><div class="address-summary"><span>${e(location)}</span></div><div class="address-summary"><span>${e([address.company, address.contact].filter(Boolean).join(' · ')) || '—'}</span><small>${e([phone, address.email].filter(Boolean).join(' · '))}</small></div>${action}</li>`;
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
      <div class="contact-phone">
        ${field({ label: '联系电话', name: 'phone', value: address.phone, type: 'tel' })}
        ${field({ label: '分机号', name: 'phoneExtension', value: address.phoneExtension, type: 'tel' })}
      </div>
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
  return `<div class="panel-head account-tab-heading"><div><h2>API 密钥</h2><p class="note">演示密钥在当前浏览器管理，完整密钥仅在创建时显示。</p></div><button class="btn primary small" type="button" data-action="new-api-key">${icon('plus')}创建密钥</button></div>
    <div class="account-list-labels account-api-columns" aria-hidden="true"><span>密钥名称</span><span>密钥（掩码）</span><span>创建日期</span><span>状态 / 操作</span></div>
    <ul class="api-key-list account-api-list">${keys.map(key => `<li class="account-api-columns"><strong>${e(key.name)}</strong><code>${e(key.preview)}</code><div class="address-summary"><time>${e(key.date)}</time>${key.revokedOn ? '<small>停用于 ' + e(key.revokedOn) + '</small>' : ''}</div>
      ${key.revokedOn ? '<div class="actions"><span class="status">已停用</span></div>' : `<div class="actions"><span class="status paid">已启用</span><button class="link" type="button" data-action="revoke-api-key" data-id="${e(key.id)}" aria-label="停用密钥 ${e(key.name)}">停用</button></div>`}</li>`).join('') || '<li class="empty">暂无演示 API 密钥</li>'}</ul>`;
}

export function walletRows(entries) {
  return entries.map(entry => `<tr>
    <td><time datetime="${e(entry.date)}">${e(entry.date || '—')}</time><small>${e(entry.id)}</small></td>
    <td><strong class="wallet-kind">${walletKinds[entry.kind]}</strong><small class="wallet-ledger-description">${e(entry.description)}</small></td>
    <td>${entry.href ? `<a class="link" href="${e(entry.href)}">${e(entry.billId)}</a><small><a class="link" href="#orders/${e(entry.orderId)}">${e(entry.orderId)}</a></small>` : `<span class="note">${entry.kind === 'opening' ? '演示初始余额' : '账户充值'}</span>`}</td>
    <td class="wallet-number ${entry.amount < 0 ? 'expense' : 'income'}">${entry.amount < 0 ? '−' : '+'}${money(Math.abs(entry.amount))}</td>
    <td class="wallet-number">${money(entry.balance)}</td>
  </tr>`).join('') || emptyRow(5, '暂无符合条件的资金流水');
}
export function walletContent(snapshot, result, filter) {
  return `<div class="wallet-content">
    <section class="wallet-overview" aria-labelledby="wallet-balance-title"><div class="wallet-balance"><h2 id="wallet-balance-title">可用余额 <small>USD</small></h2><p>${money(snapshot.balance)}</p><span class="note">演示资金账户</span></div>
    <dl class="wallet-metrics"><div><dt>累计入账</dt><dd>${money(snapshot.credits)}</dd><small>含演示初始入账</small></div><div><dt>累计支出</dt><dd>${money(snapshot.debits)}</dd><small>运费与已扣补收费用</small></div><div><dt>待处理补收</dt><dd><a class="link" href="#billing/rebills">${money(snapshot.pendingAmount)}</a></dd><small>${snapshot.pendingCount} 笔 · 尚未计入支出${snapshot.disputedAmount ? '，含申诉中 ' + money(snapshot.disputedAmount) : ''}</small></div></dl>
      <div class="wallet-overview-action"><button type="button" class="btn primary small" data-action="wallet-recharge">${icon('plus')}模拟充值</button><p class="note">仅用于演示，不产生真实交易</p></div>
    </section>
    ${snapshot.balance < 0 ? '<p class="wallet-balance-notice">演示余额不足，可通过模拟充值补充余额。</p>' : ''}
    <section class="wallet-ledger" aria-labelledby="wallet-ledger-title"><div class="panel-head"><h2 class="subhead" id="wallet-ledger-title">资金流水</h2><button type="button" class="link" data-action="wallet-export">导出流水 ${icon('arrow')}</button></div>
      <div class="wallet-filters" data-filters="wallet"><label class="field"><span class="sr-only">流水类型</span><select name="walletKind">${option('', '全部流水', filter.status)}${Object.entries(walletKinds).map(([value,label]) => option(value,label,filter.status)).join('')}</select></label>${listingSearch('搜索流水号、账单号、运单号或备注', filter.query)}</div>
      <div class="table-wrap wallet-table" tabindex="0" role="region" aria-labelledby="wallet-ledger-title"><table><thead><tr><th scope="col">日期 / 流水号</th><th scope="col">类型 / 摘要</th><th scope="col">关联单据</th><th scope="col" class="wallet-number">变动金额 (USD)</th><th scope="col" class="wallet-number">变动后余额 (USD)</th></tr></thead><tbody id="listing-rows">${walletRows(result.rows)}</tbody></table></div>
      <p class="note wallet-ledger-note">资金日期按 PT 显示。等待处理或申诉中的未扣款补收，不会预扣余额。</p>
    </section>
  </div>`;
}
export function walletRechargeForm(draft) {
  return `<form id="wallet-recharge-form" class="stack"><p class="note">模拟充值到账后，可在余额与资金流水中查看。</p><label class="field"><span>充值金额 (USD) ${requiredMark}</span><input name="amount" type="number" min="1" max="100000" step="0.01" inputmode="decimal" value="${e(draft.amount)}" required placeholder="请输入充值金额"></label><div class="wallet-quick-amounts" role="group" aria-label="快捷充值金额">${['500','1000','5000'].map(amount=>`<button type="button" class="btn small" data-action="wallet-amount" data-amount="${amount}" aria-pressed="${Number(draft.amount)===Number(amount)}">${money(Number(amount)*100)}</button>`).join('')}</div>${field({label:'备注（选填）',name:'note',value:draft.note,attributes:'maxlength="150"',placeholder:'例如运输预存款'})}<p class="error" id="wallet-recharge-error" role="alert"></p><div class="actions end"><button type="button" class="btn small" data-action="close-dialog">取消</button><button type="submit" class="btn primary small">核对充值</button></div></form>`;
}
export function walletRechargeConfirmation(draft, balance) {
  return `<div class="stack">${detailList([['本次充值', money(draft.cents) + ' USD'], ['当前余额', money(balance) + ' USD'], ['充值后余额', money(balance + draft.cents) + ' USD'], ...(draft.note ? [['充值备注',e(draft.note)]] : [])])}<p class="note">本次为模拟充值，确认后记入演示余额。</p><p class="error" id="wallet-recharge-error" role="alert"></p><div class="actions end"><button type="button" class="btn small" data-action="wallet-recharge-back">返回修改</button><button type="button" class="btn primary small" data-action="wallet-recharge-confirm">确认模拟充值 ${money(draft.cents)}</button></div></div>`;
}

export const accountTabs = { profile: '用户基本信息', balance: '余额管理', addresses: '地址簿', api: 'API 管理' };

export function accountView(profile, addresses, keys, activeTab, wallet = {}) {
  const sections = {
    profile: `<form id="profile-form" class="account-profile-form">
        <section class="account-form-section" aria-labelledby="profile-contact-heading"><div class="account-section-label"><h2 id="profile-contact-heading">公司与联系人</h2><p>用于运输联系与账号识别</p></div><div class="account-fields">
            ${field({ label: '公司名称', name: 'company', value: profile.company, required: true, attributes: 'maxlength="100"' })}
            ${field({ label: '联系人', name: 'contact', value: profile.contact, required: true, attributes: 'maxlength="70"' })}
            ${field({ label: '联系邮箱', name: 'email', value: profile.email, type: 'email', required: true, attributes: 'maxlength="100"' })}
            ${field({ label: '电话', name: 'phone', value: profile.phone, type: 'tel', required: true, attributes: 'maxlength="40"' })}
          </div></section>
        <section class="account-form-section" aria-labelledby="profile-preferences-heading"><div class="account-section-label"><h2 id="profile-preferences-heading">通知与偏好</h2><p>账单通知与默认计量单位</p></div><div class="account-fields">
            ${field({ label: '账单邮箱', name: 'billingEmail', value: profile.billingEmail, type: 'email', required: true, attributes: 'maxlength="100"' })}
            ${selectField('首选单位', 'units', unitNames, profile.units, true)}
          </div></section>
          <div class="actions end account-actions"><button class="btn primary small" type="submit">保存修改</button></div>
        </form>`,
    addresses: `<div class="panel-head account-tab-heading"><div><h2>常用地址 <span class="account-count">${addresses.length}</span></h2><p class="note">保存提送货地址与联系人，填单时可直接选用。</p></div><button class="btn primary small" type="button" data-action="new-address">${icon('plus')}添加地址</button></div>
      <div class="account-list-labels account-address-columns" aria-hidden="true"><span>地址名称 / 类型</span><span>地址</span><span>公司 / 联系人</span><span>操作</span></div>
      <ul class="address-book account-address-book">${addressRows(addresses, 'manage')}</ul>`,
    balance: wallet.content ?? '',
    api: apiKeyList(keys)
  };
  return `<h1 class="sr-only" tabindex="-1">账号管理</h1><section class="panel account-panel${activeTab === 'balance' ? ' wallet-active' : ''}">
    ${tabList('account', '账号管理标签', accountTabs, activeTab)}
    ${tabPanels('account', sections, activeTab, 'panel-inset account-tab-panel')}
  </section>${activeTab === 'balance' ? wallet.pagination ?? '' : ''}`;
}
