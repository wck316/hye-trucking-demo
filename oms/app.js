import {
  currentState, emptyShipment, exampleShipment, emptyItem, saveQuote, bookOrder, saveProfile,
  saveAddress, removeAddress, postalCode, addressValue, unitSettings, dateInZone, billingRecords, billHref, money, billStatusText, billAmountLabel, rebillMethodText, collectRebillEarly, walletSnapshot, rechargeWallet, walletRechargeAmount, walletKinds,
  displayMeasurement, updateQuote, refreshQuote, chooseRate, quoteStatus, pricingReady, detailsReady, hasStreetAddress,
  addressTypes, shortAddress, stopDetailsReady, cargoReady, emptyCommodity, itemCommodities, hazardDeclarationsReady, stopHoursReady,
  shipmentMode, quoteEntry, quoteModes, orderTypes, orderType, orderRoute, orderRecordHref, saveCustomRequest, addressContactFields, createDemoApiKey, revokeDemoApiKey,
  createTicket, updateTicket, caseTypes, caseKind, caseRoute, caseHref, caseCategory, latestCase, validateCase,
  canClaimOrder, canRequestOrderChange, editableOrderStops, planOrderChange, planOrderCargoChange, planOrderCancellation, submitOrderChange,
  emptyCustomStop, customShipmentStops, customCargoRoute, customCargoIdentities, exampleCustomShipment, customRequestStatus, customChangeTicket, submitCustomRequestChange, simulateCustomResponse, bookCustomRequest
} from './model.js?v=account-layout';
import {
  quoteView, ratesView, ordersView, billingView, accountView, accountTabs, walletContent, walletRows, walletRechargeForm, walletRechargeConfirmation, dashboardView, campaignDetails, orderRows, billRows, billDetail,
  addressRows, addressForm, icon, e, detailsView, quoteSummary, confirmationView, carrierQuotes, workflowHeader,
  cargoEditor, cargoTotalsText, cargoItemMetrics, serviceSelectionText, compareRates, orderDetail, customQuoteView, customRecordsView, customInquiryNavigation, customRequestSnapshot, customChangeComparison,
  apiKeyForm, apiKeyResult, ticketRows, ticketDetail, ticketsView, ticketForm, caseForm, caseChargeOptions, paginationControls, pageSizes, quoteAssistantForm, quoteAssistantResult,
  orderChangeEditor, orderChangeReview, orderCancellationForm, customRouteSummary, customStopLabel, customStopCargo
} from './views.js?v=dashboard-offers';
import { customRequestChanges } from './custom-changes.js?v=account-layout';
import { renderRouteMap } from './route-map.js?v=zip-suggestions';
import { orderDocument } from './order-documents.js?v=account-layout';
import { bindAddressSuggestions } from './address-search.js?v=account-layout';
import { createSatelliteDrawer } from './satellite-preview.js?v=account-layout';
import { analyzeQuoteText, applyQuoteText } from './quote-assistant.js?v=dashboard-quote';
import { saveEvidence, removeEvidence, loadEvidence } from './case-evidence.js?v=zip-suggestions';
import { initializePhoneInputs, setPhoneInputValue, phoneInputValue } from './phone-input.js?v=phone-input-2';

const workspace = document.querySelector('#workspace');
const workspaceScrolls = () => getComputedStyle(workspace).overflowY === 'auto';
const breadcrumb = document.querySelector('#breadcrumb');
const customInquiryNav = document.querySelector('#custom-inquiry-nav');
const toolbarAction = document.querySelector('#workflow-action');
const dialog = document.querySelector('#dialog');
const satelliteDrawer = createSatelliteDrawer(document.querySelector('#satellite-drawer'));
const toast = document.querySelector('#toast');
const serviceTooltip = document.querySelector('#service-tooltip');
let serviceHelpAnchor;
let serviceHelpDismissTimer;
const menuButton = document.querySelector('#menu-button');
const shade = document.querySelector('#nav-shade');
const labels = { dashboard: '工作台', quote: '快速查价', rates: '报价比较', details: '完善并下单', custom: '定制询价', orders: '订单管理', tickets: '工单与申诉', billing: '账单管理', account: '账号管理' };
const filters = Object.fromEntries([...Object.keys(orderTypes), ...Object.keys(caseTypes), 'bills', 'rebills', 'customRecords', 'wallet'].map(kind => [kind, { query: '', status: '', page: 1, size: 20 }]));
const rateFiltersByQuote = new Map();
const stopSides = ['origin', 'destination'];
const stopFields = ['Company', 'Unit', 'Contact', 'Email', 'Phone', 'PhoneExtension', 'Reference', 'Notes', 'OpensAt', 'ClosesAt'];
const detailFields = [...stopSides.flatMap(side => stopFields.map(field => side + field)), 'pickupEnd'];

let draft = emptyShipment();
let draftId = '';
let draftKey = '';
let assistantDetails = {};
const quickDrafts = new Map();
const assistantDescriptions = new Map();
const dashboardAssistant = { mode: 'ltl', description: '' };
let units = currentState().profile.units;
const emptyCustomDraft = () => ({ shipment: { ...emptyShipment(), pickupDate: '', deliveryDate: '' }, details: {}, fields: {}, units: currentState().profile.units });
let customDraft = emptyCustomDraft();
let customDraftKey = 'new';
const customDrafts = new Map();
let toastTimer;
let activeOrderId;
let activeOrderTab = 'overview';
let orderChangeDraft;
let activeTicketId;
let activeBillId;
let activeAccountTab = 'profile';
let walletRechargeDraft;
const currentRoute = () => location.hash.slice(1).split('/');
const navigate = destination => { location.hash = destination; };
const findQuote = id => currentState().quotes.find(entry => entry.id === id);

function paginate(matches, filter, requested) {
  const { size } = filter;
  const index = requested ? matches.indexOf(requested) : -1;
  const pageCount = Math.max(1, Math.ceil(matches.length / size));
  const page = index >= 0 ? Math.floor(index / size) + 1 : Math.min(filter.page, pageCount);
  filter.page = page;
  const offset = (page - 1) * size;
  return { page, size, pageCount, total: matches.length, offset, rows: matches.slice(offset, offset + size) };
}

function clearListFilters(filter) {
  Object.assign(filter, { query: '', status: '', page: 1 });
}

function updatePagination(kind, result) {
  workspace.querySelector('.list-pagination').outerHTML = paginationControls(kind, result);
}

function changeListPage(kind, page, size) {
  const filter = filters[kind];
  if (size) filter.size = size;
  filter.page = page;
  if (kind === 'wallet') {
    updateWalletFilter(currentState());
    if (size) workspace.querySelector('[data-page-size="wallet"]').focus();
    else workspace.querySelector('.wallet-table').focus({ preventScroll: true });
    return;
  }
  const route = Object.hasOwn(orderTypes, kind) ? orderRoute(kind)
    : Object.hasOwn(caseTypes, kind) ? caseRoute(kind) : { bills: '#billing', rebills: '#billing/rebills', customRecords: '#custom/records' }[kind];
  if (location.hash !== route) history.replaceState(null, '', route);
  render();
  if (size) workspace.querySelector('[data-page-size]').focus();
  else {
    const table = workspace.querySelector('.table-wrap');
    table.focus({ preventScroll: true });
    table.scrollIntoView({ block: 'start' });
  }
}

function currentOrderList({ orders }) {
  const [, part, recordId] = currentRoute();
  const hasCategory = Object.hasOwn(orderTypes, part);
  const id = hasCategory ? recordId : part;
  const order = orders.find(entry => entry.id === id);
  const kind = order ? orderType(order) : hasCategory ? part : 'ltl';
  const records = orders.filter(entry => orderType(entry) === kind);

  return { kind, records, requested: records.find(record => record.id === id), filter: filters[kind] };
}

function orderFilterResults({ records, filter }) {
  const term = filter.query.trim().toLowerCase();
  const searched = records.filter(record => [
    record.id, record.reference, record.details?.originReference, record.details?.destinationReference,
    record.shipment.origin, record.shipment.destination, record.requirements, record.proNumber,
    ...Object.values(record.shipment.stops ?? {}).flatMap(stops => stops.flatMap(stop => [stop.address, stop.reference, stop.contact]))
  ].some(field => String(field ?? '').toLowerCase().includes(term)));
  return statusFilterResults(searched, filter.status);
}

function statusFilterResults(searched, status) {
  const counts = { '': searched.length };
  for (const record of searched) counts[record.status] = (counts[record.status] ?? 0) + 1;
  return { matches: status ? searched.filter(record => record.status === status) : searched, counts };
}

function updateStatusFilters(filter, counts) {
  workspace.querySelectorAll('[data-action="list-status-filter"]').forEach(button => {
    const { status } = button.dataset;
    button.setAttribute('aria-pressed', filter.status === status);
    button.querySelector('.management-status-count').textContent = counts[status] ?? 0;
  });
}

function currentBilling(orders) {
  const [, route, rebillId] = currentRoute();
  const isRebill = route === 'rebills';
  const type = isRebill ? 'rebills' : 'bills';
  const records = billingRecords(orders);
  const bills = records.filter(bill => Boolean(bill.originalId) === isRebill);
  const selected = bills.find(bill => isRebill ? bill.id === rebillId : bill.orderId === route);
  return { type, records, bills, selected, filter: filters[type], ordersById: new Map(orders.map(order => [order.id, order])) };
}

function billFilterResults(billing) {
  const { bills, filter, ordersById } = billing;
  const term = filter.query.trim().toLowerCase();
  const searched = bills.filter(bill => {
    const shipment = ordersById.get(bill.orderId)?.shipment;
    return [bill.id, bill.orderId, bill.originalId, bill.reason, billStatusText(bill), ...bill.charges.map(([label]) => label), shipment?.origin, shipment?.destination]
      .some(value => value?.toLowerCase().includes(term));
  });
  billing.counts = { '': searched.length };
  searched.forEach(bill => { const status = bill.workflowStatus ?? bill.paymentStatus; billing.counts[status] = (billing.counts[status] ?? 0) + 1; });
  return filter.status ? searched.filter(bill => (bill.workflowStatus ?? bill.paymentStatus) === filter.status) : searched;
}

function renderBilling({ orders, tickets }) {
  const billing = currentBilling(orders);
  let matches = billFilterResults(billing);
  if (billing.selected && !matches.includes(billing.selected)) {
    clearListFilters(billing.filter);
    matches = billFilterResults(billing);
  }
  const result = paginate(matches, billing.filter, billing.selected);
  const selected = billing.selected ?? result.rows[0];
  activeBillId = selected?.id;
  return billingView(billing, result, selected, latestCase(tickets, 'disputes', selected?.id));
}

function updateBillFilter({ orders, tickets }) {
  const billing = currentBilling(orders);
  const { type, filter } = billing;
  const matches = billFilterResults(billing);
  updateStatusFilters(filter, billing.counts);
  const result = paginate(matches, filter);
  const selected = result.rows.find(bill => bill.id === activeBillId) ?? result.rows[0];
  updateListRows(billRows(result.rows, selected?.id, billing));
  updatePagination(type, result);
  if (selected?.id === activeBillId) return;
  activeBillId = selected?.id;
  const detail = workspace.querySelector('.management-detail');
  detail.innerHTML = billDetail(selected, billing, latestCase(tickets, 'disputes', selected?.id));
  if (billing.selected) {
    const base = type === 'rebills' ? '#billing/rebills' : '#billing';
    history.replaceState(null, '', selected ? billHref(selected) : base);
  }
}

const orderOverviewTickets = (tickets, order) => tickets.filter(ticket => ticket.orderId === order?.id && (ticket.orderChange
  || (caseKind(ticket) === 'disputes' && ticket.status !== 'closed' && ticket.customerActionRequired === true)));

function renderOrders({ tickets }, listing) {
  const { kind, records, filter, requested } = listing;
  let { matches, counts } = orderFilterResults(listing);
  if (requested && !matches.includes(requested)) {
    clearListFilters(filter);
    ({ matches, counts } = orderFilterResults(listing));
  }
  const result = paginate(matches, filter, requested);
  const selected = requested ?? result.rows[0];
  activeOrderId = selected?.id;
  return ordersView(result, filter, selected, records.length, activeOrderTab, counts, latestCase(tickets, 'claims', selected?.id), kind, orderOverviewTickets(tickets, selected));
}

function updateOrderFilter(state) {
  const listing = currentOrderList(state);
  const { kind, records, filter, requested } = listing;
  const { matches, counts } = orderFilterResults(listing);
  updateStatusFilters(filter, counts);
  const result = paginate(matches, filter);
  const selected = result.rows.find(order => order.id === activeOrderId) ?? result.rows[0];
  updateListRows(orderRows(result.rows, selected?.id, kind));
  updatePagination(kind, result);
  if (selected?.id === activeOrderId) return;
  activeOrderId = selected?.id;
  const detail = workspace.querySelector('.management-detail');
  detail.innerHTML = orderDetail(selected, activeOrderTab, records.length, latestCase(state.tickets, 'claims', selected?.id), kind, orderOverviewTickets(state.tickets, selected));
  if (requested) history.replaceState(null, '', selected ? orderRecordHref(kind, selected) : orderRoute(kind));
}

function ticketFilterResults(tickets, kind) {
  const { query, status } = filters[kind];
  const term = query.trim().toLowerCase();
  const searched = tickets.filter(ticket => [ticket.id, ticket.subject, ticket.orderId, ticket.billId, ticket.customRequestId, caseCategory(ticket)]
    .some(value => value?.toLowerCase().includes(term))).sort((a, b) => b.updatedAt - a.updatedAt);
  return statusFilterResults(searched, status);
}

const linkedOrder = (orders, ticket) => orders.find(order => order.id === ticket?.orderId);
const ticketEmptyMessage = (tickets, kind) => (tickets.length ? '没有符合条件的' : '暂无') + caseTypes[kind].label;
function currentCaseRoute() {
  const [, part, id] = currentRoute();
  return Object.hasOwn(caseTypes, part) ? { kind: part, id } : { kind: 'tickets', id: part };
}
const linkedBill = (orders, ticket) => ticket?.billId ? billingRecords(orders).find(bill => bill.id === ticket.billId) : undefined;

function renderTickets(state) {
  const { kind, id } = currentCaseRoute();
  const { orders } = state;
  const tickets = state.tickets.filter(ticket => caseKind(ticket) === kind);
  const requested = tickets.find(ticket => ticket.id === id);
  let { matches, counts } = ticketFilterResults(tickets, kind);
  if (requested && !matches.includes(requested)) {
    clearListFilters(filters[kind]);
    ({ matches, counts } = ticketFilterResults(tickets, kind));
  }
  const result = paginate(matches, filters[kind], requested);
  const selected = requested ?? result.rows[0];
  activeTicketId = selected?.id;
  return ticketsView(result, filters[kind], selected, linkedOrder(orders, selected), counts, ticketEmptyMessage(tickets, kind), kind, linkedBill(orders, selected), state.customRequests?.find(request => request.id === selected?.customRequestId));
}

function updateTicketFilter(state) {
  const { kind, id } = currentCaseRoute();
  const { orders } = state;
  const tickets = state.tickets.filter(ticket => caseKind(ticket) === kind);
  const { matches, counts } = ticketFilterResults(tickets, kind);
  updateStatusFilters(filters[kind], counts);
  const result = paginate(matches, filters[kind]);
  const selected = result.rows.find(ticket => ticket.id === activeTicketId) ?? result.rows[0];
  updateListRows(ticketRows(result.rows, selected?.id, kind));
  updatePagination(kind, result);
  if (selected?.id === activeTicketId) return;
  activeTicketId = selected?.id;
  const detail = workspace.querySelector('.management-detail');
  detail.innerHTML = ticketDetail(selected, linkedOrder(orders, selected), ticketEmptyMessage(tickets, kind), kind, linkedBill(orders, selected), state.customRequests?.find(request => request.id === selected?.customRequestId));
  if (id) history.replaceState(null, '', selected ? caseHref(selected) : caseRoute(kind));
}

function customRecordsResult(state) {
  const requests = state.customRequests ?? [];
  const filter = filters.customRecords;
  const term = filter.query.trim().toLowerCase();
  const searched = requests.filter(request => [request.id, request.contact, request.email, request.requirements, request.shipment?.origin, request.shipment?.destination,
      ...Object.values(request.shipment?.stops ?? {}).flat().map(stop => stop.address)]
      .some(value => value?.toLowerCase().includes(term))).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  const matches = filter.status ? searched.filter(request => customRequestStatus(request, state.tickets) === filter.status) : searched;
  return { ...paginate(matches, filter), requests: searched };
}
function updateCustomRecordFilters(state) {
  const result = customRecordsResult(state);
  const template = document.createElement('template');
  template.innerHTML = customRecordsView(result, filters.customRecords, state.tickets);
  workspace.querySelector('#listing-rows').innerHTML = template.content.querySelector('#listing-rows').innerHTML;
  updatePagination('customRecords', result);
  workspace.querySelectorAll('[data-action="list-status-filter"]').forEach(button => {
    button.setAttribute('aria-pressed', filters.customRecords.status === button.dataset.status);
    button.querySelector('.management-status-count').textContent = template.content.querySelector(`[data-status="${button.dataset.status}"] .management-status-count`).textContent;
  });
}

function walletListing(state) {
  const snapshot = walletSnapshot(state);
  const filter = filters.wallet;
  const term = filter.query.trim().toLowerCase();
  const matches = snapshot.transactions.filter(entry => (!filter.status || entry.kind === filter.status)
    && [entry.id, entry.billId, entry.orderId, entry.description, walletKinds[entry.kind]].some(value => value?.toLowerCase().includes(term)));
  return { snapshot, matches, result: paginate(matches, filter) };
}
function walletParts(state) {
  const { snapshot, result } = walletListing(state);
  return { content: walletContent(snapshot, result, filters.wallet), pagination: paginationControls('wallet', result) };
}
function refreshWalletAccount() {
  const panel = workspace.querySelector('#account-panel-balance');
  if (!panel) return;
  const parts = walletParts(currentState());
  panel.innerHTML = parts.content;
  const footer = workspace.querySelector('.list-pagination');
  if (footer) footer.outerHTML = parts.pagination;
  else workspace.insertAdjacentHTML('beforeend', parts.pagination);
}
function updateWalletFilter(state) {
  const { result } = walletListing(state);
  workspace.querySelector('#listing-rows').innerHTML = walletRows(result.rows);
  updatePagination('wallet', result);
  workspace.querySelector('.wallet-table').scrollTop = 0;
}

function updateListFilters(kind) {
  const state = currentState();
  if (Object.hasOwn(orderTypes, kind)) updateOrderFilter(state);
  else if (Object.hasOwn(caseTypes, kind)) updateTicketFilter(state);
  else if (kind === 'customRecords') updateCustomRecordFilters(state);
  else if (kind === 'wallet') updateWalletFilter(state);
  else updateBillFilter(state);
}

function updateListRows(rows) {
  workspace.querySelector('#listing-rows').innerHTML = rows;
  workspace.querySelector('.management-list .table-wrap').scrollTop = 0;
}

function revealSelectedRow(tableWrap) {
  const row = tableWrap.querySelector('.table-row-selected');
  if (!row) return;
  const viewport = tableWrap.getBoundingClientRect();
  const headerBottom = tableWrap.querySelector('th').getBoundingClientRect().bottom;
  const rowBounds = row.getBoundingClientRect();
  if (rowBounds.top < headerBottom) tableWrap.scrollTop += rowBounds.top - headerBottom;
  else if (rowBounds.bottom > viewport.top + tableWrap.clientHeight) {
    tableWrap.scrollTop += rowBounds.bottom - viewport.top - tableWrap.clientHeight;
  }
}

function openTicket(ticket) {
  const route = caseHref(ticket);
  if (location.hash === route) render(true);
  else navigate(route);
}

function caseRecords(state, kind) {
  return kind === 'disputes' ? billingRecords(state.orders) : state.orders.filter(canClaimOrder);
}

async function saveCaseChanges(form, commit, error, after) {
  if (form.dataset.saving) return;
  form.dataset.saving = 'true';
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  let records = [];
  try {
    records = await saveEvidence([...(form.elements.evidence?.files ?? [])]);
    if (!form.isConnected || form.closest('dialog')?.open === false) {
      await removeEvidence(records);
      return;
    }
    const ticket = commit(records);
    if (!ticket) {
      await removeEvidence(records);
      error.textContent = '这条记录的状态已更新，请刷新后重试。';
      return;
    }
    after(ticket);
  } catch (problem) {
    error.textContent = problem.message || '保存失败，请重试。';
  } finally {
    delete form.dataset.saving;
    submit.disabled = false;
  }
}

function activateTab(container, name, scroller = container) {
  container.querySelectorAll('[data-tab]').forEach(tab => {
    const selected = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
  scroller.scrollTop = 0;
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

function render(moveFocus = false, message = '') {
  hideServiceHelp();
  const previousList = workspace.querySelector('.management-tools')?.dataset.filters;
  const previousListScroll = workspace.querySelector('.management-list .table-wrap')?.scrollTop ?? 0;
  const previousScroll = workspace.scrollTop;
  const categoryHadFocus = document.activeElement?.matches('.management-tabs a:focus-visible, .custom-top-tabs a:focus-visible');
  const state = currentState();
  let [section, id] = currentRoute();
  if (!section) section = 'dashboard';
  if (section === 'account' && Object.hasOwn(accountTabs, id)) activeAccountTab = id;
  const quote = state.quotes.find(quote => quote.id === id);
  const booked = state.orders.find(order => order.quoteId === id);
  const orderListing = section === 'orders' ? currentOrderList(state) : null;
  const mode = quote ? shipmentMode(quote.shipment) : section === 'ftl' ? 'ftl' : 'ltl';
  const customRequests = state.customRequests ?? [];
  const customEditing = section === 'custom' && id === 'change' ? customRequests.find(request => request.id === currentRoute()[2]) : undefined;
  const customRequest = customEditing ?? customRequests.find(request => request.id === id);
  if (section === 'orders' && id === 'custom' && customRequests.some(request => request.id === currentRoute()[2])) { navigate('custom/' + currentRoute()[2]); return; }
  if (section === 'custom' && id && !['change', 'records'].includes(id) && !customRequest) { navigate('custom/records'); return; }
  if (section === 'custom' && id === 'change' && (!customEditing || customEditing.orderId || customChangeTicket(customEditing, state.tickets))) {
    navigate(customEditing ? 'custom/' + customEditing.id : 'custom/records'); return;
  }
  if (section === 'custom' && (id === 'change' || !id)) {
    const key = customEditing?.id ?? 'new';
    if (key !== customDraftKey) {
      customDraftKey = key;
      customDraft = customDrafts.get(key) ?? (customEditing ? { shipment: structuredClone(customEditing.shipment ?? { ...emptyShipment(), origin: customEditing.origin ?? '', destination: customEditing.destination ?? '' }), details: structuredClone(customEditing.details ?? {}),
        fields: Object.fromEntries(['contact', 'email', 'phone', 'requirements'].map(name => [name, customEditing[name]])), units: customEditing.units ?? state.profile.units, revision: customEditing.revision ?? 1, reason: '' } : emptyCustomDraft());
      if (customEditing) customDraft.shipment = customCargoIdentities(customDraft.shipment);
    }
  }

  if (section === 'book') section = 'rates';
  if (section === 'ftl') section = 'quote';
  if (!Object.hasOwn(labels, section) || (['rates', 'details'].includes(section) && !quote)) section = 'quote';
  if (section === 'details' && (!quote.selectedRateId || booked)) section = 'rates';
  if (section === 'quote') {
    const key = id === 'ai' ? mode + '/ai' : quote?.id ?? mode;
    if (!workspace.querySelector('#quote-form') || draftKey !== key) {
      const saved = quickDrafts.get(key);
      draft = structuredClone(saved?.shipment ?? quote?.shipment ?? emptyShipment(mode));
      assistantDetails = saved?.details ?? {};
      draftId = quote?.id ?? '';
      draftKey = key;
    }
  }
  const navigationSection = ['quote', 'rates', 'details'].includes(section) ? quoteEntry({ mode }) : section;
  const header = workflowHeader(section, quote, booked, mode);
  document.body.classList.toggle('workflow-active', Boolean(header));
  document.body.classList.toggle('custom-inquiry-active', section === 'custom');
  customInquiryNav.hidden = section !== 'custom';
  customInquiryNav.innerHTML = section === 'custom' ? customInquiryNavigation(id ? 'records' : 'new') : '';
  if (header) breadcrumb.innerHTML = header.path;
  else breadcrumb.textContent = labels[section];
  const toolbarContent = section === 'custom' && !id
    ? '<button type="button" class="btn small" data-action="fill-custom-example" aria-label="填入两提两卸示例"><span class="custom-example-full">填入两提两卸示例</span><span class="custom-example-short" aria-hidden="true">填入示例</span></button>'
    : header?.action ?? '';
  toolbarAction.innerHTML = toolbarContent;
  toolbarAction.hidden = !toolbarContent;
  renderSidebar(state, navigationSection);

  const screens = {
    dashboard: () => dashboardView(state, dashboardAssistant),
    quote: () => quoteView(draft, units, Object.values(assistantDetails).some(Boolean)),
    rates: () => ratesView(quote, booked, message, units, rateFiltersByQuote.get(quote.id) ?? {}),
    details: () => detailsView(quote, state.addresses, units),
    custom: () => id === 'records' ? customRecordsView(customRecordsResult(state), filters.customRecords, state.tickets) : customQuoteView(state.profile, customRequests, customRequest, state.addresses, customDraft, state.tickets, customEditing),
    orders: () => renderOrders(state, orderListing),
    tickets: () => renderTickets(state),
    billing: () => renderBilling(state),
    account: () => accountView(state.profile, state.addresses, state.apiKeys ?? [], activeAccountTab, activeAccountTab === 'balance' ? walletParts(state) : {})
  };
  workspace.innerHTML = screens[section]();
  initializePhoneInputs(workspace);
  const customEditor = workspace.querySelector('#custom-quote-form[data-request]');
  if (customEditor) markCustomChanges(customEditor);
  workspace.querySelectorAll('[data-quick-address]').forEach(input => bindAddressSuggestions(input, state.addresses));
  const routeMap = workspace.querySelector('[data-route-map]');
  if (routeMap) renderRouteMap(routeMap);
  if (!moveFocus) return;
  const listOnly = (section === 'orders' && !orderListing.requested) || (section === 'tickets' && !currentCaseRoute().id)
    || (section === 'billing' && !currentBilling(state.orders).selected);
  const detail = listOnly ? null : workspace.querySelector('#detail-title');
  const categoryTab = categoryHadFocus ? (section === 'custom' ? customInquiryNav : workspace).querySelector('[aria-current="page"]') : null;
  const target = detail ?? categoryTab ?? workspace.querySelector('h1');
  target?.focus({ preventScroll: true });
  if (detail && workspaceScrolls()) detail.closest('.detail').scrollIntoView();
  else {
    const nextList = workspace.querySelector('.management-tools')?.dataset.filters;
    const sameList = detail && previousList && previousList === nextList;
    workspace.scrollTop = sameList ? previousScroll : 0;
    if (detail) {
      const tableWrap = workspace.querySelector('.management-list .table-wrap');
      if (sameList) tableWrap.scrollTop = previousListScroll;
      revealSelectedRow(tableWrap);
    }
  }
  return detail?.closest('.management-workspace');
}

function hideServiceHelp() {
  clearTimeout(serviceHelpDismissTimer);
  serviceTooltip.hidden = true;
  serviceHelpAnchor = undefined;
}

function showServiceHelp(button) {
  clearTimeout(serviceHelpDismissTimer);
  serviceHelpAnchor = button;
  serviceTooltip.textContent = document.getElementById(button.dataset.serviceHelp).textContent;
  serviceTooltip.hidden = false;
  const anchor = button.getBoundingClientRect();
  const { width, height } = serviceTooltip.getBoundingClientRect();
  const left = Math.max(12, Math.min(innerWidth - width - 12, anchor.left + (anchor.width - width) / 2));
  const top = anchor.bottom + height + 8 <= innerHeight ? anchor.bottom + 5 : Math.max(5, anchor.top - height - 5);
  Object.assign(serviceTooltip.style, { left: left + 'px', top: top + 'px' });
}

function scheduleServiceHelpDismissal() {
  clearTimeout(serviceHelpDismissTimer);
  serviceHelpDismissTimer = setTimeout(hideServiceHelp, 130);
}

function readStops(fields) {
  return {
    origin: fields.get('origin').trim(), destination: fields.get('destination').trim(),
    addressTypes: { origin: fields.get('origin-type'), destination: fields.get('destination-type') },
    services: { origin: fields.getAll('origin-services'), destination: fields.getAll('destination-services') }
  };
}

function readCargo(form, previousItems, displayUnits = units, legacyDescription = '') {
  const { weightFactor, lengthFactor } = unitSettings[displayUnits];
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
      const hazmat = Object.fromEntries(Array.from(entry.querySelectorAll('[data-hazmat] [name]'), input => {
        const value = input.matches('[data-phone-number]') ? phoneInputValue(input) : input.value.trim();
        return [input.name, value];
      }));
      return {
        ...(entry.dataset.customId ? { customId: entry.dataset.customId } : {}),
        description: value('commodity'), declaredValue: value('declaredValue'), nmfc: value('nmfc'), freightClass: value('freightClass'),
        regulated: Array.from(entry.querySelectorAll('[name="regulated"]:checked'), input => input.value),
        pieceType: value('pieceType'), pieceCount: value('pieceCount'),
        ...(Object.values(hazmat).some(Boolean) ? { hazmat } : {})
      };
    });
    const quickClass = row.querySelector('[data-quick-freight-class] select');
    if (quickClass && (quickClass.value || previous.commodities?.length)) {
      const [first = emptyCommodity(), ...other] = itemCommodities(previous, index === 0 ? legacyDescription : '');
      commodities.push({ ...first, freightClass: quickClass.value }, ...other);
    }
    const route = Object.fromEntries(Array.from(row.querySelectorAll('[data-cargo-route] select'), input => [input.name, input.value]));
    return {
      ...previous,
      ...route,
      type: read('type'), quantity: read('quantity') === '' ? '' : Number(read('quantity')),
      weight: measurement('weight', weightFactor), length: measurement('length', lengthFactor),
      width: measurement('width', lengthFactor), height: measurement('height', lengthFactor),
      ...(commodities.length ? { commodities } : {})
    };
  });
}

function readCustomDraft(form) {
  const fields = new FormData(form);
  const value = name => String(fields.get(name) ?? '').trim();
  const { shipment, units } = customDraft;
  const previousStops = customShipmentStops(shipment, customDraft.details);
  const stops = Object.fromEntries(stopSides.map(side => [side, Array.from(form.querySelectorAll(`[data-custom-stop][data-side="${side}"]`), element => {
    const key = element.dataset.customStop;
    const id = element.dataset.stopId;
    return {
      ...previousStops[side].find(stop => stop.id === id), id,
      address: value(key), addressType: value(key + '-type'), date: value(key + 'Date'),
      contact: value(key + 'Contact'), phone: value(key + 'Phone'), phoneExtension: value(key + 'PhoneExtension'),
      reference: value(key + 'Reference'), notes: value(key + 'Notes'), services: fields.getAll(key + '-services')
    };
  })]));
  const origin = stops.origin[0];
  const destination = stops.destination.at(-1);
  const services = Object.fromEntries(stopSides.map(side => [side, [...new Set(stops[side].flatMap(stop => stop.services))]]));
  const endpoints = { origin, destination };
  return {
    revision: customDraft.revision, reason: value('changeReason'),
    shipment: {
      ...shipment, stops, origin: origin.address, destination: destination.address,
      addressTypes: { origin: origin.addressType, destination: destination.addressType }, services,
      pickupDate: origin.date, deliveryDate: destination.date,
      items: readCargo(form, shipment.items, units)
    },
    details: Object.fromEntries(stopSides.flatMap(side => Object.entries({
      Contact: endpoints[side].contact, Phone: endpoints[side].phone, PhoneExtension: endpoints[side].phoneExtension,
      Reference: endpoints[side].reference, Notes: endpoints[side].notes
    }).map(([field, content]) => [side + field, content]))),
    fields: Object.fromEntries(['contact', 'email', 'phone', 'requirements'].map(name => [name, value(name)])),
    units
  };
}

function markCustomChanges(form) {
  const request = currentState().customRequests?.find(entry => entry.id === form.dataset.request);
  if (!request) return;
  const { shipment, fields, details, units } = customDraft;
  const change = { before: request, after: { ...fields, shipment, details, units } };
  const changes = customRequestChanges(change);
  form.querySelectorAll('.custom-field-changed, .custom-entity-added, .custom-change-heading').forEach(element => {
    element.classList.remove('custom-field-changed', 'custom-entity-added', 'custom-change-heading');
    if (element.hasAttribute('data-change-tooltip')) { element.removeAttribute('title'); delete element.dataset.changeTooltip; }
  });
  form.querySelectorAll('.custom-field-original').forEach(element => element.remove());
  const marker = (element, row) => {
    if (!element) return;
    if (row.kind === 'added') { element.classList.add('custom-entity-added'); return; }
    const field = element.closest('.field, .cargo-declaration');
    if (!field) return;
    field.classList.add('custom-field-changed');
    field.dataset.changeTooltip = 'true';
    field.title = '修改前：' + (row.before || '未填写');
    const description = document.createElement('span');
    description.className = 'sr-only custom-field-original';
    description.textContent = ' 已修改，修改前：' + (row.before || '未填写');
    field.append(description);
  };
  const inputIn = (scope, name) => Array.from(scope?.querySelectorAll('[name]') ?? []).find(input => input.name === name);
  for (const row of changes) {
    if (row.kind === 'removed') continue;
    const target = row.target;
    if (target.scope === 'request') marker(inputIn(form, target.name), row);
    if (target.scope === 'route') form.querySelector(`#custom-${target.side}-title`)?.classList.add('custom-change-heading');
    if (target.scope === 'stop') {
      const stop = Array.from(form.querySelectorAll('[data-custom-stop]')).find(element => element.dataset.stopId === target.id);
      if (row.kind === 'added') marker(stop, row);
      else {
        const suffix = { address: '', addressType: '-type', date: 'Date', contact: 'Contact', phone: 'Phone', phoneExtension: 'PhoneExtension', reference: 'Reference', notes: 'Notes', services: '-services' }[target.name];
        if (suffix !== undefined) {
          if (target.name === 'services') {
            const disclosure = stop?.querySelector('.stop-service-disclosure');
            if (disclosure) { disclosure.classList.add('custom-change-heading'); disclosure.title = '修改前：' + (row.before || '无'); disclosure.dataset.changeTooltip = 'true'; }
            const choice = inputIn(stop, stop?.dataset.customStop + suffix);
            marker(choice, row);
          } else marker(inputIn(stop, stop?.dataset.customStop + suffix), row);
        }
      }
    }
    if (target.scope === 'cargo' || target.scope === 'commodity') {
      const cargo = Array.from(form.querySelectorAll('[data-cargo-row]')).find(element => element.dataset.customId === (target.itemId ?? target.id));
      const scope = target.scope === 'commodity' ? Array.from(cargo?.querySelectorAll('[data-commodity]') ?? []).find(element => element.dataset.customId === target.id) : cargo;
      marker(row.kind === 'added' ? scope : inputIn(scope, target.name), row);
    }
  }
  const count = document.querySelector('#custom-change-count');
  if (count) count.textContent = changes.length ? ' · 已修改 ' + changes.length + ' 项' : '';
  const summary = form.querySelector('#custom-live-changes');
  if (summary) summary.innerHTML = customChangeComparison(change, '核对本次变更');
}

function updateCustomShipment(form) {
  customDraft = readCustomDraft(form);
  const { shipment, units } = customDraft;
  const stops = shipment.stops;
  workspace.querySelector('#custom-route-preview').innerHTML = customRouteSummary(stops, shipment, units);
  updateCargoMetrics(shipment, units, form);
  form.querySelectorAll('[data-custom-stop]').forEach(element => {
    const { side, stopId } = element.dataset;
    const stop = stops[side].find(stop => stop.id === stopId);
    const label = side === 'origin' ? '提货' : '送货';
    element.querySelector('.stop-heading').textContent = stop.address ? shortAddress(stop.address) : `${label}点 ${stops[side].indexOf(stop) + 1}`;
    element.querySelector('[data-stop-cargo]').innerHTML = customStopCargo(shipment, side, stop, units);
  });
  markCustomChanges(form);
  form.querySelectorAll('[data-cargo-row]').forEach((row, index) => {
    const route = customCargoRoute(shipment.items[index], stops);
    row.querySelector('[data-cargo-route-error]').hidden = Boolean(route.originStopId && route.destinationStopId);
    for (const side of stopSides) {
      const select = row.querySelector(`[name="${side}StopId"]`);
      for (const option of select.options) {
        const stopIndex = stops[side].findIndex(stop => stop.id === option.value);
        if (stopIndex >= 0) option.textContent = customStopLabel(stops[side][stopIndex], side, stopIndex);
      }
    }
  });
}

function readShipment() {
  const form = workspace.querySelector('#quote-form');
  if (!form) return draft;
  const fields = new FormData(form);
  const ftl = shipmentMode(draft) === 'ftl' ? { equipment: fields.get('equipment'), vehicleCount: Number(fields.get('vehicleCount')) } : {};
  const legacyDescription = draftId ? findQuote(draftId)?.details?.commodity : '';
  const items = readCargo(form, draft.items, units, legacyDescription);
  return { ...draft, ...readStops(fields), ...ftl, pickupDate: fields.get('pickupDate'), items };
}

function analyzeAssistant(form, shipment = readShipment()) {
  const result = analyzeQuoteText(form.elements.description.value, { mode: shipmentMode(shipment), addresses: currentState().addresses });
  return { result, shipment: applyQuoteText(shipment, result) };
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
  initializePhoneInputs(dialog);
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  dialog.querySelector('#dialog-title').focus();
}

function showOrderChangeEditor() {
  const { order, side, values, cargo } = orderChangeDraft;
  showDialog('修改订单', orderChangeEditor(order, side, values, cargo), 'order-change');
}

const orderChangeCargoForm = () => dialog.open && dialog.querySelector('#order-change-cargo:not([hidden])');
const cargoScope = () => orderChangeCargoForm() || workspace;

function readOrderChangeCargo(form) {
  const { order, cargo } = orderChangeDraft;
  return readCargo(form, cargo.items, cargo.units, order.details?.commodity);
}

function reviewOrderChange(form) {
  const { order, cargo } = orderChangeDraft;
  const side = form.dataset.orderChangeForm;
  cargo.items = readOrderChangeCargo(dialog.querySelector('#order-change-cargo'));
  const plan = side === 'cargo' ? planOrderCargoChange(order, cargo.items) : planOrderChange(order, side, textFields(form));
  if (plan.error) {
    form.querySelector('[data-order-change-error]').textContent = plan.error;
    return;
  }
  const stopForms = dialog.querySelectorAll('[data-order-change-form]:not(#order-change-cargo)');
  orderChangeDraft.values = Object.fromEntries([...stopForms].map(node => [node.dataset.orderChangeForm, textFields(node)]));
  orderChangeDraft.plan = plan;
  orderChangeDraft.side = side;
  showDialog('核对订单变更', orderChangeReview(order, plan), 'order-change');
}

function sendOrderChange(orderId, plan) {
  const { ticket, error } = plan.error ? plan : submitOrderChange(orderId, plan);
  if (error) {
    dialog.querySelector('[data-order-change-error]').textContent = error;
    return;
  }
  dialog.close();
  activeOrderTab = 'overview';
  render();
  workspace.querySelector(`.order-change-record a[href="${caseHref(ticket)}"]`)?.focus();
  notify(plan.side === 'cancel' ? '取消申请已提交审核' : '变更申请已提交审核');
}

function downloadBill(bill) {
  if (!bill) return;
  const amount = cents => (cents / 100).toFixed(2);
  const data = bill.originalId ? [
    ['账单号', '关联运单', '出账日期', '申诉截止时间（PT）', '剩余申诉工作日', '实际扣款日期', '扣款方式', '币种', '状态', ...bill.charges.map(([label]) => label), '应付金额', '已扣款金额', '原账单号', '补收原因'],
    [bill.id, bill.orderId, bill.issuedOn, bill.appealDeadline ? bill.appealDeadline + ' 00:00' : '', bill.appealDaysRemaining, bill.collectedOn,
      rebillMethodText(bill),
      'USD', billStatusText(bill), ...bill.charges.map(([, cents]) => amount(cents)), amount(bill.total), amount(bill.paymentStatus === 'collected' ? bill.total : 0), bill.originalId, bill.reason]
  ] : [
    ['账单号', '关联运单', '扣款日期', '币种', '状态', ...bill.charges.map(([label]) => label), billAmountLabel(bill)],
    [bill.id, bill.orderId, bill.chargedOn, 'USD', billStatusText(bill), ...bill.charges.map(([, cents]) => amount(cents)), amount(bill.total)]
  ];
  const csv = data.map(row => row.map(value => '"' + String(value ?? '').replaceAll('"', '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = bill.id + '.csv';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('已准备账单明细');
}

function focusCargo(index) {
  cargoScope().querySelectorAll('[data-cargo-row]')[index]?.querySelector('[name="quantity"]')?.focus();
}

function saveDetails(form = workspace.querySelector('#details-form'), editItems) {
  if (!form) return null;
  const quote = findQuote(form.dataset.quote);
  if (!quote) return null;
  const fields = new FormData(form);
  const items = readCargo(form, quote.shipment.items);
  editItems?.(items);
  const shipment = {
    ...quote.shipment, ...readStops(fields), items,
    pickupDate: fields.get('pickupDate'), pickupTime: fields.get('pickupTime')
  };
  delete shipment.timezone;
  const details = Object.fromEntries(detailFields.map(name => [name, fields.get(name).trim()]));
  return updateQuote(quote.id, { shipment, details, stage: 'details' });
}

function editCargo(editItems, nextUnits) {
  const changeForm = orderChangeCargoForm();
  if (changeForm) {
    const { order, cargo } = orderChangeDraft;
    cargo.items = readOrderChangeCargo(changeForm);
    editItems?.(cargo.items);
    cargo.units = nextUnits ?? cargo.units;
    changeForm.querySelector('#cargo-editor').outerHTML = cargoEditor({ ...order, shipment: { ...order.shipment, items: cargo.items } }, cargo.units);
    initializePhoneInputs(changeForm);
    return cargo.items;
  }
  const customForm = workspace.querySelector('#custom-quote-form');
  if (customForm) {
    customDraft = readCustomDraft(customForm);
    const { shipment } = customDraft;
    editItems?.(shipment.items);
    Object.assign(shipment, customCargoIdentities(shipment, false));
    customDraft.units = nextUnits ?? customDraft.units;
    customForm.querySelector('#cargo-editor').outerHTML = cargoEditor({ shipment }, customDraft.units, shipment.stops);
    initializePhoneInputs(customForm);
    updateCustomShipment(customForm);
    return shipment.items;
  }
  const form = workspace.querySelector('#details-form');
  if (form) {
    const quote = saveDetails(form, editItems);
    if (!quote) return [];
    units = nextUnits ?? units;
    form.querySelector('#cargo-editor').outerHTML = cargoEditor(quote, units);
    initializePhoneInputs(form);
    updateSummary(quote);
    return quote.shipment.items;
  }
  draft = readShipment();
  editItems?.(draft.items);
  units = nextUnits ?? units;
  render();
  return draft.items;
}

function updateCargoMetrics(shipment, displayUnits = units, scope = workspace) {
  scope.querySelector('#cargo-total').textContent = cargoTotalsText(shipment, displayUnits);
  scope.querySelectorAll('[data-cargo-metrics]').forEach((entry, index) => {
    entry.textContent = cargoItemMetrics(shipment.items[index], displayUnits);
  });
}

function toggleHazmat(input) {
  if (!input.matches('[name="regulated"][value="hazmat"]')) return;
  const fields = document.getElementById(input.getAttribute('aria-controls'));
  fields.hidden = fields.disabled = !input.checked;
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
    : '请检查提货日期、两端 ZIP 和地址类型，再更新报价。';
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
  'custom-support'({ id }) {
    const state = currentState();
    const request = state.customRequests?.find(entry => entry.id === id);
    if (!request || request.orderId) return;
    const pending = customChangeTicket(request, state.tickets);
    showDialog('模拟客服处理', `<p class="note">演示操作：模拟客服审核资料并返回报价。</p>
      ${pending ? `<p>申请工单 ${e(pending.id)}</p>${customChangeComparison(pending.customChange)}<details class="custom-change-review"><summary>核对本次修改资料</summary>${customRequestSnapshot(pending.customChange.after)}</details>` : '<p>按当前运输需求生成一份演示报价，有效期 24 小时。</p>'}
      <div class="actions end">${pending ? `<button class="btn small" type="button" data-action="custom-response" data-id="${e(id)}" data-decision="reject" data-ticket="${e(pending?.id ?? '')}" data-revision="${request.revision ?? 1}">模拟审核不通过</button>` : ''}<button class="btn primary small" type="button" data-action="custom-response" data-id="${e(id)}" data-decision="approve" data-ticket="${e(pending?.id ?? '')}" data-revision="${request.revision ?? 1}">${pending ? '模拟审核通过并返回报价' : '返回演示报价'}</button></div>`, 'review');
  },
  'custom-response'({ id, decision, ticket, revision }) {
    const result = simulateCustomResponse(id, decision, ticket, revision);
    if (result.error) { notify(result.error); return; }
    dialog.close(); render(); notify(decision === 'reject' ? '修改申请未通过，原资料已保留' : '资料已核对，演示报价已返回');
  },
  'custom-book'({ id }) {
    const state = currentState();
    const request = state.customRequests?.find(entry => entry.id === id);
    if (!request || customRequestStatus(request, state.tickets) !== 'quoted') { notify('请等待审核完成并获取有效报价'); return; }
    const quote = request.quote;
    showDialog('确认定制运输订单', `<div class="stack"><p><strong>${e(id)}</strong> · 资料版本 V${quote.revision}</p><p>${e(shortAddress(request.shipment.origin))} → ${e(shortAddress(request.shipment.destination))}</p><p>报价 ${e(quote.id)} · 有效至 ${new Date(quote.expiresAt).toLocaleString('zh-CN', { hour12: false })}</p>${customRouteSummary(customShipmentStops(request.shipment, request.details), request.shipment, request.units)}<details class="custom-change-review"><summary>核对完整提送货与货物资料</summary>${customRequestSnapshot(request)}</details><p>下单扣款金额 <strong>${money(quote.total)} USD</strong></p><p class="note">演示下单与扣款。确认后生成运单，并进入订单管理。</p><p class="error" id="custom-book-error" role="alert"></p><div class="actions end"><button class="btn small" type="button" data-action="close-dialog">返回核对</button><button class="btn primary small" type="button" data-action="confirm-custom-book" data-id="${e(id)}" data-quote="${e(quote.id)}">确认下单并扣款</button></div></div>`);
  },
  'confirm-custom-book'({ id, quote }) {
    const result = bookCustomRequest(id, quote);
    if (result.error) { dialog.querySelector('#custom-book-error').textContent = result.error; return; }
    dialog.close(); navigate('orders/custom/' + result.order.id); notify('下单成功，已模拟扣款');
  },

  'fill-custom-example'() {
    const { profile } = currentState();
    customDraft = {
      ...emptyCustomDraft(), shipment: exampleCustomShipment(),
      fields: {
        contact: profile.contact, email: profile.email, phone: profile.phone,
        requirements: '两提两卸示例：先从洛杉矶、凤凰城提货，再依次送至芝加哥、印第安纳波利斯。货物 1 共 10 托盘，从 A1 整批送至 B1；货物 2 共 3 托盘，从 A2 整批送至 B2。请按各地点的预约、到货通知及尾板要求安排运输。'
      }
    };
    render();
    workspace.scrollTop = 0;
    toolbarAction.querySelector('[data-action="fill-custom-example"]').focus({ preventScroll: true });
    notify('已填入两提两卸示例，可修改后提交');
  },
  'custom-stop'({ side, index, operation }) {
    const form = workspace.querySelector('#custom-quote-form');
    if (!form || !stopSides.includes(side)) return;
    customDraft = readCustomDraft(form);
    const groups = customDraft.shipment.stops;
    const stops = groups[side];
    let nextIndex = Number(index);
    let affectedCargo = false;
    if (operation === 'add') {
      stops.push(emptyCustomStop());
      nextIndex = stops.length - 1;
    } else if (operation === 'remove' && stops.length > 1) {
      const [removed] = stops.splice(nextIndex, 1);
      for (const item of customDraft.shipment.items) {
        if (item[side + 'StopId'] !== removed.id) continue;
        item[side + 'StopId'] = '';
        affectedCargo = true;
      }
      nextIndex = Math.min(nextIndex, stops.length - 1);
    } else if (operation === 'up' && nextIndex > 0) {
      [stops[nextIndex - 1], stops[nextIndex]] = [stops[nextIndex], stops[nextIndex - 1]];
      nextIndex--;
    } else if (operation === 'down' && nextIndex < stops.length - 1) {
      [stops[nextIndex], stops[nextIndex + 1]] = [stops[nextIndex + 1], stops[nextIndex]];
      nextIndex++;
    } else return;
    render();
    const target = document.getElementById('custom-' + stops[nextIndex].id);
    target?.focus({ preventScroll: true });
    target.closest('[data-custom-stop]').scrollIntoView({ block: 'nearest' });
    if (affectedCargo) notify('地点已移除，请为关联货物重新选择' + (side === 'origin' ? '提货点' : '送货点'));
  },
  'dashboard-quote-example'(_, button) {
    const form = button.form;
    const cargo = form.elements.mode.value === 'ftl'
      ? '用 1 辆 53ft 干柜车，20 个托盘'
      : '2 个托盘';
    const input = form.elements.description;
    input.value = '明天从 90001（商业地址有卸货平台）送到 60601（商业地址无卸货平台）。\n'
      + cargo + '，每托盘 400 lb，48 × 40 × 48 in。';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  },
  'dashboard-quote'({ next }, button) {
    const form = workspace.querySelector('#dashboard-quote-form');
    if (!form || form.dataset.submitted) return;
    const mode = form.elements.mode.value;
    const { result, shipment } = analyzeAssistant(form, emptyShipment(mode));
    units = currentState().profile.units;
    form.dataset.submitted = 'true';
    button.disabled = true;
    if (next === 'rates' && pricingReady(shipment)) {
      const quote = saveQuote(shipment, '', result.details);
      navigate('rates/' + quote.id);
      return;
    }
    quickDrafts.set(mode + '/ai', { shipment, details: result.details });
    navigate(quoteEntry(shipment) + '/ai');
  },
  'open-assistant'() {
    const description = assistantDescriptions.get(location.hash) ?? '';
    showDialog('AI 快速填单', quoteAssistantForm(shipmentMode(draft), description), 'assistant');
  },
  'assistant-example'({ text }) {
    const input = dialog.querySelector('#quote-assistant-form textarea');
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  },
  'assistant-apply'() {
    const form = dialog.querySelector('#quote-assistant-form');
    const { result, shipment } = analyzeAssistant(form);
    draft = shipment;
    assistantDetails = { ...assistantDetails, ...result.details };
    dialog.close();
    render();
    workspace.querySelector('#origin').focus({ preventScroll: true });
    notify(Object.keys(result.details).length ? '已应用，交接资料将在完善订单时带入' : '已填入查价表单，请核对后查看报价');
  },
  'fill-example'() {
    const mode = shipmentMode(draft);
    draft = exampleShipment(mode);
    assistantDetails = {};
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
    cargoScope().querySelectorAll('[data-cargo-row]')[index]?.querySelector('[data-commodity]:last-of-type [name="commodity"]')?.focus();
  },
  'remove-commodity'({ index, commodityIndex }) {
    editCargo(items => items[index].commodities.splice(Number(commodityIndex), 1));
    cargoScope().querySelectorAll('[data-cargo-row]')[index]?.querySelector('[data-action="add-commodity"]')?.focus();
  },
  units({ units: selection }, button) {
    if (button.getAttribute('aria-pressed') === 'true') return;
    editCargo(undefined, selection);
    cargoScope().querySelector(`[data-units="${selection}"]`)?.focus();
  },
  'fill-details-example'() {
    const form = workspace.querySelector('#details-form');
    const example = exampleShipment();
    for (const side of stopSides) {
      const field = form.elements[side];
      if (!hasStreetAddress(field.value) && (!field.value || postalCode(field.value) === postalCode(example[side]))) {
        field.value = example[side];
      }
    }
    const values = {
      originCompany: 'West Coast Demo Warehouse', originContact: '演示提货联系人', originEmail: 'pickup@example.com', originPhone: '+1 213 555 0101',
      destinationCompany: 'Midwest Demo Receiving', destinationContact: '演示送货联系人', destinationEmail: 'delivery@example.com', destinationPhone: '+1 312 555 0102',
      originReference: 'PU-DEMO-001', originNotes: '从西侧入口进入，抵达后联系仓库。', originOpensAt: '09:00', originClosesAt: '17:00',
      destinationReference: 'DEL-DEMO-001', destinationNotes: '请到收货窗口登记。', destinationOpensAt: '09:00', destinationClosesAt: '17:00',
      pickupEnd: '17:00', commodity: '纸箱包装日用品'
    };
    for (const [name, value] of Object.entries(values)) {
      const field = form.querySelector('[name="' + name + '"]');
      if (!field.value) setPhoneInputValue(field, value);
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
    notify(`演示下单成功，已模拟扣款 ${money(order.rate.total)}`);
    navigate('orders/' + order.id);
  },
  'choose-address'({ side }) {
    const stopSide = document.getElementById(side)?.closest('[data-custom-stop]')?.dataset.side ?? side;
    const title = stopSide === 'origin' ? '选择提货地址' : '选择送货地址';
    showDialog(title, '<ul class="address-book">' + addressRows(currentState().addresses, 'pick', side) + '</ul>');
  },
  'show-satellite'({ side }) {
    const form = workspace.querySelector('#quote-form');
    if (form) satelliteDrawer.open(side, {
      origin: form.elements.origin.value.trim(), destination: form.elements.destination.value.trim()
    });
  },
  'apply-address'({ id, side }) {
    const address = currentState().addresses.find(address => address.id === id);
    const input = workspace.querySelector('#' + side);
    if (!address || !input) return;
    const quick = input.form.id === 'quote-form';
    input.value = addressValue(address);
    input.form.elements[side + '-type'].value = Object.hasOwn(addressTypes, address.type) ? address.type : '';
    if (quick) input.dispatchEvent(new Event('change', { bubbles: true }));
    if (!quick) {
      for (const [key, field] of Object.entries(addressContactFields)) {
        const control = input.form.elements[side + field];
        if (address[key] && control) setPhoneInputValue(control, address[key]);
      }
      if (input.form.id === 'custom-quote-form') {
        updateCustomShipment(input.form);
      } else {
        const quote = saveDetails();
        if (quote) updateSummary(quote);
      }
    }
    dialog.close();
    input.focus();
    input.form.querySelector('.error').textContent = '';
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
  'collect-rebill-early'({ bill: id }) {
    const bill = billingRecords(currentState().orders).find(entry => entry.id === id && entry.originalId);
    if (!bill || bill.paymentStatus !== 'scheduled') { render(); notify('该补收账单已扣款或正在申诉'); return; }
    showDialog('提前确认扣款', `<div class="stack"><p>补收账单 <strong>${e(bill.id)}</strong></p><p>关联运单 ${e(bill.orderId)}</p><p>本次扣款金额 <strong>${money(bill.total)} USD</strong></p><p class="note">申诉截止时间：${e(bill.appealDeadline ? bill.appealDeadline + ' 00:00（PT）' : '待确认')}。确认后立即模拟扣款，并保留扣款记录。</p><p class="error" id="rebill-collection-error" role="alert"></p><div class="actions end"><button type="button" class="btn small" data-action="close-dialog">返回核对</button><button type="button" class="btn primary small" data-action="confirm-rebill-collection" data-bill="${e(bill.id)}" data-total="${bill.total}">确认扣款 ${money(bill.total)}</button></div></div>`);
  },
  'confirm-rebill-collection'({ bill, total }, button) {
    button.disabled = true;
    const result = collectRebillEarly(bill, Number(total));
    if (result.error) { dialog.querySelector('#rebill-collection-error').textContent = result.error; button.disabled = false; return; }
    dialog.close();
    if (location.hash !== billHref(result.bill)) history.replaceState(null, '', billHref(result.bill));
    render(); workspace.querySelector('#detail-title')?.focus({ preventScroll: true });
    notify(result.alreadyCollected ? '该补收账单已扣款' : '已提前确认扣款（演示）');
  },
  'download-bill'({ bill: id }) {
    downloadBill(billingRecords(currentState().orders).find(bill => bill.id === id));
  },
  'order-tab'({ tab }) {
    activeOrderTab = tab;
    const detail = workspace.querySelector('.management-detail');
    activateTab(detail, tab, detail.querySelector('.management-detail-scroll'));
  },
  'account-tab'({ tab }) {
    if (!Object.hasOwn(accountTabs, tab)) return;
    activeAccountTab = tab;
    if (location.hash !== '#account/' + tab) history.replaceState(null, '', '#account/' + tab);
    const panel = workspace.querySelector('.account-panel');
    panel.classList.toggle('wallet-active', tab === 'balance');
    if (tab === 'balance') refreshWalletAccount();
    else { workspace.querySelector('.list-pagination')?.remove(); workspace.querySelector('#account-panel-balance').innerHTML = ''; }
    activateTab(panel, tab);
  },
  'wallet-recharge'() {
    walletRechargeDraft = { amount: '1000', note: '', token: crypto.randomUUID() };
    showDialog('模拟充值', walletRechargeForm(walletRechargeDraft));
  },
  'wallet-amount'({ amount }) {
    dialog.querySelector('[name="amount"]').value = amount;
    dialog.querySelectorAll('[data-action="wallet-amount"]').forEach(button => button.setAttribute('aria-pressed', button.dataset.amount === amount));
  },
  'wallet-recharge-back'() {
    if (walletRechargeDraft) showDialog('模拟充值', walletRechargeForm(walletRechargeDraft));
  },
  'wallet-recharge-confirm'(_, button) {
    if (!walletRechargeDraft) return;
    button.disabled = true;
    const result = rechargeWallet(walletRechargeDraft);
    if (result.error) { dialog.querySelector('#wallet-recharge-error').textContent = result.error; button.disabled = false; return; }
    dialog.close(); walletRechargeDraft = undefined;
    clearListFilters(filters.wallet); refreshWalletAccount();
    workspace.querySelector('[data-action="wallet-recharge"]').focus({ preventScroll: true });
    notify(result.alreadyRecharged ? '本次模拟充值已入账' : '模拟充值已入账 ' + money(result.entry.amount));
  },
  'wallet-export'() {
    const { matches } = walletListing(currentState());
    const amount = cents => (cents / 100).toFixed(2);
    const rows = [['流水号', '日期（PT）', '类型', '摘要', '关联账单', '关联运单', '收入 (USD)', '支出 (USD)', '变动后余额 (USD)'],
      ...matches.map(entry => [entry.id, entry.date, walletKinds[entry.kind], entry.description, entry.billId ?? '', entry.orderId ?? '', entry.amount > 0 ? amount(entry.amount) : '', entry.amount < 0 ? amount(-entry.amount) : '', amount(entry.balance)])];
    const csv = rows.map(row => row.map(value => { const text = String(value); const safe = /^[=+@-]/.test(text) ? "'" + text : text; return '"' + safe.replaceAll('"','""') + '"'; }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = '余额流水-' + dateInZone() + '.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); notify('已导出当前筛选的资金流水');
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
  'list-status-filter'({ status }, button) {
    const kind = button.closest('[data-filters]').dataset.filters;
    if (filters[kind].status === status) return;
    Object.assign(filters[kind], { status, page: 1 });
    updateListFilters(kind);
  },
  'view-campaign'({ id }) {
    const campaign = campaignDetails(id);
    if (campaign) showDialog(campaign.title, campaign.body);
  },
  'list-page'({ list, page }) {
    changeListPage(list, Number(page));
  },
  'edit-order'({ order: id }) {
    const order = currentState().orders.find(entry => entry.id === id);
    const [side] = editableOrderStops(order);
    if (!side) return;
    orderChangeDraft = { order, side, values: {}, cargo: { items: order.shipment.items, units } };
    showOrderChangeEditor();
  },
  'cancel-order'({ order: id }) {
    const order = currentState().orders.find(entry => entry.id === id);
    if (canRequestOrderChange(order)) showDialog('申请取消订单', orderCancellationForm(order), 'order-change');
  },
  'order-change-side'({ side }) {
    for (const button of dialog.querySelectorAll('[data-action="order-change-side"]')) {
      button.setAttribute('aria-pressed', String(button.dataset.side === side));
    }
    for (const form of dialog.querySelectorAll('[data-order-change-form]')) form.hidden = form.dataset.orderChangeForm !== side;
    orderChangeDraft.side = side;
  },
  'back-order-change'() { showOrderChangeEditor(); },
  'submit-order-change'() {
    if (!orderChangeDraft?.plan) return;
    const { order, plan } = orderChangeDraft;
    sendOrderChange(order.id, plan);
  },
  'new-ticket'({ order: id }) {
    const { orders } = currentState();
    const order = orders.find(order => order.id === id);
    showDialog('创建工单', ticketForm(orders, order));
  },
  'new-case'({ kind, record }) {
    const state = currentState();
    const records = caseRecords(state, kind);
    const selected = records.find(entry => entry.id === record);
    const existing = selected && latestCase(state.tickets, kind, selected.id);
    if (existing && existing.status !== 'closed') { openTicket(existing); return; }
    const eligible = records.filter(entry => {
      const ticket = latestCase(state.tickets, kind, entry.id);
      return !ticket || ticket.status === 'closed';
    });
    const { action } = caseTypes[kind];
    showDialog(action, eligible.length
      ? caseForm(kind, eligible, selected)
      : `<p class="note">${kind === 'disputes' ? '暂无可申诉的已出账账单。' : '暂无可发起索赔的已提货运单。'}</p>`);
  },
  async 'download-evidence'({ id, name }) {
    try {
      const file = await loadEvidence(id);
      if (!file) { notify('此浏览器中找不到该凭证'); return; }
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      notify('无法读取凭证，请重试');
    }
  },
  'close-ticket'({ id }) {
    const ticket = currentState().tickets.find(entry => entry.id === id);
    const cancelChange = Boolean(ticket?.orderChange || ticket?.customChange);
    const title = cancelChange ? '撤回申请' : '关闭记录';
    const message = cancelChange ? '撤回后将结束这次变更审核。' : '关闭后将结束这条记录的沟通。确认关闭吗？';
    showDialog(title, `<p>${message}</p><div class="actions end"><button class="btn" type="button" data-action="close-dialog">取消</button><button class="btn primary" type="button" data-action="confirm-close-ticket" data-id="${e(id)}">${cancelChange ? '确认撤回' : '确认关闭'}</button></div>`);
  },
  'confirm-close-ticket'({ id }) {
    const ticket = updateTicket(id);
    dialog.close();
    if (ticket) {
      openTicket(ticket);
      notify(ticket.orderChange || ticket.customChange ? '变更申请已撤回' : caseTypes[caseKind(ticket)].label + '已关闭');
    }
  },
  'order-file'({ order: id, kind, mode, bill }) {
    const order = currentState().orders.find(order => order.id === id);
    const file = orderDocument(order, kind, bill);
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
    workspace.querySelector('#quote-error').textContent = '请选择' + label + '的联想结果，或填写带五位美国 ZIP 的地址。也可以只填 ZIP。';
    workspace.querySelector('#' + missingPostal).focus();
    return;
  }
  if (!pricingReady(draft)) {
    workspace.querySelector('#quote-error').textContent = shipmentMode(draft) === 'ftl' ? '请检查车型、车辆数量、提货日期和货物信息。' : '请检查提货日期、地址类型和货物计价信息。';
    return;
  }
  const quote = saveQuote(draft, draftId, assistantDetails);
  assistantDetails = {};
  quickDrafts.delete(draftKey);
  workspace.querySelector('#quote-form').dataset.submitted = 'true';
  draftId = quote.id;
  navigate('rates/' + quote.id);
}

const textFields = form => Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, value.trim()]));

const submits = {
  'cancel-order-form'(form) {
    const order = currentState().orders.find(entry => entry.id === form.dataset.order);
    if (order?.status !== form.dataset.status) {
      form.querySelector('[data-order-change-error]').textContent = '运单状态已更新，请关闭后重新打开核对。';
      return;
    }
    sendOrderChange(form.dataset.order, planOrderCancellation(order, form.elements.reason.value));
  },
  'dashboard-quote-form'(form) {
    const { result, shipment } = analyzeAssistant(form, emptyShipment(form.elements.mode.value));
    const panel = workspace.querySelector('#dashboard-quote-result');
    panel.innerHTML = quoteAssistantResult(result, shipment, currentState().profile.units, true);
    panel.hidden = false;
    panel.scrollIntoView({ block: 'nearest' });
  },
  'quote-assistant-form'(form) {
    const { result, shipment } = analyzeAssistant(form);
    const panel = dialog.querySelector('#quote-assistant-result');
    panel.innerHTML = quoteAssistantResult(result, shipment, units);
    panel.hidden = false;
  },
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
    openTicket(ticket);
    notify('工单已创建');
  },
  'new-case-form'(form) {
    const fields = Object.fromEntries([...new FormData(form)].filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, value.trim()]));
    const error = form.querySelector('#ticket-form-error');
    error.textContent = validateCase(currentState(), fields);
    if (error.textContent) return;
    return saveCaseChanges(form, files => createTicket(fields, files), error, ticket => {
      dialog.close();
      openTicket(ticket);
      notify(caseTypes[caseKind(ticket)].label + '已提交');
    });
  },
  'ticket-reply-form'(form) {
    const reply = form.elements.reply.value.trim();
    const error = form.querySelector('#ticket-reply-error');
    if (!reply && !form.elements.evidence?.files.length) {
      error.textContent = form.elements.evidence ? '请填写说明或添加凭证。' : '请填写回复内容。';
      return;
    }
    error.textContent = '';
    return saveCaseChanges(form, files => updateTicket(form.dataset.id, reply, files), error, ticket => {
      openTicket(ticket);
      notify('回复已添加');
    });
  },
  'custom-quote-form'(form) {
    if (form.dataset.submitted) return;
    const { shipment, details, fields, units } = readCustomDraft(form);
    const error = form.querySelector('#custom-quote-error');
    const stops = [...shipment.stops.origin, ...shipment.stops.destination];
    const scheduled = stops.filter(stop => stop.date);
    const invalidDate = scheduled.find((stop, index) => index > 0 && stop.date < scheduled[index - 1].date);
    const invalidCargo = shipment.items.findIndex(item => {
      const route = customCargoRoute(item, shipment.stops);
      return !route.originStopId || !route.destinationStopId;
    });
    if (stops.some(stop => !stop.address) || !fields.requirements || !fields.contact || !fields.email) {
      error.textContent = '请填写提送货地点、需求说明及联系方式。';
    } else if (invalidDate) {
      error.textContent = '期望交接日期应按路线先后排列，请检查各地点日期或调整地点顺序。';
      form.elements['custom-' + invalidDate.id + 'Date'].focus();
    } else if (invalidCargo >= 0) {
      error.textContent = `请为货物 ${invalidCargo + 1} 选择有效的提货点和送货点。`;
      const row = form.querySelectorAll('[data-cargo-row]')[invalidCargo];
      row.querySelector('[data-cargo-route] select:invalid')?.focus();
    } else if (!cargoReady(shipment) || !hazardDeclarationsReady(shipment)) {
      error.textContent = '请检查货物尺寸、重量、件数和危险品申报。';
    } else {
      const requestId = form.dataset.request;
      if (requestId) {
        const result = submitCustomRequestChange(requestId, { ...fields, shipment, details, units }, customDraft.revision, form.elements.changeReason.value);
        if (result.error) { error.textContent = result.error; return; }
      }
      const request = requestId ? { id: requestId } : saveCustomRequest({ ...fields, shipment, details, units });
      form.dataset.submitted = 'true';
      customDrafts.delete(form.dataset.draftKey);
      customDraftKey = '';
      customDraft = emptyCustomDraft();
      navigate('custom/' + request.id);
      notify(requestId ? '修改工单已提交，等待客服审核' : '定制询价已提交');
    }
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
  'wallet-recharge-form'(form) {
    if (!walletRechargeDraft) return;
    const fields = new FormData(form);
    const parsed = walletRechargeAmount(fields.get('amount'));
    if (parsed.error) { form.querySelector('#wallet-recharge-error').textContent = parsed.error; return; }
    walletRechargeDraft = { ...walletRechargeDraft, amount: String(fields.get('amount')), cents: parsed.cents, note: String(fields.get('note') ?? '').trim() };
    showDialog('核对模拟充值', walletRechargeConfirmation(walletRechargeDraft, walletSnapshot().balance));
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
  const help = event.target.closest('[data-service-help]');
  if (help) showServiceHelp(help);
  else if (!serviceTooltip.contains(event.target)) hideServiceHelp();
  const action = event.target.closest('[data-action]');
  if (action && Object.hasOwn(actions, action.dataset.action)) {
    actions[action.dataset.action](action.dataset, action);
  }
  const row = event.target.closest('.management-list tbody tr');
  if (row && !event.target.closest('a, button, input, select, textarea')
    && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    && !window.getSelection()?.toString()) {
    row.querySelector('.management-record')?.click();
  }
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  if (link.closest('.management-list') && link.hash === location.hash && workspaceScrolls()) {
    workspace.querySelector('#detail-title').focus({ preventScroll: true });
    workspace.querySelector('.management-detail').scrollIntoView();
  }
  if (['#quote', '#ftl'].includes(link.getAttribute('href')) && !workspace.querySelector('#quote-form')) {
    units = currentState().profile.units;
  }
  if (document.body.classList.contains('nav-open')) {
    setMenu(false);
    if (link.getAttribute('href') === location.hash) workspace.querySelector('h1').focus();
  }
});

workspace.addEventListener('pointerover', event => {
  const help = event.target.closest('[data-service-help]');
  if (help && event.pointerType !== 'touch') showServiceHelp(help);
});
workspace.addEventListener('pointerout', event => {
  if (event.target === serviceHelpAnchor && event.pointerType !== 'touch' && event.target !== document.activeElement) scheduleServiceHelpDismissal();
});
serviceTooltip.addEventListener('pointerenter', () => clearTimeout(serviceHelpDismissTimer));
serviceTooltip.addEventListener('pointerleave', () => {
  if (document.activeElement !== serviceHelpAnchor) hideServiceHelp();
});
workspace.addEventListener('focusin', event => {
  if (event.target.matches('[data-service-help]:focus-visible')) showServiceHelp(event.target);
});
workspace.addEventListener('focusout', event => {
  if (event.target === serviceHelpAnchor) hideServiceHelp();
});
workspace.addEventListener('scroll', hideServiceHelp, { capture: true });
window.addEventListener('resize', hideServiceHelp);

document.addEventListener('submit', event => {
  const form = event.target;
  if (form.dataset.orderChangeForm) {
    event.preventDefault();
    reviewOrderChange(form);
    return;
  }
  if (!Object.hasOwn(submits, form.id)) return;
  event.preventDefault();
  submits[form.id](form);
});

workspace.addEventListener('change', event => {
  if (event.target.matches('[data-quick-address]')) {
    workspace.querySelector('#quote-error').textContent = '';
    return;
  }
  const list = event.target.dataset.pageSize;
  if (list) {
    const size = Number(event.target.value);
    if (pageSizes.includes(size)) changeListPage(list, 1, size);
    return;
  }
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
  workspace.querySelector('.rate-list-scroll').scrollTop = 0;
  const comparison = workspace.querySelector('.rate-comparison');
  if (comparison.getBoundingClientRect().top < document.querySelector('.topbar').getBoundingClientRect().bottom) {
    comparison.scrollIntoView({ block: 'start' });
  }
});

dialog.addEventListener('change', event => {
  if (!event.target.matches('#new-case-form select[name="billId"]')) return;
  const bill = billingRecords(currentState().orders).find(entry => entry.id === event.target.value);
  event.target.form.elements.charge.innerHTML = caseChargeOptions(bill);
});

dialog.addEventListener('input', event => {
  const form = event.target.closest('[data-order-change-form], #cancel-order-form');
  if (form) {
    form.querySelector('[data-order-change-error]').textContent = '';
    if (form.id === 'order-change-cargo') {
      toggleHazmat(event.target);
      if (event.target.closest('.cargo-row')) {
        updateCargoMetrics({ items: readOrderChangeCargo(form) }, orderChangeDraft.cargo.units, form);
      }
    }
    return;
  }
  if (!event.target.matches('#quote-assistant-form textarea')) return;
  assistantDescriptions.set(location.hash, event.target.value);
  dialog.querySelector('#quote-assistant-result').hidden = true;
});

workspace.addEventListener('input', event => {
  if (event.target.form?.id === 'dashboard-quote-form') {
    dashboardAssistant[event.target.name] = event.target.value;
    workspace.querySelector('#dashboard-quote-result').hidden = true;
    return;
  }
  const filterGroup = event.target.closest('[data-filters]');
  if (filterGroup) {
    const kind = filterGroup.dataset.filters;
    const property = kind === 'wallet' && event.target.name === 'walletKind' ? 'status' : 'query';
    Object.assign(filters[kind], { [property]: event.target.value, page: 1 });
    updateListFilters(kind);
  } else if (event.target.closest('#quote-form')) {
    workspace.querySelector('#quote-error').textContent = '';
  } else if (event.target.closest('#custom-quote-form')) {
    const input = event.target;
    const form = input.form;
    form.querySelector('#custom-quote-error').textContent = '';
    toggleHazmat(input);
    updateCustomShipment(form);
    const stop = input.closest('[data-custom-stop]');
    if (input.name.endsWith('-services')) {
      const { side, stopId } = stop.dataset;
      const services = customDraft.shipment.stops[side].find(entry => entry.id === stopId).services;
      input.closest('details').querySelector('[data-service-preview]').textContent = serviceSelectionText({ services: { [side]: services } }, side);
    }
  } else if (event.target.closest('#details-form')) {
    workspace.querySelector('#details-error').textContent = '';
    toggleHazmat(event.target);
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
  if (event.key !== 'Escape') return;
  if (serviceHelpAnchor) hideServiceHelp();
  if (document.body.classList.contains('nav-open')) {
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
  if (dialog.dataset.mode === 'order-change' && !dialog.open) orderChangeDraft = undefined;
});

window.addEventListener('hashchange', () => {
  if (dialog.open) dialog.close();
  satelliteDrawer.close();
  const quickForm = workspace.querySelector('#quote-form');
  draft = readShipment();
  if (quickForm && !quickForm.dataset.submitted) {
    quickDrafts.set(draftKey, { shipment: draft, details: assistantDetails });
  }
  const customForm = workspace.querySelector('#custom-quote-form');
  if (customForm && !customForm.dataset.submitted) {
    customDraft = readCustomDraft(customForm);
    customDrafts.set(customForm.dataset.draftKey, customDraft);
  }
  render(true)?.querySelectorAll('.management-detail-scroll, .table-row-selected').forEach(element => {
    element.classList.add('record-arrival');
  });
});

// Keep an open billing screen current when its PT collection date rolls over.
let displayedBillingDate = dateInZone();
function refreshBillingDate() {
  const today = dateInZone();
  if (today === displayedBillingDate || dialog.open) return;
  displayedBillingDate = today;
  if (currentRoute()[0] === 'billing') render();
  else if (currentRoute()[0] === 'account' && activeAccountTab === 'balance') refreshWalletAccount();
}
setInterval(refreshBillingDate, 60000);
window.addEventListener('focus', refreshBillingDate);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshBillingDate(); });

render();
