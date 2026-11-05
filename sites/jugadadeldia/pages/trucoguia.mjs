// Truco guides for a total beginner (owner 2026-11-05: visual tutorials, not three paragraphs): table of contents, numbered lessons,
// drawn cards and worked hands. Every result in the examples (who wins a baza, the hand, the envido, the points) is computed here
// by engine/truco and checked against what the text says (the build stops when they disagree). Rules from data/sources/truco.
import { LADDER, POWER, ENVIDO_VALUE, envidoPoints, envidoBreakdown, hasFlor, florPoints } from '../../../engine/truco/cards.mjs';
import { RULESETS, FLOR_POINTS, TRUCO_CALLS, handWinner, envidoQuieroValue, envidoNoQuieroValue, faltaValue, buenasAt } from '../../../engine/truco/rules.mjs';
import { envidoDistribution, florChance } from '../../../engine/truco/probability.mjs';
import { DECK_40, SUITS, NUMBERS_40, combinations } from '../../../engine/cards/spanish.mjs';
import { hero, cite, crumbs, webPage, fmt, card, SPRITE, tiles, ICONS, NUM, SUIT, faq, faqLd, oneIn } from './parts.mjs';
import { SENAS, face } from './truco.mjs';

const R30 = RULESETS['clasico-30-sin-flor'], R15 = RULESETS['corto-15-sin-flor'], R40 = RULESETS['bonaerense-40-con-flor'];
const HALF = buenasAt(R30);
const LV = [1, ...Object.keys(TRUCO_CALLS).map(Number)];
const CALLN = { truco: 'Truco', retruco: 'Retruco', valeCuatro: 'Vale cuatro' };
const ENVN = { envido: 'Envido', realEnvido: 'Real envido', faltaEnvido: 'Falta envido' };
const CSS = ['mesa.css', 'truco-guia.css'];
const must = (ok, what) => { if (!ok) throw new Error('truco guide example: ' + what); };

export const nm = c => { const n = parseInt(c, 10), s = c.slice(-1); return (n === 1 && (s === 'e' || s === 'b') ? 'ancho' : NUM[n]) + ' de ' + SUIT[s]; };
const el = c => (parseInt(c, 10) === 10 ? 'la ' : 'el ') + nm(c);
const al = c => (parseInt(c, 10) === 10 ? 'a la ' : 'al ') + nm(c);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const step = c => LADDER.length + 1 - POWER[c];
const ldT = (h, extra = []) => [webPage(h), crumbs(h, h.page.path === '/truco/' ? [] : [['/truco/', 'Truco']]), ...extra];

export function duelText(a, b) {
  const d = Math.sign(POWER[a] - POWER[b]);
  if (!d) return { w: -1, text: cap(el(a)) + ' y ' + el(b) + ' están en el mismo escalón (' + step(a) + '.º): empatan.' };
  const [W, L] = d > 0 ? [a, b] : [b, a];
  return { w: d > 0 ? 0 : 1, text: cap(el(W)) + ' (escalón ' + step(W) + ') le gana ' + al(L) + ' (escalón ' + step(L) + ').' };
}

const toc = list => '<nav class="jg-c w3 jg-toc" id="indice" aria-labelledby="indice-t"><span class="jg-sm" id="indice-t">En esta guía</span><ol>' +
  list.map(([id, t]) => '<li><a href="#' + id + '">' + t + '</a></li>').join('') + '</ol></nav>';
const lesson = (n, id, title, body) => '<section class="jg-c w3 jg-ls" id="' + id + '"><header class="jg-lh"><span class="jg-ln" aria-hidden="true">' + n + '</span><h2>' + title + '</h2></header>' + body + '</section>';
const two = (text, visual) => '<div class="jg-lx"><div class="jg-lt">' + text + '</div><div class="jg-lv2">' + visual + '</div></div>';
const tip = (t, cls = '') => '<p class="jg-tip' + (cls ? ' ' + cls : '') + '">' + t + '</p>';
const mini = c => { const n = parseInt(c, 10); return '<i class="jg-mc" data-s="' + c.slice(-1) + '">' + ({ 10: 'S', 11: 'C', 12: 'R' }[n] || n) + '</i>'; };
const minis = cards => '<div class="jg-mcs">' + cards.map(mini).join('') + '</div>';
const hand = (cards, cls = 'sm') => '<div class="jg-hand ' + cls + '">' + cards.map(c => card(c)).join('') + '</div>';
const dlg = list => '<ol class="jg-dlg">' + list.map(([who, say, note]) => who === 2 ? '<li class="n"><p>' + say + '</p></li>' : '<li class="' + (who ? 'r' : 'v') + '"><b>' + (who ? 'Rival' : 'Vos') + '</b><span>' + say + '</span>' + (note ? '<small>' + note + '</small>' : '') + '</li>').join('') + '</ol>';
const cta = (h, title, text, links) => '<section class="jg-c w3 jg-cta" id="a-jugar"><span class="jg-sm">Ya lo tenés</span><h2>' + title + '</h2><p>' + text + '</p><div class="jg-r">' + links.filter(([u]) => h.built(u)).map(([u, l], i) => '<a class="jg-b' + (i ? '' : ' p') + '" href="' + h.href(u) + '">' + l + '</a>').join('') + '</div></section>';
const knowLink = h => h.built('/truco/jugar/') ? '<a class="jg-kn" href="' + h.href('/truco/jugar/') + '">¿Ya sabés jugar? Jugá contra la compu</a>' : '';
const more = (h, skip) => '<section class="jg-c w3"><span class="jg-sm">Seguí aprendiendo</span><h2>Más truco</h2>' + tiles(h, [
  ['/truco/reglas/', 'Reglas paso a paso', 'La guía completa para empezar de cero', '#2f7cf6', ICONS.book],
  ['/truco/valores-de-las-cartas/', 'Valores de las cartas', 'Qué carta mata a cuál', '#e0447a', ICONS.cards],
  ['/truco/envido/', 'Envido', 'Cómo contar tus puntos', '#16b38a', ICONS.calc],
  ['/truco/senas/', 'Señas', 'Los gestos para tu compañero', '#8b5cf6', ICONS.eye],
  ['/truco/flor/', 'La flor', 'Tres cartas del mismo palo', '#e8930c', ICONS.cards],
  ['/truco/puntos/', 'Cuánto vale cada canto', 'Calculadora de puntos', '#16b38a', ICONS.calc],
  ['/truco/quiero-o-no-quiero/', '¿Quiero o no quiero?', 'Entrenador de decisiones', '#8b5cf6', ICONS.hand],
  ['/truco/anotador/', 'Anotador', 'Con fósforos', '#e8930c', ICONS.pencil],
].filter(t => t[0] !== skip)) + '</section>';

// The ladder, compact: one row per escalón with a name and its cards.
const GROUP = { 14: 'Brava · la más alta', 13: 'Brava', 12: 'Brava', 11: 'Brava', 10: 'Los tres', 9: 'Los dos', 8: 'Ases falsos', 7: 'Reyes', 6: 'Caballos', 5: 'Sotas', 4: 'Sietes falsos', 3: 'Los seis', 2: 'Los cincos', 1: 'Los cuatros' };
const ladderMini = () => '<ol class="jg-ldm">' + LADDER.map((cs, i) => '<li' + (i < 4 ? ' class="br"' : '') + '><span class="jg-lv">' + (i + 1) + '</span><b>' + GROUP[POWER[cs[0]]] + '</b>' + minis(cs) + '</li>').join('') + '</ol>';

// Tap two cards (client/trucoguia.js draws the same text).
function duelTool(a = '3e', b = '7o') {
  const r = duelText(a, b);
  return '<div class="jg-duel" data-duelo><div class="jg-dsl"><div><small>Carta 1</small><div data-o="a">' + card(a) + '</div></div><b aria-hidden="true">vs</b><div><small>Carta 2</small><div data-o="b">' + card(b) + '</div></div></div>' +
    '<p class="jg-res" data-o="r" aria-live="polite"><b>' + (r.w === -1 ? 'Parda.' : 'Gana la carta ' + (r.w + 1) + '.') + '</b> ' + r.text + '</p><p class="jg-note">Tocá una carta del mazo para la carta 1 y otra para la carta 2.</p><noscript><p class="jg-note">Para probar con otras cartas hace falta JavaScript.</p></noscript>' +
    '<div class="jg-deck sm" data-pick></div></div>';
}

// Envido worked examples: the counted cards stand out, the value of each card under it, the sum written out.
export function envFormula(hnd) {
  const b = envidoBreakdown(hnd);
  must(b.total === envidoPoints(hnd), 'envido sum');
  if (b.kind === 'single') return { b, f: 'Tres palos distintos: vale la más alta, ' + b.values[0] };
  return { b, f: (b.kind === 'three' ? 'Las tres del mismo palo: se suman las dos más altas, ' : '') + b.values[0] + ' + ' + b.values[1] + ' + 20 = ' + b.total };
}
const cv = (c, on) => '<span class="jg-cv' + (on ? ' on' : '') + '">' + card(c) + '<i>' + ENVIDO_VALUE[c] + '</i></span>';
function envExample(hnd, note) {
  const { b, f } = envFormula(hnd);
  return '<li class="jg-ev"><div class="jg-evh">' + hnd.map(c => cv(c, b.cards.includes(c))).join('') + '</div><div><p class="jg-fx"><span>Envido</span><b>' + b.total + '</b></p><p class="jg-fm">' + f + '</p><p>' + note + '</p></div></li>';
}
const ENV_EX = [
  [['7e', '6e', '3b'], 'Lo máximo que se puede tener: el siete y el seis del mismo palo.'],
  [['5c', '12c', '1o'], 'El rey vale 0, pero igual sirve: es de copas como el cinco, y eso da los 20.'],
  [['10b', '11b', '4o'], 'Dos figuras del mismo palo: 0 + 0 + 20. El cuatro de oros queda afuera.'],
  [['7o', '3c', '1e'], 'Ninguna pareja de palo: cuenta solo el siete. El ancho de espadas, tan fuerte en las bazas, acá vale 1.'],
  [['4b', '6b', '2b'], 'Si juegan sin flor, con tres del mismo palo se cuentan las dos más altas.'],
];
function envArmar() {
  const start = ['6o', '7o', '12c'], { b } = envFormula(start);
  must(b.kind === 'pair', 'armar start');
  const f = 'Dos del mismo palo: ' + b.values[0] + ' + ' + b.values[1] + ' + 20 = ' + b.total + '.';
  return '<div class="jg-arm" data-armar><div class="jg-evh" data-o="hand">' + start.map(c => cv(c, b.cards.includes(c))).join('') + '</div>' +
    '<p class="jg-fx"><span>Tu envido</span><b data-o="pts">' + b.total + '</b></p><p class="jg-fm" data-o="f" aria-live="polite">' + f + '</p><p class="jg-note">Tocá tres cartas del mazo. Si tocás una cuarta, sale la primera.</p>' +
    '<div class="jg-deck sm" data-pick data-start="' + start.join(' ') + '"></div></div>';
}

// A hand played baza by baza: plays are [your card, rival card]; who leads comes from the rules (mano first, then the winner of the
// previous baza, the mano again after a parda) and the hand ends when handWinner says so.
function playOut(mano, plays) {
  const R = [], rows = [];
  let lead = mano;
  for (let i = 0; i < plays.length; i++) {
    const p = plays[i], d = Math.sign(POWER[p[0]] - POWER[p[1]]), w = d > 0 ? 0 : d < 0 ? 1 : -1;
    R.push(w); rows.push({ i: i + 1, pair: p, lead, w });
    const win = handWinner(R, mano);
    if (win !== null) { must(i === plays.length - 1, 'extra bazas'); return { rows, winner: win, R }; }
    lead = w === -1 ? mano : w;
  }
  throw new Error('truco guide example: hand not decided');
}
const WHO = [{ n: 'Vos', w: 'Ganás vos', s: 'salís vos' }, { n: 'Rival', w: 'Gana el rival', s: 'sale el rival' }];
function bazaBox(row, extra = '') {
  const r = duelText(row.pair[0], row.pair[1]);
  const order = row.lead === 1 ? [1, 0] : [0, 1];
  return '<li class="jg-bz1"><span class="jg-sm">Baza ' + row.i + ' · ' + WHO[row.lead].s + '</span><div class="jg-bzt">' + order.map(k => '<div class="jg-bzc' + (r.w === k ? ' w' : r.w === -1 ? ' p' : '') + '"><small>' + WHO[k].n + '</small>' + card(row.pair[k]) + '</div>').join('') + '</div>' +
    '<p><b>' + (r.w === -1 ? 'Parda.' : WHO[r.w].w + '.') + '</b> ' + r.text + extra + '</p></li>';
}
const handsBox = (mine, theirs, mano) => '<div class="jg-hh"><div><span class="jg-sm">Tus cartas' + (mano === 0 ? ' · sos mano' : '') + '</span>' + hand(mine) + '</div><div><span class="jg-sm">Las del rival' + (mano === 1 ? ' · es mano' : '') + '</span>' + hand(theirs) + '</div></div>';

const PARDAS = [
  { t: 'Parda en la primera: gana el que gana la segunda', mano: 0, plays: [['3e', '3c'], ['1b', '2o']], win: 0 },
  { t: 'Ganás la primera y la segunda es parda: ganás vos', mano: 1, plays: [['7e', '12b'], ['2c', '2e']], win: 0 },
  { t: 'Una cada uno y la tercera parda: gana el que ganó primero', mano: 0, plays: [['6b', '4c'], ['11o', '1o'], ['5e', '5b']], win: 0 },
  { t: 'Las tres pardas: gana el mano', mano: 1, plays: [['3o', '3b'], ['7b', '7c'], ['4e', '4o']], win: 1 },
];
function pardaExample(x) {
  const o = playOut(x.mano, x.plays);
  must(o.winner === x.win, 'parda ' + x.t);
  return '<li class="jg-pe"><h3>' + x.t + '</h3><p class="jg-note">' + (x.mano === 0 ? 'Vos sos mano.' : 'El rival es mano.') + '</p><ol class="jg-bzl sm">' + o.rows.map(r => bazaBox(r)).join('') + '</ol><p class="jg-big3">' + (o.winner === 0 ? 'Ganás vos la mano' : 'Gana el rival la mano') + '</p></li>';
}

export function trucoChain() {
  const who = { truco: 'Lo canta cualquiera, en su turno', retruco: 'Solo el que recibió el truco', valeCuatro: 'Solo el que cantó el truco' };
  return '<ol class="jg-chn"><li><b>Sin cantar</b><span>La mano vale <em>' + LV[0] + '</em></span><small>Nadie dijo truco</small></li>' +
    Object.entries(TRUCO_CALLS).map(([v, k], i) => '<li><b>' + CALLN[k] + '</b><span>Querido: <em>' + v + '</em></span><span>No querido: <em>' + LV[i] + '</em></span><small>' + who[k] + '</small></li>').join('') + '</ol>';
}
const ENV_CH = [['envido'], ['envido', 'envido'], ['realEnvido'], ['envido', 'realEnvido'], ['envido', 'envido', 'realEnvido'], ['faltaEnvido']];
const envTable = () => '<div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Lo que se cantó</th><th class="n">Si dicen «quiero»</th><th class="n">Si dicen «no quiero»</th></tr></thead><tbody>' +
  ENV_CH.map(c => '<tr><td>' + c.map(k => ENVN[k]).join(' + ') + '</td><td class="n">' + (c.includes('faltaEnvido') ? 'lo que falta' : envidoQuieroValue(R30, c, [0, 0], 0)) + '</td><td class="n">' + envidoNoQuieroValue(c) + '</td></tr>').join('') + '</tbody></table></div>';
function faltaBox() {
  const m = [12, 7], b = [22, 16];
  const m0 = faltaValue(R30, m, 0), m1 = faltaValue(R30, m, 1), b0 = faltaValue(R30, b, 0), b1 = faltaValue(R30, b, 1);
  must(m[0] + m0 === R30.target && m[1] + m1 === R30.target && b[0] + b0 === R30.target && b0 === b1 && b[1] + b1 < R30.target, 'falta');
  return '<div class="jg-fal"><div><span class="jg-sm">En las malas</span><p class="jg-sc"><b>' + m[0] + '</b> a <b>' + m[1] + '</b></p><p>Los dos están en las malas. El que gane la falta envido se lleva lo que le falta para ' + R30.target + ': si gana el de ' + m[0] + ', suma ' + m0 + '; si gana el de ' + m[1] + ', suma ' + m1 + '. En los dos casos, <b>gana el partido</b>.</p></div>' +
    '<div><span class="jg-sm">En las buenas</span><p class="jg-sc"><b>' + b[0] + '</b> a <b>' + b[1] + '</b></p><p>El que va adelante ya está en las buenas: la falta vale lo que le falta a él, ' + b0 + '. Si la gana el de ' + b[0] + ', llega a ' + (b[0] + b0) + ' y gana; si la gana el de ' + b[1] + ', suma ' + b1 + ' y queda en ' + (b[1] + b1) + '.</p></div></div>';
}
function palitos(points, cap) {
  const full = Math.floor(points / 5), rest = points % 5;
  let s = '';
  for (let i = 0; i < full; i++) s += '<i class="jg-pz f5"></i>';
  if (rest) s += '<i class="jg-pz f' + rest + '"></i>';
  for (let i = 0; i < Math.max(0, Math.ceil(cap / 5) - full - (rest ? 1 : 0)); i++) s += '<i class="jg-pz f0"></i>';
  return s;
}
const scoreSide = (name, pts) => '<div class="jg-an"><b>' + name + ' · ' + pts + '</b><small>malas</small><div class="jg-pzr">' + palitos(Math.min(pts, HALF), HALF) + '</div><small>buenas</small><div class="jg-pzr">' + palitos(Math.max(0, pts - HALF), R30.target - HALF) + '</div></div>';
function seats() {
  const arr = '<svg viewBox="0 0 100 100" aria-hidden="true"><defs><marker id="jg-ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>' +
    ['M58 84A36 36 0 0 0 84 58', 'M84 42A36 36 0 0 0 58 16', 'M42 16A36 36 0 0 0 16 42'].map(d => '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="4" marker-end="url(#jg-ar)"/>').join('') + '</svg>';
  return '<div class="jg-st4" role="img" aria-label="Mesa de cuatro vista desde arriba: reparte el de abajo, es mano el de su derecha y el juego sigue en contra de las agujas del reloj">' +
    '<span class="s pt ta">Compañero del que reparte<small>tira 2.º</small></span><span class="s pl tb">Compañero del mano<small>tira 3.º · pie</small></span><i class="m">' + arr + '</i>' +
    '<span class="s pr tb">Mano<small>tira 1.º</small></span><span class="s pb ta">Reparte<small>tira 4.º · pie</small></span></div>';
}
const mazoTable = () => '<div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Cuándo te vas al mazo</th><th class="n">El otro cobra</th></tr></thead><tbody>' +
  '<tr><td>Antes de tirar tu primera carta, sin ningún canto</td><td class="n">' + R30.mazoNoCardPoints + '</td></tr><tr><td>Sin truco cantado, ya con cartas en la mesa</td><td class="n">' + LV[0] + '</td></tr>' +
  Object.entries(TRUCO_CALLS).map(([v, k]) => '<tr><td>Con el ' + CALLN[k].toLowerCase() + ' querido</td><td class="n">' + v + '</td></tr>').join('') + '</tbody></table></div>';
const senaMini = ids => '<div class="jg-sms">' + ids.map(id => { const x = SENAS.find(s => s.id === id); return '<figure><div class="jg-fw">' + face(x.face) + '</div><figcaption><b>' + x.what + '</b>' + x.how + '</figcaption></figure>'; }).join('') + '</div>';

// One whole hand: envido, three bazas, a retruco, the score.
const FULL = { mano: 0, mine: ['7c', '5c', '3e'], theirs: ['6o', '4o', '1b'], plays: [['5c', '6o'], ['7c', '4o'], ['3e', '1b']] };
function fullHand(h) {
  const em = envidoPoints(FULL.mine), et = envidoPoints(FULL.theirs), chain = ['envido'];
  must(em > et, 'full hand envido');
  const ev = envidoQuieroValue(R30, chain, [0, 0], 0);
  const o = playOut(FULL.mano, FULL.plays);
  const tv = +Object.keys(TRUCO_CALLS)[1];
  must(o.winner === 1 && o.rows.length === 3, 'full hand bazas');
  const rows = o.rows;
  return handsBox(FULL.mine, FULL.theirs, FULL.mano) +
    '<ol class="jg-tl2">' +
    '<li><span class="jg-sm">1 · El envido</span>' + dlg([[2, 'Tenés el siete y el cinco de copas: ' + envFormula(FULL.mine).f + '. Antes de tirar, cantás.'], [0, 'Envido.'], [1, 'Quiero.', 'tiene ' + et + ', no sabe cuánto tenés vos'], [0, String(em) + '.', 'sos mano: decís tus puntos primero'], [1, 'Son buenas.', 'tiene menos y no hace falta que diga cuánto'], [2, 'Ganás el envido: <b>' + ev + ' puntos para vos</b>. Al final de la mano mostrás tus copas.']]) + '</li>' +
    '<li><span class="jg-sm">2 · La primera baza</span><ol class="jg-bzl sm">' + bazaBox(rows[0], ' Tiraste la más baja para ver qué tiene el rival.') + '</ol></li>' +
    '<li><span class="jg-sm">3 · La segunda baza</span><ol class="jg-bzl sm">' + bazaBox(rows[1], ' Una baza cada uno: todo se decide en la tercera.') + '</ol></li>' +
    '<li><span class="jg-sm">4 · El truco y la tercera baza</span>' + dlg([[2, 'Te queda el tres de espadas, una carta fuerte. Te toca salir a vos.'], [0, '¡Truco!'], [1, '¡Quiero retruco!', 'solo puede subir el que recibió el truco'], [0, 'Quiero.', 'ahora la mano vale ' + tv]]) + '<ol class="jg-bzl sm">' + bazaBox(rows[2], ' Era un ancho de bastos: por eso el rival se animó a retrucar.') + '</ol></li>' +
    '<li><span class="jg-sm">5 · Se anota</span><p>El rival ganó dos bazas (la primera y la tercera) y cobra el retruco querido: <b>' + tv + ' puntos</b>. Vos te llevás los <b>' + ev + '</b> del envido. La próxima mano reparte otro y el mano pasa a ser el rival.</p></li></ol>';
}

const MAIN_TOC = [['de-que-se-trata', 'De qué se trata'], ['el-mazo', 'El mazo de 40 cartas'], ['valores', 'Qué carta le gana a cuál'], ['reparto', 'El reparto y el mano'], ['bazas', 'Las tres bazas'], ['pardas', 'Pardas: los empates'],
  ['envido', 'El envido: contar puntos'], ['cantar-envido', 'Cantar el envido'], ['truco', 'Truco, retruco y vale cuatro'], ['mazo', 'Irse al mazo'], ['flor', 'La flor'], ['anotar', 'Cómo se anota'], ['senas', 'Las señas'],
  ['ejemplo', 'Una mano entera'], ['errores', 'Errores comunes'], ['preguntas', 'Preguntas'], ['a-jugar', 'A jugar']];

const MAIN_FAQ = h => [
  ['¿Cuántas cartas se reparten en el truco?', 'Tres a cada jugador, de a una, empezando por el mano. Se juega con las ' + DECK_40.length + ' cartas de la baraja española, sin ochos ni nueves.'],
  ['¿Cuál es la carta más alta del truco?', 'El ancho de espadas. Lo siguen el ancho de bastos, el siete de espadas y el siete de oros: son las cuatro bravas.'],
  ['¿Qué pasa si empatan en el envido?', 'Gana el mano, que además es el primero en decir sus puntos.'],
  ['¿Se puede cantar envido después de que me cantaron truco?', 'Sí, mientras no hayas tirado tu primera carta y no hayas querido el truco: el envido se resuelve primero y después se contesta el truco.'],
  ['¿Cuánto vale el truco si no lo quieren?', 'El que cantó cobra ' + LV[0] + '. Un retruco no querido vale ' + LV[1] + ' y un vale cuatro no querido, ' + LV[2] + '.'],
  ['¿A cuántos puntos se juega?', 'Lo más común es a ' + R30.target + ': ' + HALF + ' malas y ' + HALF + ' buenas. También se juega a ' + R15.target + ', y en los Juegos Bonaerenses a ' + R40.target + '.'],
  ['¿Qué es una parda?', 'Una baza empatada: las dos cartas están en el mismo escalón. Si la primera es parda, gana la mano el que gane la segunda.'],
  ['¿Hay que jugar con flor?', 'Solo si se acuerda antes de empezar el partido. Si no se acuerda, se juega sin flor.'],
];

export const trucoReglas = {
  path: '/truco/reglas/', kind: 'game', section: 'truco', css: CSS, js: ['reglas.js', 'trucoguia.js'],
  title: 'Reglas del truco: cómo jugar paso a paso, con ejemplos',
  h1: 'Reglas del truco argentino, paso a paso',
  description: 'Reglas del truco argentino desde cero: las cartas, las tres bazas, las pardas, el envido y el truco, con manos de ejemplo dibujadas y jugadas paso a paso.',
  ld: h => ldT(h, [faqLd(MAIN_FAQ(h))]),
  render(h) {
    const ex = { mano: 0, mine: ['12o', '5c', '3e'], theirs: ['2b', '4e', '7o'], plays: [['12o', '2b'], ['5c', '4e'], ['3e', '7o']] };
    const o = playOut(ex.mano, ex.plays);
    must(o.winner === 1 && o.R.join() === '1,0,1', 'bazas example');
    const bySuit = SUITS.map(s => '<div class="jg-sr"><b>' + cap(SUIT[s]) + '</b>' + minis(NUMBERS_40.map(n => n + s)) + '</div>').join('');
    const fl = [['5o', '6o', '7o'], ['12c', '4c', '1c']];
    fl.forEach(x => must(hasFlor(x), 'flor'));
    const sec = [
      lesson(1, 'de-que-se-trata', 'De qué se trata el truco', two(
        '<p>El truco se juega de a dos (uno contra uno) o de a cuatro (dos parejas). Cada uno recibe tres cartas, y en cada mano hay <b>dos peleas distintas</b>:</p>' +
        '<ul class="jg-ul2"><li><b>El envido.</b> ¿Quién tiene más puntos sumando sus cartas del mismo palo? Se canta al principio y da puntos aparte.</li><li><b>El truco.</b> ¿Quién gana dos de las tres vueltas? Cada uno tira una carta por vez y gana la más fuerte.</li></ul>' +
        '<p>Los puntos se van anotando y gana el partido el primero que llega a <b>' + R30.target + '</b>. Y hay algo que no está en ninguna tabla: el engaño. Podés cantar sin tener nada para asustar al otro, y el otro puede no creerte.</p>',
        '<ol class="jg-flow"><li><b>Reparto</b><small>tres cartas a cada uno</small></li><li><b>Envido</b><small>si alguien lo canta, antes de la primera carta</small></li><li><b>Bazas y truco</b><small>tres vueltas de cartas</small></li><li><b>Se anota</b><small>hasta llegar a ' + R30.target + '</small></li></ol>') +
        cite(h, ['truco.target-30', 'truco.two-bazas', 'truco.deceive'])),
      lesson(2, 'el-mazo', 'El mazo: ' + DECK_40.length + ' cartas españolas', '<p>Se juega con la baraja española <b>sin los ochos ni los nueves</b>: quedan ' + DECK_40.length + ' cartas. Hay cuatro palos (espadas, bastos, oros y copas) y en cada uno, diez cartas: del 1 al 7 y tres figuras, la <b>sota</b> (10), el <b>caballo</b> (11) y el <b>rey</b> (12). A las figuras se les dice «negras», y al as de espadas y al de bastos, «ancho».</p>' +
        '<div class="jg-suits">' + bySuit + '</div>' + cite(h, ['truco.deck-40', 'truco.negras', 'truco.bravas-names'])),
      lesson(3, 'valores', 'Qué carta le gana a cuál', two(
        '<p>En las bazas no gana el número más grande: gana la carta que está <b>más arriba en esta escalera</b>. Arriba de todo están las cuatro <b>bravas</b>, que son únicas. Después vienen los tres, los dos, y así para abajo.</p>' +
        '<p>Del quinto escalón para abajo <b>el palo no importa</b>: un tres de copas y un tres de oros valen lo mismo, y si se cruzan, empatan.</p>' +
        tip('<b>Ojo con los sietes y los ases.</b> El siete de espadas y el de oros son bravas, pero el de bastos y el de copas están casi abajo de todo: son los «falsos». Lo mismo los ases: el de espadas y el de bastos son las dos más altas; el de oros y el de copas van recién después de los dos.') +
        (h.built('/truco/valores-de-las-cartas/') ? '<p><a href="' + h.href('/truco/valores-de-las-cartas/') + '">Tabla para imprimir y un juego para aprendértela</a></p>' : ''),
        ladderMini()) + '<h3>Probalo: tocá dos cartas y mirá quién gana</h3>' + duelTool() + cite(h, ['truco.hierarchy-bravas', 'truco.hierarchy-rest', 'truco.falsos'])),
      lesson(4, 'reparto', 'El reparto y quién es «mano»', two(
        '<p>Uno mezcla y reparte <b>tres cartas a cada uno, de a una por vez</b>, empezando por el que tiene a su derecha. Ese jugador es <b>el mano</b>: es el primero en jugar y, cuando hay un empate, gana él. Ser mano es una ventaja.</p>' +
        '<p>En la mano siguiente reparte el que estaba a la derecha, así que el mano va rotando. En el mano a mano es fácil: una vez sos mano vos y la otra, el rival. Todo el juego va <b>en contra de las agujas del reloj</b>.</p>' +
        '<p>De a cuatro, el último que juega de cada pareja se llama <b>pie</b>: suele ser el que manda en la pareja.</p>' + tip('Tus cartas no se muestran: las mirás vos y nadie más. Las del compañero tampoco, salvo por las señas.'),
        seats()) + cite(h, ['truco.deal-three', 'truco.deal-rotates', 'truco.4p-order', 'truco.4p-mano-right', 'truco.4p-pie'])),
      lesson(5, 'bazas', 'Las tres bazas: así se gana una mano', '<p>Una <b>baza</b> es una vuelta en la que cada uno tira una carta boca arriba. La gana la carta más alta de la escalera. <b>El que gana dos bazas gana la mano</b> y se lleva los puntos del truco, aunque nadie lo haya cantado (en ese caso, ' + LV[0] + ').</p>' +
        '<p>¿Quién tira primero? En la primera baza, el mano. En la segunda y la tercera, <b>el que ganó la anterior</b>. Si alguien gana las dos primeras, la tercera ni se juega. Y carta tirada es carta jugada: no se puede retirar.</p>' +
        '<h3>Un ejemplo, carta por carta</h3>' + handsBox(ex.mine, ex.theirs, ex.mano) + '<ol class="jg-bzl">' + o.rows.map(r => bazaBox(r, r.i === 1 ? ' Tiraste el rey para guardar el tres.' : r.i === 2 ? ' Como el rival ganó la primera, salió él.' : ' El tres es fuerte, pero el siete de oros es una brava.')).join('') + '</ol>' +
        '<p class="jg-big3">Gana el rival: hizo la primera y la tercera. Nadie cantó truco, así que se anota ' + LV[0] + '.</p>' +
        cite(h, ['truco.baza-highest', 'truco.two-bazas', 'truco.third-not-needed', 'truco.truco-callado', 'truco.card-played'])),
      lesson(6, 'pardas', 'Pardas: cuando las cartas empatan', '<p>Si las dos cartas de una baza están en el mismo escalón (dos tres, por ejemplo), la baza es <b>parda</b>: no la gana nadie. Después de una parda sale el mano. Para saber quién gana la mano hay cuatro reglas, y se aprenden mirando:</p>' +
        '<ol class="jg-pes">' + PARDAS.map(pardaExample).join('') + '</ol>' +
        '<div class="jg-qw" id="quien-gana" data-quien aria-live="polite"><h3>¿Quién ganó? Probá vos</h3><p class="jg-mu">Marcá qué pasó en cada baza, desde tu lado.</p><div class="jg-bz">' + [1, 2, 3].map(i => '<div><span class="jg-sm">Baza ' + i + '</span><div class="jg-sg" role="group" data-baza="' + i + '" aria-label="Baza ' + i + '">' + [['0', 'Gané'], ['1', 'Perdí'], ['-1', 'Parda'], ['', 'No se jugó']].map(([v, l]) => '<button type="button" data-v="' + v + '" aria-pressed="' + ((i === 1 && v === '0') || (i === 2 && v === '-1') || (i === 3 && v === '') ? 'true' : 'false') + '">' + l + '</button>').join('') + '</div></div>').join('') + '</div>' +
        '<label class="jg-chk2"><input type="checkbox" data-mano checked> Yo soy mano</label><p class="jg-big2" data-o="who">Ganaste vos</p><p class="jg-hon" data-o="why">Ganaste la primera baza y la segunda fue parda: gana el que ganó la primera.</p></div>' +
        cite(h, ['truco.parda-first', 'truco.parda-next-decides', 'truco.parda-one-each', 'truco.parda-all-three'])),
      lesson(7, 'envido', 'El envido: cómo contar tus puntos', '<p>El envido es una apuesta aparte sobre <b>los puntos de tus cartas</b>. Acá las cartas valen otra cosa que en las bazas. Se cuenta así:</p>' +
        '<ol class="jg-r3"><li><b>Cada carta vale su número.</b> Las figuras (sota, caballo y rey) valen 0.' + '<div class="jg-evh">' + cv('7o', true) + cv('12c', true) + '</div></li><li><b>Dos del mismo palo:</b> sumás esas dos y le agregás 20.<div class="jg-evh">' + cv('5e', true) + cv('3e', true) + '</div></li><li><b>Tres palos distintos:</b> vale solo la carta más alta.<div class="jg-evh">' + cv('6b', true) + cv('2o') + cv('11c') + '</div></li></ol>' +
        '<h3>Cinco manos de ejemplo</h3><ol class="jg-evs">' + ENV_EX.map(([x, n]) => envExample(x, n)).join('') + '</ol>' +
        '<h3>Armá tu mano y calculá tu envido</h3>' + envArmar() + cite(h, ['truco.envido-figures-zero', 'truco.envido-count', 'truco.envido-max-33', 'truco.envido-min-0', 'truco.envido-three-of-suit'])),
      lesson(8, 'cantar-envido', 'Cómo se canta el envido y cuánto vale', two(
        '<ol class="jg-ul2 num"><li><b>Se canta antes de tirar tu primera carta.</b> Después ya no vale.</li><li><b>El otro contesta</b> «quiero», «no quiero» o sube con otro envido, real envido o falta envido. Subir ya es querer lo anterior.</li><li><b>Si se quiere, dice sus puntos primero el mano.</b> El otro dice los suyos, o «son buenas» si tiene menos. Gana el que tiene más; si empatan, gana el mano.</li><li><b>El que gana muestra las cartas</b> al final. Si se equivocó al contar, los puntos son del otro.</li></ol>' +
        tip('<b>El envido está primero.</b> Si te cantan truco antes de que hayas tirado tu primera carta, todavía podés cantar envido: se resuelve el envido y después contestás el truco.'),
        dlg([[2, 'Tenés el seis y el dos de bastos: ' + envFormula(['6b', '2b', '4o']).f + '.'], [1, 'Envido.'], [0, 'Envido.', 'subís: ya es como decir quiero'], [1, 'Quiero.'], [0, envidoPoints(['6b', '2b', '4o']) + '.', 'sos mano: hablás primero'], [1, 'Son buenas.'], [2, 'Ganás <b>' + envidoQuieroValue(R30, ['envido', 'envido'], [0, 0], 0) + ' puntos</b> (envido y envido, querido).']])) +
        '<h3>Cuánto vale cada canto</h3>' + envTable() + '<h3>La falta envido, con dos ejemplos</h3><p>La falta envido no tiene un valor fijo: depende del tanteador. Partido a ' + R30.target + ':</p>' + faltaBox() +
        cite(h, ['truco.envido-before-card', 'truco.envido-revido-accepts', 'truco.envido-mano-first', 'truco.4p-son-buenas', 'truco.envido-tie-mano', 'truco.envido-show', 'truco.envido-wrong-count', 'truco.envido-first-over-truco', 'truco.envido-table-ee', 'truco.envido-table-r', 'truco.envido-no-quiero', 'truco.falta-malas-wins-match'])),
      lesson(9, 'truco', 'El truco: truco, retruco y vale cuatro', '<p>Si nadie canta nada, el que gana las bazas se lleva ' + LV[0] + ' punto. Para que la mano valga más, alguien canta <b>truco</b>. El otro tiene tres respuestas: «quiero» (se juega por más), «no quiero» (la mano termina y el que cantó cobra) o subir con «quiero retruco».</p>' + trucoChain() +
        two('<ul class="jg-ul2"><li><b>Solo sube el que recibió el último canto</b>, y primero tiene que querer: «quiero retruco», «quiero vale cuatro».</li><li><b>Se canta en tu turno, en cualquier momento de la mano</b>; muchos esperan a la segunda baza para saber más.</li><li><b>Vale cuatro es lo máximo.</b> Después solo queda jugar las cartas.</li><li><b>Si no contestás, es «no quiero».</b> Y cuidado: «quiero» y «no quiero» obligan aunque los digas en chiste.</li></ul>',
          dlg([[0, '¡Truco!'], [1, '¡Quiero retruco!'], [0, '¡Quiero vale cuatro!'], [1, 'No quiero.'], [2, 'El rival no se animó: cobrás <b>' + LV[2] + ' puntos</b>, lo que valía el retruco.']])) +
        cite(h, ['truco.truco-callado', 'truco.truco-no-querido', 'truco.truco-retruco-values', 'truco.retruco-by-challenged', 'truco.retruco-needs-quiero', 'truco.retruco-no-querido', 'truco.vale-cuatro-who', 'truco.vale-cuatro', 'truco.vale-cuatro-top', 'truco.truco-any-time', 'truco.no-answer-no-quiero', 'truco.reserved-words'])),
      lesson(10, 'mazo', 'Irse al mazo', two('<p>Si tus cartas son malas podés <b>abandonar la mano</b>: dejás tus cartas boca abajo sobre el mazo y el otro cobra lo que estaba en juego. Sirve para no perder más de la cuenta.</p>' +
        tip('Si ganaste el envido y te vas al mazo sin mostrar tus cartas, perdés esos puntos: mostralas antes.') + '<p>De a cuatro, si te vas vos solo, tu compañero sigue jugando.</p>', mazoTable()) +
        cite(h, ['truco.mazo-what', 'truco.mazo-before-cards', 'truco.envido-mazo-show', 'truco.4p-mazo-alone'])),
      lesson(11, 'flor', 'La flor (solo si se acuerda antes)', two('<p><b>Flor</b> es tener las tres cartas del mismo palo. Antes de empezar el partido se decide si se juega con flor; si no se acuerda, se juega sin. Con flor, el que la tiene <b>está obligado a cantarla</b>, se lleva ' + FLOR_POINTS.alone + ' puntos y el envido de esa mano no se juega.</p><p>Para comparar dos flores se cuentan como el envido, pero con las tres cartas: 20 más las tres.</p>' +
        (h.built('/truco/flor/') ? '<p><a href="' + h.href('/truco/flor/') + '">Contraflor, «con flor me achico» y cada cuánto sale una flor</a></p>' : ''),
        fl.map(x => '<div class="jg-flr">' + hand(x) + '<p class="jg-fm">' + x.map(c => ENVIDO_VALUE[c]).join(' + ') + ' + 20 = <b>' + florPoints(x) + '</b></p></div>').join('')) +
        cite(h, ['truco.flor-optional', 'truco.flor-three', 'truco.flor-cancels-envido', 'truco.flor-value', 'truco.flor-max-38'])),
      lesson(12, 'anotar', 'Cómo se anota: malas y buenas', two('<p>Cada punto es un palito. Se dibujan cuatro formando un cuadrado y el quinto lo cruza en diagonal: <b>cada cuadrado son 5 puntos</b>. A ' + R30.target + ', los primeros ' + HALF + ' son <b>las malas</b> y los otros ' + (R30.target - HALF) + ', <b>las buenas</b>.</p><p>Importa saber en cuál estás: la falta envido cambia según estés en las malas o en las buenas. Si juegan a ' + R15.target + ', no hay malas ni buenas; en los Juegos Bonaerenses se juega a ' + R40.target + ', con ' + buenasAt(R40) + ' malas y ' + buenasAt(R40) + ' buenas.</p>' +
        (h.built('/truco/anotador/') ? '<p><a href="' + h.href('/truco/anotador/') + '">Anotador con fósforos para el celu</a></p>' : ''),
        '<div class="jg-ans">' + scoreSide('Nosotros', 18) + scoreSide('Ellos', 9) + '</div><p class="jg-note">Nosotros: ' + HALF + ' malas y ' + (18 - HALF) + ' buenas. Ellos: ' + 9 + ' malas.</p>') +
        cite(h, ['truco.target-30', 'truco.malas-buenas-15', 'truco.target-40', 'truco.malas-buenas-40'])),
      lesson(13, 'senas', 'Las señas (de a cuatro)', '<p>De a cuatro se vale avisarle a tu compañero qué cartas tenés, con gestos. Los rivales también pueden verlas, así que se hacen rápido y disimulando.</p>' + senaMini(['1e', 'tres', 'malas']) +
        (h.built('/truco/senas/') ? '<p><a href="' + h.href('/truco/senas/') + '">Las nueve señas, con dibujo y un entrenador</a></p>' : '') + cite(h, ['truco.4p-senas', 'truco.4p-senas-visible'])),
      lesson(14, 'ejemplo', 'Una mano entera, de punta a punta', '<p>Ahora todo junto: reparto, envido, bazas y truco, como en una mesa de verdad.</p>' + fullHand(h)),
      lesson(15, 'errores', 'Errores comunes de los que empiezan', '<ul class="jg-err">' +
        '<li><b>Creer que todos los sietes son bravas.</b> Solo el de espadas y el de oros; el de bastos y el de copas están en el escalón ' + step('7c') + '.</li>' +
        '<li><b>Contar las figuras como 10 en el envido.</b> Valen 0.</li>' +
        '<li><b>Cantar envido después de tirar tu primera carta.</b> Ya no vale.</li>' +
        '<li><b>Retrucar sin decir «quiero».</b> Se dice «quiero retruco».</li>' +
        '<li><b>Olvidarse de que el mano gana los empates</b>: en el envido y cuando las tres bazas son pardas.</li>' +
        '<li><b>Irse al mazo con el envido ganado sin mostrar las cartas.</b> Perdés esos puntos.</li>' +
        '<li><b>Decir «quiero» o «no quiero» en chiste.</b> Cuenta igual.</li>' +
        '<li><b>Tirar una carta y querer cambiarla.</b> Carta tirada, carta jugada.</li></ul>' +
        '<p class="jg-note">Cada uno de estos errores tiene su regla, con la cita del reglamento, en la lección de arriba.</p>'),
    ];
    return SPRITE + hero(h, { kicker: 'Truco · guía desde cero', scene: 'truco-reglas', lede: 'Si nunca jugaste, empezá por acá. Primero las cartas, después cómo se gana una mano y al final los cantos, con manos de ejemplo dibujadas y la cita del reglamento en cada regla.', actions: '<a class="jg-b p" href="#de-que-se-trata">Empezar la guía</a>' + knowLink(h) }) +
      '<div class="jg-mn">' + toc(MAIN_TOC) + sec.join('') +
      faq(h, 'Preguntas que se hace todo el que empieza', MAIN_FAQ(h), ['truco.envido-first-over-truco', 'truco.target-40']) +
      cta(h, 'Ahora, a jugar', 'Lo mejor para aprender es jugar unas manos. La compu no ve tus cartas y te muestra qué pasó en cada baza.', [['/truco/jugar/', 'Jugar contra la compu'], ['/truco/anotador/', 'Anotador'], ['/truco/quiero-o-no-quiero/', 'Entrenar el quiero']]) +
      more(h, '/truco/reglas/') + '</div>';
  },
};

const VAL_FAQ = () => {
  const beats = c => DECK_40.filter(x => POWER[x] < POWER[c]).length;
  const over3 = DECK_40.filter(x => POWER[x] > POWER['3e']);
  return [
    ['¿Cuál es la carta más alta del truco?', 'El ancho de espadas: le gana a las otras ' + beats('1e') + '. Después vienen el ancho de bastos, el siete de espadas y el siete de oros.'],
    ['¿Qué cartas le ganan a un tres?', 'Solo las cuatro bravas: ' + over3.map(nm).join(', ') + '.'],
    ['¿El siete de copas es una carta buena?', 'No: es un siete falso, está en el escalón ' + step('7c') + ' de ' + LADDER.length + '. Solo le gana a los seis, los cincos y los cuatros.'],
    ['¿Qué pasa si se tiran dos cartas del mismo valor?', 'La baza es parda: nadie la gana. Si la primera es parda, gana la mano el que gane la segunda.'],
    ['¿Cuál es la carta más baja?', 'Los cuatro, de cualquier palo. No le ganan a ninguna carta.'],
    ['¿Para el envido las cartas valen lo mismo?', 'No. Para el envido cada carta vale su número y las figuras valen 0, sin importar el escalón.'],
  ];
};
export const trucoValores = {
  path: '/truco/valores-de-las-cartas/', kind: 'game', section: 'truco', css: CSS, js: ['valores.js', 'trucoguia.js'],
  title: 'Valores del truco: tabla de cartas de mayor a menor',
  h1: 'Valores de las cartas del truco',
  description: 'Valores del truco argentino de mayor a menor: las 40 cartas en orden, las cuatro bravas, los falsos y las negras, con ejemplos y un juego para aprenderlas.',
  ld: h => ldT(h, [faqLd(VAL_FAQ())]),
  render(h) {
    const rows = LADDER.map((cs, i) => {
      const beats = DECK_40.filter(c => POWER[c] < POWER[cs[0]]).length;
      return '<li><span class="jg-lv">' + (i + 1) + '</span><div><b class="jg-lgn">' + GROUP[POWER[cs[0]]] + '</b><div class="jg-hand sm">' + cs.map(c => card(c, ' tabindex="0" data-card="' + c + '"')).join('') + '</div></div><small>mata a ' + beats + '</small></li>';
    }).join('');
    const pairs = [['1e', '1b'], ['3c', '3o'], ['7o', '7c'], ['2e', '12e']];
    const cmp = ['1e', '7e', '3c', '12o', '7c', '4b'];
    const comunes = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(p => LADDER[LADDER.length - p]);
    return SPRITE + hero(h, { kicker: 'Truco · ' + LADDER.length + ' escalones', scene: 'truco-valores', lede: 'Arriba de todo, las cuatro bravas. Después, los tres, los dos y el resto. Las cartas del mismo escalón empatan: es parda. Abajo te explicamos cómo leer la tabla y cómo aprendértela.', actions: '<button class="jg-b" type="button" data-print>Imprimir machete</button>' + knowLink(h) }) +
      '<div class="jg-mn"><section class="jg-c w2 jg-lad"><span class="jg-sm">De mayor a menor</span><h2>Las ' + DECK_40.length + ' cartas en orden</h2><ol class="jg-ladder">' + rows + '</ol></section>' +
      '<section class="jg-c t2 jg-pick" aria-live="polite"><span class="jg-sm">Tocá una carta de la tabla</span><h2 data-o="name">Ancho de espadas</h2><div data-o="card">' + card('1e') + '</div><p class="jg-hon" data-o="text">Es la carta más alta: mata a las otras ' + (DECK_40.length - 1) + '.</p>' +
      '<h3>Aprendé jugando</h3><p class="jg-mu">¿Cuál de las dos gana? Tocala.</p><div class="jg-quiz" data-quiz><div class="jg-hand" data-o="qa"></div><p class="jg-res" data-o="qr"></p><p class="jg-note">Racha: <b data-o="streak">0</b></p></div></section>' +
      toc([['como-leer', 'Cómo se lee la tabla'], ['bravas', 'Las cuatro bravas'], ['comunes', 'El resto, sin importar el palo'], ['duelo', 'Probá con dos cartas'], ['envido', 'Para el envido valen otra cosa'], ['errores', 'Errores comunes'], ['preguntas', 'Preguntas']]) +
      lesson(1, 'como-leer', 'Cómo se lee la tabla', '<p>Cada fila es un <b>escalón</b>. Una carta le gana a todas las que están más abajo. Si dos cartas están en el mismo escalón, <b>empatan</b> y la baza es parda. No importa el número que tiene impreso: un dos le gana a un rey, y un tres le gana a un dos.</p>' +
        '<ol class="jg-bzl">' + pairs.map((p, i) => bazaBox({ i: i + 1, pair: p, lead: 0 }).replace(/<span class="jg-sm">[^<]*<\/span>/, '<span class="jg-sm">Ejemplo ' + (i + 1) + '</span>').replace(/<small>Vos<\/small>/, '<small>Carta 1</small>').replace(/<small>Rival<\/small>/, '<small>Carta 2</small>').replace('Ganás vos.', 'Gana la carta 1.').replace('Gana el rival.', 'Gana la carta 2.')).join('') + '</ol>' +
        cite(h, ['truco.hierarchy-bravas', 'truco.hierarchy-rest'])) +
      lesson(2, 'bravas', 'Las cuatro bravas', '<p>Son las cuatro cartas más fuertes y cada una es única: no hay otra igual en el mazo. Al as de espadas le dicen <b>«espadilla»</b> o «ancho de espadas», y al de bastos, <b>«bastillo»</b> o «ancho de bastos».</p>' +
        '<div class="jg-brv">' + LADDER.slice(0, 4).map(([c], i) => '<figure>' + card(c) + '<figcaption><b>' + (i + 1) + '.º · ' + cap(nm(c)) + '</b>mata a ' + DECK_40.filter(x => POWER[x] < POWER[c]).length + '</figcaption></figure>').join('') + '</div>' +
        tip('Con una brava en la mano, el truco se canta con más confianza. Pero ojo: el rival también puede tener una.') + cite(h, ['truco.bravas-names', 'truco.hierarchy-bravas'])) +
      lesson(3, 'comunes', 'Después de las bravas: el resto, sin importar el palo', two('<p>Del quinto escalón para abajo el orden es por número y el palo da igual: <b>3, 2, as, rey, caballo, sota, 7, 6, 5 y 4</b>.</p><p>Las trampas son dos: los <b>ases falsos</b> (de oros y de copas) van después de los dos, y los <b>sietes falsos</b> (de bastos y de copas) van después de la sota. A las figuras se les dice «negras».</p>' +
        tip('Una forma de acordarse: contá para atrás desde el tres (3, 2, 1) y seguí con las figuras de mayor a menor (12, 11, 10); después, para atrás desde el siete (7, 6, 5, 4).'),
        '<ol class="jg-cmn">' + comunes.map(cs => '<li><b>' + GROUP[POWER[cs[0]]] + '</b>' + minis(cs) + '</li>').join('') + '</ol>') + cite(h, ['truco.hierarchy-rest', 'truco.hierarchy-rest-2', 'truco.falsos', 'truco.negras'])) +
      lesson(4, 'duelo', 'Probá: tocá dos cartas y mirá quién gana', duelTool('7o', '3b')) +
      lesson(5, 'envido', 'Ojo: para el envido las cartas valen otra cosa', '<p>Esta tabla es para las bazas. Para el envido cada carta vale su número y las figuras valen 0. Por eso una carta puede ser fuerte para una cosa y floja para la otra:</p>' +
        '<div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Carta</th><th class="n">Escalón en las bazas</th><th class="n">Vale para el envido</th></tr></thead><tbody>' + cmp.map(c => '<tr><td>' + cap(nm(c)) + '</td><td class="n">' + step(c) + '.º</td><td class="n">' + ENVIDO_VALUE[c] + '</td></tr>').join('') + '</tbody></table></div>' +
        (h.built('/truco/envido/') ? '<p><a href="' + h.href('/truco/envido/') + '">Cómo se cuenta el envido</a></p>' : '') + cite(h, ['truco.envido-figures-zero'])) +
      lesson(6, 'errores', 'Errores comunes', '<ul class="jg-err"><li><b>Pensar que el número manda.</b> El rey (12) pierde contra el dos y contra el tres.</li><li><b>Creer que todos los ases son altos.</b> El de oros y el de copas están en el escalón ' + step('1o') + '.</li><li><b>Creer que todos los sietes son bravas.</b> El de bastos y el de copas están en el escalón ' + step('7b') + '.</li><li><b>Pensar que el palo desempata.</b> Dos tres de distinto palo empatan: es parda.</li></ul>' + cite(h, ['truco.falsos', 'truco.hierarchy-rest'])) +
      faq(h, 'Preguntas sobre los valores', VAL_FAQ(), ['truco.hierarchy-bravas', 'truco.hierarchy-rest', 'truco.parda-first', 'truco.envido-figures-zero']) +
      cta(h, 'Probá la tabla en una mano de verdad', 'Contra la compu vas a ver enseguida qué carta mata a cuál.', [['/truco/jugar/', 'Jugar contra la compu'], ['/truco/reglas/', 'Las reglas completas']]) + more(h, '/truco/valores-de-las-cartas/') + '</div>';
  },
};

const QUOTE_OF = { '1e': '4p-senas-1e', '1b': '4p-senas-1b', '7e': '4p-senas-7e', '7o': '4p-senas-7o', tres: '4p-senas-tres', dos: '4p-senas-dos', falso: '4p-senas-falso', malas: '4p-senas-malas', envido: '4p-senas-envido' };
const SEN_FAQ = () => [
  ['¿Cuántas señas tiene el truco?', 'Las más comunes son ' + SENAS.length + ': siete para cartas (los dos anchos, los dos sietes bravos, los tres, los dos y los ases falsos) y dos para avisar malas cartas o un buen envido.'],
  ['¿Las señas se usan en el mano a mano?', 'No: sirven para avisarle al compañero, así que se usan de a cuatro (o de a seis).'],
  ['¿Es trampa hacer señas?', 'No, están permitidas. Pero los rivales también pueden verlas.'],
  ['¿Cada mesa tiene sus propias señas?', 'Puede: las señas cambian de un lugar a otro y cada pareja puede armar su código. Estas son las más comunes.'],
  ['¿Cuál es la seña del ancho de espadas?', 'Levantar las cejas.'],
];
export const trucoSenas = {
  path: '/truco/senas/', kind: 'game', section: 'truco', css: CSS, js: ['senas.js'],
  title: 'Señas del truco: todas, con dibujo y significado',
  h1: 'Las señas del truco',
  description: 'Todas las señas del truco argentino con dibujo y significado: cuándo se hacen, cómo se usan en una mano de a cuatro y un entrenador para aprenderlas.',
  ld: h => ldT(h, [faqLd(SEN_FAQ())]),
  data: () => ({ s: SENAS.map(x => ({ id: x.id, what: x.what, face: face(x.face) })) }),
  render(h) {
    const sena = x => '<article class="jg-sena"><div class="jg-fw">' + face(x.face) + '</div><div><h3>' + x.what + '</h3><p>' + x.how + '.</p>' + (x.cards.length ? '<div class="jg-hand xs">' + x.cards.map(c => card(c)).join('') + '</div>' : '') + cite(h, 'truco.' + QUOTE_OF[x.id]) + '</div></article>';
    const cardsS = SENAS.filter(x => x.cards.length), restS = SENAS.filter(x => !x.cards.length);
    const s1e = SENAS.find(x => x.id === '1e'), sm = SENAS.find(x => x.id === 'malas');
    return SPRITE + hero(h, { kicker: 'Truco · de a cuatro', scene: 'truco-senas', lede: 'En el truco de parejas se vale avisarle al compañero qué tenés, con gestos. Acá están las más comunes, dibujadas, y cómo se usan en una mano.', actions: '<a class="jg-b p" href="#todas">Ver las señas</a><a class="jg-b" href="#entrenador">Entrenador</a>' }) +
      '<div class="jg-mn">' + toc([['que-son', 'Qué son y cuándo se hacen'], ['todas', 'Todas las señas'], ['en-una-mano', 'Cómo se usan en una mano'], ['entrenador', 'Entrenador'], ['consejos', 'Consejos y errores'], ['preguntas', 'Preguntas']]) +
      lesson(1, 'que-son', 'Qué son y cuándo se hacen', two('<p>Las señas son <b>gestos de la cara</b> para contarle a tu compañero qué cartas tenés, sin hablar. Se usan <b>de a cuatro</b>: en el mano a mano no hay a quién avisarle.</p><p>Se hacen apenas mirás tus cartas, antes de jugar, y al mismo tiempo mirás las de tu compañero. Están permitidas, pero <b>los rivales también miran</b>: por eso se hacen rápido y disimulando.</p><p>Cada mesa puede tener sus propias señas; antes de jugar, acordalas con tu compañero.</p>',
        '<div class="jg-two-f"><figure><div class="jg-fw">' + face(s1e.face) + '</div><figcaption>Tu compañero levanta las cejas</figcaption></figure><span aria-hidden="true">→</span><figure>' + card('1e') + '<figcaption>Tiene el ancho de espadas</figcaption></figure></div>') +
        cite(h, ['truco.4p-senas', 'truco.senas-when', 'truco.senas-own-code', 'truco.4p-senas-visible'])) +
      '<section class="jg-c w3 jg-ls" id="todas"><header class="jg-lh"><span class="jg-ln" aria-hidden="true">2</span><h2>Todas las señas</h2></header><h3>Para las cartas del truco</h3><div class="jg-senas2">' + cardsS.map(sena).join('') + '</div><h3>Para avisar cómo venís</h3><div class="jg-senas2">' + restS.map(sena).join('') + '</div></section>' +
      lesson(3, 'en-una-mano', 'Cómo se usan en una mano: un ejemplo', '<p>Juegan vos y tu compañero contra dos rivales. Tus cartas:</p>' + hand(['3c', '6b', '5o']) +
        dlg([[2, 'Mirás a tu compañero: <b>levanta las cejas</b>. Tiene el ancho de espadas, la carta más alta.'], [2, 'Vos tenés un tres. Entre los dos, la pareja viene fuerte para las bazas: te podés animar a cantar truco, y si te retrucan, a querer.'], [0, '¡Truco!'], [2, 'En otra mano, tu compañero <b>cierra los ojos</b>: tiene malas cartas. Si te cantan retruco con solo un cinco y un seis, lo mejor es no querer.']]) +
        '<div class="jg-sms">' + [s1e, sm].map(x => '<figure><div class="jg-fw">' + face(x.face) + '</div><figcaption><b>' + x.what + '</b>' + x.how + '</figcaption></figure>').join('') + '</div>') +
      '<section class="jg-c w3 jg-train" id="entrenador" data-senas><span class="jg-tag">Entrenador</span><h2>¿Qué te está diciendo?</h2><div class="jg-tr2"><div class="jg-fw big" data-o="face"></div><div><p class="jg-mu">Tenés 5 segundos para elegir.</p><div class="jg-opts" data-o="opts"></div><p class="jg-res" data-o="res"></p><p class="jg-note">Aciertos: <b data-o="ok">0</b> de <b data-o="n">0</b></p><button class="jg-b p" type="button" data-start>Empezar</button></div></div></section>' +
      lesson(4, 'consejos', 'Consejos y errores comunes', '<ul class="jg-err"><li><b>Hacerla lenta o exagerada.</b> Si la ven los rivales, la seña les sirve a ellos.</li><li><b>Mirar solo tus cartas.</b> Al mismo tiempo, mirá a tu compañero: sus señas valen tanto como las tuyas.</li><li><b>Inventar señas en la mesa.</b> Si no las acordaron antes, tu compañero no las va a entender.</li><li><b>Creer que la del envido dice cuánto tenés.</b> Inclinar la cabeza avisa que venís bien para el envido, no el número.</li></ul>' + cite(h, ['truco.4p-senas-visible', 'truco.senas-own-code', 'truco.4p-senas-envido'])) +
      faq(h, 'Preguntas sobre las señas', SEN_FAQ(), ['truco.4p-senas', 'truco.4p-senas-visible', 'truco.senas-own-code', 'truco.4p-senas-1e']) +
      cta(h, 'Usalas en una partida de a cuatro', 'En el juego, elegí «De a 4»: tu compañero lee tus señas y te hace las suyas.', [['/truco/jugar/', 'Jugar de a cuatro'], ['/truco/reglas/', 'Las reglas completas']]) + more(h, '/truco/senas/') + '</div>';
  },
};

const ENV_FAQ = () => [
  ['¿Cuál es el envido más alto?', 'Con flor fuera del juego, ' + Math.max(...DECK_40.flatMap(a => DECK_40.map(b => a !== b && a.slice(-1) === b.slice(-1) ? 20 + ENVIDO_VALUE[a] + ENVIDO_VALUE[b] : 0))) + ': el siete y el seis del mismo palo.'],
  ['¿Cuánto valen las figuras en el envido?', 'Cero. La sota, el caballo y el rey no suman, pero sirven para tener dos del mismo palo.'],
  ['¿Qué pasa si empatan en el envido?', 'Gana el mano.'],
  ['¿Cuándo se puede cantar envido?', 'Antes de tirar tu primera carta. Si te cantaron truco y todavía no tiraste, podés cantar envido primero.'],
  ['¿Cuánto vale el envido no querido?', 'El que lo cantó se lleva ' + envidoNoQuieroValue(['envido']) + '. Si ya se había subido, se lleva lo que estaba querido hasta ahí.'],
  ['¿Hay que mostrar las cartas del envido?', 'Sí: el que gana las muestra al final de la mano. Si se equivocó al contar, los puntos son del otro.'],
];
export const trucoEnvido = {
  path: '/truco/envido/', kind: 'game', section: 'truco', css: CSS, js: ['envido.js'],
  title: 'Envido: cómo contar los tantos, con ejemplos',
  h1: 'Envido: cómo contar tus tantos',
  description: 'Cómo contar el envido del truco con ejemplos dibujados: el 20 del mismo palo, las figuras en cero, cómo se canta, cuánto vale y qué chance tiene tu mano.',
  ld: h => ldT(h, [faqLd(ENV_FAQ())]),
  render(h) {
    const d = envidoDistribution({ flor: false });
    const keys = Object.keys(d.counts).map(Number).sort((a, b) => a - b);
    const max = Math.max(...keys.map(k => d.counts[k]));
    let atLeast = 0;
    const cum = {};
    for (const k of keys.slice().reverse()) { atLeast += d.counts[k]; cum[k] = atLeast; }
    const bars = '<div class="jg-hist" data-nosnippet>' + keys.map(k => '<div title="' + k + ' tantos"><i style="height:' + Math.max(2, Math.round(100 * d.counts[k] / max)) + '%"></i><small>' + k + '</small></div>').join('') + '</div>';
    const ref = [20, 25, 27, 28, 30, 31, 33].filter(k => cum[k]);
    const fl = florChance();
    let three = 0;
    combinations(DECK_40, 3, hh => { if (new Set(hh.map(c => c.slice(-1))).size === 1) three++; });
    const picker = '<div class="jg-deck" data-picker>' + DECK_40.map(c => card(c, ' data-card="' + c + '" tabindex="0"')).join('') + '</div>';
    return SPRITE + hero(h, { kicker: 'Truco · envido', scene: 'truco-envido', lede: 'Dos cartas del mismo palo: 20 más lo que valen. Las figuras valen cero. Si no tenés dos del mismo palo, vale tu carta más alta. Abajo, con dibujos y cinco manos de ejemplo.', actions: '<a class="jg-b p" href="#calculadora">Calcular mi envido</a>' + knowLink(h) }) +
      '<div class="jg-mn">' +
      lesson(1, 'como-se-cuenta', 'Cómo se cuenta, en tres reglas', '<ol class="jg-r3"><li><b>Cada carta vale su número.</b> Las figuras (sota, caballo y rey) valen 0.<div class="jg-evh">' + cv('7o', true) + cv('12c', true) + '</div></li><li><b>Dos del mismo palo:</b> sumás esas dos y le agregás 20.<div class="jg-evh">' + cv('5e', true) + cv('3e', true) + '</div></li><li><b>Tres palos distintos:</b> vale solo la carta más alta.<div class="jg-evh">' + cv('6b', true) + cv('2o') + cv('11c') + '</div></li></ol>' +
        tip('Acá no importa la escalera de las bazas: el ancho de espadas vale 1 y un siete de copas vale 7.') + cite(h, ['truco.envido-figures-zero', 'truco.envido-count'])) +
      toc([['como-se-cuenta', 'Cómo se cuenta'], ['ejemplos', 'Cinco manos de ejemplo'], ['calculadora', 'Calculá tu envido'], ['cantar', 'Cómo se canta'], ['cuanto-vale', 'Cuánto vale'], ['falta', 'La falta envido'], ['chances', 'Qué tan bueno es tu envido'], ['errores', 'Errores comunes'], ['preguntas', 'Preguntas']]) +
      lesson(2, 'ejemplos', 'Cinco manos de ejemplo', '<p>Las cartas que cuentan están resaltadas y abajo de cada una, lo que vale.</p><ol class="jg-evs">' + ENV_EX.map(([x, n]) => envExample(x, n)).join('') + '</ol>' + cite(h, ['truco.envido-max-33', 'truco.envido-min-0', 'truco.envido-three-of-suit'])) +
      '<section class="jg-c w2" id="calculadora" data-envido><span class="jg-tag">Calculadora</span><h2>Elegí tus tres cartas</h2>' + picker + '<p class="jg-note">Tocá tres cartas. Volvé a tocar una para sacarla.</p></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Tus tantos</span><div class="jg-hand" data-o="hand"></div><p class="jg-win"><span>Envido</span><b data-o="pts">-</b></p><p data-o="why" class="jg-mu"></p>' +
      '<div class="jg-sg" role="group" aria-label="Quién es mano"><button type="button" aria-pressed="true" data-mano="1">Soy mano</button><button type="button" aria-pressed="false" data-mano="0">No soy mano</button></div>' +
      '<p class="jg-hon" data-o="vs">Elegí tres cartas para ver la chance contra una mano al azar de las 37 que quedan.</p></section>' +
      lesson(3, 'cantar', 'Cómo se canta el envido', two('<ol class="jg-ul2 num"><li><b>Antes de tirar tu primera carta.</b> Después ya no vale.</li><li><b>El otro contesta</b> «quiero», «no quiero» o sube: otro envido, real envido o falta envido. Subir ya es querer lo anterior.</li><li><b>Si se quiere, el mano dice sus puntos primero.</b> El otro dice los suyos o «son buenas». Si empatan, gana el mano.</li><li><b>El que gana muestra las cartas</b> al final de la mano.</li></ol>' + tip('<b>El envido está primero:</b> si te cantan truco y todavía no tiraste tu primera carta, podés cantar envido antes de contestar.'),
        dlg([[0, 'Envido.', 'tenés 7 y 5 de copas: ' + envidoPoints(['7c', '5c', '3e'])], [1, 'Real envido.', 'sube: ya quiso tu envido'], [0, 'Quiero.'], [0, String(envidoPoints(['7c', '5c', '3e'])) + '.', 'sos mano: hablás primero'], [1, String(envidoPoints(['6o', '4o', '1b'])) + '.'], [2, 'Ganás vos: <b>' + envidoQuieroValue(R30, ['envido', 'realEnvido'], [0, 0], 0) + ' puntos</b> (envido más real envido).']])) +
        cite(h, ['truco.envido-before-card', 'truco.envido-not-after', 'truco.envido-revido-accepts', 'truco.envido-mano-first', 'truco.4p-son-buenas', 'truco.envido-tie-mano', 'truco.envido-show', 'truco.envido-first-over-truco'])) +
      lesson(4, 'cuanto-vale', 'Cuánto vale cada canto', envTable() + '<p class="jg-note">Cada «envido» querido vale 2 y el real envido, 3. Si dicen «no quiero», el que cantó cobra lo que ya estaba querido (o 1 si era el primer canto).</p>' +
        (h.built('/truco/puntos/') ? '<p><a href="' + h.href('/truco/puntos/') + '">Todas las combinaciones, con calculadora</a></p>' : '') + cite(h, ['truco.envido-two-per-word', 'truco.envido-table-ee', 'truco.envido-table-r', 'truco.envido-table-eer', 'truco.envido-table-er-no', 'truco.envido-no-quiero'])) +
      lesson(5, 'falta', 'La falta envido', '<p>La falta envido vale <b>lo que falta para ganar</b>, y depende del tanteador. Partido a ' + R30.target + ':</p>' + faltaBox() + cite(h, ['truco.falta-malas-wins-match'])) +
      '<section class="jg-c w3 jg-ls" id="chances"><header class="jg-lh"><span class="jg-ln" aria-hidden="true">6</span><h2>Qué tan bueno es tu envido</h2></header><p>De las ' + h.t('{{hands}}') + ' manos posibles, cuántas llegan a cada número (sin flor). Con 30 o más ya estás entre las mejores.</p>' + bars +
      '<div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Tantos</th><th class="n">Manos con eso o más</th></tr></thead><tbody>' + ref.map(k => '<tr><td>' + k + ' o más</td><td class="n">' + fmt(100 * cum[k] / d.total, 1) + ' %</td></tr>').join('') + '</tbody></table></div>' +
      '<p class="jg-hon">Con flor en juego, tres del mismo palo no cuentan como envido: pasa en ' + fmt(100 * fl.p, 2) + ' % de las manos (' + three + ' de ' + d.total + ').</p></section>' +
      lesson(7, 'errores', 'Errores comunes', '<ul class="jg-err"><li><b>Contar la sota como 10, el caballo como 11 o el rey como 12.</b> Valen 0.</li><li><b>Sumar las tres cartas.</b> Se suman solo las dos del mismo palo (más 20).</li><li><b>Sumarle 20 a una carta sola.</b> El 20 aparece solo con dos del mismo palo.</li><li><b>Cantar envido después de tirar.</b> Ya no vale.</li><li><b>Decir mal tus puntos.</b> Si te equivocás, aunque tuvieras más, los puntos son del otro.</li></ul>' + cite(h, ['truco.envido-figures-zero', 'truco.envido-count', 'truco.envido-before-card', 'truco.envido-wrong-count'])) +
      faq(h, 'Preguntas sobre el envido', ENV_FAQ(), ['truco.envido-max-33', 'truco.envido-figures-zero', 'truco.envido-tie-mano', 'truco.envido-before-card', 'truco.envido-no-quiero', 'truco.envido-show']) +
      cta(h, 'Cantá tu primer envido', 'Contra la compu, el envido se resuelve solo y te muestra los puntos de cada uno.', [['/truco/jugar/', 'Jugar contra la compu'], ['/truco/quiero-o-no-quiero/', 'Entrenar el quiero'], ['/truco/reglas/', 'Las reglas completas']]) + more(h, '/truco/envido/') + '</div>';
  },
};

const FLOR_FAQ = fc => [
  ['¿Qué es la flor en el truco?', 'Tener las tres cartas del mismo palo. Se juega solo si se acuerda antes del partido.'],
  ['¿Cuánto vale la flor?', FLOR_POINTS.alone + ' puntos para el que la canta. Si el otro también tiene, pueden ir a contraflor.'],
  ['¿Cada cuánto sale una flor?', 'Te toca ' + oneIn(1 / fc.p) + ' manos.'],
  ['¿Con flor se juega el envido?', 'No: si alguien tiene flor, el envido de esa mano no se juega.'],
  ['¿Cuál es la flor más alta?', 'El cinco, el seis y el siete del mismo palo: ' + florPoints(['5o', '6o', '7o']) + '.'],
];
export const trucoFlor = {
  path: '/truco/flor/', kind: 'game', section: 'truco', css: CSS, js: ['flor.js'],
  title: 'La flor en el truco: reglas, ejemplos y probabilidad',
  h1: 'La flor en el truco',
  description: 'La flor en el truco argentino con ejemplos: cuándo se juega, cómo se cuenta, la contraflor y el con flor me achico, y cada cuánto te toca una.',
  ld: h => ldT(h, [faqLd(FLOR_FAQ(florChance()))]),
  render(h) {
    const fc = florChance();
    const counts = {};
    let flores = 0;
    combinations(DECK_40, 3, hh => { if (hasFlor(hh)) { flores++; const p = florPoints(hh); counts[p] = (counts[p] || 0) + 1; } });
    const keys = Object.keys(counts).map(Number).sort((a, b) => a - b), mx = Math.max(...Object.values(counts));
    const bars = '<div class="jg-hist" data-nosnippet>' + keys.map(k => '<div title="' + k + '"><i style="height:' + Math.max(3, Math.round(100 * counts[k] / mx)) + '%"></i><small>' + k + '</small></div>').join('') + '</div>';
    const ed = envidoDistribution({ flor: true });
    const picker = '<div class="jg-deck sm" data-picker>' + DECK_40.map(c => card(c, ' data-card="' + c + '" tabindex="0"')).join('') + '</div>';
    const ex = [['5o', '6o', '7o', 'La más alta que existe.'], ['1e', '3e', '11e', 'El caballo suma 0.'], ['10c', '11c', '12c', 'Tres figuras: la más baja.']];
    ex.forEach(x => must(hasFlor(x.slice(0, 3)), 'flor example'));
    return SPRITE + hero(h, { kicker: 'Truco · flor', lede: 'Flor es tener las tres cartas del mismo palo. Te toca ' + oneIn(1 / fc.p) + ' manos: poco, pero cuando sale cambia todo, porque anula el envido. Se juega solo si se acuerda antes de empezar.', actions: knowLink(h) }) +
      '<div class="jg-mn">' + toc([['que-es', 'Qué es y cómo se cuenta'], ['como-se-canta', 'Cómo se canta'], ['calculadora', 'Calculá tu flor'], ['cuantas', 'Cuántas flores hay'], ['cantos', 'Los cantos y sus puntos'], ['preguntas', 'Preguntas']]) +
      lesson(1, 'que-es', 'Qué es la flor y cómo se cuenta', '<p>Flor son <b>tres cartas del mismo palo</b>. Para comparar dos flores se cuentan como el envido pero con las tres: <b>20 más el valor de las tres</b>, con las figuras en 0.</p><ol class="jg-evs">' +
        ex.map(([a, b, c, n]) => '<li class="jg-ev"><div class="jg-evh">' + [a, b, c].map(x => cv(x, true)).join('') + '</div><div><p class="jg-fx"><span>Flor</span><b>' + florPoints([a, b, c]) + '</b></p><p class="jg-fm">' + [a, b, c].map(x => ENVIDO_VALUE[x]).join(' + ') + ' + 20 = ' + florPoints([a, b, c]) + '</p><p>' + n + '</p></div></li>').join('') + '</ol>' +
        cite(h, ['truco.flor-three', 'truco.flor-value', 'truco.flor-max-38', 'truco.flor-optional'])) +
      lesson(2, 'como-se-canta', 'Cómo se canta', two('<ol class="jg-ul2 num"><li><b>Si tenés flor, la cantás sí o sí</b>, en tu turno y antes de que empiece el truco.</li><li><b>El envido se anula:</b> lo que se haya cantado de envido en esa mano no cuenta.</li><li><b>Si el otro no tiene flor</b>, te llevás ' + FLOR_POINTS.alone + ' puntos.</li><li><b>Si el otro también tiene</b>, puede decir «con flor me achico» (te deja ganar), «contraflor» (apuesta a ver cuál es mejor) o «contraflor al resto» (se juega el partido).</li></ol>',
        dlg([[0, 'Flor.', 'tenés tres oros'], [1, 'Contraflor.', 'también tiene flor y se anima'], [0, 'Quiero.'], [2, 'Ahora se comparan: gana la flor con más puntos y se lleva <b>' + FLOR_POINTS.contraflor + '</b>.']])) +
        cite(h, ['truco.flor-three', 'truco.flor-cancels-envido', 'truco.flor-achico', 'truco.contraflor', 'truco.contraflor-resto'])) +
      '<section class="jg-c w2" id="calculadora" data-flor><span class="jg-tag">Calculadora</span><h2>Elegí tus tres cartas</h2>' + picker + '<p class="jg-note">Tocá tres cartas; volvé a tocar una para sacarla.</p></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Tu mano</span><div class="jg-hand" data-o="hand"></div><p class="jg-win"><span data-o="lbl">Flor</span><b data-o="pts">-</b></p>' +
      '<div class="jg-sg" role="group" aria-label="Quién es mano"><button type="button" aria-pressed="true" data-mano="1">Soy mano</button><button type="button" aria-pressed="false" data-mano="0">No soy mano</button></div><p class="jg-hon" data-o="vs">Elegí tres cartas.</p></section>' +
      '<section class="jg-c w2" id="cuantas"><span class="jg-sm">Las ' + flores + ' flores posibles</span><h2>Cuánto suma una flor</h2>' + bars + '<p class="jg-hon">De las ' + fmt(ed.total, 0) + ' manos posibles, ' + flores + ' son flor: ' + fmt(fc.p * 100, 2) + ' %.</p>' + cite(h, ['truco.flor-value']) + '</section>' +
      '<section class="jg-c" id="cantos"><span class="jg-sm">Del reglamento</span><h2>Los cantos de la flor</h2><table class="jg-tbl" data-nosnippet><tbody><tr><td>Flor</td><td class="n">' + FLOR_POINTS.alone + '</td></tr><tr><td>Con flor me achico</td><td class="n">' + FLOR_POINTS.achico + '</td></tr><tr><td>Contraflor querida</td><td class="n">' + FLOR_POINTS.contraflor + '</td></tr><tr><td>Contraflor no querida</td><td class="n">' + FLOR_POINTS.rejected + '</td></tr><tr><td>Contraflor al resto</td><td class="n">el partido</td></tr></tbody></table>' +
      cite(h, ['truco.flor-optional', 'truco.flor-three', 'truco.flor-cancels-envido', 'truco.flor-achico', 'truco.contraflor', 'truco.contraflor-resto']) + '</section>' +
      faq(h, 'Preguntas sobre la flor', FLOR_FAQ(fc), ['truco.flor-three', 'truco.flor-optional', 'truco.flor-cancels-envido', 'truco.flor-max-38']) +
      cta(h, 'Jugá una partida con flor', 'En el juego, elegí las reglas «con flor» y la compu canta las suyas.', [['/truco/jugar/', 'Jugar contra la compu'], ['/truco/reglas/', 'Las reglas completas']]) + more(h, '/truco/flor/') + '</div>';
  },
};

export const trucoHub = {
  path: '/truco/', kind: 'game', section: 'truco', css: CSS, js: ['mano.js'],
  title: 'Truco argentino: cómo jugar, reglas, valores y señas',
  h1: 'Truco argentino',
  description: 'Truco argentino para aprender desde cero: cómo se juega paso a paso, los valores de las cartas, el envido, las señas y un anotador para la mesa.',
  ld: h => ldT(h),
  render(h) {
    const path = [
      ['/truco/reglas/#el-mazo', 'Las cartas', 'Las ' + DECK_40.length + ' cartas españolas y sus palos', ICONS.cards],
      ['/truco/valores-de-las-cartas/', 'Qué carta mata a cuál', 'La escalera de ' + LADDER.length + ' escalones, con las cuatro bravas', ICONS.cards],
      ['/truco/reglas/#bazas', 'Cómo se gana una mano', 'Las tres bazas, con un ejemplo carta por carta', ICONS.book],
      ['/truco/reglas/#pardas', 'Los empates', 'Las pardas, con cuatro ejemplos', ICONS.book],
      ['/truco/envido/', 'El envido', 'Cómo contar tus puntos y cómo se canta', ICONS.calc],
      ['/truco/reglas/#truco', 'Truco, retruco y vale cuatro', 'Cuánto vale cada canto y quién puede subir', ICONS.hand],
      ['/truco/reglas/#ejemplo', 'Una mano entera', 'Todo junto, de punta a punta', ICONS.play],
    ].filter(([u]) => h.built(u.split('#')[0]));
    return SPRITE + hero(h, { kicker: 'Truco · 40 cartas españolas', scene: 'truco', lede: 'Se juega con ' + DECK_40.length + ' cartas, sin ochos ni nueves, de a dos o de a cuatro. Si nunca jugaste, seguí los pasos de abajo en orden: en un rato vas a poder sentarte a una mesa.', actions: '<a class="jg-b p" href="#aprender">Aprender a jugar</a>' + knowLink(h) }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w3 jg-ls" id="aprender"><span class="jg-sm">Para empezar de cero</span><h2>Aprendé a jugar en ' + path.length + ' pasos</h2><ol class="jg-path">' + path.map(([u, t, s, ic]) => '<li><a href="' + h.href(u.split('#')[0]) + (u.includes('#') ? '#' + u.split('#')[1] : '') + '"><i>' + ic + '</i><span><b>' + t + '</b><small>' + s + '</small></span></a></li>').join('') + '</ol></section>' +
      '<section class="jg-c w2 jg-deal" data-mano><span class="jg-tag">Probá</span><h2>Repartí una mano</h2><div class="jg-hand" data-o="hand">' + ['1e', '7o', '3c'].map(c => card(c)).join('') + '</div>' +
      '<div class="jg-ch"><span>Envido: <b data-o="env">' + envidoPoints(['1e', '7o', '3c']) + '</b></span><span data-o="flor">sin flor</span><span>Carta más alta: <b data-o="top">' + cap(nm('1e')) + '</b></span></div>' +
      '<p class="jg-hon" data-o="chance">Tocá «Repartir» para ver qué chance tiene tu envido contra una mano al azar.</p><div class="jg-r"><button class="jg-b p" type="button" data-deal>Repartir</button><label class="jg-chk2"><input type="checkbox" data-mano-mano checked> Soy mano</label></div></section>' +
      '<section class="jg-c"><span class="jg-sm">Los puntos</span><h2>Cuánto vale cada canto</h2>' + trucoChain() + '<p class="jg-note">Envido querido: ' + envidoQuieroValue(R30, ['envido'], [0, 0], 0) + '; flor: ' + FLOR_POINTS.alone + '. El partido, a ' + R30.target + '.</p>' +
      cite(h, ['truco.truco-callado', 'truco.truco-retruco-values', 'truco.vale-cuatro', 'truco.envido-table-ee', 'truco.flor-three', 'truco.target-30']) + '</section>' +
      cta(h, '¿Listo para jugar?', 'Jugá contra la compu, de a dos o de a cuatro, con tres niveles. O sacá el anotador para una partida en la mesa.', [['/truco/jugar/', 'Jugar contra la compu'], ['/truco/anotador/', 'Anotador con fósforos']]) +
      more(h, '/truco/') + '</div>';
  },
};
