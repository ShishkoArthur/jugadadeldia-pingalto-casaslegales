// Prices of the monthly LOTBA programmes on the pages: the build writes the value of the saved copy with its month and last valid day;
// the browser (client/precios.js) replaces it with the newest good value of the server feed precios.json (docs/FEEDS.md) and hides it
// with a note once its month is over and no newer programme is in.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../../tools/env.mjs';
import { monthEnd } from '../../../engine/lottery/programa.mjs';
import { PRICES } from '../../../engine/lottery/precios.mjs';
import { money } from './parts.mjs';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const LINKS = { QUI: 'https://quiniela.loteriadelaciudad.gob.ar/#programacion', LTO: 'https://loto.loteriadelaciudad.gob.ar/#programacion' };
let BUILT = null;
function built(id) {
  if (!BUILT) BUILT = JSON.parse(readFileSync(join(ROOT, 'data/sources/lottery/lotba.json'), 'utf8'));
  const p = PRICES[id], f = BUILT.facts.find(x => x.id === id);
  if (!p || !f) throw new Error('price: unknown ' + id);
  const m = /ano=(\d{4})&mes=(\d{2})/.exec(BUILT.docs[p.doc].form || '');
  if (!m) throw new Error('price: no month for ' + p.doc);
  const ym = m[1] + '-' + m[2];
  return { value: f.value, ym, until: monthEnd(ym), link: LINKS[p.juego] };
}
export const monthName = ym => MONTHS[+ym.slice(5, 7) - 1] + ' de ' + ym.slice(0, 4);
export function price(h, id) {
  const b = built(id);
  return '<b data-price="' + id + '" data-v="' + b.value + '" data-ym="' + b.ym + '" data-until="' + b.until + '" data-link="' + h.esc(b.link) + '">' + money(b.value) + '</b>';
}
export function priceNote(h, id) {
  const b = built(id);
  return ' <small class="jg-mu" data-price-note="' + id + '">(programa oficial de ' + monthName(b.ym) + ')</small>';
}
