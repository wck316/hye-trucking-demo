import {
  billStatuses, carrierProfiles, displayAddress, invoiceId, itemCommodities, money, orderDocuments,
  packaging, selectedServices, stopSupplement, totals
} from './model.js?v=tickets';
import { e } from './views.js?v=tickets';

function stop(order, side, title, includeContact = true) {
  const details = order.details ?? {};
  const { reference, notes } = stopSupplement(details, side);
  const company = details[side + 'Company'];
  const phone = [details[side + 'Phone'], details[side + 'PhoneExtension'] && 'ext. ' + details[side + 'PhoneExtension']].filter(Boolean).join(' ');
  const contact = [details[side + 'Contact'], phone].filter(Boolean).join(' · ');
  const address = [displayAddress(order.shipment[side]), details[side + 'Unit']].filter(Boolean).join(' · ');
  return `<section><h2>${title}</h2>${company ? `<strong>${e(company)}</strong>` : ''}<p>${e(address)}</p>
    ${includeContact && contact ? `<p>${e(contact)}</p>` : ''}${reference ? `<p>Ref. ${e(reference)}</p>` : ''}
    ${includeContact && notes ? `<p class="muted">${e(notes)}</p>` : ''}</section>`;
}

function bol(order) {
  const items = order.shipment.items.map((item, index) => {
    const commodities = itemCommodities(item, index === 0 ? order.details?.commodity : '');
    const names = commodities.map(commodity => [commodity.description, commodity.nmfc && 'NMFC ' + commodity.nmfc,
      commodity.freightClass && 'Class ' + commodity.freightClass,
      commodity.regulated.includes('hazmat') && commodity.hazmat?.hazardId].filter(Boolean).join(' · ')).filter(Boolean);
    return `<tr><td>${e(item.quantity)}</td><td>${e(packaging[item.type])}${names.map(name => `<small>${e(name)}</small>`).join('')}</td>
      <td>${e([item.length, item.width, item.height].join(' × '))} in</td><td>${e(item.weight)} lb</td></tr>`;
  }).join('');
  const services = ['origin', 'destination'].flatMap(side => selectedServices(order.shipment, side)
    .map(service => (side === 'origin' ? '提货 ' : '送货 ') + service.label));
  return `<div class="stops">${stop(order, 'origin', '提货 · Shipper')}${stop(order, 'destination', '送货 · Consignee')}</div>
    <section><h2>货物明细</h2><table><thead><tr><th>件数</th><th>包装及货品</th><th>单件尺寸</th><th>单件重量</th></tr></thead><tbody>${items}</tbody></table>
    <p>总重 ${e(totals(order.shipment).weight)} lb</p>${services.length ? `<p>附加服务 ${e(services.join('、'))}</p>` : ''}</section>`;
}

function label(order) {
  return `${stop(order, 'destination', '送货 · Ship to', false)}${stop(order, 'origin', '提货 · Ship from', false)}
    <section><h2>装运件数</h2><p>${e(totals(order.shipment).quantity)} 件</p></section>`;
}

function invoice(order) {
  const rows = [['运输费用', money(order.rate.freight)], ['附加服务', money(order.rate.accessorial)], ['合计 (USD)', money(order.rate.total)]];
  return `<section><h2>${e(invoiceId(order))}</h2><p>出账日期 ${e(order.issued)} · ${e(billStatuses[order.billing])}</p></section>
    <section><h2>费用明细</h2><table class="invoice"><tbody>${rows.map(([name, value]) => `<tr><th scope="row">${name}</th><td>${value}</td></tr>`).join('')}</tbody></table></section>`;
}

const documentBodies = { bol, label, invoice };

export function orderDocument(order, kind) {
  if (!order || !Object.hasOwn(documentBodies, kind) || (kind === 'invoice' && !order.issued)) return null;
  const [name, description] = orderDocuments[kind];
  const title = `${name} · ${description}`;
  const carrier = carrierProfiles[order.rate.carrierId]?.name ?? '承运商未记录';
  return {
    name: `${kind === 'invoice' ? invoiceId(order) : `${name}-${order.id}`}.html`,
    html: `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · ${e(order.id)}</title>
    <style>
      @page { size: ${kind === 'label' ? '4in 6in' : 'letter'}; margin: ${kind === 'label' ? '.2in' : '14mm'}; }
      * { box-sizing: border-box; }
      body { margin: 20px auto; padding: 0 14px; max-width: ${kind === 'label' ? '4in' : '720px'}; font: 14px/1.45 Inter, system-ui, sans-serif; color: #142943; }
      h1, h2, p { margin: 0; overflow-wrap: anywhere; }
      h1 { font-size: 24px; }
      h2 { font-size: 14px; margin-bottom: 6px; }
      p + p { margin-top: 4px; }
      header { border-bottom: 2px solid #142943; padding-bottom: 11px; }
      .demo, .muted, small { color: #52657d; }
      .demo { font-size: 12px; }
      .muted { white-space: pre-wrap; }
      section { padding-top: 12px; margin-top: 10px; }
      .stops { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      th, td { padding: 6px; border-bottom: 1px solid #ccd7e5; text-align: left; overflow-wrap: anywhere; }
      small { display: block; }
      .invoice td { text-align: right; }
      .invoice tr:last-child { font-weight: 700; }
      button { margin-bottom: 14px; padding: 7px 11px; cursor: pointer; }
      @media (max-width: 480px) { .stops { grid-template-columns: 1fr; gap: 0; } }
      @media print { body { margin: 0; padding: 0; max-width: none; } button { display: none; } .stops { grid-template-columns: repeat(2, minmax(0,1fr)); } }
    </style></head><body><button type="button" onclick="window.print()">打印 / 存为 PDF</button>
    <header><p class="demo">HYE OMS · 演示文件</p><h1>${title}</h1><p>${e(order.id)} · ${e(carrier)}</p></header>
    ${documentBodies[kind](order)}</body></html>`
  };
}
