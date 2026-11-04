// Truco pages of wave 2 (kind "game": no help block): the rules hand by hand with "who wins the hand", the points of every call,
// the quiero / no quiero trainer and the flor. Rules from data/sources/truco (quotes checked by the engine tests), numbers from
// engine/truco (exact enumeration) at build time and in the browser.
import { RULESETS, FLOR_POINTS, TRUCO_CALLS, envidoCanRaise, envidoQuieroValue, envidoNoQuieroValue, handWinner } from '../../../engine/truco/rules.mjs';
import { florChance, envidoDistribution } from '../../../engine/truco/probability.mjs';
import { hasFlor, florPoints } from '../../../engine/truco/cards.mjs';
import { DECK_40, combinations, binom } from '../../../engine/cards/spanish.mjs';
import { hero, cite, crumbs, webPage, fmt, card, SPRITE, tiles, ICONS, oneIn } from './parts.mjs';

const ldT = h => [webPage(h), crumbs(h, [['/truco/', 'Truco']])];
const sel = (name, opts) => '<select class="jg-se" name="' + name + '">' + opts.map(([v, l, s]) => '<option value="' + v + '"' + (s ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
const CALL = { envido: 'Envido', realEnvido: 'Real envido', faltaEnvido: 'Falta envido' };
const RULE_OPTS = [['clasico-30-sin-flor', 'A 30 (15 malas y 15 buenas)', true], ['bonaerense-40-con-flor', 'A 40, bonaerense'], ['corto-15-sin-flor', 'A 15']];
const more = h => tiles(h, [
  ['/truco/jugar/', 'Jugar contra la compu', 'De a 2 o de a 4, tres niveles', '#ff5a3c', ICONS.play],
  ['/truco/reglas/', 'Reglas del truco', 'Mano por mano', '#2f7cf6', ICONS.book],
  ['/truco/puntos/', 'Cuánto vale cada canto', 'Envido, truco y falta', '#16b38a', ICONS.calc],
  ['/truco/quiero-o-no-quiero/', '¿Quiero o no quiero?', 'Entrenador en series de diez', '#8b5cf6', ICONS.hand],
  ['/truco/flor/', 'La flor', 'Reglas y probabilidad exacta', '#e0447a', ICONS.cards],
  ['/truco/anotador/', 'Anotador', 'Con fósforos', '#e8930c', ICONS.pencil],
].filter(t => t[0] !== h.page.path));

// Every envido chain the rules allow (a subsequence of envido, envido, real envido, falta envido), with its no querido value.
export function envidoChains() {
  const out = [];
  const rec = chain => {
    if (chain.length) out.push(chain);
    for (const k of ['envido', 'realEnvido', 'faltaEnvido']) if (envidoCanRaise(chain, k)) rec([...chain, k]);
  };
  rec([]);
  return out;
}

export const trucoReglas = {
  path: '/truco/reglas/', kind: 'game', section: 'truco', css: ['mesa.css', 'guias.css'], js: ['reglas.js'],
  title: 'Reglas del truco argentino, mano por mano',
  h1: 'Reglas del truco',
  description: 'Reglas del truco argentino mano por mano: el reparto, el envido, truco, retruco y vale cuatro, qué se puede cantar en cada momento y qué pasa si no querés.',
  ld: ldT,
  render(h) {
    const R = RULESETS['clasico-30-sin-flor'], B = RULESETS['bonaerense-40-con-flor'];
    const tv = Object.entries(TRUCO_CALLS);
    const res = (k, label, p) => '<button type="button" data-v="' + k + '" aria-pressed="' + p + '">' + label + '</button>';
    const baza = i => '<div><span class="jg-sm">Baza ' + i + '</span><div class="jg-sg" role="group" data-baza="' + i + '" aria-label="Baza ' + i + '">' + res('0', 'Gané', i === 1 ? 'true' : 'false') + res('1', 'Perdí', 'false') + res('-1', 'Parda', i === 2 ? 'true' : 'false') + res('', 'No se jugó', i === 3 ? 'true' : 'false') + '</div></div>';
    return SPRITE + hero(h, { kicker: 'Truco · reglamento', scene: 'truco-reglas', lede: 'Una mano de truco tiene dos peleas: el envido, que se canta al principio, y el truco, que se gana con las cartas. Acá va paso a paso, con la cita del reglamento en cada uno.', actions: '<a class="jg-b p" href="#quien-gana">¿Quién ganó la mano?</a>' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2"><span class="jg-sm">Una mano, paso a paso</span><h2>Del reparto a los puntos</h2><ol class="jg-steps">' +
      '<li><b>Se reparten tres cartas</b>Con el mazo de ' + DECK_40.length + ' cartas, sin ochos ni nueves. El que está a la derecha del que reparte es mano: tira primero y gana los empates.' + cite(h, ['truco.4p-mano-right', 'truco.hierarchy-bravas']) + '</li>' +
      '<li><b>El envido, antes de la primera carta</b>Cada uno puede cantar envido antes de tirar su primera carta. Gana el que tenga más tantos; si empatan, gana la mano.' + cite(h, ['truco.envido-before-card', 'truco.envido-tie-mano']) + '</li>' +
      '<li><b>El truco, cuando quieras</b>Si nadie lo canta, la mano vale ' + 1 + ' punto. Cantado y querido, ' + tv.map(([v, k]) => ({ truco: 'truco', retruco: 'retruco', valeCuatro: 'vale cuatro' })[k] + ' ' + v).join(', ') + '. Solo puede subir el que recibió el canto.' + cite(h, ['truco.truco-callado', 'truco.truco-retruco-values', 'truco.retruco-by-challenged', 'truco.vale-cuatro']) + '</li>' +
      '<li><b>No quiero</b>Si te cantan y no querés, el otro cobra lo que valía antes del último canto y la mano termina.' + cite(h, ['truco.truco-no-querido', 'truco.envido-no-quiero']) + '</li>' +
      '<li><b>Tres bazas</b>Gana la mano el que gana dos bazas. Con pardas (empates) hay reglas propias: probalas abajo.' + cite(h, ['truco.parda-first', 'truco.parda-all-three', 'truco.parda-one-each']) + '</li>' +
      '<li><b>Irse al mazo</b>Podés abandonar la mano: el otro cobra lo que esté en juego. Si te vas antes de tirar una carta, cobra ' + B.mazoNoCardPoints + '.' + cite(h, ['truco.mazo-before-cards']) + '</li>' +
      '<li><b>El partido</b>A ' + R.target + ' puntos: ' + R.target / 2 + ' malas y ' + R.target / 2 + ' buenas. En los Juegos Bonaerenses, a ' + B.target + '. La flor se juega si se acuerda antes de empezar.' + cite(h, ['truco.target-30', 'truco.target-40', 'truco.flor-optional']) + '</li></ol></section>' +
      '<section class="jg-c t2" id="quien-gana" data-quien aria-live="polite"><span class="jg-tag">Herramienta</span><h2>¿Quién ganó la mano?</h2><p class="jg-mu">Marcá qué pasó en cada baza, desde tu lado.</p><div class="jg-bz">' + baza(1) + baza(2) + baza(3) + '</div>' +
      '<label class="jg-chk2"><input type="checkbox" data-mano checked> Yo soy mano</label><p class="jg-big2" data-o="who">Ganaste vos</p><p class="jg-hon" data-o="why">Ganaste la primera baza y la segunda fue parda: gana el que ganó la primera.</p></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Seguí con</span><h2>Más truco</h2>' + more(h) + '</section></div>';
  },
};

export const trucoPuntos = {
  path: '/truco/puntos/', kind: 'game', section: 'truco', css: ['mesa.css', 'guias.css'], js: ['puntos.js'],
  title: 'Puntos del truco: cuánto vale cada canto',
  h1: 'Cuánto vale cada canto en el truco',
  description: 'Calculadora de puntos del truco: elegí la secuencia de cantos, de envido a falta envido o de truco a vale cuatro, y mirá cuánto vale querido y no querido.',
  ld: ldT,
  data: () => ({ rules: Object.fromEntries(RULE_OPTS.map(([k]) => [k, RULESETS[k]])) }),
  render(h) {
    const R = RULESETS['clasico-30-sin-flor'];
    const rows = envidoChains().map(c => '<tr><td>' + c.map(k => CALL[k]).join(' + ') + '</td><td class="n">' + (c.includes('faltaEnvido') ? 'falta' : envidoQuieroValue(R, c, [0, 0], 0)) + '</td><td class="n">' + envidoNoQuieroValue(c) + '</td></tr>').join('');
    const tv = Object.entries(TRUCO_CALLS);
    return hero(h, { kicker: 'Truco · los puntos', lede: 'Armá la seguidilla de cantos tocando los botones y mirá cuánto se lleva cada uno si se quiere y si no. La falta envido se calcula con el tanteador que pongas.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" data-puntos><span class="jg-tag">Calculadora</span><h2>El envido</h2><div class="jg-r">' + Object.entries(CALL).map(([k, l]) => '<button class="jg-b s" type="button" data-call="' + k + '">' + l + '</button>').join('') + '<button class="jg-b s" type="button" data-clear>Borrar</button></div>' +
      '<div class="jg-chain" data-o="chain"><em>Tocá los cantos en orden</em></div>' +
      '<div class="jg-two"><label class="jg-fl"><span>Nosotros</span><input class="jg-in" name="us" type="text" inputmode="numeric" value="0" maxlength="2"></label><label class="jg-fl"><span>Ellos</span><input class="jg-in" name="them" type="text" inputmode="numeric" value="0" maxlength="2"></label></div>' +
      '<label class="jg-fl"><span>Partido</span>' + sel('r', RULE_OPTS) + '</label>' +
      '<div class="jg-two" style="margin-top:12px"><p class="jg-win"><span>Querido</span><b data-o="q">-</b></p><p class="jg-win no"><span>No querido</span><b data-o="nq">-</b></p></div><p class="jg-hon" data-o="why">Tocá un canto para empezar.</p></section>' +
      '<section class="jg-c t2" data-tpuntos><span class="jg-tag">Calculadora</span><h2>El truco</h2><div class="jg-sg" role="group" aria-label="Hasta dónde llegó">' + '<button type="button" data-t="1" aria-pressed="false">Callado</button>' + tv.map(([v, k]) => '<button type="button" data-t="' + v + '" aria-pressed="' + (v === '2') + '">' + { truco: 'Truco', retruco: 'Retruco', valeCuatro: 'Vale cuatro' }[k] + '</button>').join('') + '</div>' +
      '<p class="jg-win"><span>Querido y ganado</span><b data-o="tq">' + tv[0][0] + '</b></p><p class="jg-win no"><span>No querido</span><b data-o="tnq">1</b></p><p class="jg-hon" data-o="twhy">El que cantó cobra 1 si le dicen «no quiero».</p>' +
      cite(h, ['truco.truco-callado', 'truco.truco-retruco-values', 'truco.truco-no-querido', 'truco.vale-cuatro']) + '</section>' +
      '<section class="jg-c w2"><span class="jg-sm">Todas las seguidillas</span><h2>Envido: la tabla completa</h2><div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Cantos</th><th class="n">Querido</th><th class="n">No querido</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="jg-note">«Falta»: los puntos que le faltan a uno para ganar el partido, según el tanteador y el reglamento que usen (calculadora de arriba).</p>' +
      cite(h, ['truco.envido-table-ee', 'truco.envido-table-r', 'truco.envido-table-eerf-no', 'truco.envido-no-quiero', 'truco.falta-malas-wins-match', 'truco.falta-leader-to-win']) + '</section>' +
      '<section class="jg-c"><span class="jg-sm">Con flor</span><h2>La flor</h2><table class="jg-tbl" data-nosnippet><tbody><tr><td>Flor</td><td class="n">' + FLOR_POINTS.alone + '</td></tr><tr><td>Con flor me achico</td><td class="n">' + FLOR_POINTS.achico + '</td></tr><tr><td>Contraflor querida</td><td class="n">' + FLOR_POINTS.contraflor + '</td></tr><tr><td>Contraflor no querida</td><td class="n">' + FLOR_POINTS.rejected + '</td></tr></tbody></table>' + (h.built('/truco/flor/') ? '<p><a href="' + h.href('/truco/flor/') + '">Todo sobre la flor</a></p>' : '') + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Seguí con</span><h2>Más truco</h2>' + more(h) + '</section></div>';
  },
};

export const trucoQuiero = {
  path: '/truco/quiero-o-no-quiero/', kind: 'game', section: 'truco', css: ['mesa.css', 'guias.css'], js: ['quiero.js'],
  title: '¿Quiero o no quiero? Entrenador de truco y envido',
  h1: '¿Quiero o no quiero?',
  description: '¿Quiero o no quiero? Entrená tus decisiones de truco y envido con manos al azar y compará cada respuesta con la cuenta del motor, en series de diez.',
  ld: ldT,
  data: () => ({ rules: RULESETS['clasico-30-sin-flor'] }),
  render(h) {
    return SPRITE + hero(h, { kicker: 'Truco · entrenador', lede: 'Te tocan tres cartas y el rival canta. Vos decidís; después el motor te muestra la cuenta: qué chance tenías y cuántos puntos se esperan con cada respuesta.', actions: '<a class="jg-b p" href="#entrenar">Empezar la serie</a>' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" id="entrenar" data-quiero><span class="jg-tag" data-o="n">1 de 10</span><h2 data-o="title">Te cantan envido</h2><div class="jg-hand" data-o="hand"></div><p class="jg-ch" data-o="ctx"></p>' +
      '<div class="jg-r"><button class="jg-b p" type="button" data-a="q">Quiero</button><button class="jg-b" type="button" data-a="n">No quiero</button></div>' +
      '<div data-o="res" aria-live="polite"></div><div class="jg-r"><button class="jg-b s" type="button" data-next hidden>Siguiente</button></div></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Tu serie</span><p class="jg-win"><span>Coincidiste con el motor</span><b data-o="ok">0</b><span>de <span data-o="done">0</span></span></p><p class="jg-hon" data-o="lost">Todavía no respondiste ninguna.</p>' +
      '<h3>Cómo decide el motor</h3><ul class="jg-ul tx"><li><b>Envido:</b> cuenta tus tantos contra todas las manos posibles del rival (las ' + fmt(binom(37, 3), 0) + ' que quedan) y compara lo que se espera ganar queriendo con lo que perdés si no querés.</li><li><b>Truco:</b> la chance de ganar las bazas con las cartas a la vista, contra todas esas manos.</li></ul>' +
      '<p class="jg-note">El motor no adivina por qué cantó el rival: supone una mano cualquiera. En la mesa, si el rival canta, suele tener algo: sé un poco más prudente que el motor.</p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Las reglas que usa</span><h2>Lo que vale cada respuesta</h2><ul class="jg-ul tx"><li>Envido querido: ' + envidoQuieroValue(RULESETS['clasico-30-sin-flor'], ['envido'], [0, 0], 0) + ' puntos al que tenga más; no querido: ' + envidoNoQuieroValue(['envido']) + ' al que cantó.</li><li>Real envido querido: ' + envidoQuieroValue(RULESETS['clasico-30-sin-flor'], ['realEnvido'], [0, 0], 0) + '; no querido: ' + envidoNoQuieroValue(['realEnvido']) + '.</li><li>Truco querido: ' + Object.keys(TRUCO_CALLS)[0] + ' al que gane la mano; no querido: 1 al que cantó.</li><li>Empate de tantos: gana la mano.</li></ul>' +
      cite(h, ['truco.envido-table-ee', 'truco.envido-table-r', 'truco.envido-tie-mano', 'truco.truco-retruco-values', 'truco.truco-no-querido']) + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Seguí con</span><h2>Más truco</h2>' + more(h) + '</section></div>';
  },
};

export const trucoFlor = {
  path: '/truco/flor/', kind: 'game', section: 'truco', css: ['mesa.css', 'guias.css'], js: ['flor.js'],
  title: 'La flor en el truco: reglas y probabilidad',
  h1: 'La flor en el truco',
  description: 'La flor en el truco argentino: cuándo se juega con flor y cuándo no, la contraflor y el con flor me achico, y la probabilidad exacta de que te toque una.',
  ld: ldT,
  render(h) {
    const fc = florChance();
    const counts = {};
    let flores = 0;
    combinations(DECK_40, 3, hh => { if (hasFlor(hh)) { flores++; const p = florPoints(hh); counts[p] = (counts[p] || 0) + 1; } });
    const keys = Object.keys(counts).map(Number).sort((a, b) => a - b), mx = Math.max(...Object.values(counts));
    const bars = '<div class="jg-hist" data-nosnippet>' + keys.map(k => '<div title="' + k + '"><i style="height:' + Math.max(3, Math.round(100 * counts[k] / mx)) + '%"></i><small>' + k + '</small></div>').join('') + '</div>';
    const ed = envidoDistribution({ flor: true });
    const picker = '<div class="jg-deck sm" data-picker>' + DECK_40.map(c => card(c, ' data-card="' + c + '" tabindex="0"')).join('') + '</div>';
    return SPRITE + hero(h, { kicker: 'Truco · flor', lede: 'Flor es tener las tres cartas del mismo palo. Te toca ' + oneIn(1 / fc.p) + ' manos: poco, pero cuando sale cambia todo, porque anula el envido.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" data-flor><span class="jg-tag">Calculadora</span><h2>Elegí tus tres cartas</h2>' + picker + '<p class="jg-note">Tocá tres cartas; volvé a tocar una para sacarla.</p></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Tu mano</span><div class="jg-hand" data-o="hand"></div><p class="jg-win"><span data-o="lbl">Flor</span><b data-o="pts">-</b></p>' +
      '<div class="jg-sg" role="group" aria-label="Quién es mano"><button type="button" aria-pressed="true" data-mano="1">Soy mano</button><button type="button" aria-pressed="false" data-mano="0">No soy mano</button></div><p class="jg-hon" data-o="vs">Elegí tres cartas.</p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Las ' + flores + ' flores posibles</span><h2>Cuánto suma una flor</h2>' + bars + '<p class="jg-hon">De las ' + fmt(ed.total, 0) + ' manos posibles, ' + flores + ' son flor: ' + fmt(fc.p * 100, 2) + ' %. La flor vale 20 más las tres cartas (las figuras, cero).</p>' + cite(h, ['truco.flor-value']) + '</section>' +
      '<section class="jg-c"><span class="jg-sm">Del reglamento</span><h2>Los cantos de la flor</h2><table class="jg-tbl" data-nosnippet><tbody><tr><td>Flor</td><td class="n">' + FLOR_POINTS.alone + '</td></tr><tr><td>Con flor me achico</td><td class="n">' + FLOR_POINTS.achico + '</td></tr><tr><td>Contraflor querida</td><td class="n">' + FLOR_POINTS.contraflor + '</td></tr><tr><td>Contraflor no querida</td><td class="n">' + FLOR_POINTS.rejected + '</td></tr><tr><td>Contraflor al resto</td><td class="n">el partido</td></tr></tbody></table>' +
      cite(h, ['truco.flor-optional', 'truco.flor-three', 'truco.flor-cancels-envido', 'truco.flor-achico', 'truco.contraflor', 'truco.contraflor-resto']) + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Seguí con</span><h2>Más truco</h2>' + more(h) + '</section></div>';
  },
};
