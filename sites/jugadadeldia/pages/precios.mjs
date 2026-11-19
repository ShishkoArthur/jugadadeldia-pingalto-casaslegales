// Prices of the monthly LOTBA programmes on the pages: the build writes the value of the saved copy with its month and last valid day;
// the browser (client/precios.js) replaces it with the newest good value of the server feed precios.json (docs/FEEDS.md) and hides it
// with a note once its month is over and no newer programme is in. Prices of an official web page (Quiniela Plus of the Provincia,
// PAGE_PRICES) carry the date of their last good read instead of a month, and are hidden PAGE_VALID_DAYS after it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../../tools/env.mjs';
import { monthEnd } from '../../../engine/lottery/programa.mjs';
import { PRICES, PAGE_PRICES, PAGES, PAGE_VALID_DAYS } from '../../../engine/lottery/precios.mjs';
import { money } from './parts.mjs';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const LINKS = { QUI: 'https://quiniela.loteriadelaciudad.gob.ar/#programacion', LTO: 'https://loto.loteriadelaciudad.gob.ar/#programacion' };
const PAGE_LABEL = { PBA: 'página oficial de la Lotería de la Provincia' };
const addDays = (d, k) => new Date(Date.parse(d + 'T12:00:00Z') + k * 864e5).toISOString().slice(0, 10);
const dmy = d => +d.slice(8, 10) + '/' + +d.slice(5, 7) + '/' + d.slice(0, 4);
const SRC = {};
const src = f => (SRC[f] ||= JSON.parse(readFileSync(join(ROOT, 'data/sources/lottery', f + '.json'), 'utf8')));
function built(id) {
  const pp = PAGE_PRICES[id];
  if (pp) {
    const pg = PAGES[pp.juego], f = src(pg.file), x = f.facts.find(y => y.id === id), d = f.docs[pg.doc];
    if (!x || !d) throw new Error('price: unknown ' + id);
    return { value: x.value, ym: d.fetched.slice(0, 7), until: addDays(d.fetched, PAGE_VALID_DAYS), link: pg.url, fetched: d.fetched, page: pp.juego };
  }
  const B = src('lotba');
  const p = PRICES[id], f = B.facts.find(x => x.id === id);
  if (!p || !f) throw new Error('price: unknown ' + id);
  const m = /ano=(\d{4})&mes=(\d{2})/.exec(B.docs[p.doc].form || '');
  if (!m) throw new Error('price: no month for ' + p.doc);
  const ym = m[1] + '-' + m[2];
  return { value: f.value, ym, until: monthEnd(ym), link: LINKS[p.juego] };
}
export const monthName = ym => MONTHS[+ym.slice(5, 7) - 1] + ' de ' + ym.slice(0, 4);
export function price(h, id) {
  const b = built(id);
  return '<b data-price="' + id + '" data-v="' + b.value + '" data-ym="' + b.ym + '" data-until="' + b.until + '" data-link="' + h.esc(b.link) + '"' + (b.page ? ' data-kind="page" data-fetched="' + b.fetched + '"' : '') + '>' + money(b.value) + '</b>';
}
export function priceNote(h, id) {
  const b = built(id);
  if (b.page) return ' <small class="jg-mu" data-price-note="' + id + '">(<a href="' + h.esc(b.link) + '" rel="noopener">' + PAGE_LABEL[b.page] + '</a><span data-price-when>, revisada el ' + dmy(b.fetched) + '</span>)</small>';
  return ' <small class="jg-mu" data-price-note="' + id + '">(programa oficial de ' + monthName(b.ym) + ')</small>';
}
