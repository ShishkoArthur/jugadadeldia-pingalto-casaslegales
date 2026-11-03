// es-AR formatting: dates dd/mm/aaaa, integers with a dot for thousands. Pure functions, used by the build and the tests.
export function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!m) throw new Error('fmtDate: not an ISO date ' + iso);
  return m[3] + '/' + m[2] + '/' + m[1];
}
export function fmtInt(n) {
  if (!Number.isInteger(n)) throw new Error('fmtInt: not an integer ' + n);
  const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 ? '-' : '') + s;
}
export function daysBetween(fromIso, toIso) {
  const a = Date.parse(fromIso + 'T00:00:00Z'), b = Date.parse(toIso + 'T00:00:00Z');
  if (!(a > 0) || !(b > 0)) throw new Error('daysBetween: bad date ' + fromIso + ' / ' + toIso);
  return Math.round((b - a) / 864e5);
}
export function addDays(iso, n) {
  const t = Date.parse(iso + 'T00:00:00Z');
  if (!(t > 0)) throw new Error('addDays: bad date ' + iso);
  return new Date(t + n * 864e5).toISOString().slice(0, 10);
}
export function plural(n, one, many) {
  return n === 1 ? one : many;
}
