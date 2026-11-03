// Distances and the physical floor of network delay (pingalto /kit/ping). Pure functions; the constants (Earth radius,
// speed of light, refractive index of fibre) are passed in from data/sources/pingalto/sources.json, never typed here.
const rad = d => (d * Math.PI) / 180;

// Wikidata coordinates come as "Point(<lon> <lat>)".
export function parsePoint(wkt) {
  const m = /^Point\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)$/.exec(String(wkt));
  if (!m) throw new Error('parsePoint: not a WKT point ' + wkt);
  return { lon: +m[1], lat: +m[2] };
}
// Great-circle distance on a sphere of radius R (haversine).
export function greatCircleKm(a, b, R) {
  if (!(R > 0)) throw new Error('greatCircleKm: radius required');
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
// Round trip time in milliseconds if a fibre ran in a straight line (great circle): the floor no real route can beat.
export function fibreRttMs({ km, c, n }) {
  if (!(km >= 0) || !(c > 0) || !(n >= 1)) throw new Error('fibreRttMs: km, c (m/s) and n required');
  return ((2 * km * 1000) / (c / n)) * 1000;
}
