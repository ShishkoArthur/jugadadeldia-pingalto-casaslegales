const TZ = 'America/Argentina/Buenos_Aires';
const DAY = /^\d{4}-\d\d-\d\d$/, HM = /^\d\d:\d\d$/;
const URL_ = '/data/feeds/programa.json';

export function monthAr() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return p.year + '-' + p.month;
}
export function goodProgram(p) {
  return !!p && Array.isArray(p.rows) && p.rows.length > 0 && DAY.test(p.from || '') && DAY.test(p.to || '') &&
    p.rows.every(r => Array.isArray(r) && r.length === 5 && DAY.test(r[1]) && HM.test(r[2]) && typeof r[3] === 'string' && Array.isArray(r[4]));
}
export function current(rows, ym) {
  const c = rows.filter(r => r[1].slice(0, 7) >= ym);
  return c.length ? c : rows;
}
export function timesOf(rows, type, wd) {
  const rs = rows.filter(r => r[3] === type && (wd === undefined || new Date(r[1] + 'T12:00:00Z').getUTCDay() === wd));
  return [...new Set(rs.map(r => r[2]))];
}
let req = null;
export function programa() {
  if (!req) req = fetch(URL_, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).then(j => (j && goodProgram(j.data) ? j.data : null)).catch(() => null);
  return req;
}
function fill(p) {
  const rows = current(p.rows, monthAr());
  for (const el of document.querySelectorAll('[data-tt]')) {
    const t = timesOf(rows, el.dataset.tt, el.dataset.wd ? +el.dataset.wd : undefined);
    if (t.length) el.textContent = t.join(' / ');
  }
}
if (typeof document === 'object' && document.querySelector('[data-tt]')) programa().then(p => { if (p) fill(p); });
