import { addressValue, dateInZone, emptyItem, postalCode, serviceOptions, unitSettings } from './model.js?v=campaigns';

const sides = ['origin', 'destination'];
const number = '(\\d+(?:[,.]\\d+)*)';
const packagingPatterns = { pallet: '托盘|栈板|pallets?', crate: '木箱|crates?', carton: '纸箱|箱|cartons?|boxes|box' };
const packageNames = Object.values(packagingPatterns).join('|');
const wordQuantities = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const quantityPattern = new RegExp(`(^|[^A-Za-z0-9.])([1-9]\\d{0,3}|${Object.keys(wordQuantities).join('|')})\\s*(?:个|件|块)?\\s*(${packageNames})(?![a-z])`, 'gi');
const servicePatterns = {
  liftgate: /尾板|lift\s*gate/i, inside: /室内|inside\s+(?:pickup|delivery)/i,
  limited: /限制进入|limited\s+access/i, cfs: /集装箱货运站|\bCFS\b/i, tradeshow: /展会|trade\s*show/i,
  appointment: /预约送货|送货.{0,6}预约|delivery appointment|appointment delivery/i,
  notify: /到货前通知|提前通知|notify before arrival|call before delivery/i,
  amazon: /亚马逊预约|amazon\s+appointment/i
};
const equipmentPatterns = {
  van: /53\s*(?:ft|英尺|['’])|干柜|dry\s*van/i, box: /26\s*(?:ft|英尺|['’])|厢式货车|box\s*truck/i,
  flatbed: /平板车|flat\s*bed/i, sprinter: /sprinter|高顶(?:货运)?面包车/i
};
const stopMarker = /(提货(?:地址|地点)?|起运(?:地)?|发货(?:地址|地)?|送货(?:地址|地点)?|收货(?:地址|地)?|目的地|\bpick\s*up(?:\s+(?:address|from|at))?|\borigin|\bdeliver(?:y)?(?:\s+(?:address|to|at))?|\bdestination)\s*[:：=]?\s*/gi;
const isOrigin = /提货|起运|发货|pick\s*up|origin/i;
const negation = /不需要|不需|无需|不用|不要|\bno\b|\bwithout\b/i;
const stopScope = '(提货|送货|发货|收货|起运|目的地|pick\\s*up|delivery|origin|destination|shipper|consignee)';
const detailPatterns = {
  Contact: '现场联系人|联系人|联系人员|contact(?: name)?',
  Phone: '联系电话|现场电话|电话号码|手机号|电话|手机|phone(?: number)?|tel',
  Email: '联系邮箱|电子邮箱|邮箱|邮件地址|e-?mail',
  Reference: '提货码|提货号|送货码|预约号|参考单号|参考号|pickup code|pickup number|delivery code|reference(?: number| no\\.?)?',
  Notes: '备注|交接说明|notes?|instructions'
};
const detailLabels = Object.entries(detailPatterns).map(([field, pattern]) => `(?<${field}>${pattern})`).join('|');
const detailMarker = new RegExp(`(?:${stopScope}\\s*)?(${detailLabels})(?:\\s*[:：=]\\s*|\\s+|(?=[\\p{Script=Han}+0-9]))`, 'giu');
const sideFor = scope => /提货|发货|起运|pick\s*up|origin|shipper/i.test(scope) ? 'origin' : 'destination';

function parseStopDetails(text) {
  const details = {};
  let side;
  let unassigned = false;
  const quoteText = text.split(/([\n；;。])/).map(segment => {
    const header = segment.match(new RegExp(`^\\s*${stopScope}(?:(?:地址|地点|信息|\\s+address|\\s+information)\\s*|\\s*[:：]|\\s*$)`, 'i'));
    const headerScope = header?.[1];
    if (headerScope) side = sideFor(headerScope);
    const markers = [...segment.matchAll(detailMarker)];
    if (!markers.length) return segment;
    for (const [index, match] of markers.entries()) {
      const field = Object.keys(detailPatterns).find(key => match.groups[key]);
      const label = match.groups[field];
      const explicit = match[1] || (/^(?:提货|送货|pickup|delivery)/i.test(label) ? label : '');
      if (explicit) side = sideFor(explicit);
      const value = segment.slice(match.index + match[0].length, markers[index + 1]?.index).trim().replace(/[，,、]+$/, '').trim();
      if (!value) continue;
      if (!side) { unassigned = true; continue; }
      const key = side + field;
      if (field === 'Email') {
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 100) details[key] = value;
      } else if (field === 'Phone') {
        const phone = value.match(/^(\+?[\d(][\d().\s-]*?)(?:\s*(?:分机号?|转|ext\.?|x|#)\s*(\d{1,12}))?$/i);
        if (!phone || phone[1].replace(/\D/g, '').length < 7 || phone[1].trim().length > 40) continue;
        details[key] = phone[1].trim();
        details[side + 'PhoneExtension'] = phone[2] ?? '';
      } else {
        const limit = { Contact: 70, Reference: 80, Notes: 1000 }[field];
        if (value.length <= limit) details[key] = value;
      }
    }
    return segment.slice(0, markers[0].index).trimEnd();
  }).join('');
  return { quoteText, details, unassigned };
}

function pickupDate(text, today) {
  const relative = text.match(/今天|明天|后天|\b(?:today|tomorrow|day after tomorrow)\b/i)?.[0]?.toLowerCase();
  if (relative) {
    const days = { 今天: 0, 明天: 1, 后天: 2, today: 0, tomorrow: 1, 'day after tomorrow': 2 }[relative];
    const date = new Date(today + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
  const full = text.match(/\b(20\d{2})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})(?:日|号)?\b/u);
  const short = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*(?:日|号)/u);
  if (!full && !short) return '';
  const [, year, month, day] = full ?? [null, today.slice(0, 4), short[1], short[2]];
  const value = [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= today ? value : '';
}

function splitStops(text) {
  const paired = text.match(/(?:从\s*|\bfrom\s+)([^\n；;]+?)\s*(?:送到|运到|运往|送往|发往|到|至|\bto\b|→|->)\s*([^\n；;]+)/i)
    ?? text.match(/([^\n；;]+?)\s*(?:→|->)\s*([^\n；;]+)/);
  const stops = paired ? { origin: paired[1], destination: paired[2] } : {};
  for (const line of text.split(/[\n；;。]/)) {
    const markers = [...line.matchAll(stopMarker)];
    for (const [index, match] of markers.entries()) {
      const value = line.slice(match.index + match[0].length, markers[index + 1]?.index).trim();
      if (!value || /^(?:日期|时间|服务|需要|用|预约|前通知|date|time|service|appointment|notification)/i.test(value)) continue;
      const side = isOrigin.test(match[0]) ? 'origin' : 'destination';
      if (!stops[side]) stops[side] = value;
    }
  }
  return stops;
}

function stopAddress(segment, addresses) {
  const value = segment.trim().replace(/^[：:\s]+/, '');
  const zip = [...value.matchAll(/\b\d{5}(?:-\d{4})?\b/g)].at(-1);
  if (zip) {
    const throughZip = value.slice(0, zip.index + zip[0].length)
      .replace(/^(?:今天|明天|后天)\s*/, '')
      .replace(/^(?:提货(?:地址)?|送货(?:地址)?|起运地|目的地)\s*[:：]?\s*/, '').trim();
    return throughZip;
  }
  const name = value.split(/[,，(（。]/)[0].trim().toLowerCase();
  const saved = addresses.find(address => name === address.label.toLowerCase() || name === address.street.toLowerCase());
  return saved ? addressValue(saved) : '';
}

function addressType(text) {
  if (/无(?:卸货|装卸)?(?:平台|月台)|没有(?:卸货|装卸)?(?:平台|月台)|no\s+(?:(?:loading|unloading)\s+)?dock|without\s+(?:a\s+)?dock/i.test(text)) return 'commercial-no-dock';
  if (/住宅|居民区|residential/i.test(text)) return 'residential';
  if (/卸货平台|装卸平台|月台|有平台|(?:loading|unloading)\s+dock|with\s+(?:a\s+)?dock/i.test(text)) return 'commercial-dock';
  return '';
}

function toNumber(value) {
  return Number(value?.replace(/,/g, ''));
}

function cargoGroups(text) {
  const matches = [...text.matchAll(quantityPattern)];
  return matches.flatMap((match, index) => {
    const quantity = wordQuantities[match[2].toLowerCase()] ?? Number(match[2]);
    if (quantity > 1000) return [];
    const next = matches[index + 1]?.index ?? text.length;
    const data = text.slice(match.index + match[0].length, next);
    const item = {
      quantity,
      type: Object.keys(packagingPatterns).find(type => new RegExp(`^(?:${packagingPatterns[type]})$`, 'i').test(match[3]))
    };
    const weight = data.match(new RegExp(`(?:(总重(?:量)?|合计|total(?:\\s+weight)?)[：:\\s]*)?${number}\\s*(kg|kgs|公斤|千克|磅|lbs?|pounds?)(?![a-z])`, 'i'));
    if (weight) {
      const divisor = /kg|公斤|千克/i.test(weight[3]) ? unitSettings.metric.weightFactor : 1;
      const perItem = toNumber(weight[2]) / divisor / (weight[1] ? quantity : 1);
      const weightClause = data.slice(Math.max(0, weight.index - 24), weight.index + weight[0].length + 24).split(/[;；。\n]/)[0];
      const specified = quantity === 1 || weight[1] || /每|单件|\beach\b|\bper\b/i.test(weightClause);
      if (specified && perItem > 0 && perItem <= 80000) item.weight = perItem;
    }
    const dims = data.match(new RegExp(`${number}\\s*[x×*]\\s*${number}\\s*[x×*]\\s*${number}\\s*(cm|厘米|inches|inch|in|英寸)`, 'i'));
    if (dims) {
      const divisor = /cm|厘米/i.test(dims[4]) ? unitSettings.metric.lengthFactor : 1;
      const dimensions = dims.slice(1, 4).map(value => toNumber(value) / divisor);
      if (dimensions.every(value => value > 0 && value <= 900)) [item.length, item.width, item.height] = dimensions;
    }
    return [item];
  });
}

export function analyzeQuoteText(text, { mode, addresses, today = dateInZone() }) {
  const { quoteText: clean, details, unassigned } = parseStopDetails(text.normalize('NFKC'));
  const parts = splitStops(clean);
  const result = { fields: {}, types: {}, services: {}, items: cargoGroups(clean), details, unassigned };

  for (const side of sides) {
    const segment = parts[side] ?? '';
    const address = stopAddress(segment, addresses);
    if (postalCode(address)) result.fields[side] = address;
    const saved = addresses.find(entry => addressValue(entry).toLowerCase() === address.toLowerCase());
    const type = addressType(segment) || saved?.type;
    if (type) result.types[side] = type;
    const stopClauses = segment.split(/[，,；;。\n]/).filter(clause => !negation.test(clause));
    const services = serviceOptions[side].filter(service => {
      const pattern = servicePatterns[service.id];
      if (stopClauses.some(clause => pattern.test(clause))) return true;
      return side === 'destination' && ['appointment', 'notify', 'amazon'].includes(service.id)
        && clean.split(/[，,；;。\n]/).some(clause => !negation.test(clause)
          && !(service.id === 'appointment' && /亚马逊|amazon/i.test(clause)) && pattern.test(clause));
    });
    if (services.length) result.services[side] = services.map(service => service.id);
  }

  const dateText = clean.split(/[，,；;。\n]/).filter(clause => !/送货日期|到货日期|delivery\s+date|送达/i.test(clause));
  const pickupClauses = dateText.filter(clause => /提货|\bpick\s*up\b/i.test(clause));
  const date = pickupDate(pickupClauses.join(' '), today) || pickupDate(dateText.join(' '), today);
  if (date) result.fields.pickupDate = date;
  if (mode === 'ftl') {
    const equipment = Object.keys(equipmentPatterns).find(type => equipmentPatterns[type].test(clean));
    const count = clean.match(/([1-9]\d*)\s*辆|\b([1-9]\d*)\s+(?:trucks?|vehicles?|trailers?)\b/i);
    if (equipment) result.fields.equipment = equipment;
    if (count && Number.isSafeInteger(Number(count[1] ?? count[2]))) result.fields.vehicleCount = Number(count[1] ?? count[2]);
  }
  return result;
}

export function applyQuoteText(shipment, result) {
  const next = { ...shipment, ...result.fields, addressTypes: { ...shipment.addressTypes }, services: { ...shipment.services } };
  for (const side of sides) {
    if (result.types[side]) next.addressTypes[side] = result.types[side];
    else if (result.fields[side] && result.fields[side] !== shipment[side]) next.addressTypes[side] = '';
    if (result.services[side]) next.services[side] = [...new Set([...shipment.services[side], ...result.services[side]])];
  }
  if (result.items.length) {
    const items = result.items.map((item, index) => {
      const prior = shipment.items[index];
      const sameGroup = prior?.type === item.type && prior.quantity === item.quantity;
      return { ...emptyItem(), ...(sameGroup ? prior : {}), ...item };
    });
    next.items = [...items, ...shipment.items.slice(items.length)];
  }
  return next;
}
