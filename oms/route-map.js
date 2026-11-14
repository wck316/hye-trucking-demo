// The local basemap uses the 2025 Census 20m state outlines and ZCTA internal points.
const censusSource = '<a href="https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html" target="_blank" rel="noopener">U.S. Census</a>';
const roadSource = '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">修正地图</a>';
const routeEndpoint = 'https://routing.openstreetmap.de/routed-car/route/v1/driving/';
const miles = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const radians = degrees => degrees * Math.PI / 180;
const longitudeFrom = (lon, origin) => ((lon - origin + 540) % 360) - 180;
const roadRoutes = new Map();
let nextRoadRequest = 0;
let mapData;
let zipData;

async function loadFile(path, format) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error('Map data unavailable');
  return response[format]();
}

export function loadZipPoints() {
  zipData ??= loadFile('./map-data/zip-points.csv', 'text').then(text => new Map(text.trim().split('\n').map(row => {
    const [zip, longitude, latitude] = row.split(',');
    return [zip, [Number(longitude), Number(latitude)]];
  }))).catch(error => { zipData = undefined; throw error; });
  return zipData;
}

function loadMapData() {
  mapData ??= Promise.all([
    loadZipPoints(),
    loadFile('./map-data/state-outlines.json', 'json')
  ]).catch(error => { mapData = undefined; throw error; });
  return mapData;
}

function directMiles([[startLon, startLat], [endLon, endLat]]) {
  const latitude = Math.sin(radians(endLat - startLat) / 2) ** 2;
  const longitude = Math.sin(radians(endLon - startLon) / 2) ** 2 * Math.cos(radians(startLat)) * Math.cos(radians(endLat));
  return 3958.76 * 2 * Math.asin(Math.sqrt(Math.min(1, latitude + longitude)));
}

function roadRoute(points) {
  const key = points.map(point => point.join(',')).join(';');
  if (!roadRoutes.has(key)) {
    const now = Date.now();
    const requestAt = Math.max(now, nextRoadRequest);
    nextRoadRequest = requestAt + 1000;
    const request = new Promise(resolve => setTimeout(resolve, requestAt - now))
      .then(() => fetch(`${routeEndpoint}${key}?overview=simplified&geometries=geojson`, { signal: AbortSignal.timeout(4500) }))
      .then(response => {
        if (!response.ok) throw new Error('Road route unavailable');
        return response.json();
      }).then(({ routes }) => {
        const route = routes?.[0];
        const coordinates = route?.geometry?.coordinates;
        return Number.isFinite(route?.distance) && coordinates?.length >= 2 && coordinates.every(point => point.length === 2 && point.every(Number.isFinite))
          ? { coordinates, miles: route.distance / 1609.344 } : null;
      }).catch(() => { roadRoutes.delete(key); return null; });
    roadRoutes.set(key, request);
  }
  return roadRoutes.get(key);
}

function mapArtwork(states, points, route) {
  const width = 344;
  const height = 170;
  const padding = 23;
  const [start, end] = points;
  const longitudeScale = Math.cos(radians((start[1] + end[1]) / 2));
  const local = ([longitude, latitude]) => [longitudeFrom(longitude, start[0]) * longitudeScale, -latitude];
  const coordinates = route?.coordinates ?? points;
  const projectedRoute = [...points, ...coordinates].map(local);
  const xs = projectedRoute.map(([x]) => x);
  const ys = projectedRoute.map(([, y]) => y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min((width - 2 * padding) / Math.max(maxX - minX, .65), (height - 2 * padding) / Math.max(maxY - minY, .35));
  const project = point => {
    const [x, y] = local(point);
    return [(x - (minX + maxX) / 2) * scale + width / 2, (y - (minY + maxY) / 2) * scale + height / 2];
  };
  const path = coordinates => coordinates.map((point, index) => `${index ? 'L' : 'M'}${point.map(value => value.toFixed(1)).join(' ')}`).join('');
  const basemap = states.flatMap(state => state.map(ring => {
    const positions = ring.map(project);
    const left = Math.min(...positions.map(([x]) => x));
    const right = Math.max(...positions.map(([x]) => x));
    if (right < 0 || left > width || right - left > 180 * longitudeScale * scale
      || positions.every(([, y]) => y < 0) || positions.every(([, y]) => y > height)) return '';
    return `<path d="${path(positions)}Z"/>`;
  })).join('');
  const projectedPoints = points.map(project);
  const [first, second] = projectedPoints;
  const overlap = Math.hypot(first[0] - second[0], first[1] - second[1]) < 17;
  const pins = (overlap ? [first] : projectedPoints).map(([x, y], index) =>
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" class="route-map-pin${index ? ' destination' : ''}"><circle r="${overlap ? 13 : 9}"/><text y=".5" dominant-baseline="central" text-anchor="middle">${overlap ? 'A/B' : index ? 'B' : 'A'}</text></g>`).join('');
  return `<svg class="route-map-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${route ? '提货点 A 到送货点 B 的预估道路路线' : '提货点 A 到送货点 B 的直线示意'}">
    <g class="route-map-states">${basemap}</g>
    <path class="route-map-line${route ? '' : ' direct'}" d="${path(coordinates.map(project))}"/>
    ${pins}
  </svg>`;
}

export async function renderRouteMap(panel) {
  const art = panel.querySelector('[data-route-art]');
  const distance = panel.querySelector('[data-route-distance]');
  const caption = panel.querySelector('[data-route-source]');
  try {
    const [zipPoints, states] = await loadMapData();
    if (!panel.isConnected) return;
    const points = [zipPoints.get(panel.dataset.from), zipPoints.get(panel.dataset.to)];
    if (points.some(point => !point)) {
      distance.textContent = '里程暂不可用';
      art.textContent = '该 ZIP 未收录在地图数据中';
      return;
    }
    art.innerHTML = mapArtwork(states, points);
    distance.textContent = `直线距离 ${miles.format(directMiles(points))} mi`;
    caption.innerHTML = `ZIP 区域直线示意 · ${censusSource}`;
    if (panel.dataset.from === panel.dataset.to) return;
    const route = await roadRoute(points);
    if (!route || !panel.isConnected) return;
    art.innerHTML = mapArtwork(states, points, route);
    distance.textContent = `道路约 ${miles.format(route.miles)} mi`;
    caption.innerHTML = `驾车路线按 ZIP 估算 · ${censusSource} · ${roadSource}`;
  } catch {
    distance.textContent = '里程暂不可用';
    art.textContent = '地图暂不可用';
  }
}
