import {
  currentState, emptyShipment, exampleShipment, emptyItem, saveQuote, bookOrder, saveProfile,
  saveAddress, removeAddress, postalCode, addressValue, displayAddress, unitSettings, invoiceId, billStatuses,
  displayMeasurement, updateQuote, refreshQuote, chooseRate, quoteStatus, pricingReady, detailsReady, hasStreetAddress,
  addressTypes, shortAddress, stopDetailsReady, cargoReady, emptyCommodity, hazardDeclarationsReady, stopHoursReady,
  shipmentMode, quoteEntry, quoteModes, saveCustomRequest, addressContactFields, createDemoApiKey, revokeDemoApiKey,
  ticketCategories, createTicket, updateTicket
} from './model.js?v=tickets';
import {
  quoteView, ratesView, ordersView, billingView, accountView, orderRows, billRows,
  addressRows, addressForm, icon, e, detailsView, quoteSummary, confirmationView, carrierQuotes, workflowHeader,
  cargoEditor, cargoTotalsText, cargoItemMetrics, serviceSelectionText, compareRates, orderDetail, customQuoteView,
  apiKeyForm, apiKeyResult, ticketRows, ticketDetail, ticketsView, ticketForm
} from './views.js?v=tickets';
import { renderRouteMap } from './route-map.js?v=rate-comparison';
import { orderDocument } from './order-documents.js?v=tickets';

const workspace = document.querySelector('#workspace');
const breadcrumb = document.querySelector('#breadcrumb');
const toolbarAction = document.querySelector('#workflow-action');
const dialog = document.querySelector('#dialog');
const toast = document.querySelector('#toast');
const menuButton = document.querySelector('#menu-button');
const shade = document.querySelector('#nav-shade');
const labels = { quote: '快速查价', rates: '报价比较', details: '完善并下单', custom: '定制询价', orders: '订单管理', tickets: '工单管理', billing: '账单管理', account: '账号管理' };
const filters = { orders: { query: '', status: '' }, tickets: { query: '', status: '' }, billing: { query: '', status: '' } };
const rateFiltersByQuote = new Map();
const stopSides = ['origin', 'destination'];
const stopFields = ['Company', 'Unit', 'Contact', 'Email', 'Phone', 'PhoneExtension', 'Reference', 'Notes', 'OpensAt', 'ClosesAt'];
const detailFields = [...stopSides.flatMap(side => stopFields.map(field => side + field)), 'pickupEnd'];

let draft = emptyShipment();
let draftId = '';
const quickDrafts = new Map();
let units = currentState().profile.units;
let toastTimer;
let activeOrderId;
let activeOrderTab = 'overview';
let activeTicketId;
let activeAccountTab = 'profile';
const currentRoute = () => location.hash.slice(1).split('/');
const navigate = destination => { location.hash = destination; };
const findQuote = id => currentState().quotes.find(entry => entry.id === id);

function filteredOrders(orders, kind, status = filters[kind].status) {
  const term = filters[kind].query.trim().toLowerCase();
  const isBilling = kind === 'billing';
  return orders.filter(order => {
    if (status && (isBilling ? order.billing : order.status) !== status) return false;
    const fields = isBilling
      ? [invoiceId(order), order.id]
      : [order.id, order.reference, order.details?.originReference, order.details?.destinationReference, order.shipment.origin, order.shipment.destination];
    return fields.some(field => field?.toLowerCase().includes(term));
  });
}

function orderFilterResults(orders) {
  const searched = filteredOrders(orders, 'orders', '');
  const counts = { '': searched.length };
  for (const order of searched) counts[order.status] = (counts[order.status] ?? 0) + 1;
  const { status } = filters.orders;
  return { matches: status ? searched.filter(order => order.status === status) : searched, counts };
}

function renderOrders(orders, requested) {
  let { matches, counts } = orderFilterResults(orders);
  if (requested && !matches.includes(requested)) {
    filters.orders = { query: '', status: '' };
    ({ matches, counts } = orderFilterResults(orders));
  }
  const selected = requested ?? matches[0];
  activeOrderId = selected?.id;
  return ordersView(matches, filters.orders, selected, orders.length, activeOrderTab, counts);
}

function updateOrderFilter(orders) {
  const { matches, counts } = orderFilterResults(orders);
  workspace.querySelectorAll('[data-order-status]').forEach(button => {
    const value = button.dataset.orderStatus;
    button.setAttribute('aria-pressed', filters.orders.status === value);
    button.querySelector('.order-status-count').textContent = counts[value] ?? 0;
  });
  const selected = matches.find(order => order.id === activeOrderId) ?? matches[0];
  workspace.querySelector('#listing-rows').innerHTML = orderRows(matches, selected?.id);
  if (selected?.id === activeOrderId) return;
  activeOrderId = selected?.id;
  const detail = workspace.querySelector('#order-detail');
  detail.innerHTML = orderDetail(selected, activeOrderTab, orders.length ? '没有符合条件的运单' : '暂无运单');
  detail.scrollTop = 0;
  if (currentRoute()[1]) history.replaceState(null, '', selected ? `#orders/${selected.id}` : '#orders');
}

function ticketFilterResults(tickets) {
  const { query, status } = filters.tickets;
  const term = query.trim().toLowerCase();
  const searched = tickets.filter(ticket => [ticket.id, ticket.subject, ticket.orderId, ticketCategories[ticket.category]]
    .some(value => value?.toLowerCase().includes(term))).sort((a, b) => b.updatedAt - a.updatedAt);
  const counts = { '': searched.length };
  for (const ticket of searched) counts[ticket.status] = (counts[ticket.status] ?? 0) + 1;
  return { matches: status ? searched.filter(ticket => ticket.status === status) : searched, counts };
}

const linkedOrder = (orders, ticket) => orders.find(order => order.id === ticket?.orderId);
const ticketEmptyMessage = tickets => tickets.length ? '没有符合条件的工单' : '暂无工单，可创建工单提交问题';

function renderTickets({ tickets, orders }, id) {
  const requested = tickets.find(ticket => ticket.id === id);
  let { matches, counts } = ticketFilterResults(tickets);
  if (requested && !matches.includes(requested)) {
    filters.tickets = { query: '', status: '' };
    ({ matches, counts } = ticketFilterResults(tickets));
  }
  const selected = requested ?? matches[0];
  activeTicketId = selected?.id;
  return ticketsView(matches, filters.tickets, selected, linkedOrder(orders, selected), counts, ticketEmptyMessage(tickets));
}

function updateTicketFilter({ tickets, orders }) {
  const { matches, counts } = ticketFilterResults(tickets);
  workspace.querySelectorAll('[data-ticket-status]').forEach(button => {
    const value = button.dataset.ticketStatus;
    button.setAttribute('aria-pressed', filters.tickets.status === value);
    button.querySelector('.order-status-count').textContent = counts[value] ?? 0;
  });
  const selected = matches.find(ticket => ticket.id === activeTicketId) ?? matches[0];
  workspace.querySelector('#ticket-rows').innerHTML = ticketRows(matches, selected?.id);
  if (selected?.id === activeTicketId) return;
  activeTicketId = selected?.id;
  const detail = workspace.querySelector('#ticket-detail');
  detail.innerHTML = ticketDetail(selected, linkedOrder(orders, selected), ticketEmptyMessage(tickets));
  detail.scrollTop = 0;
  if (currentRoute()[1]) history.replaceState(null, '', selected ? `#tickets/${selected.id}` : '#tickets');
}

function openTicket(id) {
  const route = `tickets/${id}`;
  if (location.hash === `#${route}`) render(true);
  else navigate(route);
}

function activateTab(container, name) {
  container.querySelectorAll('[data-tab]').forEach(tab => {
    const selected = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
  container.scrollTop = 0;
}

function renderSidebar(state, section) {
  document.querySelector('#sidebar-contact').textContent = state.profile.contact;
  document.querySelector('#sidebar-email').textContent = state.profile.email;
  const booked = new Set(state.orders.map(order => order.quoteId));
  document.querySelector('#recent-quotes').innerHTML = state.quotes.filter(quote => !booked.has(quote.id)).slice(0, 5).map(quote => {
    const details = quote.stage === 'details' && quote.selectedRateId;
    const state = quoteStatus(quote);
    const hint = ['stale', 'expired'].includes(state) ? ' · 需更新' : '';
    return `<li><a href="#${details ? 'details' : 'rates'}/${e(quote.id)}"><b>${postalCode(quote.shipment.origin) || '—'} → ${postalCode(quote.shipment.destination) || '—'}</b><small>${shipmentMode(quote.shipment).toUpperCase()} · ${details ? '待完善订单' : '待选报价'}${hint}</small>${icon('chev')}</a></li>`;
  }).join('') || '<li class="recent-empty">暂无未完成报价</li>';
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === section) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function updateAddressPreview(input) {
  const preview = document.getElementById(input.id + '-preview');
  const address = displayAddress(input.value.trim());
  preview.textContent = address;
  preview.hidden = !postalCode(address) || /^\d{5}(?:-\d{4})?$/.test(address);
}

function render(moveFocus = false, message = '') {
  const state = currentState();
  let [section, id] = currentRoute();
  const quote = state.quotes.find(quote => quote.id === id);
  const booked = state.orders.find(order => order.quoteId === id);
  const selectedOrder = state.orders.find(order => order.id === id);
  const mode = quote ? shipmentMode(quote.shipment) : section === 'ftl' ? 'ftl' : 'ltl';
  const customRequests = state.customRequests ?? [];

  if (section === 'book') section = 'rates';
  if (section === 'ftl') section = 'quote';
  if (!Object.hasOwn(labels, section) || (['rates', 'details'].includes(section) && !quote)) section = 'quote';
  if (section === 'details' && (!quote.selectedRateId || booked)) section = 'rates';
  if (section === 'quote' && (!workspace.querySelector('#quote-form') || draftId !== (quote?.id ?? '') || shipmentMode(draft) !== mode)) {
    draft = structuredClone(quote?.shipment ?? quickDrafts.get(mode) ?? emptyShipment(mode));
    draftId = quote?.id ?? '';
  }
  const navigationSection = ['quote', 'rates', 'details'].includes(section) ? quoteEntry({ mode }) : section;
  const header = workflowHeader(section, quote, booked, mode);
  document.body.classList.toggle('workflow-active', Boolean(header));
  if (header) breadcrumb.innerHTML = header.path;
  else breadcrumb.textContent = labels[section];
  toolbarAction.innerHTML = header?.action ?? '';
  toolbarAction.hidden = !header?.action;
  renderSidebar(state, navigationSection);

  const screens = {
    quote: () => quoteView(draft, units),
    rates: () => ratesView(quote, booked, message, units, rateFiltersByQuote.get(quote.id) ?? {}),
    details: () => detailsView(quote, state.addresses, units),
    custom: () => customQuoteView(state.profile, customRequests, customRequests.find(request => request.id === id)),
    orders: () => renderOrders(state.orders, selectedOrder),
    tickets: () => renderTickets(state, id),
    billing: () => billingView(filteredOrders(state.orders, 'billing'), filters.billing, selectedOrder, state.orders),
    account: () => accountView(state.profile, state.addresses, state.apiKeys ?? [], activeAccountTab)
  };
  workspace.innerHTML = screens[section]();
  workspace.querySelectorAll('#origin, #destination').forEach(updateAddressPreview);
  const routeMap = workspace.querySelector('[data-route-map]');
  if (routeMap) renderRouteMap(routeMap);
  if (!moveFocus) return;
  const detail = ['orders', 'tickets'].includes(section) && !id ? null : workspace.querySelector('#detail-title');
  const target = detail ?? workspace.querySelector('h1');
  target.focus({ preventScroll: true });
  if (detail && innerWidth <= 1080) detail.closest('.detail').scrollIntoView();
  else window.scrollTo(0, 0);
}

function readStops(fields, shipment, zipOnly) {
  const address = side => {
    const value = fields.get(side).trim();
    return zipOnly && value === postalCode(shipment[side]) ? shipment[side] : value;
  };
  return {
    origin: address('origin'), destination: address('destination'),
    addressTypes: { origin: fields.get('origin-type'), destination: fields.get('destination-type') },
    services: { origin: fields.getAll('origin-services'), destination: fields.getAll('destination-services') }
  };
}

function readCargo(form, previousItems) {
  const { weightFactor, lengthFactor } = unitSettings[units];
  return Array.from(form.querySelectorAll('[data-cargo-row]'), (row, index) => {
    const previous = previousItems[index] ?? emptyItem();
    const read = name => row.querySelector('[name="' + name + '"]').value;
    const measurement = (name, factor) => {
      const value = read(name);
      if (value === '') return '';
      // Keep the canonical value when the user has only changed the display unit.
      return Number(value) === displayMeasurement(previous[name], factor) ? previous[name] : Number(value) / factor;
    };
    const commodities = Array.from(row.querySelectorAll('[data-commodity]'), entry => {
      const value = name => entry.querySelector('[name="' + name + '"]').value.trim();
      const hazmat = Object.fromEntries(Array.from(entry.querySelectorAll('[data-hazmat] [name]'), input => [input.name, input.value.trim()]));
      return {
        description: value('commodity'), nmfc: value('nmfc'), freightClass: value('freightClass'),
        regulated: Array.from(entry.querySelectorAll('[name="regulated"]:checked'), input => input.value),
        pieceType: value('pieceType'), pieceCount: value('pieceCount'),
        ...(Object.values(hazmat).some(Boolean) ? { hazmat } : {})
      };
    });
    return {
      ...previous,
      type: read('type'), quantity: read('quantity') === '' ? '' : Number(read('quantity')),
      weight: measurement('weight', weightFactor), length: measurement('length', lengthFactor),
      width: measurement('width', lengthFactor), height: measurement('height', lengthFactor),
      ...(commodities.length ? { commodities } : {})
    };
  });
}

function readShipment() {
  const form = workspace.querySelector('#quote-form');
  if (!form) return draft;
  const fields = new FormData(form);
  const ftl = shipmentMode(draft) === 'ftl' ? { equipment: fields.get('equipment'), vehicleCount: Number(fields.get('vehicleCount')), pickupDate: fields.get('pickupDate') } : {};
  return { ...draft, ...readStops(fields, draft, true), ...ftl, items: readCargo(form, draft.items) };
}

function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3600);
}

function setMenu(open) {
  document.body.classList.toggle('nav-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  shade.hidden = !open;
  if (open) document.querySelector('#sidebar [data-nav][aria-current]')?.focus();
}

function showDialog(title, content, mode = '') {
  dialog.dataset.mode = mode;
  dialog.classList.toggle('wide-dialog', Boolean(mode));
  dialog.innerHTML = `<header class="panel-head ruled"><h2 id="dialog-title" class="panel-title" tabindex="-1">${title}</h2><button class="icon-button" type="button" data-action="close-dialog" aria-label="关闭弹窗">${icon('close')}</button></header><div class="detail-body">${content}</div>`;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  dialog.querySelector('#dialog-title').focus();
}

function downloadBill(order) {
  if (!order?.issued) return;
  const data = [
    ['账单号', '关联运单', '出账日期', '币种', '状态', '运输费用', '附加服务', '合计'],
    [invoiceId(order), order.id, order.issued, 'USD', billStatuses[order.billing],
      (order.rate.freight / 100).toFixed(2), (order.rate.accessorial / 100).toFixed(2), (order.rate.total / 100).toFixed(2)]
  ];
  const csv = data.map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = invoiceId(order) + '.csv';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('已准备账单明细');
}

function focusCargo(index) {
  workspace.querySelectorAll('[data-cargo-row]')[index]?.querySelector('[name="quantity"]')?.focus();
}

function saveDetails(form = workspace.querySelector('#details-form'), editItems) {
  if (!form) return null;
  const quote = findQuote(form.dataset.quote);
  if (!quote) return null;
  const fields = new FormData(form);
  const items = readCargo(form, quote.shipment.items);
  editItems?.(items);
  const shipment = {
    ...quote.shipment, ...readStops(fields, quote.shipment, false), items,
    pickupDate: fields.get('pickupDate'), pickupTime: fields.get('pickupTime')
  };
  delete shipment.timezone;
  const details = Object.fromEntries(detailFields.map(name => [name, fields.get(name).trim()]));
  return updateQuote(quote.id, { shipment, details, stage: 'details' });
}

function editCargo(editItems, nextUnits = units) {
  const form = workspace.querySelector('#details-form');
  if (form) {
    const quote = saveDetails(form, editItems);
    if (!quote) return [];
    units = nextUnits;
    form.querySelector('#cargo-editor').outerHTML = cargoEditor(quote, units);
    updateSummary(quote);
    return quote.shipment.items;
  }
  draft = readShipment();
  editItems?.(draft.items);
  units = nextUnits;
  render();
  return draft.items;
}

function updateCargoMetrics(shipment) {
  workspace.querySelector('#cargo-total').textContent = cargoTotalsText(shipment, units);
  workspace.querySelectorAll('[data-cargo-metrics]').forEach((entry, index) => {
    entry.textContent = cargoItemMetrics(shipment.items[index], units);
  });
}

function updateSummary(quote, message = '') {
  const summary = workspace.querySelector('#selected-quote-body');
  if (!summary) return;
  const feesOpen = summary.querySelector('.quote-fees')?.open;
  summary.innerHTML = quoteSummary(quote, message);
  const fees = summary.querySelector('.quote-fees');
  if (fees && feesOpen) fees.open = true;

  for (const side of stopSides) {
    const stop = workspace.querySelector('[data-stop="' + side + '"]');
    const complete = stopDetailsReady(quote, side);
    const status = stop.querySelector('[data-stop-status]');
    stop.querySelector('[data-stop-location]').textContent = shortAddress(quote.shipment[side]) || '待填地址';
    stop.querySelector('[data-service-preview]').textContent = serviceSelectionText(quote.shipment, side);
    status.textContent = complete ? '已填写' : '待填写';
    status.classList.toggle('paid', complete);
  }
}

function showConfirmation(quote, message = '') {
  showDialog('确认下单', confirmationView(quote, message), 'review');
}

function showCarrierChooser(quote, returnToReview) {
  const back = returnToReview
    ? `<button type="button" class="link" data-action="return-review" data-quote="${e(quote.id)}">返回核对订单</button>`
    : '';
  showDialog('更换承运商报价', `<p class="note">当前订单资料已保存。选用报价后即可继续。</p>${carrierQuotes(quote)}${back}`,
    returnToReview ? 'review-carriers' : 'carriers');
}

function explainIncompletePricing(quote) {
  const message = quote && !cargoReady(quote.shipment)
    ? '请先补齐货物的包装、件数、重量和尺寸，再更新报价。'
    : '请先补齐两端 ZIP 和地址类型，再更新报价。';
  const error = workspace.querySelector('#details-error');
  if (error) error.textContent = message;
  notify(message);
}

function updateRates(id) {
  const previous = saveDetails() ?? findQuote(id);
  const invalid = workspace.querySelector('#cargo-editor .cargo-row :invalid');
  if (invalid) { invalid.reportValidity(); return; }
  const quote = refreshQuote(id);
  if (!quote) { explainIncompletePricing(previous); return; }
  const message = quoteStatus(quote) === 'changed' ? '报价已更新，请确认新价格或换一家承运商。' : '已刷新承运商报价。';
  if (dialog.open && dialog.dataset.mode === 'review') showConfirmation(quote, message);
  if (workspace.querySelector('#selected-quote-body')) {
    updateSummary(quote, message);
    if (!dialog.open) workspace.querySelector('#selected-quote-body [data-action="refresh-rates"]').focus();
  } else {
    render(false, message);
    toolbarAction.querySelector('[data-action="refresh-rates"]')?.focus();
  }
}

const actions = {
  'fill-example'() {
    const mode = shipmentMode(draft);
    draft = exampleShipment(mode);
    render();
    toolbarAction.querySelector('[data-action="fill-example"]').focus();
    notify(`已填入${quoteModes[mode]}示例`);
  },
  'add-cargo'() {
    const items = editCargo(items => items.push(emptyItem()));
    focusCargo(items.length - 1);
  },
  'remove-cargo'({ index }) {
    const items = editCargo(items => { if (items.length > 1) items.splice(Number(index), 1); });
    focusCargo(Math.min(Number(index), items.length - 1));
  },
  'add-commodity'({ index }) {
    editCargo(items => items[index].commodities.push(emptyCommodity()));
    workspace.querySelectorAll('[data-cargo-row]')[index]?.querySelector('[data-commodity]:last-of-type [name="commodity"]')?.focus();
  },
  'remove-commodity'({ index, commodityIndex }) {
    editCargo(items => items[index].commodities.splice(Number(commodityIndex), 1));
    workspace.querySelectorAll('[data-cargo-row]')[index]?.querySelector('[data-action="add-commodity"]')?.focus();
  },
  units({ units: selection }) {
    if (units === selection) return;
    editCargo(undefined, selection);
    workspace.querySelector('[data-units="' + units + '"]').focus();
  },
  'fill-details-example'() {
    const form = workspace.querySelector('#details-form');
    const example = exampleShipment();
    for (const side of stopSides) {
      const field = form.elements[side];
      if (!hasStreetAddress(field.value) && (!field.value || postalCode(field.value) === postalCode(example[side]))) {
        field.value = example[side];
        updateAddressPreview(field);
      }
    }
    const values = {
      originCompany: 'West Coast Demo Warehouse', originContact: '演示提货联系人', originEmail: 'pickup@example.com', originPhone: '+1 213 555 0101',
      destinationCompany: 'Midwest Demo Receiving', destinationContact: '演示送货联系人', destinationEmail: 'delivery@example.com', destinationPhone: '+1 312 555 0102',
      originReference: 'PU-DEMO-001', originNotes: '从西侧入口进入，抵达后联系仓库。', originOpensAt: '08:00', originClosesAt: '18:00',
      destinationReference: 'DEL-DEMO-001', destinationNotes: '请到收货窗口登记。', destinationOpensAt: '09:00', destinationClosesAt: '17:00',
      pickupEnd: '17:00', commodity: '纸箱包装日用品'
    };
    for (const [name, value] of Object.entries(values)) {
      const field = form.querySelector('[name="' + name + '"]');
      if (!field.value) field.value = value;
    }
    const quote = saveDetails(form);
    if (quote) updateSummary(quote);
    notify('已补齐示例联系人和交接资料');
  },
  'refresh-rates'({ quote: id }) { updateRates(id); },
  'change-rate'({ quote: id }) {
    const previous = saveDetails() ?? findQuote(id);
    if (!previous) return;
    const invalid = workspace.querySelector('#cargo-editor .cargo-row :invalid');
    if (invalid) { invalid.reportValidity(); return; }
    const returnToReview = dialog.open && dialog.dataset.mode === 'review';
    const quote = ['stale', 'expired', 'unavailable'].includes(quoteStatus(previous)) ? refreshQuote(id) : previous;
    if (!quote) { explainIncompletePricing(previous); return; }
    updateSummary(quote);
    showCarrierChooser(quote, returnToReview);
  },
  'select-rate'({ quote: id, rate }) {
    const selected = chooseRate(id, rate);
    if (!selected) {
      const quote = findQuote(id);
      if (dialog.open && dialog.dataset.mode === 'review' && quote) showConfirmation(quote, '这条报价已失效，请更新报价。');
      else if (dialog.open) { dialog.close(); if (quote) updateSummary(quote, '这条报价已失效，请更新报价。'); }
      else if (workspace.querySelector('#selected-quote-body') && quote) updateSummary(quote, '这条报价已失效，请更新报价。');
      else render(false, '这条报价已失效，请更新报价。');
      return;
    }
    if (!workspace.querySelector('#details-form')) {
      navigate('details/' + id);
      return;
    }
    updateSummary(selected, '已选用报价，填写内容已保留。');
    if (dialog.open && ['review', 'review-carriers'].includes(dialog.dataset.mode)) {
      showConfirmation(selected, '已选用报价，订单资料已保留。');
    } else {
      if (dialog.open) dialog.close();
      workspace.querySelector('#selected-quote-body [data-action="refresh-rates"]').focus({ preventScroll: true });
    }
  },
  'return-review'({ quote: id }) {
    const quote = findQuote(id);
    if (quote) showConfirmation(quote);
  },
  'confirm-booking'({ quote: id }) {
    const order = bookOrder(id);
    if (!order) {
      const quote = findQuote(id);
      if (quote) showConfirmation(quote, '请确认报价有效并补齐订单资料。');
      return;
    }
    dialog.close();
    draft = emptyShipment();
    units = currentState().profile.units;
    notify('演示运单已生成 · ' + order.id);
    navigate('orders/' + order.id);
  },
  'choose-address'({ side }) {
    const title = side === 'origin' ? '选择提货地址' : '选择送货地址';
    showDialog(title, '<ul class="address-book">' + addressRows(currentState().addresses, 'pick', side) + '</ul>');
  },
  'apply-address'({ id, side }) {
    const address = currentState().addresses.find(address => address.id === id);
    const input = workspace.querySelector('#' + side);
    if (!address || !input) return;
    const quick = input.form.id === 'quote-form';
    input.value = quick ? address.zip : addressValue(address);
    if (quick) draft[side] = addressValue(address);
    input.form.elements[side + '-type'].value = Object.hasOwn(addressTypes, address.type) ? address.type : '';
    updateAddressPreview(input);
    if (!quick) {
      for (const [key, field] of Object.entries(addressContactFields)) {
        if (address[key]) input.form.elements[side + field].value = address[key];
      }
      const quote = saveDetails();
      if (quote) updateSummary(quote);
    }
    dialog.close();
    input.focus();
    workspace.querySelector(quick ? '#quote-error' : '#details-error').textContent = '';
  },
  'new-address'() { showDialog('添加地址', addressForm()); },
  'edit-address'({ id }) {
    const address = currentState().addresses.find(entry => entry.id === id);
    if (address) showDialog('编辑地址', addressForm(address));
  },
  'delete-address'({ id }) {
    const address = currentState().addresses.find(address => address.id === id);
    if (!address) return;
    showDialog('删除地址', `<p>从地址簿删除「${e(address.label)}」？</p><div class="actions end"><button class="btn" type="button" data-action="close-dialog">取消</button><button class="btn primary" type="button" data-action="confirm-delete" data-id="${e(id)}">删除地址</button></div>`);
  },
  'confirm-delete'({ id }) {
    removeAddress(id);
    dialog.close();
    render();
    workspace.querySelector('[data-action="new-address"]').focus();
    notify('地址已删除');
  },
  'download-bill'({ order: id }) {
    downloadBill(currentState().orders.find(order => order.id === id));
  },
  'order-tab'({ tab }) {
    activeOrderTab = tab;
    activateTab(workspace.querySelector('#order-detail'), tab);
  },
  'account-tab'({ tab }) {
    activeAccountTab = tab;
    activateTab(workspace.querySelector('.account-panel'), tab);
  },
  'new-api-key'() { showDialog('创建演示 API 密钥', apiKeyForm()); },
  async 'copy-api-key'() {
    const input = dialog.querySelector('#api-key-value');
    const status = dialog.querySelector('#api-key-copy-status');
    if (!input || !status) return;
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = '密钥已复制';
    } catch {
      input.select();
      status.textContent = '已选中密钥，可手动复制';
    }
  },
  'revoke-api-key'({ id }) {
    const key = currentState().apiKeys?.find(entry => entry.id === id && !entry.revokedOn);
    if (key) showDialog('停用密钥', `<p>停用「${e(key.name)}」？</p><div class="actions end"><button class="btn" type="button" data-action="close-dialog">取消</button><button class="btn primary" type="button" data-action="confirm-revoke-api-key" data-id="${e(id)}">确认停用</button></div>`);
  },
  'confirm-revoke-api-key'({ id }) {
    if (!revokeDemoApiKey(id)) return;
    dialog.close();
    render();
    workspace.querySelector('[data-action="new-api-key"]')?.focus();
    notify('密钥已停用');
  },
  'order-status-filter'({ orderStatus }) {
    filters.orders.status = orderStatus;
    updateOrderFilter(currentState().orders);
  },
  'ticket-status-filter'({ ticketStatus }) {
    filters.tickets.status = ticketStatus;
    updateTicketFilter(currentState());
  },
  'new-ticket'({ order: id }) {
    const { orders } = currentState();
    const order = orders.find(order => order.id === id);
    showDialog('创建工单', ticketForm(orders, order));
  },
  'close-ticket'({ id }) {
    showDialog('关闭工单', `<p>关闭后将结束这条工单的沟通。确认关闭吗？</p><div class="actions end"><button class="btn" type="button" data-action="close-dialog">取消</button><button class="btn primary" type="button" data-action="confirm-close-ticket" data-id="${e(id)}">确认关闭</button></div>`);
  },
  'confirm-close-ticket'({ id }) {
    const ticket = updateTicket(id);
    dialog.close();
    openTicket(id);
    if (ticket) notify('工单已关闭');
  },
  'order-file'({ order: id, kind, mode }) {
    const order = currentState().orders.find(order => order.id === id);
    const file = orderDocument(order, kind);
    if (!file) return;
    const url = URL.createObjectURL(new Blob([file.html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    if (mode === 'download') link.download = file.name;
    else { link.target = '_blank'; link.rel = 'noopener'; }
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
  'close-dialog'() { dialog.close(); }
};

function saveShipment() {
  draft = readShipment();
  const missingPostal = ['origin', 'destination'].find(side => !postalCode(draft[side]));
  if (missingPostal) {
    const label = missingPostal === 'origin' ? '提货地址' : '送货地址';
    workspace.querySelector('#quote-error').textContent = '请在' + label + '末尾填写有效的五位美国 ZIP 邮编。';
    workspace.querySelector('#' + missingPostal).focus();
    return;
  }
  if (!pricingReady(draft)) {
    workspace.querySelector('#quote-error').textContent = shipmentMode(draft) === 'ftl' ? '请检查车型、车辆数量、提货日期和货物信息。' : '请检查地址类型和货物计价信息。';
    return;
  }
  const quote = saveQuote(draft, draftId);
  if (!draftId) quickDrafts.delete(shipmentMode(draft));
  draftId = quote.id;
  navigate('rates/' + quote.id);
}

const textFields = form => Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, value.trim()]));

const submits = {
  'quote-form': saveShipment,
  'new-ticket-form'(form) {
    const fields = textFields(form);
    const error = form.querySelector('#ticket-form-error');
    if (!fields.subject || !fields.description) {
      error.textContent = '请填写工单主题和问题描述。';
      return;
    }
    const ticket = createTicket(fields);
    if (!ticket) {
      error.textContent = '请检查问题类型和关联运单后重新提交。';
      return;
    }
    dialog.close();
    openTicket(ticket.id);
    notify('工单已创建');
  },
  'ticket-reply-form'(form) {
    const { reply } = textFields(form);
    if (!reply) {
      form.querySelector('#ticket-reply-error').textContent = '请填写回复内容。';
      return;
    }
    const ticket = updateTicket(form.dataset.id, reply);
    openTicket(form.dataset.id);
    if (ticket) notify('回复已添加');
  },
  'custom-quote-form'(form) {
    const fields = textFields(form);
    if (['origin', 'destination', 'requirements', 'contact', 'email'].some(name => !fields[name])) {
      form.querySelector('#custom-quote-error').textContent = '请填写提送货地点、需求说明及联系方式。';
      return;
    }
    const request = saveCustomRequest(fields);
    navigate('custom/' + request.id);
  },
  'details-form'(form) {
    const quote = saveDetails(form);
    if (!quote) return;
    if (!detailsReady(quote)) {
      const incomplete = stopSides.find(side => !hasStreetAddress(quote.shipment[side]));
      const incompleteHours = stopSides.find(side => !stopHoursReady(quote.details, side));
      const error = workspace.querySelector('#details-error');
      if (incomplete) {
        error.textContent = '请填写提送货的完整街道地址和五位 ZIP。';
        form.elements[incomplete].focus();
      } else if (incompleteHours) {
        error.textContent = `请填写${incompleteHours === 'origin' ? '提货' : '送货'}地点的营业开始和结束时间。`;
        form.elements[incompleteHours + (quote.details[incompleteHours + 'OpensAt'] ? 'ClosesAt' : 'OpensAt')].focus();
      } else if (!hazardDeclarationsReady(quote.shipment)) {
        error.textContent = '请检查已勾选货品的危险品详情。';
      } else {
        error.textContent = '请检查联系人和提货时间窗口，最晚提货需晚于最早提货。';
      }
      return;
    }
    showConfirmation(quote);
  },
  'profile-form'(form) {
    const profile = textFields(form);
    if (Object.values(profile).some(value => !value)) { notify('请填写完整的账户资料'); return; }
    saveProfile(profile);
    units = profile.units;
    renderSidebar(currentState(), 'account');
    notify('账户资料已保存');
  },
  'address-form'(form) {
    const address = textFields(form);
    if (['label', 'street', 'city', 'region', 'zip', 'type'].some(key => !address[key])) { notify('请填写完整的地址'); return; }
    if (!saveAddress({ ...address, region: address.region.toUpperCase() }, form.dataset.address)) return;
    dialog.close();
    render();
    workspace.querySelector('[data-action="new-address"]').focus();
    notify('地址已保存');
  },
  'api-key-form'(form) {
    const { name } = textFields(form);
    if (!name) {
      form.elements.name.value = '';
      form.reportValidity();
      return;
    }
    const token = createDemoApiKey(name);
    render();
    showDialog('演示 API 密钥已创建', apiKeyResult(token));
  }
};

document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]');
  if (action && Object.hasOwn(actions, action.dataset.action)) {
    actions[action.dataset.action](action.dataset);
  }
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  if (link.matches('.ticket-subject-link') && link.hash === location.hash && innerWidth <= 1080) {
    workspace.querySelector('#detail-title').focus({ preventScroll: true });
    workspace.querySelector('#ticket-detail').scrollIntoView();
  }
  if (['#quote', '#ftl'].includes(link.getAttribute('href')) && !workspace.querySelector('#quote-form')) {
    units = currentState().profile.units;
  }
  if (document.body.classList.contains('nav-open')) {
    setMenu(false);
    if (link.getAttribute('href') === location.hash) workspace.querySelector('h1').focus();
  }
});

document.addEventListener('submit', event => {
  const form = event.target;
  if (!Object.hasOwn(submits, form.id)) return;
  event.preventDefault();
  submits[form.id](form);
});

workspace.addEventListener('change', event => {
  if (!event.target.closest('[data-rate-filters]')) return;
  const [, id] = currentRoute();
  const state = currentState();
  const quote = state.quotes.find(entry => entry.id === id);
  if (!quote) return;
  const booked = state.orders.find(order => order.quoteId === id);
  const filters = { ...rateFiltersByQuote.get(id), [event.target.name]: event.target.value };
  rateFiltersByQuote.set(id, filters);
  const rates = compareRates(quote.rates, filters);
  workspace.querySelector('#rate-result-count').textContent = `${rates.length} 条报价`;
  workspace.querySelector('#rate-results').innerHTML = carrierQuotes(quote, booked, rates);
});

workspace.addEventListener('input', event => {
  const filterGroup = event.target.closest('[data-filters]');
  if (filterGroup) {
    const kind = filterGroup.dataset.filters;
    filters[kind][event.target.name] = event.target.value;
    const state = currentState();
    const { orders } = state;
    if (kind === 'orders') updateOrderFilter(orders);
    else if (kind === 'tickets') updateTicketFilter(state);
    else workspace.querySelector('#listing-rows').innerHTML = billRows(filteredOrders(orders, kind), currentRoute()[1]);
  } else if (event.target.closest('#quote-form')) {
    workspace.querySelector('#quote-error').textContent = '';
    if (event.target.matches('#origin, #destination')) updateAddressPreview(event.target);
  } else if (event.target.closest('#custom-quote-form')) {
    workspace.querySelector('#custom-quote-error').textContent = '';
  } else if (event.target.closest('#details-form')) {
    workspace.querySelector('#details-error').textContent = '';
    if (event.target.matches('#origin, #destination')) updateAddressPreview(event.target);
    if (event.target.matches('[name="regulated"][value="hazmat"]')) {
      const fields = document.getElementById(event.target.getAttribute('aria-controls'));
      fields.hidden = fields.disabled = !event.target.checked;
    }
    const quote = saveDetails();
    if (quote) {
      if (event.target.closest('.cargo-item .cargo-row')) updateCargoMetrics(quote.shipment);
      updateSummary(quote);
    }
  }
});

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') === 'false'));
shade.addEventListener('click', () => { setMenu(false); menuButton.focus(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
    setMenu(false);
    menuButton.focus();
  }
});

workspace.addEventListener('keydown', event => {
  const current = event.target.closest('[data-tab]');
  if (!current || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...current.parentElement.querySelectorAll('[data-tab]')];
  const index = tabs.indexOf(current);
  const target = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1)
    : tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
  target.click();
  target.focus();
});

dialog.addEventListener('close', () => {
  if (dialog.querySelector('#api-key-value')) dialog.innerHTML = '';
});

window.addEventListener('hashchange', () => {
  if (dialog.open) dialog.close();
  const quickForm = workspace.querySelector('#quote-form');
  draft = readShipment();
  if (quickForm && !draftId) quickDrafts.set(shipmentMode(draft), draft);
  render(true);
});

render();
