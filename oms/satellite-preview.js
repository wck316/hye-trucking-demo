import { displayAddress, postalCode } from './model.js?v=campaigns';
import { locateStreetAddress } from './address-search.js?v=campaigns';
import { loadZipPoints } from './route-map.js?v=campaigns';

const imageryTiles = 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}';
const minZoom = 3;
const maxZoom = 19;
const maxNativeZoom = 16;

export function createSatelliteDrawer(drawer) {
  const mapNode = drawer.querySelector('.satellite-map');
  const addressLabel = drawer.querySelector('[data-map-address]');
  const status = drawer.querySelector('[data-map-status]');
  const message = drawer.querySelector('[data-map-message]');
  const controls = drawer.querySelector('.satellite-map-controls');
  const zoomLevel = drawer.querySelector('[data-map-level]');
  const zoomButtons = [...drawer.querySelectorAll('[data-map-zoom]')];
  const sideButtons = [...drawer.querySelectorAll('[data-map-side]')];
  const osmCredit = drawer.querySelector('[data-map-osm]');
  let addresses;
  let activeSide;
  let request;
  let map;
  let home;

  function clearMap() {
    request?.abort();
    request = undefined;
    map?.remove();
    map = undefined;
    home = undefined;
    activeSide = undefined;
    controls.hidden = true;
    osmCredit.hidden = true;
    zoomLevel.textContent = '';
    mapNode.removeAttribute('tabindex');
  }

  function showMessage(text) {
    message.textContent = text;
    message.hidden = !text;
  }

  function showMap(center, exact) {
    const L = window.L;
    const [longitude, latitude] = center;
    home = { center: [latitude, longitude], zoom: exact ? 17 : 13 };
    map = L.map(mapNode, { minZoom, maxZoom, zoomControl: false, attributionControl: false, worldCopyJump: true })
      .setView(home.center, home.zoom);

    const imagery = L.tileLayer(imageryTiles, { maxNativeZoom, maxZoom, referrerPolicy: 'no-referrer' });
    let loadedTile = false;
    imagery.on('loading', () => { loadedTile = false; showMessage('正在加载影像…'); });
    imagery.on('tileload', () => { loadedTile = true; showMessage(''); });
    imagery.on('load', () => {
      if (!loadedTile) showMessage('当前区域影像暂不可用，可移动或调整缩放。');
    });
    imagery.addTo(map);

    L.circleMarker(home.center, {
      radius: exact ? 7 : 9, weight: 2, color: '#fff', fillColor: '#0c55ed', fillOpacity: exact ? 1 : .6, interactive: false
    }).addTo(map);

    function updateZoom() {
      const level = map.getZoom();
      zoomLevel.textContent = '缩放 ' + level;
      for (const button of zoomButtons) {
        button.disabled = Number(button.dataset.mapZoom) > 0 ? level >= maxZoom : level <= minZoom;
      }
    }
    map.on('zoomend', updateZoom);
    controls.hidden = false;
    osmCredit.hidden = !exact;
    mapNode.setAttribute('tabindex', '0');
    updateZoom();
  }

  async function selectSide(side) {
    if (side === activeSide) return;
    clearMap();
    activeSide = side;
    for (const button of sideButtons) button.setAttribute('aria-pressed', String(button.dataset.mapSide === side));
    const address = displayAddress(addresses[side]);
    addressLabel.textContent = address || '尚未填写地址';
    status.textContent = '';
    const zip = postalCode(address);
    if (!zip) {
      showMessage('请先填写带 ZIP 的地址，或输入五位美国 ZIP。');
      return;
    }

    showMessage('正在查找位置…');
    request = new AbortController();
    const { signal } = request;
    try {
      const exact = /[a-z]/i.test(address.replace(/(?:,?\s+(?:US|USA|United States))$/i, ''))
        ? await locateStreetAddress(address, AbortSignal.any([signal, AbortSignal.timeout(3800)])).catch(() => undefined)
        : undefined;
      if (signal.aborted || !drawer.open) return;
      const center = exact ?? (await loadZipPoints()).get(zip);
      if (signal.aborted || !drawer.open) return;
      if (!center || !window.L) {
        showMessage('暂时无法显示此地址的影像。');
        return;
      }
      status.textContent = exact ? '街道地址附近' : 'ZIP ' + zip + ' 区域预览';
      showMessage('正在加载影像…');
      showMap(center, Boolean(exact));
    } catch {
      if (!signal.aborted && drawer.open) showMessage('影像暂时无法加载，可关闭后重试。');
    }
  }

  for (const button of sideButtons) button.addEventListener('click', () => selectSide(button.dataset.mapSide));
  for (const button of zoomButtons) button.addEventListener('click', () => map?.setZoom(map.getZoom() + Number(button.dataset.mapZoom)));
  drawer.querySelector('[data-map-reset]').addEventListener('click', () => {
    if (map && home) map.setView(home.center, home.zoom, { animate: false });
  });
  drawer.addEventListener('close', () => { if (!drawer.open) clearMap(); });

  return {
    open(side, values) {
      addresses = values;
      if (!drawer.open) drawer.showModal();
      return selectSide(side);
    },
    close() {
      if (drawer.open) drawer.close();
      clearMap();
    }
  };
}
