// Truco pages (kind "game": no help block, PLAYBOOK 1.1). Rules from data/sources/truco (quotes checked by the engine tests);
// numbers from engine/truco (exact enumeration). Play against the computer: client/truco.js.
import { LADDER, POWER, envidoPoints } from '../../../engine/truco/cards.mjs';
import { envidoDistribution, florChance } from '../../../engine/truco/probability.mjs';
import { RULESETS, FLOR_POINTS, TRUCO_CALLS } from '../../../engine/truco/rules.mjs';
import { DECK_40, combinations } from '../../../engine/cards/spanish.mjs';
import { hero, cite, crumbs, webPage, fmt, card, SPRITE, tiles, ICONS, NUM, SUIT, mnOpen, mnArt } from './parts.mjs';

const ldT = (h, extra) => [webPage(h), crumbs(h, h.page.path === '/truco/' ? [] : [['/truco/', 'Truco']]), ...(extra ? [extra] : [])];
const name = c => NUM[parseInt(c, 10)] + ' de ' + SUIT[c.slice(-1)];

export const SENAS = [
  { id: '1e', cards: ['1e'], what: 'Ancho de espadas', how: 'Levantar las cejas', face: { brows: 'up' } },
  { id: '1b', cards: ['1b'], what: 'Ancho de bastos', how: 'Guiñar un ojo', face: { eyes: 'wink' } },
  { id: '7e', cards: ['7e'], what: 'Siete de espadas', how: 'Mover los labios hacia la derecha', face: { mouth: 'right' } },
  { id: '7o', cards: ['7o'], what: 'Siete de oros', how: 'Mover los labios hacia la izquierda', face: { mouth: 'left' } },
  { id: 'tres', cards: ['3e', '3b', '3o', '3c'], what: 'Un tres', how: 'Morder el labio de abajo', face: { mouth: 'bite' } },
  { id: 'dos', cards: ['2e', '2b', '2o', '2c'], what: 'Un dos', how: 'Fruncir los labios, como un beso', face: { mouth: 'kiss' } },
  { id: 'falso', cards: ['1o', '1c'], what: 'As de oros o de copas', how: 'Abrir un poco la boca', face: { mouth: 'open' } },
  { id: 'malas', cards: [], what: 'Malas cartas', how: 'Cerrar los ojos', face: { eyes: 'closed' } },
  { id: 'envido', cards: [], what: 'Buenas para el envido', how: 'Inclinar la cabeza', face: { tilt: true } },
];
const QUOTE_OF = { '1e': '4p-senas-1e', '1b': '4p-senas-1b', '7e': '4p-senas-7e', '7o': '4p-senas-7o', tres: '4p-senas-tres', dos: '4p-senas-dos', falso: '4p-senas-falso', malas: '4p-senas-malas', envido: '4p-senas-envido' };
export function face({ brows = 'n', eyes = 'open', mouth = 'n', tilt = false } = {}) {
  const eye = (x, closed) => closed ? '<path d="M' + (x - 7) + ' 52q7 5 14 0" stroke-width="3.5"/>' : '<circle cx="' + x + '" cy="52" r="5" fill="currentColor" stroke="none"/>';
  const by = brows === 'up' ? 30 : 38;
  const m = {
    n: '<path d="M48 82q12 7 24 0" stroke-width="3.5"/>',
    right: '<path d="M60 82q10 6 20-3" stroke-width="3.5"/>',
    left: '<path d="M40 79q10 9 20 3" stroke-width="3.5"/>',
    bite: '<path d="M47 80h26" stroke-width="3.5"/><path d="M52 80v5M58 80v5M64 80v5M70 80v4" stroke-width="2.4"/>',
    kiss: '<ellipse cx="60" cy="82" rx="6" ry="5" stroke-width="3.5"/>',
    open: '<ellipse cx="60" cy="82" rx="9" ry="7" fill="currentColor" stroke="none" opacity=".85"/>',
  }[mouth];
  return '<svg class="jg-face" viewBox="0 0 120 120" aria-hidden="true"><g' + (tilt ? ' transform="rotate(-14 60 60)"' : '') + '><circle cx="60" cy="60" r="44" class="sk"/>' +
    '<path d="M34 ' + by + 'q9-6 18 0M68 ' + by + 'q9-6 18 0" stroke-width="3.5"/>' + eye(43, eyes === 'closed') + eye(77, eyes === 'closed' || eyes === 'wink') + m + '</g></svg>';
}

export const trucoHub = {
  path: '/truco/', kind: 'game', section: 'truco', css: ['mesa.css'], js: ['mano.js'],
  title: 'Truco argentino: reglas, valores, señas y anotador',
  h1: 'Truco argentino',
  description: 'Truco argentino de punta a punta: reglas, valores de las cartas, señas y anotador. Repartí una mano y mirá tu envido y qué chance tiene contra otra.',
  ld: h => ldT(h),
  render(h) {
    const R = RULESETS['clasico-30-sin-flor'];
    return SPRITE + hero(h, { kicker: 'Truco · 40 cartas españolas', scene: 'truco', lede: 'Se juega con ' + DECK_40.length + ' cartas, sin ochos ni nueves, de a dos o de a cuatro. Repartí una mano acá abajo y mirá cuánto vale.', actions: (h.built('/truco/jugar/') ? '<a class="jg-b p" href="' + h.href('/truco/jugar/') + '">Jugar contra la compu</a>' : '') + (h.built('/truco/anotador/') ? '<a class="jg-b" href="' + h.href('/truco/anotador/') + '">Anotador</a>' : '') }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2 jg-deal" data-mano><span class="jg-tag">Repartí una mano</span><h2>Tu mano</h2><div class="jg-hand" data-o="hand">' + ['1e', '7o', '3c'].map(c => card(c)).join('') + '</div>' +
      '<div class="jg-ch"><span>Envido: <b data-o="env">' + envidoPoints(['1e', '7o', '3c']) + '</b></span><span data-o="flor">sin flor</span><span>Carta más alta: <b data-o="top">' + name('1e') + '</b></span></div>' +
      '<p class="jg-hon" data-o="chance">Tocá «Repartir» para ver qué chance tiene tu envido contra una mano al azar.</p><div class="jg-r"><button class="jg-b p" type="button" data-deal>Repartir</button><label class="jg-chk2"><input type="checkbox" data-mano-mano checked> Soy mano</label></div></section>' +
      '<section class="jg-c"><span class="jg-sm">Los puntos</span><h2>Cuánto vale cada canto</h2><table class="jg-tbl" data-nosnippet><tbody>' + Object.entries(TRUCO_CALLS).map(([v, k]) => '<tr><td>' + { truco: 'Truco', retruco: 'Retruco', valeCuatro: 'Vale cuatro' }[k] + ' querido</td><td class="n">' + v + '</td></tr>').join('') + '<tr><td>Flor</td><td class="n">' + FLOR_POINTS.alone + '</td></tr></tbody></table>' +
      cite(h, ['truco.truco-callado', 'truco.truco-retruco-values', 'truco.vale-cuatro', 'truco.flor-three']) + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Todo el truco</span><h2>Elegí por dónde seguir</h2>' + tiles(h, [
        ['/truco/jugar/', 'Jugar contra la compu', 'De a 2 o de a 4, tres niveles, con o sin flor', '#ff5a3c', ICONS.play],
        ['/truco/anotador/', 'Anotador con fósforos', 'Malas y buenas, deshacer y pantalla grande', '#16b38a', ICONS.pencil],
        ['/truco/valores-de-las-cartas/', 'Valores de las cartas', 'Qué carta mata a cuál', '#e0447a', ICONS.cards],
        ['/truco/senas/', 'Señas', 'Las nueve señas, con dibujo y entrenador', '#8b5cf6', ICONS.eye],
        ['/truco/envido/', 'Envido', 'Contá tus tantos y mirá qué chance tienen', '#2f7cf6', ICONS.calc],
        ['/truco/reglas/', 'Reglas', 'Mano por mano, y quién gana con pardas', '#e8930c', ICONS.book],
        ['/truco/puntos/', 'Cuánto vale cada canto', 'Envido, truco y falta, querido o no', '#16b38a', ICONS.calc],
        ['/truco/quiero-o-no-quiero/', '¿Quiero o no quiero?', 'Entrenador en series de diez', '#8b5cf6', ICONS.hand],
        ['/truco/flor/', 'La flor', 'Contraflor y probabilidad exacta', '#e0447a', ICONS.cards],
      ]) + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Reglas en un minuto</span><h2>Cómo se juega una mano</h2><ol><li>Cada uno recibe tres cartas. Se juegan hasta tres bazas: gana la mano quien gana dos.</li><li>Antes de tirar tu primera carta podés cantar <b>envido</b>: gana quien tenga más tantos.</li><li>En cualquier momento podés cantar <b>truco</b>: si te dicen «quiero», la mano vale ' + Object.keys(TRUCO_CALLS)[0] + ' puntos; si no, ganás uno.</li><li>El partido es a ' + R.target + ' puntos: los primeros ' + R.target / 2 + ' son las malas y los otros las buenas.</li></ol>' +
      cite(h, ['truco.hierarchy-bravas', 'truco.envido-before-card', 'truco.truco-no-querido', 'truco.target-30']) + '</section></div>';
  },
};

export const trucoJugar = {
  path: '/truco/jugar/', kind: 'game', section: 'truco', css: ['mesa.css'], js: ['truco.js'],
  title: 'Truco online gratis contra la compu: de a 2 o de a 4',
  h1: 'Jugá al truco contra la compu',
  description: 'Jugá al truco argentino online gratis y sin registro contra la compu: mano a mano o de a 4 con un compañero que lee tus señas. Tres niveles.',
  ld: h => ldT(h, { '@context': 'https://schema.org', '@type': 'Game', name: 'Truco argentino contra la compu', url: 'https://' + h.site.domain + h.page.path, inLanguage: 'es-AR', numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 4 } }),
  data: () => ({ s: SENAS.map(x => ({ id: x.id === 'falso' ? 'anchoFalso' : x.id, what: x.what, how: x.how, face: face(x.face) })) }),
  render(h) {
    const opt = (v, l, sel) => '<option value="' + v + '"' + (sel ? ' selected' : '') + '>' + l + '</option>';
    const P30 = RULESETS['parejas-30-sin-flor'], P15 = RULESETS['parejas-15-sin-flor'];
    const seat = (n, cls, name) => '<div class="jg-seat ' + cls + '" data-seat="' + n + '"><div class="jg-stn"><b>' + name + '</b><span data-o="bd"></span></div><div class="jg-hand" data-o="cards"></div><p class="jg-say" data-o="say" hidden></p></div>';
    return SPRITE + '<section class="jg-play" data-truco><div class="jg-ph"><h1 class="jg-h1 sm">' + h.esc(h.page.h1) + '</h1><form class="jg-cfg" data-cfg>' +
      '<div class="jg-mode"><span class="jg-sm" id="jg-modo">Jugadores</span><div class="jg-seg" role="radiogroup" aria-labelledby="jg-modo"><label><input type="radio" name="modo" value="2" checked><span>De a 2</span></label><label><input type="radio" name="modo" value="4"><span>De a 4</span></label></div></div>' +
      '<label><span class="jg-sm">Compu</span><select class="jg-se" name="nivel">' + opt('facil', 'Fácil') + opt('normal', 'Normal', true) + opt('dificil', 'Difícil') + '</select></label>' +
      '<label><span class="jg-sm">Reglas</span><select class="jg-se" name="reglas">' + opt('clasico-30-sin-flor', 'A 30, sin flor', true) + opt('clasico-30-con-flor', 'A 30, con flor') + opt('corto-15-sin-flor', 'A 15, sin flor') + opt('bonaerense-40-con-flor', 'A 40, con flor (bonaerense)') + '</select></label>' +
      '<button class="jg-b s" type="button" data-sound aria-pressed="false">Sonido: no</button></form></div>' +
      '<div class="jg-table"><div class="jg-score"><div><span class="jg-sm" data-t="usl">Vos</span><div data-t="us"></div></div><p class="jg-goal" data-t="goal"></p><div><span class="jg-sm" data-t="theml">Compu</span><div data-t="them"></div></div></div>' +
      '<div class="jg-felt" data-felt="2"><div class="jg-opp"><div class="jg-hand back" data-t="opp"></div><p class="jg-say" data-t="say" hidden aria-live="polite"></p></div>' +
      '<div class="jg-bazas" data-t="bazas"></div><p class="jg-turn" data-t="turn" aria-live="polite"></p>' +
      '<div class="jg-hand mine" data-t="mine"></div><p class="jg-info" data-t="info"></p><div class="jg-calls" data-t="calls"></div>' +
      '<div class="jg-end" data-t="end" hidden aria-live="polite"></div></div>' +
      '<div class="jg-felt jg-f4" data-felt="4" hidden>' + seat(2, 't', 'Compañero') + seat(3, 'l', 'Rival') +
      '<div class="jg-mid"><div class="jg-bzs" data-t="bz"></div><div class="jg-x" data-t="x"></div><p class="jg-turn" data-t="turn" aria-live="polite"></p><p class="jg-log" data-t="log" aria-live="polite"></p></div>' + seat(1, 'r', 'Rival') +
      '<div class="jg-me" data-seat="0"><div class="jg-stn"><b>Vos</b><span data-o="bd"></span></div><p class="jg-say" data-o="say" hidden></p><div class="jg-hand mine" data-t="mine"></div><p class="jg-info" data-t="info"></p></div>' +
      '<div class="jg-calls" data-t="calls"></div>' +
      '<details class="jg-sn" data-t="sn"><summary>Señas para tu compañero</summary><div class="jg-snl" data-t="snl"></div><p class="jg-snd" data-t="snd"></p></details>' +
      '<div class="jg-end" data-t="end" hidden aria-live="polite"></div></div></div>' +
      '<noscript><p class="jg-hon">Para jugar hace falta JavaScript.</p></noscript></section>' +
      mnOpen(h) + '<section class="jg-c w2"><span class="jg-sm">Cómo jugar</span><h2>Tocá una carta para tirarla</h2><ul><li>Elegí arriba si jugás <b>de a 2</b> (vos contra la compu) o <b>de a 4</b> (vos y un compañero contra dos rivales; los tres los maneja la compu).</li><li>Los cantos que podés hacer aparecen como botones debajo de tus cartas: envido, truco, quiero, no quiero, irte al mazo.</li><li>Con el teclado: 1, 2 y 3 tiran tus cartas; Q es quiero, N no quiero, T truco (o la subida que toque), E envido; Enter reparte.</li><li>Cada modo guarda su partida en tu navegador: si cerrás la página o cambiás de modo, la seguís después.</li><li>La compu no ve tus cartas: decide con lo que se ve en la mesa, como vos.</li></ul></section>' + mnArt(h) + '<section class="jg-c"><span class="jg-sm">Niveles</span><h2>Qué hace la compu</h2><p><b>Fácil</b> juega casi al azar. <b>Normal</b> calcula la chance exacta de su envido y de sus cartas. <b>Difícil</b> además adivina tus cartas por lo que cantaste y a veces miente. De a 4, tu compañero y los rivales juegan con el mismo nivel.</p></section>' +
      '<section class="jg-c w3" id="de-a-cuatro"><span class="jg-sm">De a 4</span><h2>Cómo se juega de a cuatro</h2><ul>' +
      '<li>Son dos parejas sentadas frente a frente: tu compañero está enfrente y los rivales a los costados. Se juega en contra de las agujas del reloj, así que después de vos tira el rival de la derecha.</li>' +
      '<li>Empieza el mano y en la mano siguiente lo es el de al lado. El último de cada pareja en jugar es el <b>pie</b>.</li>' +
      '<li>Cada baza la gana la carta más alta. Si empatan dos cartas de la misma pareja, la baza es de esa pareja; si son de parejas distintas, es parda. La baza siguiente la empieza el que ganó; después de una parda, el mano.</li>' +
      '<li>Cualquiera puede cantar envido antes de tirar su primera carta. Si es querido, los tantos se dicen desde el mano y el que no supera lo mejor de la otra pareja dice «son buenas»; gana la pareja del que tiene más, y si empatan, el más cerca del mano.</li>' +
      '<li>Quién contesta un canto: a ' + P30.target + ' contesta el pie de la otra pareja; a ' + P15.target + ', el primer rival después del que cantó. La respuesta compromete a toda la pareja.</li>' +
      '<li>Si te vas al mazo te vas solo y tu compañero sigue con sus cartas. Si se van los dos, la otra pareja cobra lo que valía la mano (sin truco ni cartas jugadas: ' + P30.mazoNoCardPoints + ' a ' + P30.target + ' y ' + P15.mazoNoCardPoints + ' a ' + P15.target + ').</li>' +
      '<li><b>Señas:</b> con el panel le marcás a tu compañero qué tenés. Acá solo podés hacer señas ciertas y tu compañero las tiene en cuenta; los rivales no las ven, aunque en una mesa de verdad pueden. Están todas en <a href="' + h.href('/truco/senas/') + '">las señas del truco</a>.</li>' +
      '<li>De a 4 se juega sin flor: con cuatro manos la flor tiene reglas propias que todavía no armamos.</li></ul>' +
      cite(h, ['truco.4p-pairs', 'truco.4p-order', 'truco.4p-mano-right', 'truco.4p-pie', 'truco.4p-baza-same-team', 'truco.4p-lead-winner', 'truco.4p-parda-mano-leads', 'truco.4p-envido-team', 'truco.4p-envido-tie-mano', 'truco.4p-son-buenas', 'truco.4p-responder-any', 'truco.4p-mazo-alone', 'truco.4p-mazo-both', 'truco.4p-senas', 'truco.4p-senas-visible']) + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Reglas que usa el juego</span><h2>De los reglamentos</h2>' + cite(h, ['truco.hierarchy-bravas', 'truco.hierarchy-rest', 'truco.envido-count', 'truco.envido-tie-mano', 'truco.envido-no-quiero', 'truco.falta-malas-wins-match', 'truco.parda-first', 'truco.parda-all-three', 'truco.mazo-before-cards', 'truco.flor-three', 'truco.flor-achico', 'truco.contraflor', 'truco.target-40']) + '</section></div>';
  },
};

export const trucoValores = {
  path: '/truco/valores-de-las-cartas/', kind: 'game', section: 'truco', css: ['mesa.css'], js: ['valores.js'],
  title: 'Valores del truco: tabla de cartas de mayor a menor',
  h1: 'Valores de las cartas del truco',
  description: 'Valores del truco argentino de mayor a menor: el ancho de espadas arriba y las 40 cartas en orden. Tocá una y mirá a cuáles mata. Y machete para imprimir.',
  ld: h => ldT(h),
  render(h) {
    const rows = LADDER.map((cards, i) => {
      const beats = DECK_40.filter(c => POWER[c] < POWER[cards[0]]).length;
      return '<li><span class="jg-lv">' + (i + 1) + '</span><div class="jg-hand sm">' + cards.map(c => card(c, ' tabindex="0" data-card="' + c + '"')).join('') + '</div><small>mata a ' + beats + '</small></li>';
    }).join('');
    return SPRITE + hero(h, { kicker: 'Truco · ' + LADDER.length + ' escalones', scene: 'truco-valores', lede: 'Arriba de todo, las cuatro bravas. Después, los tres, los dos y el resto. Las cartas del mismo escalón empatan: es parda.', actions: '<button class="jg-b" type="button" data-print>Imprimir machete</button>' }) +
      '<div class="jg-mn"><section class="jg-c w2 jg-lad"><span class="jg-sm">De mayor a menor</span><h2>Las 40 cartas en orden</h2><ol class="jg-ladder">' + rows + '</ol></section>' +
      '<section class="jg-c t2 jg-pick" aria-live="polite"><span class="jg-sm">Tocá una carta</span><h2 data-o="name">Ancho de espadas</h2><div data-o="card">' + card('1e') + '</div><p class="jg-hon" data-o="text">Es la carta más alta: mata a las otras 39.</p>' +
      '<h3>Aprendé en dos minutos</h3><p class="jg-mu">¿Cuál de las dos gana?</p><div class="jg-quiz" data-quiz><div class="jg-hand" data-o="qa"></div><p class="jg-res" data-o="qr"></p><p class="jg-note">Racha: <b data-o="streak">0</b></p></div></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Del reglamento</span><h2>El orden oficial</h2>' + cite(h, ['truco.hierarchy-bravas', 'truco.hierarchy-rest', 'truco.hierarchy-rest-2']) + '</section></div>';
  },
};

export const trucoSenas = {
  path: '/truco/senas/', kind: 'game', section: 'truco', css: ['mesa.css'], js: ['senas.js'],
  title: 'Señas del truco: todas, con dibujo y significado',
  h1: 'Las señas del truco',
  description: 'Todas las señas del truco argentino con dibujo y significado, y un entrenador para adivinar qué carta te está marcando tu compañero, contra reloj.',
  ld: h => ldT(h),
  data: () => ({ s: SENAS.map(x => ({ id: x.id, what: x.what, face: face(x.face) })) }),
  render(h) {
    const cards = SENAS.map(x => '<article class="jg-c jg-sena"><div class="jg-fw">' + face(x.face) + '</div><div><h3>' + x.what + '</h3><p>' + x.how + '.</p>' + (x.cards.length ? '<div class="jg-hand xs">' + x.cards.map(c => card(c)).join('') + '</div>' : '') + cite(h, 'truco.' + QUOTE_OF[x.id]) + '</div></article>').join('');
    return SPRITE + hero(h, { kicker: 'Truco · de a cuatro', scene: 'truco-senas', lede: 'En el truco de parejas se vale avisarle al compañero qué tenés, con gestos. Estas son las más comunes; cada mesa puede tener las suyas.', actions: '<a class="jg-b p" href="#entrenador">Probar el entrenador</a>' }) +
      '<div class="jg-mn jg-senas">' + cards +
      '<section class="jg-c w3 jg-train" id="entrenador" data-senas><span class="jg-tag">Entrenador</span><h2>¿Qué te está diciendo?</h2><div class="jg-tr2"><div class="jg-fw big" data-o="face"></div><div><p class="jg-mu">Tenés 5 segundos.</p><div class="jg-opts" data-o="opts"></div><p class="jg-res" data-o="res"></p><p class="jg-note">Aciertos: <b data-o="ok">0</b> de <b data-o="n">0</b></p><button class="jg-b p" type="button" data-start>Empezar</button></div></div></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Ojo</span><h2>Los de enfrente también miran</h2>' + cite(h, ['truco.4p-senas', 'truco.4p-senas-visible']) + '</section></div>';
  },
};

export const trucoAnotador = {
  path: '/truco/anotador/', kind: 'game', section: 'truco', css: ['mesa.css'], js: ['anotador.js'],
  title: 'Anotador de truco online: a 15 o a 30, con fósforos',
  h1: 'Anotador de truco',
  description: 'Anotador de truco online para el celu: a 15 o a 30, malas y buenas, con los fosforitos en cuadrados de cinco como en la mesa. Deshacer y pantalla completa.',
  ld: h => ldT(h),
  render(h) {
    const side = (k, label) => '<div class="jg-side" data-side="' + k + '"><input class="jg-tn" data-name="' + k + '" value="' + label + '" aria-label="Nombre del equipo" maxlength="18" autocomplete="off"><b class="jg-num" data-o="n' + k + '">0</b><div class="jg-pzw" data-o="p' + k + '"></div><p class="jg-stage" data-o="s' + k + '"></p>' +
      '<div class="jg-r"><button class="jg-b p jg-plus1" type="button" data-add="' + k + '" data-v="1">+1</button><button class="jg-b s" type="button" data-add="' + k + '" data-v="2">+2</button><button class="jg-b s" type="button" data-add="' + k + '" data-v="3">+3</button><button class="jg-b s" type="button" data-add="' + k + '" data-v="-1" aria-label="Restar uno">−1</button></div></div>';
    return '<section class="jg-anot" data-anotador><div class="jg-ph"><h1 class="jg-h1 sm">' + h.esc(h.page.h1) + '</h1><div class="jg-sg" role="group" aria-label="A cuántos puntos"><button type="button" data-target="15" aria-pressed="false">A 15</button><button type="button" data-target="30" aria-pressed="true">A 30</button><button type="button" data-target="40" aria-pressed="false">A 40</button></div></div>' +
      '<div class="jg-sides">' + side('a', 'Nosotros') + side('b', 'Ellos') + '</div><p class="jg-win2" data-o="win" hidden aria-live="polite"></p>' +
      '<div class="jg-r jg-tools"><button class="jg-b s" type="button" data-undo>Deshacer</button><button class="jg-b s" type="button" data-reset>Partido nuevo</button><button class="jg-b s" type="button" data-full>Pantalla completa</button><button class="jg-b s" type="button" data-share>Compartir resultado</button><button class="jg-b s" type="button" data-sound aria-pressed="false">Sonido: no</button></div>' +
      '<details class="jg-src"><summary>Historial</summary><ol data-o="log"></ol></details></section>' +
      mnOpen(h) + '<section class="jg-c w2"><span class="jg-sm">Cómo se anota</span><h2>Fósforos de a cinco</h2><p>Cada punto es un palito; al quinto se cierra el cuadrado con una diagonal. A 30, los primeros 15 son las malas y los otros 15 las buenas.</p><p>Los nombres y el tanteador quedan guardados en tu teléfono. Una vez abierta, la página anda sin conexión.</p></section>' + mnArt(h) + '<section class="jg-c"><span class="jg-sm">Del reglamento</span><h2>Malas y buenas</h2>' + cite(h, ['truco.target-30', 'truco.malas-buenas-40']) + '</section></div>';
  },
};

export const trucoEnvido = {
  path: '/truco/envido/', kind: 'game', section: 'truco', css: ['mesa.css'], js: ['envido.js'],
  title: 'Envido: cómo contar los tantos y qué chance tenés',
  h1: 'Envido: contá tus tantos',
  description: 'Contá los tantos del envido con tus tres cartas y mirá qué chance tenés de ganarle a una mano al azar, calculada sobre todas las combinaciones posibles.',
  ld: h => ldT(h),
  render(h) {
    const d = envidoDistribution({ flor: false });
    const keys = Object.keys(d.counts).map(Number).sort((a, b) => a - b);
    const max = Math.max(...keys.map(k => d.counts[k]));
    let atLeast = 0;
    const cum = {};
    for (const k of keys.slice().reverse()) { atLeast += d.counts[k]; cum[k] = atLeast; }
    const bars = '<div class="jg-hist" data-nosnippet>' + keys.map(k => '<div title="' + k + ' tantos"><i style="height:' + Math.max(2, Math.round(100 * d.counts[k] / max)) + '%"></i><small>' + k + '</small></div>').join('') + '</div>';
    const ref = [20, 25, 27, 28, 30, 31, 33].filter(k => cum[k]);
    const picker = '<div class="jg-deck" data-picker>' + DECK_40.map(c => card(c, ' data-card="' + c + '" tabindex="0"')).join('') + '</div>';
    const fl = florChance();
    let three = 0;
    combinations(DECK_40, 3, hh => { if (new Set(hh.map(c => c.slice(-1))).size === 1) three++; });
    return SPRITE + hero(h, { kicker: 'Truco · envido', scene: 'truco-envido', lede: 'Dos cartas del mismo palo: 20 más lo que valen. Las figuras valen cero. Si no tenés dos del mismo palo, vale tu carta más alta. El máximo es ' + h.t('{{env_max}}') + '.' }) +
      '<div class="jg-mn"><section class="jg-c w2" data-envido><span class="jg-tag">Calculadora</span><h2>Elegí tus tres cartas</h2>' + picker + '<p class="jg-note">Tocá tres cartas. Volvé a tocar una para sacarla.</p></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Tus tantos</span><div class="jg-hand" data-o="hand"></div><p class="jg-win"><span>Envido</span><b data-o="pts">-</b></p><p data-o="why" class="jg-mu"></p>' +
      '<div class="jg-sg" role="group" aria-label="Quién es mano"><button type="button" aria-pressed="true" data-mano="1">Soy mano</button><button type="button" aria-pressed="false" data-mano="0">No soy mano</button></div>' +
      '<p class="jg-hon" data-o="vs">Elegí tres cartas para ver la chance contra una mano al azar de las 37 que quedan.</p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Las ' + h.t('{{hands}}') + ' manos posibles</span><h2>Cuántos tantos salen</h2>' + bars +
      '<table class="jg-tbl" data-nosnippet><thead><tr><th>Tantos</th><th class="n">Manos con eso o más</th></tr></thead><tbody>' + ref.map(k => '<tr><td>' + k + ' o más</td><td class="n">' + fmt(100 * cum[k] / d.total, 1) + ' %</td></tr>').join('') + '</tbody></table>' +
      '<p class="jg-hon">Con flor en juego, tres del mismo palo no cuentan como envido: pasa en ' + fmt(100 * fl.p, 2) + ' % de las manos (' + three + ' de ' + d.total + ').</p></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Del reglamento</span><h2>Cómo se cuenta</h2>' + cite(h, ['truco.envido-count', 'truco.envido-figures-zero', 'truco.envido-max-33', 'truco.envido-three-of-suit', 'truco.envido-tie-mano', 'truco.envido-table-ee', 'truco.envido-table-r', 'truco.falta-malas-wins-match']) + '</section></div>';
  },
};
