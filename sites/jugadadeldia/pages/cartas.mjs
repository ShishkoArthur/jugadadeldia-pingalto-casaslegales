// Card and tile games of wave 2 (kind "game": no help block): chinchón rules with "¿puedo cortar?" and its scorer, escoba de 15 with
// the escoba finder and the hand counter, burako rules with the hand calculator and its scorer. Rules from data/sources/<game>
// (quotes checked by the engine tests); chinchón and escoba numbers from engine/, burako values from the cited table below.
import { RULESETS as CHIN, deckOf, cardValue } from '../../../engine/chinchon/rules.mjs';
import { RULESETS as ESC, VALUE, SETENTA } from '../../../engine/escoba/rules.mjs';
import { DECK_40 } from '../../../engine/cards/spanish.mjs';
import { hero, cite, crumbs, webPage, card, SPRITE, tiles, ICONS, mnOpen, mnArt } from './parts.mjs';
import { LIMIT } from './juegos.mjs';

const ld = (h, parent) => [webPage(h), crumbs(h, parent ? [parent] : [])];
const sel = (name, opts) => '<select class="jg-se" name="' + name + '">' + opts.map(([v, l, s]) => '<option value="' + v + '"' + (s ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
const joker = (attrs = '') => '<span class="jg-cd jk"' + attrs + ' role="img" aria-label="comodín"><b>J</b><small>comodín</small></span>';

// Burako (Juegos Bonaerenses 2026, data/sources/burako): tile values, canastas, close, muerto. Each value next to its quote id.
export const BURAKO = Object.freeze({
  tiles: Object.freeze([
    { k: 'uno', label: 'Fichas 1', v: 15, q: 'v-1' }, { k: 'dos', label: 'Fichas 2', v: 20, q: 'v-2' }, { k: 'bajas', label: 'Del 3 al 7', v: 5, q: 'v-3-7' },
    { k: 'altas', label: 'Del 8 al 13', v: 10, q: 'v-8-13' }, { k: 'com', label: 'Comodines', v: 50, q: 'v-joker' },
  ]),
  pura: 200, impura: 100, cierre: 100, muerto: 100, goal: 1500, tilesTotal: 104, jokers: 2, rack: 12, muertoTiles: 11, piles: 6, pileTiles: 10, canasta: 7,
});
const bq = id => 'burako.' + id;
// Every value of BURAKO must be written in its quote (the quotes themselves are checked against the saved PDF by the engine tests).
function checkBurako(h) {
  const B = BURAKO, has = (id, v) => { const q = h.src.fact(bq(id)).quote.replace(/\./g, ''); if (!q.includes(String(v))) throw new Error('burako: ' + v + ' is not in quote ' + id); };
  for (const t of B.tiles) has(t.q, t.v);
  [['pura-200', B.pura], ['impura-100', B.impura], ['close-100', B.cierre], ['muerto-100', B.muerto], ['goal-1500', B.goal], ['tiles-104', B.tilesTotal], ['jokers-2', B.jokers], ['piles', B.rack], ['piles', B.muertoTiles], ['piles', B.piles], ['piles', B.pileTiles], ['canasta', B.canasta]].forEach(([id, v]) => has(id, v));
}
const more = (h, list) => tiles(h, list.filter(t => t[0] !== h.page.path));
const GAMES = [
  ['/chinchon/', 'Chinchón', '¿Puedo cortar? y reglas', '#2f7cf6', ICONS.hand],
  ['/chinchon/anotador/', 'Anotador de chinchón', 'Hasta ' + LIMIT + ', con reenganche', '#16b38a', ICONS.pencil],
  ['/chinchon/jugar/', 'Chinchón contra la compu', 'Tres niveles', '#ff5a3c', ICONS.play],
  ['/escoba-de-15/', 'Escoba de 15', 'Buscador de escobas', '#e8930c', ICONS.cards],
  ['/burako/', 'Burako', 'Calculadora de la mano', '#8b5cf6', ICONS.calc],
  ['/burako/anotador/', 'Anotador de burako', 'Mano por mano', '#e0447a', ICONS.pencil],
];

export const chinchon = {
  path: '/chinchon/', kind: 'game', section: 'juegos', css: ['mesa.css', 'guias.css'], js: ['corte.js'],
  title: 'Chinchón: reglas y cuándo se puede cortar',
  h1: 'Chinchón: reglas y corte',
  description: 'Reglas del chinchón y cuándo se puede cortar: cargá tus siete cartas y mirá las mejores combinaciones, cuántos puntos te quedan y si tenés chinchón.',
  ld: h => ld(h, ['/juegos-de-cartas/', 'Juegos de cartas']),
  data: () => ({ rules: CHIN, decks: Object.fromEntries(Object.entries(CHIN).map(([k, r]) => [k, deckOf(r)])) }),
  render(h) {
    const B = CHIN['bonaerense-50'], L = CHIN['ludoteka-40'];
    const deck = deckOf(B);
    const picker = '<div class="jg-deck sm" data-picker>' + deck.map(c => /^J/.test(c) ? joker(' data-card="' + c + '" tabindex="0"') : card(c, ' data-card="' + c + '" tabindex="0"')).join('') + '</div>';
    const vals = [1, 5, 10, 12].map(n => (n === 1 ? 'As' : n === 10 ? 'Sota' : n === 12 ? 'Rey' : n) + ' ' + cardValue(B, n + 'o')).join(' · ');
    return SPRITE + hero(h, { kicker: 'Chinchón · cartas españolas', scene: 'chinchon', lede: 'Siete cartas, juegos de tres o más y cortar con pocos puntos sueltos. Cargá tu mano y el código busca la mejor forma de armarla, entre todas las posibles.', actions: (h.built('/chinchon/jugar/') ? '<a class="jg-b p" href="' + h.href('/chinchon/jugar/') + '">Jugar contra la compu</a>' : '') }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" data-corte><span class="jg-tag">¿Puedo cortar?</span><h2>Cargá tus 7 cartas</h2><div class="jg-r" style="margin-bottom:10px"><label class="jg-fl" style="flex:1 1 220px"><span>Mazo</span>' + sel('r', [['bonaerense-50', '50 cartas con comodines (bonaerense)', true], ['ludoteka-40', '40 cartas'], ['ludoteka-48', '48 cartas']]) + '</label><button class="jg-b s" type="button" data-clear>Borrar</button></div>' + picker + '<p class="jg-note">Tocá siete cartas; volvé a tocar una para sacarla.</p></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Tu mano</span><div class="jg-hand xs" data-o="hand"></div><p class="jg-win"><span data-o="verdict">Elegí 7 cartas</span><b data-o="pts">-</b></p><div class="jg-meld" data-o="melds"></div><p class="jg-hon" data-o="why"></p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Del reglamento</span><h2>Las reglas en un minuto</h2><ol class="jg-steps">' +
      '<li><b>Siete cartas cada uno</b>Robás del mazo o del pozo y tirás una. La idea es armar juegos.</li>' +
      '<li><b>Juegos</b>Tres o cuatro cartas del mismo número, o escalera de tres o más del mismo palo. En el bonaerense hay ' + B.jokers + ' comodines y va uno solo por juego.</li>' +
      '<li><b>Cortar</b>Bonaerense: si lo que te queda suelto suma ' + 5 + ' o menos. Con 40 o 48 cartas: una sola carta suelta de ' + 4 + ' o menos.</li>' +
      '<li><b>Los puntos</b>Lo que te queda suelto suma en contra. ' + vals + '. Cortar con todo en juegos: ' + B.allMelded + '.</li>' +
      '<li><b>Chinchón</b>Siete cartas en escalera del mismo palo, sin comodín: ganás el partido en el acto.</li>' +
      '<li><b>Hasta ' + LIMIT + '</b>El que pasa de ' + LIMIT + ' queda afuera; gana el último que queda.</li></ol>' +
      cite(h, ['chinchon.seven-cards', 'chinchon.draw-discard', 'chinchon.melds', 'chinchon.groups-3-4', 'chinchon.jokers-two', 'chinchon.one-joker', 'chinchon.cut-5', 'chinchon.l-cut', 'chinchon.values', 'chinchon.l-figures-10', 'chinchon.all-melded', 'chinchon.chinchon-wins', 'chinchon.limit-101', 'chinchon.no-rejoin']) + '</section>' +
      '<section class="jg-c"><span class="jg-sm">Mazos</span><h2>¿Con cuántas cartas?</h2><table class="jg-tbl" data-nosnippet><tbody>' + Object.entries(CHIN).map(([k, r]) => '<tr><td>' + ({ 'bonaerense-50': 'Bonaerense', 'ludoteka-40': 'Clásico de 40', 'ludoteka-48': 'Clásico de 48' })[k] + '</td><td class="n">' + (r.deck + r.jokers) + ' cartas</td></tr>').join('') + '</tbody></table><p class="jg-note">Con 40 o 48 cartas, sin comodines y las figuras valen ' + cardValue(L, '12o') + '.</p></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Seguí con</span><h2>Más juegos</h2>' + more(h, GAMES) + '</section></div>';
  },
};

export const chinchonAnotador = {
  path: '/chinchon/anotador/', kind: 'game', section: 'juegos', css: ['mesa.css', 'guias.css'], js: ['anotchin.js'],
  title: 'Anotador de chinchón online, con enganche',
  h1: 'Anotador de chinchón',
  description: 'Anotador de chinchón online: puntaje hasta 101 o lo que elijan, menos diez por cortar con todo, reenganche y la tabla final de quién quedó afuera.',
  ld: h => ld(h, ['/chinchon/', 'Chinchón']),
  data: () => ({ limit: LIMIT, all: CHIN['bonaerense-50'].allMelded }),
  render(h) {
    return '<section class="jg-anot" data-anotchin><div class="jg-ph"><h1 class="jg-h1 sm">' + h.esc(h.page.h1) + '</h1><form class="jg-cfg" data-cfg><label><span class="jg-sm">Jugadores</span>' + sel('n', [2, 3, 4, 5, 6].map(v => [v, String(v), v === 3])) + '</label><label><span class="jg-sm">Hasta</span><input class="jg-in" name="lim" type="text" inputmode="numeric" maxlength="3" value="' + LIMIT + '" style="width:90px"></label><label class="jg-chk2"><input type="checkbox" name="re"> Con reenganche</label></form></div>' +
      '<div class="jg-c"><div class="jg-tw"><table class="jg-pls" data-o="sheet"></table></div><p class="jg-note" data-o="state" aria-live="polite"></p>' +
      '<div class="jg-r jg-tools"><button class="jg-b p" type="button" data-add>Anotar la mano</button><button class="jg-b s" type="button" data-undo>Deshacer</button><button class="jg-b s" type="button" data-reset>Partido nuevo</button></div></div></section>' +
      mnOpen(h) + '<section class="jg-c w2"><span class="jg-sm">Cómo se usa</span><h2>Una fila por mano</h2><ul><li>Escribí los puntos que le quedaron a cada uno y tocá «Anotar la mano».</li><li>El que cortó con todo en juegos anota ' + CHIN['bonaerense-50'].allMelded + ': escribilo así, con el signo menos.</li><li>Quien pasa del límite queda tachado. Con reenganche vuelve con el puntaje del que va más alto entre los que siguen.</li><li>Todo queda guardado en tu teléfono.</li></ul></section>' + mnArt(h) +
      '<section class="jg-c"><span class="jg-sm">De los reglamentos</span><h2>El límite y el reenganche</h2>' + cite(h, ['chinchon.limit-101', 'chinchon.all-melded', 'chinchon.no-rejoin', 'chinchon.all-over', 'chinchon.l-reenganche', 'chinchon.l-no-reenganche-2', 'chinchon.l-all-rivals-out']) + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Seguí con</span><h2>Más juegos</h2>' + more(h, GAMES) + '</section></div>';
  },
};

export const escoba = {
  path: '/escoba-de-15/', kind: 'game', section: 'juegos', css: ['mesa.css', 'guias.css'], js: ['buscador.js'],
  title: 'Escoba de 15: reglas y buscador de escobas',
  h1: 'Escoba de 15',
  description: 'Escoba de 15 con las reglas de acá: cargá las cartas de la mesa y la tuya, y el buscador te muestra todas las sumas de 15 y si hay escoba. Y contá la mano.',
  ld: h => ld(h, ['/juegos-de-cartas/', 'Juegos de cartas']),
  data: () => ({ rules: ESC }),
  render(h) {
    const picker = (attr) => '<div class="jg-deck sm" ' + attr + '>' + DECK_40.map(c => card(c, ' data-card="' + c + '" tabindex="0"')).join('') + '</div>';
    const scale = Object.entries(SETENTA).filter(([n]) => +n <= 7).sort((a, b) => b[1] - a[1]).map(([n, v]) => (n === '1' ? 'As' : n) + ' = ' + v).join(' · ');
    return SPRITE + hero(h, { kicker: 'Escoba de 15 · cartas españolas', scene: 'escoba-de-15', lede: 'Con una carta tuya y las de la mesa tenés que sumar 15. Si levantás todo, es escoba. El buscador te muestra todas las jugadas posibles.', actions: (h.built('/escoba-de-15/jugar/') ? '<a class="jg-b p" href="' + h.href('/escoba-de-15/jugar/') + '">Jugar contra la compu</a>' : '') + '<a class="jg-b" href="#contar">Contar la mano</a>' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" data-busca><span class="jg-tag">Buscador</span><h2>¿Hay escoba?</h2><div class="jg-sg" role="group" aria-label="Qué estás cargando" style="margin-bottom:10px"><button type="button" data-mode="t" aria-pressed="true">Cartas de la mesa</button><button type="button" data-mode="m" aria-pressed="false">Mi carta</button><button type="button" data-clear>Borrar</button></div>' + picker('data-picker') + '<p class="jg-note">Azul: en la mesa. Naranja: la tuya.</p></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Jugadas posibles</span><p class="jg-win"><span>Formas de sumar 15</span><b data-o="n">-</b></p><div data-o="list"></div></section>' +
      '<section class="jg-c w3" id="contar" data-cuenta><span class="jg-tag">Contá la mano</span><h2>¿Cuántos puntos hiciste?</h2><p class="jg-mu">Tocá las cartas que levantaste vos; las demás son del rival. Sumá las escobas de cada uno.</p>' + picker('data-mine') +
      '<div class="jg-r" style="margin-top:10px"><label class="jg-fl"><span>Mis escobas</span><input class="jg-in" name="e0" type="text" inputmode="numeric" maxlength="2" value="0" style="width:90px"></label><label class="jg-fl"><span>Escobas del rival</span><input class="jg-in" name="e1" type="text" inputmode="numeric" maxlength="2" value="0" style="width:90px"></label><label class="jg-fl"><span>Reglas</span>' + sel('r', [['bonaerense', 'Bonaerenses', true], ['ludoteka', 'Ludoteka']]) + '</label></div>' +
      '<div class="jg-two" style="margin-top:12px"><p class="jg-win"><span>Vos</span><b data-o="p0">-</b></p><p class="jg-win no"><span>Rival</span><b data-o="p1">-</b></p></div><ul class="jg-chipl" data-o="detail"></ul></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Del reglamento</span><h2>Lo que se cuenta</h2><ul class="jg-ul"><li><b>Valores:</b> sota ' + VALUE['10o'] + ', caballo ' + VALUE['11o'] + ', rey ' + VALUE['12o'] + '; el resto, su número.</li><li><b>Escoba:</b> levantar toda la mesa, un punto.</li><li><b>Cartas:</b> el que tiene más; empate, nadie.</li><li><b>Oros:</b> el que tiene 6 o más.</li><li><b>Siete de oros:</b> un punto.</li><li><b>Setenta:</b> la mejor carta de cada palo con esta escala: ' + scale + ' · figuras ' + SETENTA[10] + '.</li></ul>' +
      cite(h, ['escoba.values', 'escoba.escoba', 'escoba.cartas', 'escoba.oros-6', 'escoba.siete-oros', 'escoba.setenta-suits', 'escoba.scale-7', 'escoba.scale-6-1', 'escoba.scale-5-4-3', 'escoba.scale-2', 'escoba.scale-fig', 'escoba.tie-none', 'escoba.must-take', 'escoba.target-30']) + '</section>' +
      '<section class="jg-c"><span class="jg-sm">Seguí con</span><h2>Más juegos</h2>' + more(h, GAMES.slice(0, 5)) + '</section></div>';
  },
};

const burakoTiles = () => '<div class="jg-tls" aria-hidden="true">' + [[1, '#ff5a3c'], [2, '#2f7cf6'], [5, '#16b38a'], [9, '#1d2433'], [13, '#e8930c']].map(([n, c]) => '<span class="jg-tl" style="--c:' + c + '">' + n + '</span>').join('') + '<span class="jg-tl j">★</span></div>';
const counter = (k, label, sub) => '<div class="jg-cnt"><span>' + label + '<small>' + sub + '</small></span><div><button type="button" data-d="-1" data-k="' + k + '" aria-label="Menos ' + label + '">−</button><output data-v="' + k + '">0</output><button type="button" data-d="1" data-k="' + k + '" aria-label="Más ' + label + '">+</button></div></div>';
export function burakoCalc(prefix = '') {
  const B = BURAKO;
  return '<div class="jg-two"><div><h3>Juegos y cierre</h3>' + counter(prefix + 'pura', 'Canastas puras', 'sin comodín · ' + B.pura + ' c/u') + counter(prefix + 'impura', 'Canastas impuras', 'con comodín · ' + B.impura + ' c/u') +
    '<label class="jg-chk2"><input type="checkbox" data-c="cierre"> Cerré la mano (+' + B.cierre + ')</label><label class="jg-chk2"><input type="checkbox" data-c="muerto" checked> Compré el muerto</label>' +
    '<label class="jg-chk2"><input type="checkbox" data-c="mesa" checked> Sumar las fichas bajadas</label></div>' +
    '<div><h3 data-mesa-h>Fichas bajadas</h3><div data-g="mesa">' + B.tiles.map(t => counter('m-' + t.k, t.label, t.v + ' c/u')).join('') + '</div>' +
    '<h3>Fichas que quedaron en la mano</h3><div data-g="mano">' + B.tiles.map(t => counter('h-' + t.k, t.label, '−' + t.v + ' c/u')).join('') + '</div></div></div>';
}

export const burako = {
  path: '/burako/', kind: 'game', section: 'juegos', css: ['guias.css'], js: ['burako.js'],
  title: 'Burako: reglas, canastas y cuántos puntos vale cada una',
  h1: 'Burako',
  description: 'Burako con el reglamento de los Juegos Bonaerenses: canastas puras e impuras, el muerto y una calculadora que suma los puntos de la mano en segundos.',
  ld: h => ld(h, ['/juegos-de-cartas/', 'Juegos de cartas']),
  data: () => ({ B: BURAKO }),
  render(h) {
    checkBurako(h);
    const B = BURAKO;
    const dealt = 2 * B.rack + 2 * B.muertoTiles + B.piles * B.pileTiles;
    return hero(h, { kicker: 'Burako · fichas', scene: 'burako', lede: 'Se juega con ' + (B.tilesTotal + B.jokers) + ' fichas: armás piernas y escaleras, juntás canastas de ' + B.canasta + ' y comprás el muerto. Sumá tu mano con la calculadora de acá abajo.', actions: (h.built('/burako/anotador/') ? '<a class="jg-b p" href="' + h.href('/burako/anotador/') + '">Abrir el anotador</a>' : '') }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" data-burako><span class="jg-tag">Calculadora</span><h2>Los puntos de tu mano</h2>' + burakoCalc() + '<p class="jg-win"><span>Tu mano</span><b data-o="total">0</b></p><p class="jg-hon" data-o="why">Cargá tus canastas y las fichas.</p></section>' +
      '<section class="jg-c t2"><span class="jg-sm">Lo que vale cada ficha</span><h2>La tabla</h2>' + burakoTiles() + '<table class="jg-tbl" data-nosnippet><tbody>' + B.tiles.map(t => '<tr><td>' + t.label + '</td><td class="n">' + t.v + '</td></tr>').join('') + '<tr><td>Canasta pura</td><td class="n">' + B.pura + '</td></tr><tr><td>Canasta impura</td><td class="n">' + B.impura + '</td></tr><tr><td>Cierre</td><td class="n">' + B.cierre + '</td></tr><tr><td>No comprar el muerto</td><td class="n">−' + B.muerto + '</td></tr></tbody></table>' +
      cite(h, [bq('v-1'), bq('v-2'), bq('v-3-7'), bq('v-8-13'), bq('v-joker'), bq('pura-200'), bq('impura-100'), bq('close-100'), bq('muerto-100'), bq('hand-minus')]) + '</section>' +
      '<section class="jg-c w2"><span class="jg-sm">Del reglamento</span><h2>Cómo se juega</h2><ol class="jg-steps">' +
      '<li><b>El armado</b>' + B.tilesTotal + ' fichas numeradas y ' + B.jokers + ' comodines: ' + B.rack + ' para cada atril, un muerto de ' + B.muertoTiles + ' por jugador y ' + B.piles + ' montones de ' + B.pileTiles + ' (' + dealt + ' en total).' + cite(h, [bq('tiles-104'), bq('jokers-2'), bq('piles')]) + '</li>' +
      '<li><b>Tu turno</b>Tomás una ficha del mazo o todo el pozo, bajás juegos si querés y dejás una ficha en el pozo.' + cite(h, [bq('pozo-all'), bq('discard')]) + '</li>' +
      '<li><b>Juegos</b>Pierna: tres o más del mismo número. Escalera: el 1 puede ir al principio o después del 13. Canasta: ' + B.canasta + ' fichas o más. Los 2 también son comodines.' + cite(h, [bq('pierna'), bq('escalera'), bq('canasta'), bq('two-jokers'), bq('two-is-joker')]) + '</li>' +
      '<li><b>Cerrar</b>Con el atril vacío o una ficha, y solo si ya tenés una canasta y compraste el muerto.' + cite(h, [bq('close-needs'), bq('close-empty')]) + '</li>' +
      '<li><b>Si se acaba el mazo</b>Sin canastas, la mano se juega de nuevo; si alguien tiene canasta, se cuenta sin los ' + B.cierre + ' del cierre.' + cite(h, [bq('no-canasta-replay'), bq('stock-out')]) + '</li>' +
      '<li><b>El partido</b>A ' + B.goal.toLocaleString('es-AR') + ' puntos, de a dos.' + cite(h, [bq('goal-1500'), bq('two-players')]) + '</li></ol></section>' +
      '<section class="jg-c"><span class="jg-sm">Ojo</span><h2>Las fichas bajadas</h2><p>El reglamento bonaerense dice que las fichas que no bajaste se descuentan y que, si se acaba el mazo, se cuenta «normalmente». En casi todas las mesas las fichas bajadas suman: por eso la calculadora las suma, y lo podés apagar.</p>' + more(h, GAMES) + '</section></div>';
  },
};

export const burakoAnotador = {
  path: '/burako/anotador/', kind: 'game', section: 'juegos', css: ['guias.css'], js: ['burako.js'],
  title: 'Anotador de burako: planilla online para 2 o 4',
  h1: 'Anotador de burako',
  description: 'Anotador de burako online para dos jugadores o dos parejas: planilla mano por mano hasta la meta que elijan, con la calculadora de la mano incluida.',
  ld: h => ld(h, ['/burako/', 'Burako']),
  data: () => ({ B: BURAKO }),
  render(h) {
    const B = BURAKO;
    return '<section class="jg-c" data-anotbur><div class="jg-ph"><h1 class="jg-h1 sm">' + h.esc(h.page.h1) + '</h1><form class="jg-cfg" data-cfg><label><span class="jg-sm">Meta</span>' + sel('goal', [[B.goal, B.goal.toLocaleString('es-AR'), true], [B.goal * 2, (B.goal * 2).toLocaleString('es-AR')]]) + '</label><label><span class="jg-sm">Lado 1</span><input class="jg-in" name="a" value="Nosotros" maxlength="16" style="width:150px" aria-label="Nombre del lado 1"></label><label><span class="jg-sm">Lado 2</span><input class="jg-in" name="b" value="Ellos" maxlength="16" style="width:150px" aria-label="Nombre del lado 2"></label></form></div>' +
      '<div class="jg-tw"><table class="jg-pls" data-o="sheet"></table></div><p class="jg-big2" data-o="lead" aria-live="polite"></p>' +
      '<div class="jg-r jg-tools"><button class="jg-b s" type="button" data-undo>Deshacer</button><button class="jg-b s" type="button" data-reset>Partido nuevo</button></div></section>' +
      '<section class="jg-c" data-burako data-anot style="margin-top:22px"><span class="jg-tag">Mano nueva</span><h2>Calculá y anotá</h2><div class="jg-sg" role="group" aria-label="De quién es la mano" style="margin-bottom:10px"><button type="button" data-side="0" aria-pressed="true">Nosotros</button><button type="button" data-side="1" aria-pressed="false">Ellos</button></div>' + burakoCalc() +
      '<p class="jg-win"><span>Esta mano</span><b data-o="total">0</b></p><p class="jg-hon" data-o="why">Cargá las canastas y las fichas.</p><div class="jg-r"><button class="jg-b p" type="button" data-put>Anotar</button><button class="jg-b s" type="button" data-zero>Limpiar</button></div></section>' +
      '<div class="jg-mn" style="margin-top:22px"><section class="jg-c w2"><span class="jg-sm">Cómo se usa</span><h2>Una mano, dos toques</h2><ul><li>Elegí de quién es la mano, cargá canastas y fichas, y tocá «Anotar». Después, lo mismo para el otro lado.</li><li>Gana el primero que llega a la meta; si llegan los dos en la misma mano, el que suma más.</li><li>La planilla queda guardada en tu teléfono.</li></ul></section>' +
      '<section class="jg-c"><span class="jg-sm">Del reglamento</span><h2>La meta</h2>' + cite(h, [bq('goal-1500'), bq('winner-both'), bq('pura-200'), bq('impura-100'), bq('close-100'), bq('muerto-100')]) + '</section></div>';
  },
};
