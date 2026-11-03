// Table games (kind "game": no help block): generala (scorer, play vs computer, probabilities), chinchón and escoba de 15 vs
// computer, dice roller and the hub of card games. Rules from data/sources/<game>/rules.json, numbers from engine/.
import { RULESETS as GEN, boxesOf, solver } from '../../../engine/generala/index.mjs';
import { servida, generalaWithin } from '../../../engine/lottery/dice.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';
import { RULESETS as CHIN } from '../../../engine/chinchon/rules.mjs';
import { VALUE, SETENTA } from '../../../engine/escoba/rules.mjs';
import { hero, cite, crumbs, webPage, fmt, oneIn, card, SPRITE, tiles, ICONS } from './parts.mjs';

const BOX = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', escalera: 'Escalera', full: 'Full', poker: 'Póker', generala: 'Generala', doble: 'Doble generala' };
const ld = (h, parent) => [webPage(h), crumbs(h, parent ? [parent] : [])];
const sel = (name, opts) => '<select class="jg-se" name="' + name + '">' + opts.map(([v, l, s]) => '<option value="' + v + '"' + (s ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
const R = GEN.ruibal;
export const LIMIT = 101;

export const generala = {
  path: '/generala/', kind: 'game', section: 'juegos', css: ['mesa.css'], js: ['anotgen.js'],
  title: 'Generala: anotador online, puntos y reglas',
  h1: 'Generala: anotador y puntos',
  description: 'Anotador de generala online para 2 a 8 jugadores: escalera, full, póker, generala y servida, con una ayuda que te dice dónde te conviene anotar cada tiro.',
  ld: h => ld(h),
  data: () => ({ rules: { ruibal: GEN.ruibal, w50: GEN['wikipedia-50'] }, boxes: boxesOf(R), names: BOX }),
  render(h) {
    return hero(h, { kicker: 'Generala · anotador', scene: 'generala', lede: 'Cinco dados, tres tiros y ' + boxesOf(R).length + ' casilleros. Anotá a todos en la mesa y pedí ayuda: el código te dice qué casillero te conviene llenar.', actions: (h.built('/generala/jugar/') ? '<a class="jg-b p" href="' + h.href('/generala/jugar/') + '">Jugar contra la compu</a>' : '') }) +
      '<div class="jg-mn"><section class="jg-c w3" data-anotgen><span class="jg-tag">Anotador</span><h2>La planilla</h2><div class="jg-r"><label class="jg-fl"><span>Jugadores</span>' + sel('n', [2, 3, 4, 5, 6, 7, 8].map(v => [v, String(v), v === 2])) + '</label><label class="jg-fl"><span>Generala vale</span>' + sel('g', [['ruibal', String(GEN.ruibal.generala), true], ['w50', String(GEN['wikipedia-50'].generala)]]) + '</label><label class="jg-chk2"><input type="checkbox" name="doble"> Doble generala</label><label class="jg-fl" data-doblev hidden><span>La doble vale</span><input class="jg-in" name="dv" type="text" inputmode="numeric" value="" maxlength="3" placeholder="lo que acuerden"></label></div>' +
      '<div class="jg-tw"><table class="jg-sheet" data-o="sheet"></table></div><div class="jg-r"><button class="jg-b s" type="button" data-undo>Deshacer</button><button class="jg-b s" type="button" data-reset>Planilla nueva</button></div><p class="jg-note">Tocá un casillero para anotar. La planilla queda guardada en tu teléfono.</p></section>' +
      '<section class="jg-c w2" data-ayuda><span class="jg-sm">Ayuda</span><h2>¿Dónde me conviene anotar?</h2><p class="jg-mu">Cargá tus cinco dados y en qué tiro estás. Mira la planilla del jugador elegido.</p><div class="jg-dice" data-o="dice">' + [1, 2, 3, 4, 5].map(i => '<button type="button" class="jg-die" data-i="' + i + '" aria-label="Dado ' + i + '">' + i + '</button>').join('') + '</div>' +
      '<div class="jg-r"><label class="jg-fl"><span>Tiro</span>' + sel('t', [[1, 'Primero (servido)', true], [2, 'Segundo'], [3, 'Tercero']]) + '</label><label class="jg-fl"><span>Planilla de</span><select class="jg-se" name="p" data-o="who"></select></label></div><ol class="jg-ul" data-o="tips"></ol></section>' +
      '<section class="jg-c"><span class="jg-sm">Del reglamento</span><h2>Lo que vale cada jugada</h2><table class="jg-tbl" data-nosnippet><tbody><tr><td>Escalera</td><td class="n">' + R.escalera + '</td></tr><tr><td>Full</td><td class="n">' + R.full + '</td></tr><tr><td>Póker</td><td class="n">' + R.poker + '</td></tr><tr><td>Generala</td><td class="n">' + R.generala + '</td></tr><tr><td>Servida (primer tiro)</td><td class="n">+' + R.servidaBonus + '</td></tr></tbody></table><p class="jg-note">Generala servida: gana el partido en el acto.</p>' + cite(h, ['generala.escalera-20', 'generala.full-30', 'generala.poker-40', 'generala.generala-60', 'generala.servida-bonus-5', 'generala.servida-wins', 'generala.w-generala-60-50', 'generala.w-doble-optional', 'generala.number-box']) + '</section></div>';
  },
};

export const generalaJugar = {
  path: '/generala/jugar/', kind: 'game', section: 'juegos', css: ['mesa.css'], js: ['generala.js'],
  title: 'Jugar a la generala online contra la compu',
  h1: 'Jugá a la generala',
  description: 'Jugá a la generala online contra la compu, que en difícil juega con estrategia óptima. Al terminar, mirá en qué tiros te apartaste de la mejor jugada.',
  ld: h => ld(h, ['/generala/', 'Generala']),
  data: () => ({ boxes: boxesOf(R), names: BOX }),
  render(h) {
    return '<section class="jg-play" data-gen><div class="jg-ph"><h1 class="jg-h1 sm">' + h.esc(h.page.h1) + '</h1><form class="jg-cfg" data-cfg><label><span class="jg-sm">Compu</span>' + sel('nivel', [['facil', 'Fácil'], ['normal', 'Normal', true], ['dificil', 'Difícil']]) + '</label><button class="jg-b s" type="button" data-sound aria-pressed="false">Sonido: no</button></form></div>' +
      '<div class="jg-table"><div class="jg-score"><table class="jg-sheet" data-o="sheet"></table></div><div class="jg-felt"><p class="jg-turn" data-o="turn" aria-live="polite"></p><div class="jg-dice" data-o="dice"></div><p class="jg-info" data-o="info"></p>' +
      '<div class="jg-calls"><button class="jg-b p" type="button" data-roll>Tirar</button><button class="jg-b s" type="button" data-hint>¿Qué me conviene?</button></div><p class="jg-say" data-o="say" hidden></p><div class="jg-end" data-o="end" hidden></div></div></div></section>' +
      '<div class="jg-mn"><section class="jg-c w2"><span class="jg-sm">Cómo jugar</span><h2>Tocá los dados que querés guardar</h2><ul><li>Tenés tres tiros por turno. Después de cada tiro, tocá los dados que te quedás y volvé a tirar.</li><li>Para anotar, tocá tu casillero en la planilla: muestra cuánto sumás ahí.</li><li>«¿Qué me conviene?» te muestra la jugada con más puntos esperados para todo el partido.</li></ul></section>' +
      '<section class="jg-c"><span class="jg-sm">Niveles</span><h2>Qué hace la compu</h2><p><b>Fácil</b> junta el número que más le salió. <b>Normal</b> calcula las chances del turno. <b>Difícil</b> juega la mejor estrategia posible para toda la planilla.</p></section></div>';
  },
};

export const generalaProb = {
  path: '/generala/probabilidades/', kind: 'game', section: 'juegos', css: ['mesa.css'],
  title: 'Probabilidades de la generala: servida y con tres tiros',
  h1: 'Qué chance tiene cada jugada',
  description: 'Probabilidades de la generala: qué chance tiene cada jugada servida y en tres tiros si guardás los dados, calculadas exactas por nuestro código.',
  ld: h => ld(h, ['/generala/', 'Generala']),
  render(h) {
    const s = servida(R.straights);
    const rows = ['generala', 'poker', 'full', 'escalera'].map(k => '<tr><td>' + BOX[k] + '</td><td class="n">' + s[k].ways + '</td><td class="n">' + oneIn(s[k].oneIn) + '</td><td class="n">' + fmt(toNumber(s[k].p) * 100, 2) + ' %</td></tr>').join('');
    const w = [1, 2, 3].map(t => generalaWithin(t));
    const S = solver(R, 'game');
    return hero(h, { kicker: 'Generala · la cuenta exacta', scene: 'generala-probabilidades', lede: 'Contamos las ' + fmt(6 ** 5, 0) + ' tiradas posibles de cinco dados y seguimos cada estrategia hasta el final. Nada de simulación: son fracciones exactas.' }) +
      '<div class="jg-mn"><section class="jg-c w2"><span class="jg-sm">En el primer tiro</span><h2>Servida</h2><div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Jugada</th><th class="n">Tiradas de ' + fmt(6 ** 5, 0) + '</th><th class="n">Chance</th><th class="n">%</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="jg-note">Escalera 1-2-3-4-5 o 2-3-4-5-6, como en el reglamento de Ruibal.</p></section>' +
      '<section class="jg-c"><span class="jg-sm">Generala en el turno</span><h2>Si vas a buscarla</h2><ul class="jg-ul">' + w.map(x => '<li><b>En ' + x.rolls + (x.rolls === 1 ? ' tiro' : ' tiros') + '</b> ' + oneIn(x.oneIn) + '</li>').join('') + '</ul><p class="jg-note">Guardando siempre los dados del número que más te salió.</p></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Toda la planilla</span><h2>Cuánto se suma jugando perfecto</h2><p class="jg-win"><span>En promedio</span><b>' + fmt(S.expectedTotal, 1) + '</b><span>puntos</span></p><p class="jg-hon">Es el promedio de una planilla completa con la mejor decisión en cada tiro, sin contar la generala servida. En <a href="' + (h.built('/generala/jugar/') ? h.href('/generala/jugar/') : '/') + '">el juego contra la compu</a> el nivel difícil juega así.</p></section></div>';
  },
};

export const chinchonJugar = {
  path: '/chinchon/jugar/', kind: 'game', section: 'juegos', css: ['mesa.css'], js: ['chinchon.js'],
  title: 'Jugar al chinchón online gratis',
  h1: 'Jugá al chinchón',
  description: 'Jugá al chinchón online contra la compu, gratis y sin registro: robás, descartás y cortás cuando podés, con las reglas de los Juegos Bonaerenses.',
  ld: h => ld(h),
  render(h) {
    const B = CHIN['bonaerense-50'];
    return SPRITE + '<section class="jg-play" data-chin><div class="jg-ph"><h1 class="jg-h1 sm">' + h.esc(h.page.h1) + '</h1><form class="jg-cfg" data-cfg><label><span class="jg-sm">Compu</span>' + sel('nivel', [['facil', 'Fácil'], ['normal', 'Normal', true], ['dificil', 'Difícil']]) + '</label><label><span class="jg-sm">Mazo</span>' + sel('reglas', [['bonaerense-50', '50 cartas con comodines', true], ['ludoteka-40', '40 cartas'], ['ludoteka-48', '48 cartas']]) + '</label><button class="jg-b s" type="button" data-sound aria-pressed="false">Sonido: no</button></form></div>' +
      '<div class="jg-table"><div class="jg-score"><div><span class="jg-sm">Vos</span><b data-o="us">0</b></div><p class="jg-goal" data-o="goal"></p><div><span class="jg-sm">Compu</span><b data-o="them">0</b></div></div>' +
      '<div class="jg-felt"><div class="jg-opp"><div class="jg-hand" data-o="opp"></div></div><div class="jg-row2"><div class="jg-pile"><button type="button" class="jg-cd back" data-draw="mazo" aria-label="Robar del mazo"></button><small data-o="stock"></small></div><div class="jg-pile"><div data-o="pozo"></div><small>pozo</small></div></div>' +
      '<p class="jg-turn" data-o="turn" aria-live="polite"></p><div class="jg-hand mine" data-o="mine"></div><p class="jg-info" data-o="info"></p><div class="jg-calls" data-o="calls"></div><div class="jg-end" data-o="end" hidden></div></div></div></section>' +
      '<div class="jg-mn"><section class="jg-c w2"><span class="jg-sm">Cómo jugar</span><h2>Robá, descartá, cortá</h2><ul><li>En tu turno robá del mazo o del pozo, y después tocá la carta que tirás.</li><li>Si con las otras seis armás juegos y te quedan ' + (B.cut === 'sum-at-most-5' ? '5 puntos o menos' : 'pocos puntos') + ' sueltos, aparece el botón para cortar.</li><li>Juegos: tres o cuatro del mismo número, o escalera de tres o más del mismo palo.</li><li>Gana quien no pase de ' + LIMIT + ' puntos. Chinchón (siete en escalera) sin comodín gana el partido.</li></ul></section>' +
      '<section class="jg-c"><span class="jg-sm">Del reglamento</span><h2>Juegos Bonaerenses</h2>' + cite(h, ['chinchon.50-cards', 'chinchon.seven-cards', 'chinchon.melds', 'chinchon.groups-3-4', 'chinchon.draw-discard', 'chinchon.cut-5', 'chinchon.values', 'chinchon.all-melded', 'chinchon.chinchon-wins', 'chinchon.limit-101', 'chinchon.l-cut', 'chinchon.l-figures-10'], 'Ver reglas') + '</section></div>';
  },
};

export const escobaJugar = {
  path: '/escoba-de-15/jugar/', kind: 'game', section: 'juegos', css: ['mesa.css'], js: ['escoba.js'],
  title: 'Jugar a la escoba de 15 online gratis',
  h1: 'Jugá a la escoba de 15',
  description: 'Jugá a la escoba de 15 online contra la compu, gratis y sin registro, con un aviso de las escobas que se te pasaron después de cada jugada.',
  ld: h => ld(h),
  render(h) {
    const vals = Object.entries({ 1: 'As', 7: 'Siete', 10: 'Sota', 11: 'Caballo', 12: 'Rey' }).map(([n, l]) => l + ' ' + VALUE[n + 'o']).join(' · ');
    return SPRITE + '<section class="jg-play" data-esc><div class="jg-ph"><h1 class="jg-h1 sm">' + h.esc(h.page.h1) + '</h1><form class="jg-cfg" data-cfg><label><span class="jg-sm">Compu</span>' + sel('nivel', [['facil', 'Fácil'], ['normal', 'Normal', true], ['dificil', 'Difícil']]) + '</label><label><span class="jg-sm">Reglas</span>' + sel('reglas', [['bonaerense', 'Bonaerenses (levantar es obligatorio)', true], ['ludoteka', 'Levantar a elección']]) + '</label><button class="jg-b s" type="button" data-sound aria-pressed="false">Sonido: no</button></form></div>' +
      '<div class="jg-table"><div class="jg-score"><div><span class="jg-sm">Vos</span><b data-o="us">0</b></div><p class="jg-goal" data-o="goal"></p><div><span class="jg-sm">Compu</span><b data-o="them">0</b></div></div>' +
      '<div class="jg-felt"><div class="jg-opp"><div class="jg-hand" data-o="opp"></div></div><div class="jg-tablecards" data-o="table"></div><p class="jg-turn" data-o="turn" aria-live="polite"></p>' +
      '<div class="jg-hand mine" data-o="mine"></div><p class="jg-info" data-o="info"></p><div class="jg-calls" data-o="calls"></div><p class="jg-say" data-o="tip" hidden></p><div class="jg-end" data-o="end" hidden></div></div></div></section>' +
      '<div class="jg-mn"><section class="jg-c w2"><span class="jg-sm">Cómo jugar</span><h2>Sumá 15 con la mesa</h2><ul><li>Tocá una carta tuya. Si puede levantar, elegís qué cartas de la mesa suman 15 con ella.</li><li>Si dejás la mesa vacía, es escoba: un punto.</li><li>Valores: ' + vals + '; el resto, su número.</li><li>Al final de cada mano se cuentan cartas, oros, siete de oros y setenta (con la escala del reglamento).</li></ul></section>' +
      '<section class="jg-c"><span class="jg-sm">Setenta</span><h2>La escala</h2><p>' + Object.entries(SETENTA).filter(([n]) => +n <= 7).sort((a, b) => b[1] - a[1]).map(([n, v]) => (n === '1' ? 'As' : n) + ' = ' + v).join(' · ') + ' · figuras = ' + SETENTA[10] + '</p>' + cite(h, ['escoba.values', 'escoba.escoba', 'escoba.cartas', 'escoba.oros-6', 'escoba.siete-oros', 'escoba.setenta-suits', 'escoba.scale-7', 'escoba.scale-6-1', 'escoba.scale-5-4-3', 'escoba.scale-2', 'escoba.scale-fig', 'escoba.must-take', 'escoba.target-30', 'escoba.l-optional']) + '</section></div>';
  },
};

export const dados = {
  path: '/dados/', kind: 'game', section: 'juegos', css: ['mesa.css'], js: ['dados.js'],
  title: 'Tirador de dados online: 1 a 10 dados, para la generala',
  h1: 'Tirá los dados',
  description: 'Tirador de dados online: de 1 a 10 dados, de 4 a 20 caras, con suma e historial. Atajo para la generala con cinco dados y gráfico de resultados.',
  ld: h => ld(h),
  render(h) {
    return '<section class="jg-play" data-dados><div class="jg-ph"><h1 class="jg-h1 sm">' + h.esc(h.page.h1) + '</h1><form class="jg-cfg" data-cfg><label><span class="jg-sm">Dados</span>' + sel('n', Array.from({ length: 10 }, (_, i) => [i + 1, String(i + 1), i === 1])) + '</label><label><span class="jg-sm">Caras</span>' + sel('c', [4, 6, 8, 10, 12, 20].map(v => [v, 'd' + v, v === 6])) + '</label><button class="jg-b s" type="button" data-gen5>Generala (5 dados)</button><button class="jg-b s" type="button" data-sound aria-pressed="false">Sonido: no</button></form></div>' +
      '<div class="jg-felt jg-dfelt"><div class="jg-dice" data-o="dice"></div><p class="jg-win"><span>Suma</span><b data-o="sum">-</b></p><p class="jg-info" data-o="hand"></p><div class="jg-calls"><button class="jg-b p" type="button" data-roll>Tirar</button></div></div>' +
      '<div class="jg-mn"><section class="jg-c w2"><span class="jg-sm">Historial</span><h2>Lo que fue saliendo</h2><div class="jg-hist" data-o="hist"></div><p class="jg-note" data-o="hn">Tirá varias veces y mirá cómo se reparten las sumas: las barras grises son lo que se espera.</p><ol class="jg-ul" data-o="log"></ol></section>' +
      '<section class="jg-c"><span class="jg-sm">Cómo funciona</span><h2>Azar del navegador</h2><p>Cada dado sale de <code>crypto.getRandomValues</code>, el generador criptográfico de tu navegador, sin sesgo por módulo. Nada se manda a ningún lado.</p></section></div>';
  },
};

export const juegosCartas = {
  path: '/juegos-de-cartas/', kind: 'game', section: 'juegos', css: ['mesa.css'],
  title: 'Juegos de cartas españolas que se juegan en Argentina',
  h1: 'Juegos de cartas y de dados',
  description: 'Los juegos de cartas españolas y de dados de la mesa argentina: truco, chinchón, escoba de 15 y generala, para jugar contra la compu o anotar en la mesa.',
  ld: h => ld(h),
  render(h) {
    return SPRITE + hero(h, { kicker: 'Juegos de mesa · sin plata', scene: 'juegos', lede: 'Truco, chinchón, escoba y generala: contra la compu, sin registro y sin apuestas. Y anotadores para cuando juegan en la mesa.' }) +
      '<div class="jg-mn"><section class="jg-c w3"><span class="jg-sm">Con cartas españolas</span><h2>Cartas</h2>' + tiles(h, [
        ['/truco/jugar/', 'Truco', 'Contra la compu, con o sin flor', '#ff5a3c', ICONS.cards],
        ['/chinchon/jugar/', 'Chinchón', 'Robá, descartá y cortá', '#2f7cf6', ICONS.cards],
        ['/escoba-de-15/jugar/', 'Escoba de 15', 'Sumá 15 y barré la mesa', '#16b38a', ICONS.cards],
        ['/truco/anotador/', 'Anotador de truco', 'Con fósforos, malas y buenas', '#8b5cf6', ICONS.pencil],
      ]) + '</section><section class="jg-c w3"><span class="jg-sm">Con dados</span><h2>Dados</h2>' + tiles(h, [
        ['/generala/jugar/', 'Generala contra la compu', 'La compu difícil juega perfecto', '#e8930c', ICONS.dice],
        ['/generala/', 'Anotador de generala', 'De 2 a 8 jugadores, con ayuda', '#e0447a', ICONS.pencil],
        ['/generala/probabilidades/', 'Probabilidades', 'Servida, póker, full: la cuenta exacta', '#2f7cf6', ICONS.calc],
        ['/dados/', 'Tirador de dados', 'De 1 a 10 dados, de 4 a 20 caras', '#16b38a', ICONS.dice],
      ]) + '</section><section class="jg-c w3"><span class="jg-sm">El mazo</span><h2>La baraja española</h2><div class="jg-hand sm">' + ['1e', '1b', '1o', '1c', '7e', '7o', '10c', '11b', '12o'].map(c => card(c)).join('') + '</div><p>Cuatro palos: espadas, bastos, oros y copas. Para el truco y la escoba se usan 40 cartas (sin ochos ni nueves); el chinchón de los Juegos Bonaerenses usa ' + CHIN['bonaerense-50'].deck + ' más dos comodines.</p></section></div>';
  },
};
