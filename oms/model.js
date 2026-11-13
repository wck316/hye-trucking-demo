export const serviceOptions = {
  origin: [
    { id: 'liftgate', label: '尾板', fee: 6500 },
    { id: 'inside', label: '室内提货', fee: 8500 },
    { id: 'limited', label: '限制进入', fee: 6000 },
    { id: 'cfs', label: '集装箱货运站', fee: 7000 },
    { id: 'tradeshow', label: '展会', fee: 9000 }
  ],
  destination: [
    { id: 'liftgate', label: '尾板', fee: 6500 },
    { id: 'inside', label: '室内送货', fee: 8500 },
    { id: 'limited', label: '限制进入', fee: 6000 },
    { id: 'appointment', label: '预约送货', fee: 4500 },
    { id: 'notify', label: '到货前通知', fee: 2000 },
    { id: 'amazon', label: '亚马逊预约', fee: 6500 }
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
export const billStatuses = { pending: '待出账', due: '待支付', paid: '已支付' };
export const ticketStatuses = { pending: '待处理', processing: '处理中', closed: '已关闭' };
export const ticketCategories = {
  tracking: '运输跟踪', stops: '提送货问题', billing: '账单费用', documents: '文件与回单', damage: '货损理赔', other: '其他'
};
export const orderDocuments = { bol: ['BOL', '提单'], label: ['Label', '货运标签'], invoice: ['Invoice', '账单'] };
export const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export const postalCode = value => value.match(/\b(\d{5})(?:-\d{4})?(?:,\s*(?:US|USA))?\s*$/i)?.[1] ?? '';
export const displayAddress = address => address.replace(/^.*? · /, '');
export const hasStreetAddress = address => Boolean(postalCode(address) && !/^\d{5}(?:-\d{4})?(?:,\s*(?:US|USA))?$/i.test(displayAddress(address)));
export const shortAddress = address => {
  const text = displayAddress(address);
  return text.match(/(?:^|, )([^,]+, [A-Za-z]{2} \d{5}(?:-\d{4})?)$/)?.[1] ?? text;
};
export const addressValue = address => address.label + ' · ' + address.street + ', ' + address.city + ', ' + address.region + ' ' + address.zip;
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
    origin: '', destination: '', pickupDate: dateInZone(), pickupTime: '09:00',
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
  'ftl-economy': { name: '整车承运渠道 A' },
  'ftl-standard': { name: '整车承运渠道 B' },
  'ftl-express': { name: '整车承运渠道 C' }
};
const sides = ['origin', 'destination'];

export function cargoReady(shipment) {
  return shipment.items.length > 0 && shipment.items.every(item => Object.hasOwn(packaging, item.type)
    && Number.isInteger(item.quantity) && item.quantity > 0
    && ['weight', 'length', 'width', 'height'].every(key => Number.isFinite(item[key]) && item[key] > 0));
}

export function pricingReady(shipment) {
  const equipmentReady = shipmentMode(shipment) === 'ltl' || (Object.hasOwn(equipmentTypes, shipment.equipment)
    && Number.isSafeInteger(shipment.vehicleCount) && shipment.vehicleCount > 0 && shipment.pickupDate);
  return equipmentReady && sides.every(side => postalCode(shipment[side]) && Object.hasOwn(addressTypes, addressTypeFor(shipment, side))) && cargoReady(shipment);
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
  return [
    { id: 'economy', name: '经济方案', businessDays: ftl ? [3, 5] : [5, 7], factor: 1 },
    { id: 'standard', name: '标准方案', businessDays: [3, 4], factor: 1.19 },
    { id: 'express', name: '加急方案', businessDays: ftl ? [2, 3] : [1, 2], factor: 1.43 }
  ].map(({ factor, ...rate }, index) => {
    const serviceId = ftl ? `ftl-${rate.id}` : rate.id;
    const freight = Math.round(base * factor * 100);
    return {
      ...rate, id: serviceId, carrierId: serviceId, days: rate.businessDays.join('–') + ' 个工作日',
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

export function createTicket({ subject, category, orderId, description }) {
  const state = currentState();
  if (!subject || !description || !Object.hasOwn(ticketCategories, category)) return;
  if (orderId && !state.orders.some(order => order.id === orderId)) return;
  const at = Date.now();
  const ticket = {
    id: idFor('TK-'), subject, category, orderId, status: 'pending', createdAt: at, updatedAt: at,
    messages: [{ by: 'customer', text: description, at }]
  };
  persist({ ...state, tickets: [ticket, ...state.tickets] });
  return ticket;
}

export function updateTicket(id, reply = '') {
  const state = currentState();
  const ticket = state.tickets.find(ticket => ticket.id === id);
  if (!ticket || ticket.status === 'closed') return;
  const at = Date.now();
  const entry = reply ? { by: 'customer', text: reply, at } : { by: 'system', text: '工单已关闭', at };
  const updated = { ...ticket, status: reply ? ticket.status : 'closed', updatedAt: at, messages: [...ticket.messages, entry] };
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

export function saveQuote(shipment, previousId) {
  const state = currentState();
  const booked = state.orders.some(order => order.quoteId === previousId);
  const previous = booked ? null : state.quotes.find(entry => entry.id === previousId);
  return storeQuote(state, priceQuote({ ...previous, id: previous?.id ?? idFor('QT-'), stage: 'compare' }, shipment));
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
