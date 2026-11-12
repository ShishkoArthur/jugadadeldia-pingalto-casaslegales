// Card and tile games of wave 2 (kind "game": no help block): chinchón rules with "¿puedo cortar?" and its scorer, escoba de 15 with
// the escoba finder and the hand counter, burako rules with the hand calculator and its scorer. Rules from data/sources/<game>
// (quotes checked by the engine tests); chinchón and escoba numbers from engine/, burako values from the cited table below.
import { RULESETS as CHIN, deckOf, cardValue } from '../../../engine/chinchon/rules.mjs';
import { RULESETS as ESC, VALUE, SETENTA } from '../../../engine/escoba/rules.mjs';
import { DECK_40 } from '../../../engine/cards/spanish.mjs';
import { hero, cite, crumbs, webPage, card, SPRITE, tiles, ICONS, mnOpen, mnArt, btn, faqLd } from './parts.mjs';
import { wrap, go } from './curso.mjs';
import { chinchonCurso, escobaCurso, burakoCurso } from './curso-juegos.mjs';
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
  path: '/chinchon/', kind: 'game', section: 'juegos', css: ['naipes.css', 'mesa.css', 'guias.css', 'curso.css'], js: ['corte.js'],
  title: 'Reglas del chinchón: cómo se juega y cuándo cortar',
  h1: 'Reglas del chinchón',
  description: 'Reglas del chinchón desde cero: el mazo, los juegos, robar y tirar, cuándo cortar y cómo se cuentan los puntos, con una mano real resuelta turno por turno.',
  ld: h => [...ld(h, ['/juegos-de-cartas/', 'Juegos de cartas']), faqLd(chinchonCurso(h, { limit: LIMIT }).faq)],
  data: () => ({ rules: CHIN, decks: Object.fromEntries(Object.entries(CHIN).map(([k, r]) => [k, deckOf(r)])) }),
  render(h) {
    const B = CHIN['bonaerense-50'];
    const deck = deckOf(B);
    const picker = '<div class="jg-deck sm" data-picker>' + deck.map(c => /^J/.test(c) ? joker(' data-card="' + c + '" tabindex="0"') : card(c, ' data-card="' + c + '" tabindex="0"')).join('') + '</div>';
    return SPRITE + hero(h, { kicker: 'Chinchón · guía para empezar', scene: 'chinchon', lede: 'Siete cartas, juegos de tres o más y cortar con pocos puntos sueltos. Te lo explicamos paso a paso, con una mano real jugada por nuestro código; al final podés probar si tu mano corta.' }) +
      wrap(chinchonCurso(h, { limit: LIMIT }).html) +
      '<div class="jg-mn" id="corte">' +
      '<section class="jg-c w2" data-corte><span class="jg-tag">¿Puedo cortar?</span><h2>Cargá tus 7 cartas</h2><div class="jg-r" style="margin-bottom:10px"><label class="jg-fl" style="flex:1 1 220px"><span>Mazo</span>' + sel('r', [['bonaerense-50', '50 cartas con comodines (bonaerense)', true], ['ludoteka-40', '40 cartas'], ['ludoteka-48', '48 cartas']]) + '</label><button class="jg-b s" type="button" data-clear>Borrar</button></div>' + picker + '<p class="jg-note">Tocá siete cartas; volvé a tocar una para sacarla. El código busca la mejor forma de armarla entre todas las posibles.</p></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Tu mano</span><div class="jg-hand xs" data-o="hand"></div><p class="jg-win"><span data-o="verdict">Elegí 7 cartas</span><b data-o="pts">-</b></p><div class="jg-meld" data-o="melds"></div><p class="jg-hon" data-o="why"></p></section>' +
      go('Ahora, a jugar', '<p>Practicá contra la compu con las mismas reglas: robás, tirás y cortás cuando podés. Para una mesa de verdad, el anotador suma las manos hasta ' + LIMIT + '.</p>', btn(h, '/chinchon/jugar/', 'Jugar contra la compu', true) + btn(h, '/chinchon/anotador/', 'Anotador de chinchón')) +
      '<section class="jg-c w3"><span class="jg-sm">Seguí con</span><h2>Más juegos</h2>' + more(h, GAMES) + '</section></div>';
  },
};

export const chinchonAnotador = {
  path: '/chinchon/anotador/', kind: 'game', section: 'juegos', css: ['naipes.css', 'mesa.css', 'guias.css'], js: ['anotchin.js'],
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
  path: '/escoba-de-15/', kind: 'game', section: 'juegos', css: ['naipes.css', 'mesa.css', 'guias.css', 'curso.css'], js: ['buscador.js'],
  title: 'Cómo se juega a la escoba de 15: reglas y puntos',
  h1: 'Cómo se juega a la escoba de 15',
  description: 'Reglas de la escoba de 15 desde cero: qué vale cada carta, cómo se suma 15, la escoba, el setenta y la cuenta de la mano, con una mano real resuelta.',
  ld: h => [...ld(h, ['/juegos-de-cartas/', 'Juegos de cartas']), faqLd(escobaCurso(h).faq)],
  data: () => ({ rules: ESC }),
  render(h) {
    const picker = (attr) => '<div class="jg-deck sm" ' + attr + '>' + DECK_40.map(c => card(c, ' data-card="' + c + '" tabindex="0"')).join('') + '</div>';
    return SPRITE + hero(h, { kicker: 'Escoba de 15 · guía para empezar', scene: 'escoba-de-15', lede: 'Con una carta tuya y las de la mesa tenés que sumar 15; si levantás todo, es escoba. Te lo explicamos con una mano real jugada por nuestro código, y al final está el buscador de escobas.' }) +
      wrap(escobaCurso(h).html) +
      '<div class="jg-mn" id="herramientas">' +
      '<section class="jg-c w2" data-busca><span class="jg-tag">Buscador</span><h2>¿Hay escoba?</h2><div class="jg-sg" role="group" aria-label="Qué estás cargando" style="margin-bottom:10px"><button type="button" data-mode="t" aria-pressed="true">Cartas de la mesa</button><button type="button" data-mode="m" aria-pressed="false">Mi carta</button><button type="button" data-clear>Borrar</button></div>' + picker('data-picker') + '<p class="jg-note">Azul: en la mesa. Naranja: la tuya.</p></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Jugadas posibles</span><p class="jg-win"><span>Formas de sumar 15</span><b data-o="n">-</b></p><div data-o="list"></div></section>' +
      '<section class="jg-c w3" data-cuenta><span class="jg-tag">Contá la mano</span><h2>¿Cuántos puntos hiciste?</h2><p class="jg-mu">Tocá las cartas que levantaste vos; las demás son del rival. Sumá las escobas de cada uno.</p>' + picker('data-mine') +
      '<div class="jg-r" style="margin-top:10px"><label class="jg-fl"><span>Mis escobas</span><input class="jg-in" name="e0" type="text" inputmode="numeric" maxlength="2" value="0" style="width:90px"></label><label class="jg-fl"><span>Escobas del rival</span><input class="jg-in" name="e1" type="text" inputmode="numeric" maxlength="2" value="0" style="width:90px"></label><label class="jg-fl"><span>Reglas</span>' + sel('r', [['bonaerense', 'Bonaerenses', true], ['ludoteka', 'Ludoteka']]) + '</label></div>' +
      '<div class="jg-two" style="margin-top:12px"><p class="jg-win"><span>Vos</span><b data-o="p0">-</b></p><p class="jg-win no"><span>Rival</span><b data-o="p1">-</b></p></div><ul class="jg-chipl" data-o="detail"></ul></section>' +
      go('Ahora, a jugar', '<p>Practicá contra la compu: después de cada jugada te avisa si se te pasó una escoba.</p>', btn(h, '/escoba-de-15/jugar/', 'Jugar contra la compu', true)).replace('jg-c jg-cu-go', 'jg-c w2 jg-cu-go') +
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
  path: '/burako/', kind: 'game', section: 'juegos', css: ['guias.css', 'curso.css'], js: ['burako.js'],
  title: 'Cómo se juega al burako: reglas, canastas y puntos',
  h1: 'Cómo se juega al burako',
  description: 'Reglas del burako desde cero con el reglamento bonaerense: las fichas, piernas y escaleras, canastas, el muerto, el cierre y una mano contada entera.',
  ld: h => [...ld(h, ['/juegos-de-cartas/', 'Juegos de cartas']), faqLd(burakoCurso(h, { B: BURAKO }).faq)],
  data: () => ({ B: BURAKO }),
  render(h) {
    checkBurako(h);
    const B = BURAKO;
    return hero(h, { kicker: 'Burako · guía para empezar', scene: 'burako', lede: 'Se juega con ' + (B.tilesTotal + B.jokers) + ' fichas: armás piernas y escaleras, juntás canastas de ' + B.canasta + ' y comprás el muerto. Te lo explicamos desde cero y al final está la calculadora de la mano.' }) +
      wrap(burakoCurso(h, { B }).html) +
      '<div class="jg-mn" id="calculadora">' +
      '<section class="jg-c w2" data-burako><span class="jg-tag">Calculadora</span><h2>Los puntos de tu mano</h2>' + burakoCalc() + '<p class="jg-win"><span>Tu mano</span><b data-o="total">0</b></p><p class="jg-hon" data-o="why">Cargá tus canastas y las fichas.</p></section>' +
      '<section class="jg-c t2"><span class="jg-sm">Lo que vale cada ficha</span><h2>La tabla</h2>' + burakoTiles() + '<table class="jg-tbl" data-nosnippet><tbody>' + B.tiles.map(t => '<tr><td>' + t.label + '</td><td class="n">' + t.v + '</td></tr>').join('') + '<tr><td>Canasta pura</td><td class="n">' + B.pura + '</td></tr><tr><td>Canasta impura</td><td class="n">' + B.impura + '</td></tr><tr><td>Cierre</td><td class="n">' + B.cierre + '</td></tr><tr><td>No comprar el muerto</td><td class="n">−' + B.muerto + '</td></tr></tbody></table>' +
      cite(h, [bq('v-1'), bq('v-2'), bq('v-3-7'), bq('v-8-13'), bq('v-joker'), bq('pura-200'), bq('impura-100'), bq('close-100'), bq('muerto-100'), bq('hand-minus')]) + '</section>' +
      go('Ahora, a la mesa', '<p>El anotador lleva la planilla mano por mano hasta ' + B.goal.toLocaleString('es-AR') + ', con esta misma calculadora adentro.</p>', btn(h, '/burako/anotador/', 'Abrir el anotador', true)) +
      '<section class="jg-c w2"><span class="jg-sm">Seguí con</span><h2>Más juegos</h2>' + more(h, GAMES) + '</section></div>';
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
