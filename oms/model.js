const liftgateHelp = '现场没有装卸平台或叉车，需要用车尾升降平台在地面和车厢之间装卸货物。';
const limitedAccessHelp = '车辆进出受限或需要登记通行，例如工地、学校和军事基地。';

export const serviceOptions = {
  origin: [
    { id: 'liftgate', label: '尾板', fee: 6500, description: liftgateHelp },
    { id: 'inside', label: '室内提货', fee: 8500, description: '货物在建筑物内，需要司机进入指定位置提货。' },
    { id: 'limited', label: '限制进入', fee: 6000, description: limitedAccessHelp },
    { id: 'cfs', label: '集装箱货运站', fee: 7000, description: '提货地点是集装箱货运站（CFS），例如海运拼箱拆箱后提取货物。' },
    { id: 'tradeshow', label: '展会', fee: 9000, description: '从展馆或会展中心提货，现场可能设有专用装卸区或指定提货时段。' }
  ],
  destination: [
    { id: 'liftgate', label: '尾板', fee: 6500, description: liftgateHelp },
    { id: 'inside', label: '室内送货', fee: 8500, description: '需要司机把货物送到建筑物内的指定交接位置。' },
    { id: 'limited', label: '限制进入', fee: 6000, description: limitedAccessHelp },
    { id: 'appointment', label: '预约送货', fee: 4500, description: '收货方要求提前约定送货日期或时间窗口。' },
    { id: 'notify', label: '到货前通知', fee: 2000, description: '请承运商在到达前联系收货人，方便提前安排接货。' },
    { id: 'amazon', label: '亚马逊预约', fee: 6500, description: '送往亚马逊运营中心时，需要通过 Carrier Central 申请送货预约。' }
  ]
};
export const addressTypes = {
  'commercial-dock': '商业地址+卸货平台',
  'commercial-no-dock': '商业地址+无卸货平台',
  residential: '住宅地址'
};
const residentialFee = 5500;

export function addressTypeFor(shipment, side) {
  // Older quotes recorded residential addresses as an optional service.
  return shipment.addressTypes?.[side] ?? (shipment.services[side].includes('residential') ? 'residential' : '');
}

export const zones = {
  'America/Los_Angeles': '太平洋时间 (PT)',
  'America/Denver': '山地时间 (MT)',
  'America/Chicago': '中部时间 (CT)',
  'America/New_York': '东部时间 (ET)'
};
export const defaultZone = 'America/Los_Angeles';

export const unitSettings = {
  imperial: { weight: 'lb', length: 'in', weightFactor: 1, lengthFactor: 1 },
  metric: { weight: 'kg', length: 'cm', weightFactor: 0.45359237, lengthFactor: 2.54 }
};
export const displayMeasurement = (value, factor) => value === '' ? '' : Number((value * factor).toFixed(4));

export const packaging = { pallet: '托盘', crate: '木箱', carton: '纸箱' };
export const quoteModes = { ltl: 'LTL 零担', ftl: 'FTL 整车' };
export const equipmentTypes = { van: '53ft 干柜车', box: '26ft Box Truck', flatbed: '平板车', sprinter: 'Sprinter', reefer: '冷藏车' };
export const shipmentMode = shipment => shipment?.mode === 'ftl' ? 'ftl' : 'ltl';
export const quoteEntry = shipment => shipmentMode(shipment) === 'ftl' ? 'ftl' : 'quote';
export const equipmentSummary = shipment => `${equipmentTypes[shipment.equipment] ?? '车型待填'} · ${shipment.vehicleCount || '—'} 辆`;
export const hazardClasses = {
  '1.1': '爆炸品', '1.2': '爆炸品', '1.3': '爆炸品', '1.4': '爆炸品', '1.5': '爆炸品', '1.6': '爆炸品',
  '2.1': '易燃气体', '2.2': '非易燃、非毒性气体', '2.3': '毒性气体',
  '3': '易燃液体', '4.1': '易燃固体', '4.2': '易自燃物质', '4.3': '遇水危险物质',
  '5.1': '氧化剂', '5.2': '有机过氧化物', '6.1': '毒性物质', '6.2': '感染性物质',
  '7': '放射性物质', '8': '腐蚀性物质', '9': '其他危险品'
};
export const packingGroups = { I: 'I', II: 'II', III: 'III' };
export const hazardIdPattern = '(?:[Uu][Nn]|[Nn][Aa]) *[0-9]{4}';
const hazardIdFormat = new RegExp('^' + hazardIdPattern + '$');
export const orderStatuses = {
  ready: '待提货', picked: '已提货', transit: '运输中', delivered: '已签收'
};
export const orderTypes = { ltl: 'LTL', ftl: 'FTL', custom: '定制服务' };
export const orderType = order => order.shipment.mode === 'custom' ? 'custom' : shipmentMode(order.shipment);
export const orderRoute = kind => kind === 'ltl' ? '#orders' : '#orders/' + kind;
export const orderRecordHref = (kind, record) => orderRoute(kind) + '/' + record.id;
export const billStatuses = { pending: '待出账', due: '待支付', paid: '已支付' };
export const ticketStatuses = { pending: '待处理', processing: '处理中', closed: '已关闭' };
export const ticketCategories = {
  tracking: '运输跟踪', stops: '提送货问题', billing: '账单费用', documents: '文件与回单', damage: '货损理赔', other: '其他'
};
export const caseTypes = {
  tickets: { label: '普通工单', action: '创建工单', prefix: 'TK-' },
  disputes: { label: '账单申诉', action: '发起申诉', prefix: 'BD-' },
  claims: { label: '运输索赔', action: '发起索赔', prefix: 'CL-' }
};
export const disputeReasons = { amount: '费用金额有误', service: '未使用该服务', duplicate: '重复收费', other: '其他费用问题' };
export const claimReasons = { damage: '货损', shortage: '短少', loss: '丢失' };
export const caseKind = ticket => ticket.kind ?? 'tickets';
export const caseRoute = kind => kind === 'tickets' ? '#tickets' : '#tickets/' + kind;
export const caseHref = ticket => caseRoute(caseKind(ticket)) + '/' + ticket.id;
export function caseCategory(ticket) {
  const kind = caseKind(ticket);
  const categories = kind === 'claims' ? claimReasons : kind === 'disputes' ? disputeReasons : ticketCategories;
  return Object.hasOwn(categories, ticket.category) ? categories[ticket.category] : '';
}
export function latestCase(tickets, kind, value) {
  const key = kind === 'disputes' ? 'billId' : 'orderId';
  return tickets.find(ticket => caseKind(ticket) === kind && ticket[key] === value && ticket.status !== 'closed')
    ?? tickets.find(ticket => caseKind(ticket) === kind && ticket[key] === value);
}
export const orderDocuments = { bol: ['BOL', '提单'], label: ['Label', '货运标签'], invoice: ['Invoice', '账单'] };
export const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export const postalCode = value => value.match(/\b(\d{5})(?:-\d{4})?(?:(?:,\s*|\s+)(?:US|USA|United States))?\s*$/i)?.[1] ?? '';
export const displayAddress = address => address.replace(/^.*? · /, '');
export const hasStreetAddress = address => Boolean(postalCode(address) && !/^\d{5}(?:-\d{4})?(?:,\s*(?:US|USA))?$/i.test(displayAddress(address)));
export const shortAddress = address => {
  const text = displayAddress(address);
  return text.match(/(?:^|, )([^,]+, [A-Za-z]{2} \d{5}(?:-\d{4})?)$/)?.[1] ?? text;
};
export const addressValue = address => `${address.street}, ${address.city}, ${address.region} ${address.zip}`;
export const addressContactFields = { company: 'Company', unit: 'Unit', contact: 'Contact', phone: 'Phone', phoneExtension: 'PhoneExtension', email: 'Email' };

const demoAddresses = [
  { id: 'west', label: '西部演示仓', street: '120 Demo Way', city: 'Los Angeles', region: 'CA', zip: '90001', type: 'commercial-dock' },
  { id: 'midwest', label: '中部演示收货点', street: '85 Sample Drive', city: 'Chicago', region: 'IL', zip: '60601', type: 'commercial-no-dock' }
];

export function dateInZone(zone = defaultZone, days = 0) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(Date.now() + days * 86400000));
}

export function emptyItem() {
  return { type: 'pallet', quantity: 1, weight: '', length: '', width: '', height: '' };
}

export function emptyCommodity() {
  return { description: '', nmfc: '', freightClass: '', regulated: [], pieceType: '', pieceCount: '' };
}

export function itemCommodities(item, legacyDescription = '') {
  return item.commodities ?? [{ ...emptyCommodity(), description: legacyDescription }];
}

export function emptyShipment(mode = 'ltl') {
  return {
    origin: '', destination: '', pickupDate: '', pickupTime: '09:00',
    addressTypes: { origin: '', destination: '' }, services: { origin: [], destination: [] }, items: [emptyItem()],
    ...(mode === 'ftl' ? { mode, equipment: '', vehicleCount: 1 } : {})
  };
}

export function exampleShipment(mode = 'ltl') {
  return {
    ...emptyShipment(mode),
    origin: addressValue(demoAddresses[0]),
    destination: addressValue(demoAddresses[1]),
    addressTypes: { origin: 'commercial-dock', destination: 'commercial-no-dock' },
    pickupDate: dateInZone(defaultZone, 1),
    services: { origin: [], destination: ['appointment'] },
    items: [{ type: 'pallet', quantity: mode === 'ftl' ? 20 : 2, weight: 400, length: 48, width: 40, height: 48 }],
    ...(mode === 'ftl' ? { equipment: 'van' } : {})
  };
}

export function totals(shipment) {
  return shipment.items.reduce((result, item) => ({
    quantity: result.quantity + Number(item.quantity),
    weight: result.weight + item.quantity * item.weight,
    volume: result.volume + item.quantity * item.length * item.width * item.height / 1728
  }), { quantity: 0, weight: 0, volume: 0 });
}

export function estimatedLinearFeet(shipment) {
  const trailerWidth = 96;
  return shipment.items.reduce((feet, item) => {
    // Estimate unstacked rows of identical handling units, allowing a 90° turn.
    const inches = (length, width) => {
      const across = Math.floor(trailerWidth / width);
      return across > 0 ? Math.ceil(item.quantity / across) * length : Infinity;
    };
    return feet + Math.min(inches(item.length, item.width), inches(item.width, item.length)) / 12;
  }, 0);
}

export function selectedServices(shipment, side) {
  return serviceOptions[side].filter(service => shipment.services[side].includes(service.id));
}

export const carrierProfiles = {
  economy: { name: 'Estes Express Lines', logo: 'EXLA.png' },
  standard: { name: 'XPO', logo: 'XPOL.png' },
  express: { name: 'FedEx Freight', logo: 'FXFE.png' },
  abfs: { name: 'ABF Freight', logo: 'ABFS.png' },
  fwdn: { name: 'Forward Air', logo: 'FWDN.png' },
  odfl: { name: 'Old Dominion', logo: 'ODFL.png' },
  saia: { name: 'Saia', logo: 'SAIA.png' },
  tfin: { name: 'TForce Freight', logo: 'TFIN.png' },
  ctbv: { name: 'Custom Companies' },
  echs: { name: 'Echo Global Logistics' },
  'ftl-economy': { name: '整车承运渠道 A' },
  'ftl-standard': { name: '整车承运渠道 B' },
  'ftl-express': { name: '整车承运渠道 C' }
};

const ltlServiceNames = {
  standard: '标准方案', express: '加急方案', guaranteed: '保证送达', noon: '保证中午 12 点前送达'
};

// Sample prices set the relative price of each option. Demo totals still use the current shipment.
const ltlRateExamples = [
  { carrierId: 'abfs', service: 'standard', transit: [2, 2], referencePrice: 253.13 },
  { carrierId: 'abfs', service: 'guaranteed', transit: [2, 2], referencePrice: 485.72 },
  { carrierId: 'abfs', service: 'noon', transit: [2, 2], referencePrice: 533.75 },
  { carrierId: 'fwdn', service: 'standard', transit: [1, 1], referencePrice: 276.04 },
  { carrierId: 'odfl', service: 'standard', transit: [1, 1], referencePrice: 679.24 },
  { carrierId: 'odfl', service: 'guaranteed', transit: [1, 1], referencePrice: 837.57 },
  { carrierId: 'saia', service: 'standard', transit: [1, 1], referencePrice: 358.24 },
  { carrierId: 'saia', service: 'guaranteed', transit: [1, 1], referencePrice: 439.25 },
  { carrierId: 'saia', service: 'noon', transit: [1, 1], referencePrice: 582.75 },
  { carrierId: 'tfin', service: 'standard', transit: [1, 1], referencePrice: 269.89 },
  { carrierId: 'tfin', service: 'guaranteed', transit: [1, 1], referencePrice: 385.62 },
  { carrierId: 'standard', service: 'guaranteed', transit: [1, 1], referencePrice: 373.19 },
  { carrierId: 'standard', service: 'express', transit: [1, 1], referencePrice: 269.32 },
  { carrierId: 'ctbv', service: 'standard', transit: [1, 3], referencePrice: 208.27 },
  { carrierId: 'echs', service: 'standard', transit: [1, 1], referencePrice: 1859.44 }
];

const fedExRateExamples = [
  { id: 'fxfe-economy-direct-appt', name: 'Economy Direct Basic by Appt', businessDays: [4, 6], factor: 1.27 },
  { id: 'fxfe-economy-direct', name: 'Economy Direct Basic', businessDays: [4, 5], factor: 1.21 },
  { id: 'fxfe-priority-premium', name: 'Priority Direct Premium', businessDays: [1, 1], factor: 1.86 },
  { id: 'fxfe-priority-standard', name: 'Priority Direct Standard', businessDays: [1, 2], factor: 1.66 },
  { id: 'fxfe-priority-direct-appt', name: 'Priority Direct Basic by Appt', businessDays: [2, 3], factor: 1.57 },
  { id: 'fxfe-priority-direct', name: 'Priority Direct Basic', businessDays: [1, 2], factor: 1.51 },
  { id: 'fxfe-economy', name: 'Economy', businessDays: [4, 6], factor: 1.13 }
];
const sides = ['origin', 'destination'];

export function cargoReady(shipment) {
  return shipment.items.length > 0 && shipment.items.every(item => Object.hasOwn(packaging, item.type)
    && Number.isInteger(item.quantity) && item.quantity > 0
    && ['weight', 'length', 'width', 'height'].every(key => Number.isFinite(item[key]) && item[key] > 0));
}

export function pricingReady(shipment) {
  const equipmentReady = shipmentMode(shipment) === 'ltl' || (Object.hasOwn(equipmentTypes, shipment.equipment)
    && Number.isSafeInteger(shipment.vehicleCount) && shipment.vehicleCount > 0);
  return Boolean(shipment.pickupDate && shipment.pickupDate >= dateInZone()) && equipmentReady
    && sides.every(side => postalCode(shipment[side]) && Object.hasOwn(addressTypes, addressTypeFor(shipment, side))) && cargoReady(shipment);
}

function pricingSnapshot(shipment) {
  const stop = side => ({
    zip: postalCode(shipment[side]), type: addressTypeFor(shipment, side),
    services: selectedServices(shipment, side).map(service => service.id)
  });
  const items = shipment.items.map(({ type, quantity, weight, length, width, height }) => ({ type, quantity, weight, length, width, height }));
  const equipment = shipmentMode(shipment) === 'ftl' ? { type: shipment.equipment, count: shipment.vehicleCount } : undefined;
  return { origin: stop('origin'), destination: stop('destination'), items, equipment };
}

function pricingChanges(previous, current) {
  if (!previous) return ['运输计价信息'];
  const changes = [];
  for (const side of sides) {
    const label = side === 'origin' ? '提货' : '送货';
    if (previous[side].zip !== current[side].zip) changes.push(label + '邮编');
    if (previous[side].type !== current[side].type) {
      const type = addressTypes[current[side].type];
      changes.push(type ? label + '地址改为' + type : label + '地址类型变更');
    }
    const previousServices = previous[side].services;
    const currentServices = current[side].services;
    const added = serviceOptions[side].filter(service => currentServices.includes(service.id) && !previousServices.includes(service.id));
    const removed = serviceOptions[side].filter(service => previousServices.includes(service.id) && !currentServices.includes(service.id));
    if (added.length) changes.push(label + '新增' + added.map(service => service.label).join('、'));
    if (removed.length) changes.push(label + '移除' + removed.map(service => service.label).join('、'));
  }
  if (JSON.stringify(previous.items) !== JSON.stringify(current.items)) changes.push('货物明细');
  if (previous.equipment?.type !== current.equipment?.type || previous.equipment?.count !== current.equipment?.count) changes.push('车辆需求');
  return changes;
}

export const selectedRate = quote => quote.rates.find(rate => rate.id === quote.selectedRateId);
const sameRate = (first, second) => Boolean(first && second && first.id === second.id
  && first.carrierId === second.carrierId && first.total === second.total && first.days === second.days
  && first.freight === second.freight && first.accessorial === second.accessorial);

export function quoteStatus(quote) {
  if (pricingChanges(quote.pricedFor, pricingSnapshot(quote.shipment)).length) return 'stale';
  if (!quote.rates.length || quote.rates.every(rate => !(rate.expiresAt > Date.now()))) return 'expired';
  if (!quote.selectedRateId) return 'unselected';
  const rate = selectedRate(quote);
  if (!rate) return 'unavailable';
  if (!(rate.expiresAt > Date.now())) return 'expired';
  return sameRate(quote.acceptedRate, rate) ? 'valid' : 'changed';
}

function ratesFor(shipment, quoteId) {
  const cargo = totals(shipment);
  const zoneDifference = Math.abs(Number(postalCode(shipment.origin)[0]) - Number(postalCode(shipment.destination)[0]));
  const ftl = shipmentMode(shipment) === 'ftl';
  const equipmentFactor = { van: 1, box: .78, flatbed: 1.12, sprinter: .62, reefer: 1.26 }[shipment.equipment] ?? 1;
  const base = ftl ? (1000 + zoneDifference * 310) * shipment.vehicleCount * equipmentFactor + cargo.weight * .025
    : 160 + zoneDifference * 48 + cargo.weight * 0.12 + cargo.volume * 0.72 + cargo.quantity * 21;
  const accessorial = sides.reduce((sum, side) => {
    const services = selectedServices(shipment, side).reduce((total, service) => total + service.fee, 0);
    return sum + services + (addressTypeFor(shipment, side) === 'residential' ? residentialFee : 0);
  }, 0);

  const expiresAt = Date.now() + 30 * 60 * 1000;
  const options = [
    { id: 'economy', name: '经济方案', businessDays: ftl ? [3, 5] : [5, 7], factor: 1 },
    { id: 'standard', name: '标准方案', businessDays: [3, 4], factor: 1.19 },
    { id: 'express', name: ftl ? '加急方案' : 'FedEx Freight Priority', businessDays: ftl ? [2, 3] : [1, 2], factor: 1.43 }
  ].map(rate => {
    const id = ftl ? `ftl-${rate.id}` : rate.id;
    return { ...rate, id, carrierId: id };
  });
  if (!ftl) {
    const extraDays = Math.floor(zoneDifference / 2);
    options.push(...ltlRateExamples.map(({ carrierId, service, transit, referencePrice }) => ({
      id: `${carrierId}-${service}`, carrierId, name: ltlServiceNames[service],
      businessDays: transit.map(days => days + extraDays), factor: referencePrice / 276.04
    })));
    options.push(...fedExRateExamples.map(rate => ({ ...rate, carrierId: 'express', name: 'FedEx Freight ' + rate.name })));
  }
  return options.map(({ factor, ...rate }, index) => {
    const freight = Math.round(base * factor * 100);
    const [minDays, maxDays] = rate.businessDays;
    const days = minDays === maxDays ? minDays : `${minDays}–${maxDays}`;
    return {
      ...rate, days: days + ' 个工作日',
      freight, accessorial, total: freight + accessorial, expiresAt, reference: quoteId + '-' + (index + 1)
    };
  });
}

function priceQuote(quote, shipment) {
  const pricedFor = pricingSnapshot(shipment);
  const changes = pricingChanges(quote.pricedFor, pricedFor);
  const rates = ratesFor(shipment, quote.id);
  const current = rates.find(rate => rate.id === quote.selectedRateId);
  return {
    ...quote, shipment, pricedFor, rates, date: dateInZone(),
    acceptedRate: sameRate(quote.acceptedRate, current) ? current : quote.acceptedRate,
    changeReason: changes.length ? changes.join('、') : quote.changeReason
  };
}

export function stopSupplement(details, side) {
  return {
    reference: details?.[side + 'Reference'] ?? (side === 'origin' ? details?.reference ?? '' : ''),
    notes: details?.[side + 'Notes'] ?? (side === 'origin' ? details?.notes ?? '' : ''),
    opensAt: details?.[side + 'OpensAt'] ?? '',
    closesAt: details?.[side + 'ClosesAt'] ?? ''
  };
}

export function stopHoursReady(details, side) {
  const { opensAt, closesAt } = stopSupplement(details, side);
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  return time.test(opensAt) && time.test(closesAt);
}

export function stopDetailsReady(quote, side) {
  const { shipment, details = {} } = quote;
  const addressReady = hasStreetAddress(shipment[side])
    && Object.hasOwn(addressTypes, addressTypeFor(shipment, side))
    && ['Company', 'Contact', 'Email', 'Phone'].every(key => details[side + key]?.trim());
  if (!addressReady || !stopHoursReady(details, side)) return false;
  if (side === 'destination') return true;
  return Boolean(shipment.pickupDate && shipment.pickupDate >= dateInZone()
    && shipment.pickupTime && details.pickupEnd && shipment.pickupTime < details.pickupEnd);
}

export function hazardDeclarationsReady(shipment) {
  return shipment.items.every(item => itemCommodities(item).every(({ regulated, hazmat }) => {
    if (!regulated.includes('hazmat')) return true;
    if (!hazmat) return false;
    const quantity = Number(hazmat.hazardQuantity);
    return Object.hasOwn(hazardClasses, hazmat.hazardClass) && hazardIdFormat.test(hazmat.hazardId)
      && Number.isSafeInteger(quantity) && quantity > 0
      && (!hazmat.packingGroup || Object.hasOwn(packingGroups, hazmat.packingGroup))
      && ['hazardPackage', 'shippingName', 'emergencyFirstName', 'emergencyLastName', 'emergencyCompany', 'emergencyPhone']
        .every(key => hazmat[key]?.trim());
  }));
}

export const detailsReady = quote => sides.every(side => stopDetailsReady(quote, side)) && hazardDeclarationsReady(quote.shipment);

export const invoiceId = order => 'INV-' + order.id.slice(4);

export function billingRecords(orders) {
  return orders.flatMap(order => {
    const bill = {
      id: invoiceId(order), orderId: order.id, status: order.billing, issued: order.issued,
      total: order.rate.total, charges: [['运输费用', order.rate.freight], ['附加服务', order.rate.accessorial]]
    };
    const adjustment = {
      'HYE-DEMO-102': { label: '送货尾板费', amount: 6500, reason: '送货现场使用了尾板，原账单未包含此项服务。', status: 'due' },
      'HYE-DEMO-101': { label: '提货等候费', amount: 4500, reason: '提货超出免费等候时间，承运商补收等候费。', status: 'paid' }
    }[order.id];
    if (!order.issued || !adjustment) return [bill];
    return [bill, {
      id: 'RB-' + order.id.slice(4), orderId: order.id, originalId: bill.id,
      issued: order.issued, status: adjustment.status, total: adjustment.amount,
      reason: adjustment.reason, charges: [[adjustment.label, adjustment.amount]]
    }];
  });
}

export const billHref = bill => bill.originalId ? `#billing/rebills/${bill.id}` : `#billing/${bill.orderId}`;
const idFor = prefix => prefix + Array.from(crypto.getRandomValues(new Uint8Array(5)), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
const storageKey = 'hye-oms-client-demo-v1';

function seedTickets(orders) {
  const examples = [
    ['103', 'tracking', 'pending', '确认预计送达时间', '收货仓库需要提前安排卸货，请帮忙确认预计送达日期。'],
    ['102', 'billing', 'processing', '核对账单附加服务费', '请帮忙核对账单中的附加服务费。', '已收到，我们正在核对承运商的费用明细。'],
    ['101', 'documents', 'closed', '查看签收回单', '请问这票运单的签收回单在哪里查看？', '签收回单已回传，可在运单总览查看回单状态。']
  ];
  return examples.flatMap(([number, category, status, subject, question, answer]) => {
    const order = orders.find(entry => entry.id === `HYE-DEMO-${number}`);
    if (!order) return [];
    const createdAt = Date.parse(`${order.shipment.pickupDate}T16:00:00Z`);
    const messages = [{ by: 'customer', text: question, at: createdAt }];
    if (answer) messages.push({ by: 'support', text: answer, at: createdAt + 5400000 });
    if (status === 'closed') messages.push({ by: 'system', text: '工单已关闭', at: createdAt + 7200000 });
    return [{ id: `TK-DEMO-${number}`, orderId: order.id, subject, category, status, createdAt, updatedAt: messages.at(-1).at, messages }];
  });
}

function seed() {
  const lane = (origin, destination, days) => ({
    ...exampleShipment(), origin, destination, pickupDate: dateInZone(defaultZone, days)
  });
  const shipments = [
    lane('120 Demo Way, Los Angeles, CA 90001', '85 Sample Drive, Chicago, IL 60601', -1),
    lane('95 Demo Avenue, San Jose, CA 95131', '84 Example Way, Houston, TX 77002', -6),
    lane('21 Example Road, Newark, NJ 07102', '54 Sample Drive, Charlotte, NC 28202', -13)
  ];
  const quotes = shipments.map((shipment, index) => ({
    ...priceQuote({ id: 'QT-DEMO-10' + (3 - index) }, shipment), date: dateInZone(defaultZone, -index * 3 - 1)
  }));
  const statuses = ['transit', 'delivered', 'delivered'];
  const billing = ['pending', 'due', 'paid'];
  const orders = quotes.map((quote, index) => ({
    id: 'HYE-DEMO-10' + (3 - index),
    quoteId: quote.id,
    reference: 'PO-' + (301 - index),
    shipment: quote.shipment,
    rate: quote.rates[index === 2 ? 0 : 1],
    status: statuses[index],
    billing: billing[index],
    ...(index === 2 ? { podReceived: dateInZone(defaultZone, -7) } : {}),
    issued: index === 0 ? '' : dateInZone(defaultZone, index === 1 ? -2 : -8),
    date: quote.date
  }));
  const pending = priceQuote({ id: 'QT-DEMO-104', stage: 'compare' },
    lane('90001', '95131', 1));
  const continuing = priceQuote({ id: 'QT-DEMO-105', stage: 'details', selectedRateId: 'standard' },
    lane('160 Demo Avenue, Ontario, CA 91761', '94 Sample Way, Dallas, TX 75201', 1));
  continuing.acceptedRate = selectedRate(continuing);
  return {
    profile: {
      company: '环洋卡派演示客户', contact: '演示客户', email: 'shipping@example.com',
      phone: '+1 213 555 0100', billingEmail: 'billing@example.com', units: 'imperial'
    },
    addresses: demoAddresses,
    quotes: [continuing, pending, ...quotes],
    orders,
    tickets: seedTickets(orders)
  };
}

let memory = seed();

export function currentState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.profile && Array.isArray(saved.orders) && Array.isArray(saved.quotes) && Array.isArray(saved.addresses)) {
      memory = Array.isArray(saved.tickets) ? saved : { ...saved, tickets: seedTickets(saved.orders) };
    }
  } catch {
    // The current session stays usable if the browser denies local storage.
  }
  return memory;
}

function persist(state) {
  memory = state;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Keep changes in memory for this session.
  }
}

export function validateCase(state, { kind = 'tickets', subject, category, orderId, billId, charge, requestedAmount, description }) {
  if (!Object.hasOwn(caseTypes, kind) || !subject || !description || !caseCategory({ kind, category })) return '请填写问题类型、主题和说明。';
  if (kind === 'disputes') {
    const bill = billingRecords(state.orders).find(entry => entry.id === billId && entry.issued);
    if (!bill || (charge !== 'all' && !bill.charges.some(([label, amount]) => label === charge && amount > 0))) return '请选择已出账的账单和费用项。';
    const existing = latestCase(state.tickets, kind, billId);
    if (existing && existing.status !== 'closed') return '该账单已有进行中的申诉。';
  }
  if (kind === 'claims') {
    const order = state.orders.find(entry => entry.id === orderId && entry.status !== 'ready');
    if (!order) return '请选择已提货的运单。';
    if (requestedAmount && (!/^\d{1,9}(?:\.\d{1,2})?$/.test(requestedAmount) || Number(requestedAmount) <= 0)) return '请填写有效的索赔金额。';
    const existing = latestCase(state.tickets, kind, orderId);
    if (existing && existing.status !== 'closed') return '该运单已有进行中的索赔。';
  }
  if (kind !== 'disputes' && orderId && !state.orders.some(order => order.id === orderId)) return '请选择有效的关联运单。';
  return '';
}

export function createTicket({ kind = 'tickets', subject, category, orderId, billId, charge, requestedAmount, description }, files = []) {
  const state = currentState();
  if (validateCase(state, { kind, subject, category, orderId, billId, charge, requestedAmount, description })) return;
  if (kind === 'disputes') orderId = billingRecords(state.orders).find(bill => bill.id === billId).orderId;
  const at = Date.now();
  const ticket = {
    id: idFor(caseTypes[kind].prefix), kind, subject, category, orderId, status: 'pending', createdAt: at, updatedAt: at,
    ...(kind === 'disputes' ? { billId, charge } : {}),
    ...(kind === 'claims' && requestedAmount ? { requestedAmount: Math.round(Number(requestedAmount) * 100) } : {}),
    messages: [{ by: 'customer', text: description, at, files }]
  };
  persist({ ...state, tickets: [ticket, ...state.tickets] });
  return ticket;
}

export function updateTicket(id, reply = '', files = []) {
  const state = currentState();
  const ticket = state.tickets.find(ticket => ticket.id === id);
  if (!ticket || ticket.status === 'closed') return;
  const at = Date.now();
  const responding = Boolean(reply || files.length);
  const entry = responding ? { by: 'customer', text: reply, at, files } : { by: 'system', text: caseTypes[caseKind(ticket)].label + '已关闭', at };
  const updated = { ...ticket, status: responding ? ticket.status : 'closed', updatedAt: at, messages: [...ticket.messages, entry] };
  persist({ ...state, tickets: state.tickets.map(ticket => ticket.id === id ? updated : ticket) });
  return updated;
}

export function saveCustomRequest(fields) {
  const state = currentState();
  const request = { ...fields, id: idFor('CQ-'), date: dateInZone() };
  persist({ ...state, customRequests: [request, ...(state.customRequests ?? [])] });
  return request;
}

function storeQuote(state, quote) {
  persist({ ...state, quotes: [quote, ...state.quotes.filter(entry => entry.id !== quote.id)] });
  return quote;
}

export function saveQuote(shipment, previousId, supplemental = {}) {
  const state = currentState();
  const booked = state.orders.some(order => order.quoteId === previousId);
  const previous = booked ? null : state.quotes.find(entry => entry.id === previousId);
  const details = { ...previous?.details, ...supplemental };
  return storeQuote(state, priceQuote({ ...previous, id: previous?.id ?? idFor('QT-'), stage: 'compare', details }, shipment));
}

export function updateQuote(id, update) {
  const state = currentState();
  const quote = state.quotes.find(entry => entry.id === id);
  if (!quote || state.orders.some(order => order.quoteId === id)) return null;
  return storeQuote(state, { ...quote, ...update });
}

export function refreshQuote(id) {
  const state = currentState();
  const quote = state.quotes.find(entry => entry.id === id);
  if (!quote || !pricingReady(quote.shipment) || state.orders.some(order => order.quoteId === id)) return null;
  return storeQuote(state, priceQuote(quote, quote.shipment));
}

export function chooseRate(id, rateId) {
  const state = currentState();
  const quote = state.quotes.find(entry => entry.id === id);
  const rate = quote?.rates.find(entry => entry.id === rateId);
  if (!rate || !(rate.expiresAt > Date.now()) || quoteStatus(quote) === 'stale'
    || state.orders.some(order => order.quoteId === id)) return null;
  return storeQuote(state, { ...quote, selectedRateId: rate.id, acceptedRate: rate, stage: 'details', changeReason: '' });
}

export function bookOrder(quoteId) {
  const state = currentState();
  const existing = state.orders.find(order => order.quoteId === quoteId);
  if (existing) return existing;

  const quote = state.quotes.find(entry => entry.id === quoteId);
  if (!quote || quoteStatus(quote) !== 'valid' || !detailsReady(quote)) return null;
  const rate = selectedRate(quote);
  const shipment = { ...quote.shipment, items: quote.shipment.items.map(item => item.commodities ? {
    ...item, commodities: item.commodities.map(({ hazmat, ...commodity }) => commodity.regulated.includes('hazmat') ? { ...commodity, hazmat } : commodity)
  } : item) };
  const reference = stopSupplement(quote.details, 'origin').reference || stopSupplement(quote.details, 'destination').reference;

  const order = {
    id: 'HYE-' + quote.id.slice(3), quoteId, reference, details: quote.details, shipment, rate,
    date: dateInZone(), status: 'ready', billing: 'pending', issued: ''
  };
  persist({ ...state, orders: [order, ...state.orders] });
  return order;
}

export function saveProfile(profile) {
  const state = currentState();
  persist({ ...state, profile });
}

export function saveAddress(address, id) {
  const state = currentState();
  if (id && !state.addresses.some(entry => entry.id === id)) return false;
  const addresses = id ? state.addresses.map(entry => entry.id === id ? { ...entry, ...address } : entry)
    : [...state.addresses, { id: idFor('ADDR-'), ...address }];
  persist({ ...state, addresses });
  return true;
}

export function removeAddress(id) {
  const state = currentState();
  persist({ ...state, addresses: state.addresses.filter(address => address.id !== id) });
}

export function createDemoApiKey(name) {
  const state = currentState();
  const token = 'hye_demo_' + Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('');
  const date = dateInZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const key = { id: idFor('KEY-'), name, preview: `${token.slice(0, 15)}…${token.slice(-4)}`, date };
  persist({ ...state, apiKeys: [key, ...(state.apiKeys ?? [])] });
  return token;
}

export function revokeDemoApiKey(id) {
  const state = currentState();
  const keys = state.apiKeys ?? [];
  if (!keys.some(key => key.id === id && !key.revokedOn)) return false;
  const date = dateInZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  persist({ ...state, apiKeys: keys.map(key => key.id === id ? { ...key, revokedOn: date } : key) });
  return true;
}
