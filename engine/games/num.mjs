// es-AR number formatting for pingalto (decimal comma, dot for thousands). Same output in Node (build) and the browser.
const cache = {};
export function fmt(n, digits) {
  if (!Number.isFinite(n)) throw new Error('fmt: not a number ' + n);
  if (!Number.isInteger(digits) || digits < 0) throw new Error('fmt: digits required');
  const k = String(digits);
  if (!cache[k]) cache[k] = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: digits });
  return cache[k].format(n);
}
// Fixed number of decimals (results of the tools: "0,393").
export function fmtFixed(n, digits) {
  if (!Number.isFinite(n)) throw new Error('fmtFixed: not a number ' + n);
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}
// Percent from a 0..1 share: "55 %".
export function fmtPct(x, digits) {
  return fmt(x * 100, digits) + ' %';
}
