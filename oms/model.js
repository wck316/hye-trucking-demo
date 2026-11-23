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
  return shipment.addressTypes?.[side] ?? (shipment.services?.[side]?.includes('residential') ? 'residential' : '');
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
  ready: '待提货', picked: '已提货', transit: '运输中', delivered: '已签收', cancelled: '已取消'
};
export const canClaimOrder = order => ['picked', 'transit', 'delivered'].includes(order?.status);
export const orderTypes = { ltl: 'LTL', ftl: 'FTL', custom: '定制服务' };
export const orderType = order => order.shipment.mode === 'custom' ? 'custom' : shipmentMode(order.shipment);
export const orderRoute = kind => kind === 'ltl' ? '#orders' : '#orders/' + kind;
export const orderRecordHref = (kind, record) => orderRoute(kind) + '/' + record.id;
export const chargedBillStatus = '已扣款';
export const rebillStatuses = { waiting: '等待处理', disputing: '正在申诉', completed: '处理完成' };
export const rebillCollectionRule = '请在出账后 5 个工作日内发起申诉，逾期未申诉将自动扣款。不含出账当天，工作日按周一至周五计算。';
export const billStatusText = bill => bill.originalId ? rebillStatuses[bill.workflowStatus] ?? rebillStatuses.waiting : chargedBillStatus;
export const billAmountLabel = bill => !bill.originalId || bill.paymentStatus === 'collected' ? '已扣款金额' : '应付金额';
export const rebillCountdownText = bill => bill.workflowStatus === 'disputing' ? (bill.paymentStatus === 'collected' ? '账单已扣款，申诉处理中' : '申诉处理中，暂缓扣款')
  : bill.paymentStatus === 'collected' ? '已扣款' : bill.appealDaysRemaining == null ? '申诉期限待确认' : `剩余 ${bill.appealDaysRemaining} 个工作日可申诉`;
export const rebillMethodText = bill => bill.paymentStatus === 'held' ? '申诉处理中，暂缓扣款' : bill.paymentStatus !== 'collected' ? '逾期未申诉将自动扣款' : bill.collectionMethod === 'early' ? '客户提前确认扣款' : '逾期未申诉自动扣款';

export const ticketStatuses = { pending: '待处理', processing: '处理中', closed: '已关闭' };
export const ticketCategories = {
  tracking: '运输跟踪', stops: '提送货问题', 'order-change': '订单变更', billing: '账单费用', documents: '文件与回单', damage: '货损理赔', other: '其他'
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
export const orderDocuments = { bol: ['BOL', '提单'], label: ['Label', '货运标签'], pod: ['POD', '签收回单'], invoice: ['Invoice', '账单'], rebill: ['Rebill', '补收账单'] };
export const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export const postalCode = value => value.match(/\b(\d{5})(?:-\d{4})?(?:(?:,\s*|\s+)(?:US|USA|United States))?\s*$/i)?.[1] ?? '';
export const displayAddress = address => address.replace(/^.*? · /, '');
export const hasStreetAddress = address => Boolean(postalCode(address) &&
  !/^(?:[^,]+,\s*[A-Za-z]{2}\s+)?\d{5}(?:-\d{4})?(?:(?:,\s*|\s+)(?:US|USA|United States))?$/i.test(displayAddress(address).trim()));
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
  return { description: '', declaredValue: '', nmfc: '', freightClass: '', regulated: [], pieceType: '', pieceCount: '' };
}

export function itemCommodities(item, legacyDescription = '') {
  return item.commodities ?? [{ ...emptyCommodity(), description: legacyDescription }];
}

export function itemFreightClasses(item) {
  const classes = itemCommodities(item).map(commodity => commodity.freightClass).filter(Boolean);
  return [...new Set(classes)].sort((first, second) => Number(first) - Number(second));
}

export function emptyShipment(mode = 'ltl') {
  return {
    origin: '', destination: '', pickupDate: '', pickupTime: '09:00',
    addressTypes: { origin: '', destination: '' }, services: { origin: [], destination: [] }, items: [emptyItem()],
    ...(mode === 'ftl' ? { mode, equipment: '', vehicleCount: 1 } : {})
  };
}

export function emptyCustomStop() {
  return { id: idFor('STOP-'), address: '', addressType: '', date: '', contact: '', phone: '', phoneExtension: '', reference: '', notes: '', services: [] };
}

export function customShipmentStops(shipment, details = {}) {
  return Object.fromEntries(sides.map(side => [side, shipment.stops?.[side]?.length ? shipment.stops[side] : [{
    id: side, address: shipment[side] ?? '', addressType: addressTypeFor(shipment, side) ?? '',
    date: shipment[side === 'origin' ? 'pickupDate' : 'deliveryDate'] ?? '',
    contact: details[side + 'Contact'] ?? '', phone: details[side + 'Phone'] ?? '',
    phoneExtension: details[side + 'PhoneExtension'] ?? '', company: details[side + 'Company'] ?? '',
    unit: details[side + 'Unit'] ?? '', email: details[side + 'Email'] ?? '',
    reference: details[side + 'Reference'] ?? '', notes: details[side + 'Notes'] ?? '',
    services: shipment.services?.[side] ?? []
  }]]));
}

export function customCargoRoute(item, stops) {
  return Object.fromEntries(sides.map(side => {
    const key = side + 'StopId';
    const id = item[key] ?? (stops[side].length === 1 ? stops[side][0].id : '');
    return [key, stops[side].some(stop => stop.id === id) ? id : ''];
  }));
}

// Stable custom cargo identities keep removals and insertions distinct from edits.
export function customCargoIdentities(shipment, baseline = true) {
  return { ...shipment, items: (shipment.items ?? []).map((item, index) => ({ ...item,
    customId: item.customId ?? (baseline ? 'cargo-' + (index + 1) : idFor('CI-')),
    commodities: itemCommodities(item).map((commodity, position) => ({ ...commodity,
      customId: commodity.customId ?? (baseline ? 'commodity-' + (position + 1) : idFor('CC-'))
    }))
  })) };
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

export function exampleCustomShipment() {
  const origin = [
    {
      ...emptyCustomStop(), address: addressValue(demoAddresses[0]), addressType: 'commercial-dock',
      date: dateInZone(defaultZone, 1), contact: '洛杉矶仓库联系人', phone: '+1 213 555 0101', phoneExtension: '101',
      reference: 'PU-LA-DEMO-001', notes: '从西门进入，提取货物 1，共 10 托盘。'
    },
    {
      ...emptyCustomStop(), address: '411 Demo Road, Phoenix, AZ 85001', addressType: 'commercial-no-dock',
      date: dateInZone(defaultZone, 2), contact: '凤凰城仓库联系人', phone: '+1 602 555 0102', phoneExtension: '102',
      reference: 'PU-PHX-DEMO-002', notes: '抵达后联系现场人员，提取货物 2，共 3 托盘。', services: ['liftgate']
    }
  ];
  const destination = [
    {
      ...emptyCustomStop(), address: addressValue(demoAddresses[1]), addressType: 'commercial-dock',
      date: dateInZone(defaultZone, 5), contact: '芝加哥收货联系人', phone: '+1 312 555 0103', phoneExtension: '201',
      reference: 'DEL-CHI-DEMO-001', notes: '卸下货物 1，共 10 托盘，到收货窗口登记。', services: ['appointment', 'notify']
    },
    {
      ...emptyCustomStop(), address: '88 Sample Drive, Indianapolis, IN 46201', addressType: 'commercial-no-dock',
      date: dateInZone(defaultZone, 6), contact: '印第安纳波利斯收货联系人', phone: '+1 317 555 0104', phoneExtension: '202',
      reference: 'DEL-IND-DEMO-002', notes: '卸下货物 2，共 3 托盘，需要尾板卸货。', services: ['liftgate', 'appointment']
    }
  ];
  return {
    ...emptyShipment(), stops: { origin, destination },
    origin: origin[0].address, destination: destination[1].address,
    pickupDate: origin[0].date, deliveryDate: destination[1].date,
    addressTypes: { origin: origin[0].addressType, destination: destination[1].addressType },
    services: { origin: ['liftgate'], destination: ['appointment', 'notify', 'liftgate'] },
    items: [
      {
        type: 'pallet', quantity: 10, weight: 400, length: 48, width: 40, height: 48,
        originStopId: origin[0].id, destinationStopId: destination[0].id,
        commodities: [{ ...emptyCommodity(), description: '服装（纸箱包装）', declaredValue: '12000', pieceType: 'carton', pieceCount: '12' }]
      },
      {
        type: 'pallet', quantity: 3, weight: 400, length: 48, width: 40, height: 60,
        originStopId: origin[1].id, destinationStopId: destination[1].id,
        commodities: [{ ...emptyCommodity(), description: '家具配件（加固包装）', declaredValue: '4500', pieceType: 'box', pieceCount: '4' }]
      }
    ]
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
  const isFtl = shipmentMode(shipment) === 'ftl';
  const items = shipment.items.map(item => {
    const { type, quantity, weight, length, width, height } = item;
    const classes = isFtl ? [] : itemFreightClasses(item);
    return { type, quantity, weight, length, width, height, ...(classes.length ? { classes } : {}) };
  });
  const equipment = isFtl ? { type: shipment.equipment, count: shipment.vehicleCount } : undefined;
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
export const orderChargeDate = order => order.date || order.issued || '';

function calendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
export function addBusinessDays(value, days = 5) {
  const date = calendarDate(value);
  if (!date || !Number.isInteger(days) || days < 0) return '';
  for (let remaining = days; remaining > 0;) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (![0, 6].includes(date.getUTCDay())) remaining--;
  }
  return date.toISOString().slice(0, 10);
}
export function businessDaysRemaining(today, deadline) {
  const date = calendarDate(today);
  if (!date || !calendarDate(deadline)) return null;
  let days = 0;
  while (date.toISOString().slice(0, 10) < deadline) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (![0, 6].includes(date.getUTCDay())) days++;
  }
  return days;
}
function billingDay(at) {
  const date = new Date(at ?? NaN);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-CA', { timeZone: defaultZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date) : '';
}

export function billingRecords(orders, today = dateInZone(defaultZone), tickets = currentState().tickets) {
  return orders.flatMap(order => {
    const chargedOn = orderChargeDate(order);
    const bill = {
      id: invoiceId(order), orderId: order.id, issuedOn: chargedOn, chargedOn,
      paymentStatus: 'charged', total: order.rate.total, charges: [['运输费用', order.rate.freight], ['附加服务', order.rate.accessorial]]
    };
    const example = {
      'HYE-DEMO-102': { label: '送货尾板费', amount: 6500, reason: '送货现场使用了尾板，原账单未包含此项服务。', daysAfterBooking: 2 },
      'HYE-DEMO-101': { label: '提货等候费', amount: 4500, reason: '提货超出免费等候时间，承运商补收等候费。', daysAfterBooking: 3 }
    }[order.id];
    const adjustments = Array.isArray(order.rebills) ? order.rebills : example ? [example] : [];
    const rebills = adjustments.map((adjustment, index) => {
      const issueDate = calendarDate(chargedOn);
      const offsetDays = Number(adjustment.daysAfterBooking ?? 0);
      if (issueDate && Number.isInteger(offsetDays)) issueDate.setUTCDate(issueDate.getUTCDate() + offsetDays);
      const issuedOn = adjustment.issuedOn ?? (issueDate && Number.isInteger(offsetDays) && Number.isFinite(issueDate.getTime()) ? issueDate.toISOString().slice(0, 10) : '');
      const autoCollectOn = addBusinessDays(issuedOn);
      const id = adjustment.id ?? 'RB-' + order.id.slice(4) + (index ? '-' + (index + 1) : '');
      const charges = adjustment.charges ?? [[adjustment.label, adjustment.amount]];
      const total = adjustment.total ?? adjustment.amount ?? charges.reduce((sum, [, value]) => sum + value, 0);
      const storedPayment = order.rebillPayments?.[id];
      const payment = storedPayment?.total === total ? storedPayment : undefined;
      const disputes = tickets.filter(ticket => ticket.kind === 'disputes' && ticket.billId === id);
      const activeDispute = disputes.find(ticket => ticket.status !== 'closed');
      const timely = ticket => !autoCollectOn || !billingDay(ticket.createdAt) || billingDay(ticket.createdAt) < autoCollectOn;
      const held = Boolean(activeDispute && timely(activeDispute) && !payment);
      // Demo-only collection: an unresolved timely dispute blocks deduction.
      const collected = Boolean(payment) || Boolean(!held && autoCollectOn && calendarDate(today) && today >= autoCollectOn);
      const resolvedOn = disputes.filter(ticket => ticket.status === 'closed' && timely(ticket)).map(ticket => billingDay(ticket.updatedAt)).filter(day => day && day <= today);
      const automaticOn = [autoCollectOn, ...resolvedOn].sort().at(-1);
      const collectedOn = collected ? payment?.collectedOn ?? automaticOn : '';
      return {
        id, orderId: order.id, originalId: bill.id, issuedOn, autoCollectOn,
        paymentStatus: collected ? 'collected' : held ? 'held' : 'scheduled',
        workflowStatus: activeDispute ? 'disputing' : collected ? 'completed' : 'waiting',
        appealDeadline: autoCollectOn, appealDaysRemaining: businessDaysRemaining(today, autoCollectOn), disputeId: activeDispute?.id ?? '',
        collectedOn, chargedOn: collectedOn,
        collectionMethod: collected ? payment?.method ?? 'automatic' : '',
        collectionId: payment?.id ?? '', collectionSimulated: true,
        total, reason: adjustment.reason, charges
      };
    });
    return [bill, ...rebills];
  });
}

export function collectRebillEarly(billId, expectedTotal) {
  const state = currentState();
  const bill = billingRecords(state.orders).find(entry => entry.id === billId && entry.originalId);
  if (!bill) return { error: '找不到这张补收账单，请刷新后重试。' };
  if (bill.total !== Number(expectedTotal)) return { error: '补收金额已变化，请重新核对账单后确认。' };
  if (bill.paymentStatus === 'collected') return { bill, alreadyCollected: true };
  if (bill.workflowStatus === 'disputing') return { error: '该补收账单正在申诉，请先处理或撤回申诉。' };
  const today = dateInZone(defaultZone);
  if (!calendarDate(bill.issuedOn) || bill.issuedOn > today) return { error: '该补收账单尚未正式出具。' };
  const payment = { id: idFor('DEMO-PAY-'), total: bill.total, collectedOn: today, collectedAt: Date.now(), method: 'early', simulated: true };
  persist({ ...state, orders: state.orders.map(order => order.id === bill.orderId ? {
    ...order, rebillPayments: { ...order.rebillPayments, [bill.id]: payment }
  } : order) });
  return { bill: billingRecords(currentState().orders).find(entry => entry.id === bill.id) };
}

export const billHref = bill => bill.originalId ? `#billing/rebills/${bill.id}` : `#billing/${bill.orderId}`;
const idFor = prefix => prefix + Array.from(crypto.getRandomValues(new Uint8Array(5)), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
const storageKey = 'hye-oms-client-demo-v1';
const demoCompany = 'HYE Freight 演示客户';
const demoProNumbers = new Map([
  ['HYE-DEMO-101', 'DEMO-0101'],
  ['HYE-DEMO-102', 'DEMO-0102'],
  ['HYE-DEMO-103', 'DEMO-0103']
]);

function withDemoProNumber(order) {
  const sample = demoProNumbers.get(order.id);
  return sample && !String(order.proNumber ?? '').trim() ? { ...order, proNumber: sample } : order;
}

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
  const orders = quotes.map((quote, index) => ({
    id: 'HYE-DEMO-10' + (3 - index),
    quoteId: quote.id,
    reference: 'PO-' + (301 - index),
    shipment: quote.shipment,
    rate: quote.rates[index === 2 ? 0 : 1],
    status: statuses[index],
    ...(index === 2 ? { podReceived: dateInZone(defaultZone, -7), details: { destinationPhone: '+1 704 555 0102' } } : {}),
    date: quote.date
  })).map(withDemoProNumber);
  const reviewedOrder = orders[2];
  const requestedAt = Date.parse(`${reviewedOrder.shipment.pickupDate}T15:00:00Z`);
  const reviewedAt = requestedAt + 3600000;
  const reviewedChange = {
    id: 'TK-DEMO-104', orderId: reviewedOrder.id, category: 'order-change', subject: '送货交接信息变更申请',
    status: 'closed', createdAt: requestedAt, updatedAt: reviewedAt,
    orderChange: {
      side: 'destination', addressChange: false, result: 'approved',
      changes: [{ key: 'Phone', before: '+1 704 555 0101', after: reviewedOrder.details.destinationPhone }]
    },
    messages: [
      { by: 'customer', text: '请更新收货仓库的现场联系电话。', at: requestedAt },
      { by: 'support', text: '审核通过，送货联系电话已更新。', at: reviewedAt }
    ]
  };
  const pending = priceQuote({ id: 'QT-DEMO-104', stage: 'compare' },
    lane('90001', '95131', 1));
  const continuing = priceQuote({ id: 'QT-DEMO-105', stage: 'details', selectedRateId: 'standard' },
    lane('160 Demo Avenue, Ontario, CA 91761', '94 Sample Way, Dallas, TX 75201', 1));
  continuing.acceptedRate = selectedRate(continuing);
  return {
    profile: {
      company: demoCompany, contact: '演示客户', email: 'shipping@example.com',
      phone: '+1 213 555 0100', billingEmail: 'billing@example.com', units: 'imperial'
    },
    addresses: demoAddresses,
    quotes: [continuing, pending, ...quotes],
    orders,
    tickets: [...seedTickets(orders), reviewedChange]
  };
}

let memory = seed();

export function currentState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.profile && Array.isArray(saved.orders) && Array.isArray(saved.quotes) && Array.isArray(saved.addresses)) {
      const profile = saved.profile.company === '环洋卡派演示客户' && saved.profile.email === 'shipping@example.com'
        ? { ...saved.profile, company: demoCompany } : saved.profile;
      memory = { ...saved, profile, orders: saved.orders.map(withDemoProNumber), tickets: Array.isArray(saved.tickets) ? saved.tickets : seedTickets(saved.orders) };
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

export const walletKinds = { opening: '初始入账', topup: '充值入账', freight: '运费扣款', rebill: '补收扣款' };
function walletConfig(state) {
  const dates = state.orders.map(orderChargeDate).filter(date => calendarDate(date)).sort();
  const firstDay = calendarDate(dates[0] ?? dateInZone());
  firstDay.setUTCDate(firstDay.getUTCDate() - 1);
  return state.wallet ?? { openingBalance: 1000000, openingOn: firstDay.toISOString().slice(0, 10), topups: [] };
}
export function walletSnapshot(state = currentState()) {
  const wallet = walletConfig(state);
  const bills = billingRecords(state.orders, dateInZone(), state.tickets);
  const topups = wallet.topups ?? [];
  const transactions = [{ id: 'BALANCE-OPENING', kind: 'opening', date: wallet.openingOn, at: 0,
    amount: wallet.openingBalance, description: '演示初始入账', reference: '', billId: '', orderId: '' },
    ...topups.map(entry => ({ ...entry, kind: 'topup', at: entry.createdAt, description: entry.note || '演示余额充值', reference: entry.id })),
    ...bills.filter(bill => ['charged', 'collected'].includes(bill.paymentStatus)).map(bill => {
      const order = state.orders.find(order => order.id === bill.orderId);
      return { id: 'WL-' + bill.id, kind: bill.originalId ? 'rebill' : 'freight', date: bill.chargedOn,
        at: (bill.originalId ? order?.rebillPayments?.[bill.id]?.collectedAt : order?.createdAt) ?? Date.parse(bill.chargedOn + 'T00:00:00Z'),
        amount: -bill.total, description: bill.originalId ? bill.reason || bill.charges.map(([label]) => label).join('、') : '运输订单扣款',
        reference: bill.id, billId: bill.id, orderId: bill.orderId, href: billHref(bill) };
    })];
  transactions.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.at - b.at || a.id.localeCompare(b.id));
  let balance = 0;
  const ledger = transactions.map(entry => { balance += entry.amount; return { ...entry, balance }; });
  const credits = transactions.filter(entry => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
  const debits = transactions.filter(entry => entry.amount < 0).reduce((sum, entry) => sum - entry.amount, 0);
  const pending = bills.filter(bill => bill.originalId && bill.paymentStatus !== 'collected');
  return { balance, credits, debits, pendingAmount: pending.reduce((sum, bill) => sum + bill.total, 0), pendingCount: pending.length,
    disputedAmount: pending.filter(bill => bill.workflowStatus === 'disputing').reduce((sum, bill) => sum + bill.total, 0),
    transactions: ledger.reverse() };
}
export function walletRechargeAmount(amount) {
  const value = String(amount ?? '').trim();
  if (!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(value)) return { error: '请输入有效的美元金额，最多两位小数。' };
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents < 100 || cents > 10000000) return { error: '单次演示充值金额为 1–100,000 USD。' };
  return { cents };
}
export function rechargeWallet({ amount, note = '', token }) {
  const parsed = walletRechargeAmount(amount);
  if (parsed.error) return parsed;
  const { cents } = parsed;
  if (typeof token !== 'string' || !/^[a-zA-Z0-9-]{8,100}$/.test(token)) return { error: '充值请求已失效，请重新填写。' };
  const state = currentState();
  const wallet = walletConfig(state);
  const previous = wallet.topups?.find(entry => entry.token === token);
  if (previous) return previous.amount === cents ? { entry: previous, alreadyRecharged: true } : { error: '充值金额已变化，请重新确认。' };
  const entry = { id: idFor('TOPUP-'), token, amount: cents, note: String(note).trim().slice(0, 150), date: dateInZone(), createdAt: Date.now(), simulated: true };
  persist({ ...state, wallet: { ...wallet, topups: [entry, ...(wallet.topups ?? [])] } });
  return { entry };
}

export function validateCase(state, { kind = 'tickets', subject, category, orderId, billId, charge, requestedAmount, description }) {
  if (!Object.hasOwn(caseTypes, kind) || !subject || !description || !caseCategory({ kind, category })) return '请填写问题类型、主题和说明。';
  if (kind === 'disputes') {
    const bill = billingRecords(state.orders).find(entry => entry.id === billId);
    if (!bill || (charge !== 'all' && !bill.charges.some(([label, amount]) => label === charge && amount > 0))) return '请选择账单和争议费用项。';
    const existing = latestCase(state.tickets, kind, billId);
    if (existing && existing.status !== 'closed') return '该账单已有进行中的申诉。';
  }
  if (kind === 'claims') {
    const order = state.orders.find(entry => entry.id === orderId && canClaimOrder(entry));
    if (!order) return '请选择已提货的运单。';
    if (requestedAmount && (!/^\d{1,9}(?:\.\d{1,2})?$/.test(requestedAmount) || Number(requestedAmount) <= 0)) return '请填写有效的索赔金额。';
    const existing = latestCase(state.tickets, kind, orderId);
    if (existing && existing.status !== 'closed') return '该运单已有进行中的索赔。';
  }
  if (kind !== 'disputes' && orderId && !state.orders.some(order => order.id === orderId)) return '请选择有效的关联运单。';
  return '';
}

export function createTicket({ kind = 'tickets', subject, category, orderId, billId, charge, requestedAmount, description, orderChange, customRequestId, customChange }, files = []) {
  const state = currentState();
  if (validateCase(state, { kind, subject, category, orderId, billId, charge, requestedAmount, description })) return;
  if (kind === 'disputes') orderId = billingRecords(state.orders).find(bill => bill.id === billId).orderId;
  const at = Date.now();
  const ticket = {
    id: idFor(caseTypes[kind].prefix), kind, subject, category, orderId, status: 'pending', createdAt: at, updatedAt: at,
    ...(kind === 'disputes' ? { billId, charge } : {}),
    ...(kind === 'claims' && requestedAmount ? { requestedAmount: Math.round(Number(requestedAmount) * 100) } : {}),
    ...(orderChange ? { orderChange } : {}),
    ...(customRequestId && customChange ? { customRequestId, customChange } : {}),
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
  const entry = responding ? { by: 'customer', text: reply, at, files }
    : { by: 'system', text: ticket.orderChange || ticket.customChange ? '变更申请已撤回' : caseTypes[caseKind(ticket)].label + '已关闭', at };
  const updated = { ...ticket, status: responding ? ticket.status : 'closed', updatedAt: at, messages: [...ticket.messages, entry] };
  persist({ ...state, tickets: state.tickets.map(ticket => ticket.id === id ? updated : ticket) });
  return updated;
}

export function saveCustomRequest(fields) {
  const state = currentState();
  const request = { ...structuredClone(fields), id: idFor('CQ-'), date: dateInZone(), revision: 1, createdAt: Date.now(), updatedAt: Date.now() };
  persist({ ...state, customRequests: [request, ...(state.customRequests ?? [])] });
  return request;
}

export const customRequestStatuses = { waiting: '待报价', reviewing: '修改审核中', quoted: '可下单', expired: '报价已过期', booked: '已下单' };
export function customChangeTicket(request, tickets = currentState().tickets) {
  return tickets.find(ticket => ticket.customRequestId === request?.id && ticket.customChange && ticket.status !== 'closed');
}
export function customRequestStatus(request, tickets = currentState().tickets) {
  if (request.orderId) return 'booked';
  if (customChangeTicket(request, tickets)) return 'reviewing';
  if (!request.quote || request.quote.revision !== (request.revision ?? 1)) return 'waiting';
  return request.quote.expiresAt > Date.now() ? 'quoted' : 'expired';
}
function customRequestData(request) {
  const data = structuredClone({ ...Object.fromEntries(['contact', 'email', 'phone', 'requirements'].map(key => [key, request[key] ?? ''])),
    shipment: request.shipment || { ...emptyShipment(), origin: request.origin ?? '', destination: request.destination ?? '' }, details: request.details ?? {}, units: request.units ?? 'imperial' });
  const stops = customShipmentStops(data.shipment, data.details || {});
  const endpoints = { origin: stops.origin[0], destination: stops.destination.at(-1) };
  data.shipment = { ...customCargoIdentities(data.shipment), stops, origin: endpoints.origin.address, destination: endpoints.destination.address,
    pickupDate: endpoints.origin.date, deliveryDate: endpoints.destination.date,
    addressTypes: Object.fromEntries(sides.map(side => [side, endpoints[side].addressType])),
    services: Object.fromEntries(sides.map(side => [side, [...new Set(stops[side].flatMap(stop => stop.services ?? []))].sort()])) };
  data.details = { ...data.details, ...Object.fromEntries(sides.flatMap(side => ['Contact', 'Phone', 'PhoneExtension', 'Reference', 'Notes'].map(key => [side + key, endpoints[side][key[0].toLowerCase() + key.slice(1)] ?? '']))) };
  return data;
}
function customDataSignature(value, key = '') {
  if (typeof value === 'string') return /phone$/i.test(key) ? value.replace(/[^+0-9]/g, '') : value.trim();
  if (Array.isArray(value)) return value.map(entry => customDataSignature(entry));
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).filter(key => !['customId', 'units'].includes(key)).sort().flatMap(key => {
    const entry = customDataSignature(value[key], key);
    return entry === '' || entry == null || (typeof entry === 'object' && !Object.keys(entry).length) ? [] : [[key, entry]];
  }));
  return value;
}

function customDataError(data) {
  if (!data.shipment?.items?.length || !data.requirements?.trim() || !data.contact?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? '')) return '请填写需求说明、联系人和有效邮箱。';
  const groups = customShipmentStops(data.shipment, data.details);
  const stops = [...groups.origin, ...groups.destination];
  if (stops.some(stop => !stop.address?.trim())) return '请填写所有提送货地点。';
  const dates = stops.filter(stop => stop.date).map(stop => stop.date);
  if (dates.some((date, index) => index && date < dates[index - 1])) return '请检查各地点日期的先后顺序。';
  if (data.shipment.items.some(item => { const route = customCargoRoute(item, groups); return !route.originStopId || !route.destinationStopId; })) return '请为每批货物选择有效的提货点和送货点。';
  if (!cargoReady(data.shipment) || !hazardDeclarationsReady(data.shipment)) return '请检查货物和危险品申报。';
  return '';
}
export function submitCustomRequestChange(requestId, fields, revision, reason) {
  const state = currentState();
  const request = state.customRequests?.find(entry => entry.id === requestId);
  if (!request || request.orderId) return { error: '该询价已下单或不存在，请在订单管理中提交变更。' };
  if (customChangeTicket(request, state.tickets)) return { error: '已有待审核的修改申请，请先处理或撤回。' };
  if ((request.revision ?? 1) !== Number(revision)) return { error: '资料已更新，请重新打开修改页面。' };
  const after = customRequestData(fields);
  const before = customRequestData(request);
  const error = customDataError(after);
  if (error) return { error };
  if (!reason?.trim()) return { error: '请填写修改说明。' };
  if (JSON.stringify(customDataSignature(before)) === JSON.stringify(customDataSignature(after))) return { error: '尚未修改资料。' };
  const ticket = createTicket({ category: 'other', subject: '定制询价资料修改申请', description: reason.trim(), customRequestId: requestId,
    customChange: { before, after, revision: request.revision ?? 1 } });
  return ticket ? { ticket } : { error: '无法提交修改申请，请重试。' };
}
// Demo-only support action. Approved snapshots and quotes are committed together.
export function simulateCustomResponse(requestId, decision = 'approve', expectedTicketId, expectedRevision) {
  const state = currentState();
  const request = state.customRequests?.find(entry => entry.id === requestId);
  if (!request || request.orderId) return { error: '该询价无法再更新报价。' };
  const pending = customChangeTicket(request, state.tickets);
  if (pending && pending.customChange.revision !== (request.revision ?? 1)) return { error: '申请版本已过期，请撤回后重新提交。' };
  const at = Date.now();
  if ((expectedTicketId !== undefined && (pending?.id ?? '') !== expectedTicketId) || (expectedRevision !== undefined && Number(expectedRevision) !== (request.revision ?? 1))) return { error: '审核资料已变化，请关闭后重新核对。' };
  const rejected = pending && decision === 'reject';
  const data = pending && !rejected ? pending.customChange.after : customRequestData(request);
  const error = customDataError(data);
  if (!rejected && error) return { error };
  const revision = (request.revision ?? 1) + (pending && !rejected ? 1 : 0);
  let quote = request.quote;
  if (!rejected) {
    const groups = customShipmentStops(data.shipment, data.details);
    const freight = Math.round(48000 + totals(data.shipment).weight * 38 + (groups.origin.length + groups.destination.length - 2) * 12500);
    const accessorial = sides.reduce((sum, side) => sum + groups[side].reduce((subtotal, stop) => subtotal + serviceOptions[side].filter(service => (stop.services ?? []).includes(service.id)).reduce((fees, service) => fees + service.fee, 0), 0), 0);
    quote = { id: idFor('CQT-'), reference: idFor('CQR-'), revision, simulated: true, carrierId: 'custom', carrierName: 'HYE Freight 定制运输', name: '多点提送方案', days: '按约定交接日期安排', freight, accessorial, total: freight + accessorial, createdAt: at, expiresAt: at + 86400000 };
  }
  const updated = { ...request, ...structuredClone(data), revision, quote, updatedAt: at };
  const tickets = pending ? state.tickets.map(ticket => ticket.id === pending.id ? { ...ticket, status: 'closed', resolution: rejected ? 'rejected' : 'approved', updatedAt: at,
    messages: [...ticket.messages, { by: 'support', text: rejected ? '【演示】修改申请未通过，保留原资料。' : '【演示】修改申请已审核通过，资料和报价已更新。', at }] } : ticket) : state.tickets;
  persist({ ...state, tickets, customRequests: state.customRequests.map(entry => entry.id === requestId ? updated : entry) });
  return { request: updated };
}
export function bookCustomRequest(requestId, quoteId) {
  const state = currentState();
  const request = state.customRequests?.find(entry => entry.id === requestId);
  if (!request) return { error: '询价不存在。' };
  const existing = state.orders.find(order => order.customRequestId === requestId);
  if (existing) return { order: existing };
  if (customRequestStatus(request, state.tickets) !== 'quoted' || request.quote.id !== quoteId) return { error: '报价已变更、过期或资料正在审核，请核对最新报价后再下单。' };
  const error = customDataError(request);
  if (error) return { error };
  const at = Date.now();
  const order = { id: idFor('HYE-'), customRequestId: requestId, quoteId, date: dateInZone(), createdAt: at, status: 'ready',
    shipment: { ...structuredClone(request.shipment), mode: 'custom' }, details: structuredClone(request.details ?? {}),
    rate: structuredClone(request.quote), units: request.units, requirements: request.requirements,
    inquiryContact: { contact: request.contact, email: request.email, phone: request.phone }, reference: request.id };
  persist({ ...state, orders: [order, ...state.orders], customRequests: state.customRequests.map(entry => entry.id === requestId ? { ...entry, orderId: order.id, updatedAt: at } : entry) });
  return { order };
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
    date: dateInZone(), createdAt: Date.now(), status: 'ready'
  };
  persist({ ...state, orders: [order, ...state.orders] });
  return order;
}

export const orderChangeLabels = {
  address: '街道地址', addressType: '地址类型', Company: '公司名称', Unit: '套间 / 单元',
  Contact: '现场联系人', Phone: '联系电话', PhoneExtension: '分机号', Email: '联系邮箱', Reference: '参考单号 / 交接码', Notes: '交接备注'
};
export const orderStopLabel = side => side === 'origin' ? '提货' : '送货';
export const canRequestOrderChange = order => ['ready', 'picked', 'transit'].includes(order?.status);
export function editableOrderStops(order) {
  if (order?.status === 'ready') return sides;
  return canRequestOrderChange(order) ? ['destination'] : [];
}

export function orderStopValues(order, side) {
  const { shipment, details = {} } = order;
  const { reference, notes } = stopSupplement(details, side);
  return {
    address: displayAddress(shipment[side]).trim(), addressType: addressTypeFor(shipment, side) ?? '',
    Company: details[side + 'Company'] ?? '', Unit: details[side + 'Unit'] ?? '',
    Contact: details[side + 'Contact'] ?? '', Phone: details[side + 'Phone'] ?? '',
    PhoneExtension: details[side + 'PhoneExtension'] ?? '', Email: details[side + 'Email'] ?? '', Reference: reference, Notes: notes
  };
}

export function planOrderChange(order, side, input) {
  if (!editableOrderStops(order).includes(side)) return { error: '这个运输节点已无法通过此入口修改。' };
  const current = orderStopValues(order, side);
  const changes = Object.keys(current).flatMap(key => {
    const after = input[key]?.trim();
    return after === undefined || after === current[key] ? [] : [{ key, before: current[key], after }];
  });
  if (!changes.length) return { error: '请先修改至少一项信息。' };
  const addressChange = changes.some(({ key }) => key === 'address' || key === 'addressType');
  const { address, addressType } = { ...current, ...input };
  if (addressChange && (!hasStreetAddress(address) || !Object.hasOwn(addressTypes, addressType))) {
    return { error: '请填写包含街道和五位 ZIP 的完整地址，并选择地址类型。' };
  }
  return { side, changes, addressChange };
}

function orderCargoSnapshot(items, legacyDescription = '') {
  return items.map(({ type, quantity, weight, length, width, height, ...item }, index) => {
    const commodities = itemCommodities(item, index === 0 ? legacyDescription : '').map(commodity => {
      const { description = '', declaredValue = '', nmfc = '', freightClass = '', regulated = [], pieceType = '', pieceCount = '', hazmat } = commodity;
      return {
        description, declaredValue, nmfc, freightClass, regulated: [...regulated].sort(), pieceType, pieceCount,
        ...(regulated.includes('hazmat') && hazmat ? { hazmat: Object.fromEntries(Object.entries(hazmat).sort()) } : {})
      };
    }).filter(commodity => Object.values(commodity).some(value => Array.isArray(value) ? value.length : value));
    return { type, quantity, weight, length, width, height, commodities };
  });
}

export function planOrderCargoChange(order, items) {
  if (!canRequestOrderChange(order)) return { error: '此运单已无法提交货物明细变更。' };
  const shipment = { ...order.shipment, items };
  if (!cargoReady(shipment) || !hazardDeclarationsReady(shipment)) return { error: '请检查货物件数、重量、尺寸和危险品申报。' };
  const beforeItems = orderCargoSnapshot(order.shipment.items, order.details?.commodity);
  const afterItems = orderCargoSnapshot(items, order.details?.commodity);
  if (JSON.stringify(beforeItems) === JSON.stringify(afterItems)) return { error: '请先修改至少一项货物信息。' };
  return { side: 'cargo', beforeItems, afterItems };
}

export function planOrderCancellation(order, reason) {
  if (!canRequestOrderChange(order)) return { error: '此运单已无法申请取消。' };
  return { side: 'cancel', status: order.status, reason: reason.trim() };
}

export function submitOrderChange(orderId, plan) {
  const state = currentState();
  const order = state.orders.find(entry => entry.id === orderId);
  const { side, changes } = plan;
  const current = side === 'cargo' ? planOrderCargoChange(order, plan.afterItems)
    : side === 'cancel' ? planOrderCancellation(order, plan.reason)
    : planOrderChange(order, side, Object.fromEntries(changes.map(({ key, after }) => [key, after])));
  if (current.error || JSON.stringify(current) !== JSON.stringify(plan)) {
    return { error: '订单信息已更新，请关闭后重新打开核对。' };
  }
  const submittedFields = new Set(changes?.map(({ key }) => key));
  const overlappingRequest = state.tickets.some(ticket => ticket.orderId === orderId && ticket.status !== 'closed'
    && ticket.orderChange?.side === side && (!changes || ticket.orderChange.changes?.some(({ key }) => submittedFields.has(key))));
  if (overlappingRequest) {
    const subject = side === 'cancel' ? '此运单已有待审核的取消申请。' : side === 'cargo' ? '货物明细已有待审核的变更申请。' : '这些字段已有待审核的变更申请。';
    return { error: `${subject}请从运单总览查看申请，或撤回后重新提交。` };
  }
  const [subject, description] = side === 'cargo' ? ['货物明细变更申请', '请审核货物明细变更，并确认费用及运输安排。']
    : side === 'cancel' ? ['取消订单申请', '请审核是否可以取消此运单，并确认相关费用和退款安排。']
    : [`${orderStopLabel(side)}${current.addressChange ? '地址' : '交接信息'}变更申请`, current.addressChange
      ? '请审核地址变更，并确认费用和送达时效。' : '请审核并更新此运单的交接信息。'];
  const ticket = createTicket({ orderId, category: 'order-change', subject, description, orderChange: current });
  return ticket ? { ticket } : { error: '变更申请提交失败，请重新核对后再试。' };
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
