import { addressValue, postalCode } from './model.js?v=zip-suggestions';

const endpoint = 'https://photon.komoot.io/api/';
const resultLimit = 6;
const normalize = value => value.toLowerCase().replace(/[,.#]/g, ' ').replace(/\s+/g, ' ').trim();
const postcodeOnly = /^\d{1,5}(?:-\d{0,4})?$/;
const zipPrefix = /^\d{1,5}$/;
const chosenLocations = new Map();
const geonames = { label: '© GeoNames', href: 'https://www.geonames.org/export/zip/' };
const openStreetMap = { label: '© OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' };
let zipLocalities;

function loadZipLocalities() {
  zipLocalities ??= fetch(new URL('./map-data/zip-localities.tsv', import.meta.url), { signal: AbortSignal.timeout(6000) }).then(response => {
    if (!response.ok) throw new Error('ZIP lookup unavailable');
    return response.text();
  }).then(text => {
    const localities = new Map();
    for (const row of text.split('\n')) {
      const [zip, city, state] = row.split('\t');
      if (!/^\d{5}$/.test(zip) || !city || !state) continue;
      if (!localities.has(zip)) localities.set(zip, []);
      localities.get(zip).push(`${city}, ${state}`);
    }
    return localities;
  }).catch(error => { zipLocalities = undefined; throw error; });
  return zipLocalities;
}

function zipMatches(localities, prefix, zipPlusFour) {
  const matches = [];
  for (const [zip, places] of localities) {
    if (!zip.startsWith(prefix)) continue;
    for (const place of places) {
      const value = `${place} ${zipPlusFour || zip}`;
      matches.push({ value, label: value, detail: '使用 ZIP 查价' });
      if (matches.length === resultLimit) return matches;
    }
  }
  return matches;
}

function localMatches(query, addresses) {
  const terms = normalize(query).split(' ');
  return addresses.flatMap(address => {
    const value = addressValue(address);
    const searchable = normalize(`${address.label} ${value}`);
    return terms.every(term => searchable.includes(term))
      ? [{ value, label: address.street, detail: `${address.city}, ${address.region} ${address.zip} · 地址簿`, type: address.type }]
      : [];
  });
}

async function onlineMatches(query, signal) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ q: query, countrycode: 'US', limit: '12', lang: 'en' });
  const response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error('Address search unavailable');
  const { features } = await response.json();
  return (features ?? []).flatMap(({ properties = {}, geometry }) => {
    const { countrycode, postcode, housenumber, street, city, county, state, name } = properties;
    if (countrycode !== 'US' || typeof postcode !== 'string' || !postalCode(postcode)) return [];
    const area = [city || county || name, [state, postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    const coordinates = geometry?.coordinates;
    return housenumber && street
      ? [{ value: `${housenumber} ${street}, ${area}`, label: `${housenumber} ${street}`, detail: area,
          coordinates: coordinates?.length === 2 && coordinates.every(Number.isFinite) ? coordinates : undefined }]
      : [{ value: postalCode(postcode), label: area, detail: '使用 ZIP 查价' }];
  });
}

export async function locateStreetAddress(value, signal) {
  if (chosenLocations.has(value)) return chosenLocations.get(value);
  const streetKey = address => normalize(address.split(',')[0]).replace(/\b(street|avenue|road|drive|boulevard|lane|court|place|highway|parkway)\b/g,
    part => ({ street: 'st', avenue: 'ave', road: 'rd', drive: 'dr', boulevard: 'blvd', lane: 'ln', court: 'ct', place: 'pl', highway: 'hwy', parkway: 'pkwy' })[part]);
  const matches = await onlineMatches(value, signal);
  const zip = postalCode(value);
  return matches.find(match => match.coordinates && postalCode(match.value) === zip && streetKey(match.value) === streetKey(value))?.coordinates;
}

export function bindAddressSuggestions(input, addresses) {
  const popup = input.closest('.address-field').querySelector('.address-suggestions');
  const list = popup.querySelector('[role="listbox"]');
  const status = popup.querySelector('[role="status"]');
  let options = [];
  let selected = -1;
  let timer;
  let request;

  function stopSearch() {
    clearTimeout(timer);
    request?.abort();
    request = undefined;
  }

  function close() {
    stopSearch();
    popup.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    selected = -1;
  }

  function show(results, message, source) {
    const seen = new Set();
    options = results.filter(({ value }) => {
      const key = normalize(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, resultLimit);
    selected = -1;
    input.removeAttribute('aria-activedescendant');
    list.replaceChildren(...options.map((entry, index) => {
      const item = document.createElement('div');
      item.id = `${input.id}-address-option-${index}`;
      item.dataset.option = index;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      const title = document.createElement('strong');
      title.textContent = entry.label;
      const detail = document.createElement('small');
      detail.textContent = entry.detail;
      item.append(title, detail);
      return item;
    }));
    status.textContent = message;
    if (source) {
      const credit = document.createElement('a');
      credit.href = source.href;
      credit.target = '_blank';
      credit.rel = 'noopener noreferrer';
      credit.textContent = source.label;
      status.append(credit);
    }
    popup.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function choose(index) {
    const option = options[index];
    if (!option) return;
    input.value = option.value;
    if (option.coordinates) chosenLocations.set(option.value, option.coordinates);
    if (option.type) input.form.elements[input.name + '-type'].value = option.type;
    close();
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function searchZip(query, prefix) {
    const controller = new AbortController();
    request = controller;
    const stillCurrent = () => request === controller && input.isConnected && document.activeElement === input && input.value.trim() === query;
    const zipPlusFour = query.includes('-') ? query : '';
    const saved = () => {
      const places = new Map();
      for (const { zip, city, region } of addresses) {
        const locality = `${city}, ${region.toUpperCase()}`;
        const existing = places.get(zip) ?? [];
        if (!existing.includes(locality)) places.set(zip, [...existing, locality]);
      }
      return zipMatches(places, prefix, zipPlusFour);
    };
    show([], '正在查找 ZIP…');
    try {
      const places = await loadZipLocalities();
      if (!stillCurrent()) return;
      const matches = prefix.length === 5 ? zipMatches([[prefix, places.get(prefix) ?? []]], prefix, zipPlusFour)
        : zipMatches(places, prefix, '');
      const fallback = matches.length ? [] : saved();
      if (matches.length) show(matches, 'ZIP 地区 ', geonames);
      else if (fallback.length) show(fallback, '地址簿 ZIP 匹配');
      else show([], prefix.length === 5 ? '未找到此 ZIP 的城市，可直接用 ZIP 查价。' : '暂无匹配的 ZIP。');
    } catch {
      if (!stillCurrent()) return;
      const matches = saved();
      show(matches, matches.length ? '地址簿 ZIP 匹配' : 'ZIP 联想暂不可用，可直接输入五位 ZIP 查价。');
    }
  }

  function search() {
    stopSearch();
    const query = input.value.trim();
    const prefix = zipPrefix.test(query) ? query : postcodeOnly.test(query) && postalCode(query);
    if (prefix) {
      searchZip(query, prefix);
      return;
    }
    if (query.length < 2) { close(); return; }
    const local = localMatches(query, addresses);
    if (postcodeOnly.test(query) || query.length < 4 || local.length) {
      if (local.length) show(local, '地址簿匹配');
      else close();
      return;
    }
    show([], '正在搜索美国地址 · Photon');
    timer = setTimeout(async () => {
      if (!input.isConnected || document.activeElement !== input) return;
      const controller = new AbortController();
      request = controller;
      const stillCurrent = () => request === controller && input.isConnected && document.activeElement === input && input.value.trim() === query;
      try {
        const matches = await onlineMatches(query, AbortSignal.any([controller.signal, AbortSignal.timeout(4500)]));
        if (stillCurrent()) show(matches, matches.length ? '地址数据 ' : '未找到带 ZIP 的地址，可直接输入完整地址或 ZIP。', matches.length ? openStreetMap : undefined);
      } catch {
        if (stillCurrent()) show([], '地址联想暂不可用，可直接输入完整地址或 ZIP。');
      }
    }, 380);
  }

  input.addEventListener('input', event => { if (!event.isComposing) search(); });
  input.addEventListener('focus', () => {
    const value = input.value.trim();
    if (!postalCode(value) || postcodeOnly.test(value)) search();
  });
  input.addEventListener('blur', event => { if (!popup.contains(event.relatedTarget)) close(); });
  popup.addEventListener('focusout', event => {
    if (event.relatedTarget !== input && !popup.contains(event.relatedTarget)) close();
  });
  list.addEventListener('pointerdown', event => { if (event.target.closest('[data-option]')) event.preventDefault(); });
  list.addEventListener('click', event => {
    const item = event.target.closest('[data-option]');
    if (item) choose(Number(item.dataset.option));
  });
  input.addEventListener('keydown', event => {
    if (popup.hidden || event.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key === 'Enter' && selected >= 0) { event.preventDefault(); choose(selected); return; }
    if (!options.length || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const next = selected + (event.key === 'ArrowDown' ? 1 : -1);
    selected = next < 0 ? options.length - 1 : next % options.length;
    Array.from(list.children).forEach((item, index) => item.setAttribute('aria-selected', String(index === selected)));
    input.setAttribute('aria-activedescendant', list.children[selected].id);
    list.children[selected].scrollIntoView({ block: 'nearest' });
  });
}
