import {
  serviceOptions, selectedServices, addressTypes, addressTypeFor, zones, unitSettings, packaging, orderStatuses, billStatuses,
  dateInZone, totals, displayAddress, shortAddress, addressValue, invoiceId, money, displayMeasurement,
  carrierProfiles, selectedRate, quoteStatus, postalCode, stopDetailsReady, itemCommodities,
  hazardClasses, packingGroups, hazardIdPattern, stopSupplement, cargoReady, estimatedLinearFeet, orderDocuments,
  quoteModes, shipmentMode, quoteEntry, equipmentTypes, equipmentSummary, addressContactFields, ticketStatuses, ticketCategories
} from './model.js?v=tickets';

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
function pickupTimeFields(shipment, details) {
  return `<fieldset class="stop-time-group">
    <legend>提货窗口（当地）</legend>
    <div class="stop-time-grid pickup-window">
      ${field({ label: '提货日期', name: 'pickupDate', value: shipment.pickupDate, type: 'date', attributes: 'min="' + dateInZone() + '"', required: true })}
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
    <div class="service-options">${serviceOptions[side].map(service =>
      `<label class="check-option"><input type="checkbox" name="${side}-services" value="${service.id}"${shipment.services[side].includes(service.id) ? ' checked' : ''}><span>${service.label}</span></label>`
    ).join('')}</div>
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
function sideFields(shipment, side, details = null, complete = false) {
  const pickup = side === 'origin';
  const stopLabel = pickup ? '提货' : '送货';
  const label = stopLabel + (details ? '完整地址' : ' ZIP');
  const address = details ? shipment[side] : postalCode(shipment[side]);
  const addressAttributes = details
    ? 'list="address-suggestions" maxlength="220"'
    : 'inputmode="numeric" pattern="[0-9]{5}" maxlength="5"';
  const addressFields = `<div class="address-line">
      <div class="address-field">
        <label class="field" for="${side}"><span>${label} ${requiredMark}</span><span class="with-icon">${icon('search')}<input id="${side}" name="${side}" ${addressAttributes} value="${e(address)}" placeholder="${details ? '街道、城市、州、ZIP' : '五位美国邮编'}" autocomplete="off" required></span></label>
        <button class="icon-button" type="button" data-action="choose-address" data-side="${side}" aria-label="从地址簿选择${stopLabel}地址">${icon('book')}</button>
      </div>
      ${selectField('地址类型', side + '-type', addressTypeOptions, addressTypeFor(shipment, side), true)}
    </div>
    <p id="${side}-preview" class="address-preview" hidden></p>`;
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
    <header class="stop-header"><h3 class="stop-heading" id="${side}-heading">${stopLabel}信息</h3></header>
    <div class="stop-body">${addressFields}${serviceFields(shipment, side, stopLabel + '服务')}</div>
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
export function quoteView(shipment, units) {
  const mode = shipmentMode(shipment);
  return `<h1 class="sr-only" tabindex="-1">${quoteModes[mode]}询价</h1>
    <form id="quote-form" class="stack">
      <section class="panel panel-inset" aria-labelledby="route-heading">
        <h2 id="route-heading" class="panel-title">提送货信息</h2>
        <div class="route-grid">${sideFields(shipment, 'origin')}${icon('arrow', 'route-arrow')}${sideFields(shipment, 'destination')}</div>
      </section>
      ${mode === 'ftl' ? `<section class="panel panel-inset" aria-labelledby="equipment-heading">
        <h2 id="equipment-heading" class="panel-title">车辆与提货日期</h2>
        ${equipmentPicker(shipment.equipment)}
        <div class="ftl-options">
          ${field({ label: '车辆数量', name: 'vehicleCount', value: shipment.vehicleCount, type: 'number', attributes: 'min="1" step="1"', required: true })}
          ${field({ label: '提货日期（当地）', name: 'pickupDate', value: shipment.pickupDate, type: 'date', attributes: `min="${dateInZone()}"`, required: true })}
        </div>
      </section>` : ''}
      <section class="panel panel-inset" aria-labelledby="cargo-heading">
        <div class="panel-head"><h2 id="cargo-heading" class="panel-title">货物明细</h2>${cargoUnits(units)}</div>
        <div class="cargo-rows">${shipment.items.map((item, index) => `<div class="cargo-row" data-cargo-row>${cargoFields(item, units)}${removeCargoButton(index, shipment.items.length)}</div>`).join('')}</div>
        <button type="button" class="btn small" data-action="add-cargo">${icon('plus')}添加一项货物</button>
      </section>
      <div>
        <p class="error" role="alert" id="quote-error"></p>
        <div class="actions end"><p class="note">${quoteModes[mode]} · 美国境内运输演示</p><button class="btn primary shipment-submit" type="submit">查看报价 ${icon('arrow')}</button></div>
      </div>
    </form>`;
}

export function customQuoteView(profile, requests, request) {
  const heading = '<h1 class="sr-only" tabindex="-1">定制询价</h1>';
  if (request) return `${heading}<section class="panel panel-inset custom-quote" aria-labelledby="custom-receipt-heading">
    <div class="panel-head"><h2 class="panel-title" id="custom-receipt-heading">定制询价已保存</h2><span class="status paid">${e(request.id)}</span></div>
    <div class="custom-quote-fields">${detailList([
      ['提货地点', e(request.origin)], ['送货地点', e(request.destination)], ['联系人', e(request.contact)],
      ['联系邮箱', e(request.email)], ...(request.phone ? [['联系电话', e(request.phone)]] : []),
      ['运输需求', e(request.requirements), 'stop-note']
    ])}<p class="note">此演示记录保存在当前浏览器。</p><a class="link" href="#custom">返回定制询价</a></div>
  </section>`;
  return `${heading}<div class="stack custom-quote">
    <form id="custom-quote-form" class="panel panel-inset">
      <h2 class="panel-title">运输需求</h2>
      <div class="account-fields custom-quote-fields">
        ${field({ label: '提货地点', name: 'origin', placeholder: '城市、州或 ZIP', attributes: 'maxlength="180"', required: true })}
        ${field({ label: '送货地点', name: 'destination', placeholder: '城市、州或 ZIP', attributes: 'maxlength="180"', required: true })}
        <label class="field full"><span>需求说明 ${requiredMark}</span><textarea name="requirements" rows="4" maxlength="1500" placeholder="请填写货物信息、提送时间和特殊要求" required></textarea></label>
      </div>
      <h2 class="subhead custom-contact-heading">联系信息</h2>
      <div class="account-fields custom-quote-fields">
        ${field({ label: '联系人', name: 'contact', value: profile.contact, attributes: 'maxlength="70"', required: true })}
        ${field({ label: '联系邮箱', name: 'email', type: 'email', value: profile.email, attributes: 'maxlength="100"', required: true })}
        ${field({ label: '联系电话（可选）', name: 'phone', type: 'tel', value: profile.phone, attributes: 'maxlength="40"' })}
      </div>
      <p class="error" id="custom-quote-error" role="alert"></p>
      <div class="actions end account-actions"><p class="note">演示询价保存在当前浏览器</p><button class="btn primary" type="submit">提交定制询价 ${icon('arrow')}</button></div>
    </form>
    ${requests.length ? `<section class="panel panel-inset" aria-labelledby="custom-history-heading"><h2 class="subhead" id="custom-history-heading">定制询价记录</h2>
      <ul class="order-files">${requests.map(record => `<li><div><a class="link" href="#custom/${e(record.id)}">${e(record.id)}</a><p class="note">${e(record.origin)} → ${e(record.destination)}</p></div><time class="note" datetime="${e(record.date)}">${e(record.date)}</time></li>`).join('')}</ul></section>` : ''}
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
function detailPanel(title, closeHref, body) {
  return `<section id="detail-panel" class="panel detail" aria-labelledby="detail-title"><header class="panel-head ruled"><h2 id="detail-title" class="panel-title" tabindex="-1">${title}</h2><a href="${closeHref}" class="icon-button" aria-label="关闭详情">${icon('close')}</a></header><div class="detail-body">${body}</div></section>`;
}
const validUntil = rate => rate.expiresAt
  ? new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(rate.expiresAt)
  : '需更新';

function arrivalText(quote, rate) {
  const date = quote.shipment.pickupDate;
  if (!date || !quote.details?.pickupEnd || !rate.businessDays) return '待确认提货时间';
  return rate.businessDays.map(days => {
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
      : `<button class="btn primary small" type="button" data-action="select-rate" data-quote="${e(quote.id)}" data-rate="${e(rate.id)}" aria-label="选用 ${e(carrierName(rate))} 报价"${blocked || !(rate.expiresAt > Date.now()) ? ' disabled' : ''}>选用报价</button>`;
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
  const services = Object.fromEntries(quote.rates.map(rate => [rate.name, rate.name]));
  return `<div class="rate-filters" data-rate-filters>
    ${selectField('承运商', 'carrier', { '': '全部承运商', ...carriers }, filters.carrier ?? '')}
    ${selectField('服务等级', 'service', { '': '全部等级', ...services }, filters.service ?? '')}
    ${selectField('排序', 'sort', rateSortOptions, filters.sort ?? 'price-asc')}
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
        <div class="panel rate-toolbar"><div><h2 class="panel-title" id="rate-comparison-heading">承运商报价</h2><p class="note" id="rate-result-count" role="status">${rates.length} 条报价</p></div>${rateFilters(quote, filters)}</div>
        ${booked ? '<p class="notice">这条报价已生成运单。</p>' : ''}
        ${!booked && pending ? '<p class="notice">当前报价需要更新，更新后即可选用。</p>' : ''}
        ${message ? '<p class="notice">' + e(message) + '</p>' : ''}
        <div id="rate-results">${carrierQuotes(quote, booked, rates)}</div>
        <p class="note">报价与时效为模拟数据 · 有效期按当前浏览器时间显示</p>
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
  const alternatives = quote.rates.filter(rate => rate.id !== quote.selectedRateId);
  if (!alternatives.length) return '';
  return `<div class="detail-block quick-rates">
    <h3 class="subhead">更换承运商</h3>
    ${alternatives.map(rate => {
      const logo = carrierProfiles[rate.carrierId]?.logo;
      return `<button type="button" class="quick-rate" aria-pressed="${quote.selectedRateId === rate.id}" aria-label="快速选用 ${e(carrierName(rate))}" data-action="select-rate" data-quote="${e(quote.id)}" data-rate="${e(rate.id)}"${blocked || !(rate.expiresAt > Date.now()) ? ' disabled' : ''}>
        <span class="quick-rate-carrier">${logo ? '<img src="../assets/carriers/' + logo + '" alt="">' : ''}<span><strong>${e(carrierName(rate))}</strong><small>${e(rate.days)}</small></span></span><b>${money(rate.total)}</b>
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
  const compactPrice = rate ? `<div class="quote-total"><span class="note">预计合计 (USD)</span><strong>${money(rate.total)}</strong><p class="note">${e(rate.days)}${arrival !== '待确认提货时间' ? ' · 预计 ' + e(arrival) + ' 送达' : ''}</p></div>
    <details class="quote-fees"><summary class="sub-disclosure"><strong>费用明细与有效期</strong>${icon('chev')}</summary><div class="quote-fees-body">${breakdown}</div></details>` : '';
  const reviewPrice = rate ? `<div class="review-price"><span class="note">${state === 'valid' ? '预计合计 (USD)' : '已选报价合计 (USD)'}</span><strong>${money(rate.total)}</strong></div>
    ${detailList(timing, 'review-rate-timing')}${detailList(feeRows(rate), 'fees review-fees')}` : '';
  return `
    <div class="detail-block">
      <div class="panel-head">${rate ? carrierIdentity(rate) : ''}<span class="status ${state === 'valid' ? 'paid' : 'ready'}">${titles[state]}</span></div>
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
    const saved = addresses.find(address => addressValue(address) === shipment[side]);
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
        <datalist id="address-suggestions">${addresses.map(address => option(addressValue(address), address.label)).join('')}</datalist>
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

function cargoDetailRows(shipment, details) {
  return shipment.items.map((item, index) => {
    const size = [item.length, item.width, item.height].map(value => cargoNumber.format(value)).join(' × ');
    const line = `${item.quantity} ${packaging[item.type]} · 单件 ${cargoNumber.format(item.weight)} lb · ${size} in`;
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
  return `<section class="panel review-stop" aria-labelledby="${heading}">
    <header class="review-stop-heading"><span class="overview-pin${pickup ? '' : ' destination'}" aria-hidden="true">${pickup ? 'A' : 'B'}</span><h3 class="subhead" id="${heading}">${label}信息</h3></header>
    <div class="review-stop-body">
      <div class="review-address">${company ? `<strong>${e(company)}</strong>` : ''}<p>${e(displayAddress(shipment[side]))}${unit ? ' · ' + e(unit) : ''}</p>${type ? `<p class="note">${e(type)}</p>` : ''}</div>
      ${detailList([
        ['联系人', e(details[side + 'Contact'])], ['电话', e(contactPhone(details, side))], ['邮箱', e(details[side + 'Email'])],
        ...(pickup ? [['提货窗口', pickupWindowText(shipment, details)]] : []), ...stopSupplementRows(details, side),
        ['附加服务', e(includedServiceNames(shipment, side).join('、') || '无')]
      ].filter(([, value]) => value))}
    </div>
  </section>`;
}

function shipmentCargoCard(shipment, details, scope) {
  return `<section class="panel review-cargo" aria-labelledby="${scope}-cargo-heading">
    <header class="panel-head ruled"><h3 class="subhead" id="${scope}-cargo-heading">货物明细</h3><p class="note">${cargoLabel(shipment)}</p></header>
    ${detailList(cargoDetailRows(shipment, details), 'review-cargo-list')}
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
export function orderRows(orders, selectedId) {
  return orders.map(order => {
    const references = [order.details?.originReference && '提货 ' + order.details.originReference,
      order.details?.destinationReference && '送货 ' + order.details.destinationReference].filter(Boolean);
    if (!references.length && order.reference) references.push(order.reference);
    return `<tr${order.id === selectedId ? ' class="table-row-selected"' : ''}>
    <td><a class="link" href="#orders/${e(order.id)}"${order.id === selectedId ? ' aria-current="true"' : ''}>${e(order.id)}</a>${references.map(value => `<small>${e(value)}</small>`).join('')}</td>
    <td>${routeLabel(order.shipment)}</td><td>${status(order.status, orderStatuses)}</td>
    <td><time datetime="${e(order.shipment.pickupDate)}">${e(order.shipment.pickupDate)}</time></td>
    <td><a class="link" href="#orders/${e(order.id)}" aria-label="查看运单 ${e(order.id)}">查看</a></td>
  </tr>`;
  }).join('') || emptyRow(5, '没有符合条件的运单');
}
export function billRows(orders, selectedId) {
  return orders.map(order => `<tr${order.id === selectedId ? ' class="table-row-selected"' : ''}>
    <td><a class="link" href="#billing/${e(order.id)}">${e(invoiceId(order))}</a></td>
    <td><a class="link" href="#orders/${e(order.id)}">${e(order.id)}</a></td>
    <td>${e(order.issued || '—')}</td><td class="amount">${order.issued ? money(order.rate.total) : '—'}</td>
    <td>${status(order.billing, billStatuses)}</td>
    <td><a class="link" href="#billing/${e(order.id)}" aria-label="查看账单 ${e(invoiceId(order))}">查看</a></td>
  </tr>`).join('') || emptyRow(6, '没有符合条件的账单');
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

export function orderDetail(order, activeTab, emptyMessage) {
  const header = `<h2 class="panel-title" id="detail-title" tabindex="-1">运单详情</h2>`;
  if (!order) return `<header class="panel-head ruled">${header}</header><p class="empty">${emptyMessage}</p>`;
  const sections = { overview: orderOverview(order), details: orderInformation(order), files: orderFiles(order) };
  return `<div class="order-detail-head">
    <header class="panel-head ruled"><div>${header}<p class="note">${e(order.id)}</p></div><div class="actions order-detail-actions">${status(order.status, orderStatuses)}<button class="btn small" type="button" data-action="new-ticket" data-order="${e(order.id)}">${icon('plus')} 创建工单</button></div></header>
    ${tabList('order', '运单详情标签', orderTabs, activeTab)}
  </div>
  ${tabPanels('order', sections, activeTab, 'detail-body order-tab-body')}`;
}
function billDetail(order) {
  return detailPanel('账单详情', '#billing', `
    <section class="detail-block">${detailList([
      ['账单号', '<strong>' + e(invoiceId(order)) + '</strong>'], ['关联运单', '<a class="link" href="#orders/' + e(order.id) + '">' + e(order.id) + '</a>'],
      ['出账日期', e(order.issued || '—')], ['状态', status(order.billing, billStatuses)]
    ])}</section>
    <section class="detail-block"><h3 class="subhead">费用明细</h3>${feeBreakdown(order.rate, !order.issued)}</section>
    ${order.issued
      ? '<div class="actions end"><button type="button" class="btn primary" data-action="download-bill" data-order="' + e(order.id) + '">下载账单明细</button></div>'
      : '<p class="note">账单出具后可下载明细。</p>'}`);
}
function listingSearch(placeholder, query) {
  return `<label class="with-icon"><span class="sr-only">${placeholder}</span>${icon('search')}<input class="text-input" type="search" name="query" placeholder="${placeholder}" value="${e(query)}"></label>`;
}
function billingFilters(filter) {
  return `<div class="filters" data-filters="billing">
    ${listingSearch('搜索账单号或关联运单', filter.query)}
    <label><span class="sr-only">筛选状态</span><select class="select-input" name="status">${option('', '全部状态', filter.status)}${Object.entries(billStatuses).map(([id, value]) => option(id, value, filter.status)).join('')}</select></label>
  </div>`;
}
function statusFilters(kind, statuses, label, filter, counts) {
  return `<div class="order-status-tabs" role="group" aria-label="${label}">${[['', '全部'], ...Object.entries(statuses)].map(([value, name]) =>
    `<button type="button" data-action="${kind}-status-filter" data-${kind}-status="${value}" aria-pressed="${filter.status === value}">${name} <span class="order-status-count">${counts[value] ?? 0}</span></button>`).join('')}</div>`;
}
function orderToolbar(filter, counts) {
  return `<div class="panel order-toolbar" data-filters="orders">
    ${statusFilters('order', orderStatuses, '按订单状态筛选', filter, counts)}${listingSearch('搜索运单号、参考号或线路', filter.query)}
  </div>`;
}
function listing(kind, orders, filter, detail, activeTab, totalCount) {
  const billing = kind === 'billing';
  const selected = detail?.id;
  const heading = billing ? '账单管理' : '订单管理';
  const headers = billing ? ['账单号', '关联运单', '出账日期', '金额 (USD)', '状态', '操作'] : ['运单号', '运输线路', '状态', '提货日期', '操作'];
  const table = `<div class="panel">${billing ? billingFilters(filter) : ''}
    <div class="table-wrap" tabindex="0" role="region" aria-label="${heading}列表"><table class="${billing ? 'bill' : 'order'}-table" aria-label="${heading}列表">
      <thead><tr>${headers.map(header => '<th scope="col">' + header + '</th>').join('')}</tr></thead>
      <tbody id="listing-rows">${billing ? billRows(orders, selected) : orderRows(orders, selected)}</tbody>
    </table></div>
  </div>`;
  if (billing) return `<div class="split${detail ? ' has-detail' : ''}">${table}${detail ? billDetail(detail) : ''}</div>`;
  const emptyMessage = totalCount ? '没有符合条件的运单' : '暂无运单';
  return `<div class="split has-detail order-workspace">${table}<aside class="panel detail order-detail" id="order-detail" aria-labelledby="detail-title">${orderDetail(detail, activeTab, emptyMessage)}</aside></div>`;
}
export function ordersView(orders, filter, detail, totalCount, activeTab, counts) {
  return `<h1 class="sr-only" tabindex="-1">订单管理</h1>${orderToolbar(filter, counts)}`
    + listing('orders', orders, filter, detail, activeTab, totalCount);
}

const ticketDateFormat = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function ticketTime(timestamp) {
  return `<time datetime="${new Date(timestamp).toISOString()}">${ticketDateFormat.format(timestamp)}</time>`;
}
export function ticketRows(tickets, selectedId) {
  return tickets.map(ticket => {
    const selected = ticket.id === selectedId;
    const category = e(ticketCategories[ticket.category]);
    const order = e(ticket.orderId);
    return `<tr${selected ? ' class="table-row-selected"' : ''}>
      <td><a class="link ticket-subject-link" href="#tickets/${e(ticket.id)}"${selected ? ' aria-current="true"' : ''}>${e(ticket.subject)}</a><small>${e(ticket.id)}</small><small class="ticket-mobile-meta">${category}${order ? ` · ${order}` : ''}</small></td>
      <td class="ticket-table-context">${category}${order ? `<small>${order}</small>` : ''}</td>
      <td>${status(ticket.status, ticketStatuses)}</td><td class="ticket-table-date">${ticketTime(ticket.updatedAt)}</td>
    </tr>`;
  }).join('') || emptyRow(4, '没有符合条件的工单');
}

export function ticketDetail(ticket, order, emptyMessage) {
  if (!ticket) return `<header class="panel-head ruled"><h2 class="panel-title" id="detail-title" tabindex="-1">工单详情</h2></header><p class="empty">${emptyMessage}</p>`;
  const names = { customer: '你', support: 'HYE 客服', system: '系统' };
  return `<header class="ticket-detail-head">
    <div class="panel-head"><p class="note">${e(ticket.id)} <span aria-hidden="true">·</span> ${e(ticketCategories[ticket.category])}</p>${status(ticket.status, ticketStatuses)}</div>
    <h2 class="panel-title" id="detail-title" tabindex="-1">${e(ticket.subject)}</h2>
    ${order ? `<a class="ticket-linked-order" href="#orders/${e(order.id)}">${icon('order')}<span><strong>${e(order.id)}</strong><small>${routeLabel(order.shipment)}</small></span>${icon('chev')}</a>` : ''}
  </header>
  <div class="detail-body ticket-detail-body">
    <section class="detail-block" aria-labelledby="ticket-activity-heading"><h3 class="subhead" id="ticket-activity-heading">沟通记录</h3>
      <ol class="ticket-activity">${ticket.messages.map(message => `<li class="ticket-message ${message.by === 'support' ? 'ticket-message-support' : ''}">
        <div class="panel-head"><strong>${names[message.by]}</strong><span class="note">${ticketTime(message.at)}</span></div><p>${e(message.text)}</p>
      </li>`).join('')}</ol>
    </section>
    ${ticket.status === 'closed' ? '' : `<form class="detail-block" id="ticket-reply-form" data-id="${e(ticket.id)}">
      <label class="field"><span>补充说明</span><textarea name="reply" rows="2" required maxlength="2000" placeholder="输入要补充的信息"></textarea></label>
      <p class="error" role="alert" id="ticket-reply-error"></p>
      <div class="panel-head"><button class="link ticket-close" type="button" data-action="close-ticket" data-id="${e(ticket.id)}">关闭工单</button><button class="btn primary small" type="submit">添加回复</button></div>
    </form>`}
  </div>`;
}

export function ticketsView(tickets, filter, selected, order, counts, emptyMessage) {
  return `<h1 class="sr-only" tabindex="-1">工单管理</h1>
    <div class="panel order-toolbar ticket-toolbar" data-filters="tickets">
      ${statusFilters('ticket', ticketStatuses, '按工单状态筛选', filter, counts)}
      ${listingSearch('搜索工单号、主题或运单号', filter.query)}
      <button class="btn primary small" type="button" data-action="new-ticket">${icon('plus')} 创建工单</button>
    </div>
    <div class="split has-detail ticket-workspace">
      <section class="panel table-wrap" aria-label="工单列表"><table aria-label="工单列表"><thead><tr><th scope="col">工单主题</th><th class="ticket-table-context" scope="col">问题类型 / 运单</th><th scope="col">状态</th><th class="ticket-table-date" scope="col">最近更新</th></tr></thead><tbody id="ticket-rows">${ticketRows(tickets, selected?.id)}</tbody></table></section>
      <aside class="panel detail ticket-detail" id="ticket-detail" aria-labelledby="detail-title">${ticketDetail(selected, order, emptyMessage)}</aside>
    </div>`;
}

export function ticketForm(orders, order) {
  const orderField = order ? `<div class="ticket-linked-order">${icon('order')}<span><strong>关联运单 ${e(order.id)}</strong><small>${routeLabel(order.shipment)}</small></span></div><input type="hidden" name="orderId" value="${e(order.id)}">`
    : selectField('关联运单（可选）', 'orderId', Object.fromEntries([['', '选择运单'], ...orders.map(entry => [entry.id, `${entry.id} · ${shortAddress(entry.shipment.origin)} → ${shortAddress(entry.shipment.destination)}`])]), '');
  return `<form class="ticket-form" id="new-ticket-form">
    ${orderField}
    ${selectField('问题类型', 'category', { '': '选择问题类型', ...ticketCategories }, '', true)}
    ${field({ label: '工单主题', name: 'subject', placeholder: '例如确认预计送达时间', required: true, attributes: 'maxlength="80"' })}
    <label class="field"><span>问题描述 ${requiredMark}</span><textarea name="description" rows="4" maxlength="2000" required placeholder="请描述遇到的问题和需要的协助"></textarea></label>
    <p class="error" role="alert" id="ticket-form-error"></p>
    <div class="actions end"><button class="btn" type="button" data-action="close-dialog">取消</button><button class="btn primary" type="submit">提交工单</button></div>
  </form>`;
}

export function billingView(orders, filter, detail, allOrders) {
  const due = allOrders.filter(order => order.billing === 'due').reduce((sum, order) => sum + order.rate.total, 0);
  const pending = allOrders.filter(order => order.billing === 'pending').length;
  return `${pageHead('账单管理')}<div class="stack">
    <dl class="panel balance"><div><dt>待支付金额</dt><dd>${money(due)}</dd></div><div><dt>待出账单数</dt><dd>${pending}</dd></div></dl>
    ${listing('billing', orders, filter, detail)}
  </div>`;
}

export function addressRows(addresses, mode, side = '') {
  return addresses.map(address => {
    const action = mode === 'pick'
      ? `<button class="btn small" type="button" data-action="apply-address" data-id="${e(address.id)}" data-side="${side}">选用</button>`
      : `<div class="actions"><button class="link" type="button" data-action="edit-address" data-id="${e(address.id)}" aria-label="编辑地址 ${e(address.label)}">编辑</button><button class="link" type="button" data-action="delete-address" data-id="${e(address.id)}" aria-label="删除地址 ${e(address.label)}">删除</button></div>`;
    const location = [displayAddress(addressValue(address)), address.unit].filter(Boolean).join(' · ');
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
