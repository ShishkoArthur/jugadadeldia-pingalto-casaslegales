// Licence registries: pure helpers over the verified registry documents (data/sources/registries/*.json).
// No file system and no defaults: callers pass the registries they loaded and verified.
export function hostKey(input) {
  let s = String(input == null ? '' : input).trim().toLowerCase();
  if (!s) return '';
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(s)) s = 'http://' + s;
  let h;
  try { h = new URL(s).hostname; } catch { return ''; }
  return h.replace(/\.$/, '').replace(/^www\d?\./, '');
}
export function isBetAr(host) {
  return /(^|\.)bet\.ar$/.test(hostKey(host));
}
export function licensees(regs) {
  const out = [];
  for (const r of regs) for (const l of r.licensees) out.push({ jur: r.id, brand: l.brand, host: hostKey(l.host), ref: l.ref || null });
  return out;
}
export function countBy(regs) {
  return Object.fromEntries(regs.map(r => [r.id, r.licensees.length]));
}
export function total(regs) {
  return regs.reduce((n, r) => n + r.licensees.length, 0);
}
export function brands(regs) {
  return [...new Set(licensees(regs).map(l => l.brand))];
}
export function brandMatrix(regs, names) {
  if (!names) throw new Error('brandMatrix: brand names are required');
  const jurs = regs.map(r => r.id);
  const rows = new Map();
  for (const l of licensees(regs)) {
    if (!names[l.brand]) throw new Error('brandMatrix: no display name for brand ' + l.brand);
    if (!rows.has(l.brand)) rows.set(l.brand, { brand: l.brand, name: names[l.brand], cells: Object.fromEntries(jurs.map(j => [j, null])) });
    rows.get(l.brand).cells[l.jur] = { host: l.host, ref: l.ref };
  }
  const n = row => Object.values(row.cells).filter(Boolean).length;
  return [...rows.values()].sort((a, b) => n(b) - n(a) || a.name.localeCompare(b.name, 'es'));
}
export function presence(row) {
  return Object.values(row.cells).filter(Boolean).length;
}
export function multiJurisdiction(matrix) {
  return matrix.filter(r => presence(r) > 1);
}
export function distinctHosts(row) {
  return new Set(Object.values(row.cells).filter(Boolean).map(c => c.host)).size;
}
// brands whose licensed address differs between jurisdictions (the case where a visitor can land on the wrong one)
export function splitAddress(matrix) {
  return matrix.filter(r => distinctHosts(r) > 1);
}
export function findHost(regs, input) {
  const h = hostKey(input);
  if (!h) return [];
  return licensees(regs).filter(l => l.host === h);
}
export function tileLevel(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error('tileLevel: bad count ' + n);
  if (n === 0) return 0;
  if (n <= 3) return 1;
  if (n <= 7) return 2;
  return 3;
}
