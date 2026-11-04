import { fmt, esc } from './kit.js';

const TZ = 'America/Argentina/Buenos_Aires';
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const monthName = ym => MONTHS[+ym.slice(5, 7) - 1] + ' de ' + ym.slice(0, 4);
const EN = /^en/.test(document.documentElement.lang || '');
const dmy = d => (EN ? new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d + 'T12:00:00Z')) : +d.slice(8, 10) + '/' + +d.slice(5, 7) + '/' + d.slice(0, 4));
const money = n => '$ ' + fmt(n, 2);
function todayAr() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return p.year + '-' + p.month + '-' + p.day;
}
const good = f => f && Number.isFinite(f.value) && f.value > 0 && DAY.test(f.until || '') && /^\d{4}-\d{2}$/.test(f.ym || '');

function apply(feed) {
  const today = todayAr();
  for (const el of document.querySelectorAll('[data-price]')) {
    const id = el.dataset.price;
    const st = { value: +el.dataset.v, ym: el.dataset.ym, until: el.dataset.until, link: el.dataset.link, fetched: null };
    const f = feed && feed.prices && feed.prices[id];
    const c = good(f) && f.until >= st.until ? { value: f.value, ym: f.ym, until: f.until, link: (feed.links && feed.links[f.juego]) || st.link, fetched: f.doc && f.doc.fetched } : st;
    const notes = document.querySelectorAll('[data-price-note="' + id + '"]');
    const link = '<a href="' + esc(c.link) + '" rel="noopener">programa oficial de ' + monthName(c.ym) + '</a>';
    if (today > c.until) {
      el.textContent = 'sin precio vigente';
      el.classList.add('jg-off');
      notes.forEach(n => { n.innerHTML = '(el ' + link + ' venció el ' + dmy(c.until) + '; el precio nuevo aparece acá apenas Lotería de la Ciudad publique el programa siguiente)'; });
    } else {
      el.textContent = money(c.value);
      el.classList.remove('jg-off');
      notes.forEach(n => { n.innerHTML = '(' + link + ', vigente hasta el ' + dmy(c.until) + (c.fetched ? '; revisado el ' + dmy(c.fetched) : '') + ')'; });
    }
  }
}
async function load() {
  apply(null);
  try {
    const r = await fetch('/data/feeds/precios.json', { cache: 'no-cache' });
    if (r.ok) apply((await r.json()).data);
  } catch (e) { return; }
}
if (document.querySelector('[data-price]')) load();
