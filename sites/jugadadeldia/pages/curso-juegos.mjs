// Beginner tutorials of the table games (owner 2026-11-05): generala, chinchon, escoba de 15, burako and dice. Every number comes
// from the engine or from a cited value; the worked examples are real games played by the engine with a fixed seed (the build
// stops when a seed no longer gives the situation the text explains: then pick another seed with the scratch search).
import { RULESETS as GEN, solver, newGame, apply as genApply, boxScore, boxesOf } from '../../../engine/generala/index.mjs';
import { servida, generalaWithin, handOf } from '../../../engine/lottery/dice.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';
import { cite, fmt, oneIn } from './parts.mjs';
import { toc, sec, tip, steps, errs, fig, dice, go, faqSec } from './curso.mjs';

const R = GEN.ruibal;
export const BOXN = { 1: 'al 1', 2: 'al 2', 3: 'al 3', 4: 'al 4', 5: 'al 5', 6: 'al 6', escalera: 'Escalera', full: 'Full', poker: 'Póker', generala: 'Generala', doble: 'Doble generala' };
const ev1 = x => fmt(x, 1);
const keepTxt = k => (k.length ? k.join('-') : 'nada');
const optTxt = o => (o.type === 'roll' ? 'guardar ' + keepTxt(o.keep) + ' y tirar' : 'anotar ' + o.points + ' ' + (/^\d$/.test(o.box) ? BOXN[o.box] : 'en ' + BOXN[o.box]));

// One turn of a fresh sheet played with the best decision at every throw (solver 'game'): dice, the choice and the top options.
function genTurn(seed) {
  const S = solver(R, 'game');
  let s = newGame(R, { players: 2, seed });
  s = genApply(s, { type: 'roll', keep: [] });
  const out = [];
  for (let t = 1; t <= 3 && !s.over; t++) {
    const opts = S.options(s.sheets[0], s.dice, s.throws);
    out.push({ dice: s.dice.slice(), best: opts[0], top: opts.slice(0, 3) });
    if (opts[0].type === 'score') break;
    s = genApply(s, { type: 'roll', keep: opts[0].keep });
  }
  return out;
}
const optTable = (top, cap) => '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>' + cap + '</th><th class="n">Puntos esperados al final</th></tr></thead><tbody>' +
  top.map((o, i) => '<tr' + (i === 0 ? ' class="on"' : '') + '><td>' + optTxt(o) + (i === 0 ? ' · la mejor' : '') + '</td><td class="n">' + ev1(o.ev) + '</td></tr>').join('') + '</tbody></table></div>';

export const GEN_SEEDS = { turn: 61, poker: 42 };
export function generalaCurso(h) {
  const S = solver(R, 'game'), sv = servida(R.straights), boxes = boxesOf(R);
  const T = genTurn(GEN_SEEDS.turn), P = genTurn(GEN_SEEDS.poker);
  const [a, b, c] = T;
  if (T.length !== 3 || a.best.keep.length !== 2 || b.best.keep.length !== 4 || c.best.box !== 'full') throw new Error('generala tutorial: seed ' + GEN_SEEDS.turn + ' no longer gives pair, two pairs, full');
  if (P.length !== 3 || handOf(P[1].dice, R.straights) !== 'poker' || P[1].best.type !== 'roll' || P[1].top.findIndex(o => o.type === 'score' && o.box === 'poker') !== 1 || P[2].best.box !== 'poker') throw new Error('generala tutorial: seed ' + GEN_SEEDS.poker + ' no longer gives poker on the second throw');
  const sixBox = c.top.find(o => o.box === '6');
  const empty = Object.fromEntries(boxes.map(x => [x, null]));
  const junk = [1, 2, 4, 5, 6], J = S.options(empty, junk, 3);
  if (handOf(junk, R.straights) !== null || J[0].box !== '1') throw new Error('generala tutorial: the junk roll example changed');
  const jEsc = J.find(o => o.box === 'escalera');
  const within = [1, 2, 3].map(t => generalaWithin(t));
  const ex3 = [3, 3, 3, 5, 6];
  const majors = [['escalera', [1, 2, 3, 4, 5], 'Cinco seguidos: 1-2-3-4-5 o 2-3-4-5-6'], ['full', [2, 2, 5, 5, 5], 'Tres iguales y un par'], ['poker', [4, 4, 4, 4, 1], 'Cuatro iguales'], ['generala', [6, 6, 6, 6, 6], 'Los cinco iguales']];
  const sheetRows = '<tr><td><b>Del 1 al 6</b>' + dice(ex3) + '</td><td>La suma de los dados de ese número: con ' + ex3.join('-') + ', ' + BOXN[3] + ' anotás ' + boxScore(R, '3', ex3, 2, false) + '</td><td class="n">variable</td></tr>' +
    majors.map(([k, d, t]) => '<tr><td><b>' + BOXN[k] + '</b>' + dice(d) + '</td><td>' + t + '</td><td class="n">' + boxScore(R, k, d, 2, false) + (k === 'generala' ? '' : ' (' + boxScore(R, k, d, 1, false) + ' servida)') + '</td></tr>').join('');
  const svRows = ['generala', 'poker', 'full', 'escalera'].map(k => '<tr><td>' + BOXN[k] + '</td><td class="n">' + sv[k].ways + ' de ' + fmt(6 ** 5, 0) + '</td><td class="n">' + oneIn(sv[k].oneIn) + '</td></tr>').join('');
  const FAQ = [
    ['¿Cuántos dados y cuántos tiros tiene la generala?', 'Cinco dados y hasta tres tiros por turno. Después de cada tiro guardás los dados que te sirven y volvés a tirar el resto; también podés volver a tirar los cinco.'],
    ['¿Cuánto vale cada jugada?', 'Con el reglamento de Ruibal: escalera ' + R.escalera + ', full ' + R.full + ', póker ' + R.poker + ' y generala ' + R.generala + '. Si la escalera, el full o el póker salen en el primer tiro (servidos) suman ' + R.servidaBonus + ' más. En los casilleros del 1 al 6 anotás la suma de los dados de ese número.'],
    ['¿Qué es la generala servida?', 'Los cinco dados iguales en el primer tiro del turno: ganás el partido en el acto. Sale ' + oneIn(sv.generala.oneIn) + ' tiros.'],
    ['¿Qué hago si no me salió nada?', 'Igual tenés que anotar: elegís un casillero libre y ponés lo que vale tu tirada ahí, aunque sea cero (eso es tachar). Lo que menos cuesta suele ser poner lo poco que tengas en el casillero del 1.'],
    ['¿La escalera 3-4-5-6-1 vale?', 'En el reglamento de Ruibal no: solo 1-2-3-4-5 y 2-3-4-5-6. Hay mesas que la aceptan (la «escalera con as arriba»): acuérdenlo antes de empezar.'],
    ['¿Cuándo termina el partido?', 'Cuando todos llenaron sus ' + boxes.length + ' casilleros, uno por turno. Gana el que suma más. O antes, si alguien saca generala servida.'],
  ];
  const items = [['objetivo', 'De qué se trata'], ['materiales', 'Qué necesitás'], ['planilla', 'La planilla y lo que vale cada jugada'], ['turno', 'Un turno, paso a paso'], ['ejemplo', 'Un turno real, tiro por tiro'], ['poker', '¿Anotar el póker o ir por la generala?'], ['servida', 'Servida: el primer tiro'], ['sin-juego', 'Cuando no sale nada'], ['errores', 'Errores comunes'], ['variantes', 'Variantes de la mesa'], ['preguntas', 'Preguntas'], ['anotador', 'El anotador y la ayuda']];
  const html = toc(items, '¿Ya sabés jugar? <a href="#anotador">Ir al anotador</a>' + (h.built('/generala/jugar/') ? ' o <a href="' + h.href('/generala/jugar/') + '">jugar contra la compu</a>' : '') + '.') +
    sec('objetivo', 1, 'El objetivo', 'De qué se trata',
      '<p>La generala es un juego de dados por turnos. Cada jugador tiene una <b>planilla con ' + boxes.length + ' casilleros</b>: seis para los números (del 1 al 6) y cuatro para los juegos (escalera, full, póker y generala). En cada turno tirás los dados hasta tres veces y al final <b>anotás en un solo casillero</b> que tengas libre.</p>' +
      '<p>Cuando todos llenaron sus ' + boxes.length + ' casilleros, se suma la planilla y <b>gana el que tiene más puntos</b>. La gracia está en decidir qué dados guardar y dónde anotar cada tirada: una buena tirada en el casillero equivocado te puede costar el partido.</p>' +
      cite(h, ['generala.three-throws', 'generala.ten-boxes', 'generala.highest-wins'])) +
    sec('materiales', 2, 'Antes de empezar', 'Qué necesitás',
      fig(dice([5, 3, 6, 1, 4]), 'Cinco dados comunes de seis caras.') +
      '<ul><li><b>Cinco dados</b> de seis caras y, si tenés, un cubilete para tirarlos.</li><li><b>Una planilla</b> por mesa: una columna por jugador y una fila por casillero. Podés usar papel o <a href="#anotador">el anotador de esta página</a>.</li><li><b>Dos o más jugadores.</b> Nuestro anotador lleva de 2 a 8.</li></ul>' +
      tip('¿Sin dados a mano?', 'El <a href="' + (h.built('/dados/') ? h.href('/dados/') : '#anotador') + '">tirador de dados</a> tira los cinco en el teléfono, con el azar del navegador.')) +
    sec('planilla', 3, 'Del reglamento', 'La planilla y lo que vale cada jugada',
      '<p>Estos son los ' + boxes.length + ' casilleros. Cada uno se llena una sola vez en todo el partido: si ya anotaste el full, otro full más adelante tiene que ir a otro lado.</p>' +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Casillero</th><th>Qué hace falta</th><th class="n">Puntos</th></tr></thead><tbody>' + sheetRows + '</tbody></table></div>' +
      tip('Los números también sirven para los juegos', 'Con un full de tres cincos y dos doses podés anotar 30 en el full, o ' + boxScore(R, '5', [2, 2, 5, 5, 5], 2, false) + ' ' + BOXN[5] + ' si el full ya está lleno. El reglamento lo permite: elegís el casillero.', 'why') +
      cite(h, ['generala.number-box', 'generala.escalera-20', 'generala.full-30', 'generala.poker-40', 'generala.generala-60', 'generala.servida-bonus-5', 'generala.major-as-number', 'generala.w-box-closed'])) +
    sec('turno', 4, 'Cómo se juega', 'Un turno, paso a paso',
      steps([
        ['Tirás los cinco dados', '<p>Es el primer tiro. Si sale un juego ya en este tiro, es «servido» y vale un poco más.</p>', dice([2, 4, 5, 6, 6])],
        ['Elegís qué dados guardar', '<p>Apartás los que te sirven (en el dibujo, los dos seis con borde naranja) y volvés a tirar los demás. Si no te sirve ninguno, podés tirar los cinco de nuevo.</p>', dice([2, 4, 5, 6, 6], [6, 6])],
        ['Hasta tres tiros', '<p>Repetís lo mismo en el segundo tiro: podés guardar otros dados, o soltar alguno que habías guardado. En cualquier momento podés plantarte y anotar, no hace falta usar los tres.</p>', dice([1, 1, 4, 6, 6], [1, 1, 6, 6])],
        ['Anotás en un casillero libre', '<p>Siempre anotás algo al final del turno, aunque no te haya salido nada: en ese caso ponés lo poco que tengas, o un cero (eso se llama tachar). Después le pasás los dados al siguiente.</p>', dice([1, 1, 6, 6, 6], [1, 1, 6, 6, 6])],
      ]) + cite(h, ['generala.three-throws', 'generala.reroll-all', 'generala.scratch-zero', 'generala.w-scratch'])) +
    sec('ejemplo', 5, 'Ejemplo resuelto', 'Un turno real, tiro por tiro',
      '<p>Este turno lo jugó nuestro código con la planilla vacía, eligiendo en cada tiro la opción que deja más puntos <b>al final del partido</b> (no solo en este turno). Para cada opción calcula todas las tiradas que pueden salir y lo que vale seguir jugando bien desde ahí: esa cuenta es la columna de la derecha.</p>' +
      '<div class="jg-cu-row">' + T.map((t, i) => '<div><small>Tiro ' + (i + 1) + '</small>' + dice(t.dice, t.best.type === 'roll' ? t.best.keep : t.dice) + '</div>').join('') + '</div>' +
      '<h3>Tiro 1: ' + a.dice.join(' ') + '</h3><p>No hay ningún juego, pero hay un par de ' + a.best.keep[0] + '. Lo mejor es <b>guardar el par y tirar los otros tres</b>: con tres dados nuevos tenés chances de trío, full, póker y hasta generala.</p>' + optTable(a.top, 'Opción') +
      '<h3>Tiro 2: ' + b.dice.join(' ') + '</h3><p>Salió otro par. Con <b>dos pares</b> guardás los cuatro dados y tirás uno solo: si sale ' + b.best.keep[0] + ' o ' + b.best.keep[3] + ' tenés full. Son 2 caras de 6, una chance de 1 en 3.</p>' + optTable(b.top, 'Opción') +
      '<h3>Tiro 3: ' + c.dice.join(' ') + '</h3><p>¡Full! Ahora toca anotar, y hay dos lugares razonables: <b>' + c.best.points + ' en el full</b> o <b>' + sixBox.points + ' ' + BOXN[6] + '</b>. Gana el full por lejos: son más puntos ahora y el casillero del 6 queda libre para una tirada con muchos seis más adelante.</p>' + optTable(c.top, 'Dónde anotar') +
      tip('La idea que sirve siempre', 'Guardá lo que se repite. Un par se puede volver trío, full, póker o generala; dados sueltos casi nunca llegan a nada en dos tiros.')) +
    sec('poker', 6, 'Otra decisión', '¿Anotar el póker o ir por la generala?',
      '<p>En otro partido de nuestro código, el segundo tiro trajo <b>póker</b>: ' + P[1].dice.join(' ') + '. Muchos lo anotan enseguida. El cálculo dice que conviene <b>guardar los cuatro iguales y tirar el dado que sobra</b>: si sale igual es generala (' + R.generala + ' puntos), y si no sale, igual te quedan los cuatro iguales para anotar el póker en el tercer tiro.</p>' +
      '<div class="jg-cu-row"><div><small>Tiro 2</small>' + dice(P[1].dice, P[1].best.keep) + '</div><div><small>Tiro 3</small>' + dice(P[2].dice, P[2].dice) + '</div></div>' + optTable(P[1].top, 'En el tiro 2') +
      '<p>En el tercer tiro salió ' + P[2].dice.join(' ') + ': no hubo generala, y se anotaron igual los ' + P[2].best.points + ' del póker. No se perdió nada por probar.</p>') +
    sec('servida', 7, 'El primer tiro', 'Servida: los ' + R.servidaBonus + ' puntos de más',
      '<p>Si la escalera, el full o el póker salen en el <b>primer tiro</b> del turno, se llaman «servidos» y suman ' + R.servidaBonus + ' puntos más: la escalera servida vale ' + (R.escalera + R.servidaBonus) + ', el full ' + (R.full + R.servidaBonus) + ' y el póker ' + (R.poker + R.servidaBonus) + '.</p>' +
      '<p>La <b>generala servida</b> (cinco iguales en el primer tiro) no suma puntos: <b>gana el partido en el acto</b>, aunque ya hayas usado el casillero de la generala.</p>' +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Servida</th><th class="n">Tiradas posibles</th><th class="n">Chance</th></tr></thead><tbody>' + svRows + '</tbody></table></div>' +
      '<p class="jg-note">Contamos las ' + fmt(6 ** 5, 0) + ' tiradas posibles de cinco dados. Si vas a buscar la generala guardando siempre el número que más salió, la chance de completarla en el turno es ' + within.map(w => oneIn(w.oneIn) + ' en ' + w.rolls + (w.rolls === 1 ? ' tiro' : ' tiros')).join(', ') + '.</p>' +
      cite(h, ['generala.servida-bonus-5', 'generala.servida-wins', 'generala.servida-any-box'])) +
    sec('sin-juego', 8, 'Tachar', 'Cuando no sale nada',
      '<p>Llegaste al tercer tiro con ' + junk.join(' ') + ': no es escalera (le falta el 3) ni tiene repetidos. Igual tenés que anotar. Con la planilla vacía, la cuenta queda así:</p>' + fig(dice(junk)) +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Dónde anotar</th><th class="n">Puntos esperados al final</th></tr></thead><tbody>' + J.slice(0, 3).map((o, i) => '<tr' + (i === 0 ? ' class="on"' : '') + '><td>' + optTxt(o) + '</td><td class="n">' + ev1(o.ev) + '</td></tr>').join('') + '<tr><td>tachar la escalera (0)</td><td class="n">' + ev1(jEsc.ev) + '</td></tr></tbody></table></div>' +
      '<p>Lo mejor es poner <b>' + J[0].points + ' ' + BOXN[1] + '</b>: es el casillero que menos rinde en toda la planilla, así que «gastarlo» con una tirada mala cuesta poco. Tachar la escalera, en cambio, te saca un juego de ' + R.escalera + ' puntos que todavía podías hacer.</p>') +
    sec('errores', 9, 'Para no equivocarte', 'Errores comunes',
      errs([
        ['Tirar una cuarta vez porque «faltaba poquito».', 'Son tres tiros como máximo. Al tercero, anotás.'],
        ['Pasar el turno sin anotar porque no salió nada.', 'Siempre se anota: lo que valga la tirada en un casillero libre, o un cero.'],
        ['Anotar un segundo full en el casillero del full, que ya está lleno.', 'Cada casillero se llena una sola vez. El segundo full va a un número: tres cincos y dos doses son 15 al 5.'],
        ['Olvidarse de los ' + R.servidaBonus + ' de la servida.', 'Escalera, full y póker en el primer tiro suman ' + R.servidaBonus + ' más.'],
        ['Anotar el póker en el segundo tiro sin pensar.', 'Si todavía te queda un tiro, probar la generala no te hace perder el póker.'],
      ])) +
    sec('variantes', 10, 'Acuerden antes', 'Variantes de la mesa',
      '<ul><li><b>Escalera con as arriba:</b> en muchas mesas también vale 3-4-5-6-1.</li><li><b>Generala de 50:</b> algunas planillas le dan 50 en lugar de 60.</li><li><b>Doble generala:</b> un casillero once, para una segunda generala, con el valor que acuerden. Sin doble, una segunda generala va a los números: cinco seis son 30 ' + BOXN[6] + '.</li></ul>' +
      cite(h, ['generala.w-escalera-as', 'generala.w-generala-60-50', 'generala.w-doble-optional', 'generala.five-as-number'])) +
    faqSec(h, 11, 'Preguntas sobre la generala', FAQ);
  return { html, faq: FAQ, expected: S.expectedTotal };
}

// ---------- chinchon ----------
import { RULESETS as CHIN, cardValue as chinValue, isJoker, deckOf as chinDeck } from '../../../engine/chinchon/rules.mjs';
import { bestSplit as chinSplit } from '../../../engine/chinchon/melds.mjs';
import { newMatch as chinMatch, createBot as chinBot, step as chinStep, toAct as chinAct, observation as chinObs } from '../../../engine/chinchon/index.mjs';
import { card, NUM, SUIT } from './parts.mjs';

const jk = () => '<span class="jg-cd jk" role="img" aria-label="comodín"><b>J</b><small>comodín</small></span>';
const cd = c => (/^J/.test(c) ? jk() : card(c));
const hand = (cards, cls = 'sm') => '<div class="jg-hand ' + cls + '">' + cards.map(cd).join('') + '</div>';
export const cname = c => { if (/^J/.test(c)) return 'el comodín'; const n = +c.slice(0, -1); return (n === 1 ? 'el as' : n === 10 ? 'la sota' : 'el ' + NUM[n]) + ' de ' + SUIT[c.slice(-1)]; };
const meldName = m => (m.filter(c => !isJoker(c)).every(c => c.slice(0, -1) === m.find(x => !isJoker(x)).slice(0, -1)) ? 'grupo' : 'escalera');

// A whole hand of two 'dificil' bots with the Juegos Bonaerenses deck; the turns of seat 0 ("vos") with the cards before each.
export const CHIN_SEED = 188;
function chinHand(seed) {
  const r = CHIN['bonaerense-50'];
  const s = chinMatch(r, { players: 2, limit: 101, reenganches: 0, seed });
  const bots = [chinBot('dificil', seed * 7 + 1), chinBot('dificil', seed * 7 + 2)];
  const start = s.hand.hands.map(x => x.slice()), pozo0 = s.hand.pozo[s.hand.pozo.length - 1], mano = s.hand.mano;
  const turns = [];
  let cur = null, guard = 0;
  while (!s.hand.ended && guard++ < 200) {
    const seat = chinAct(s), a = bots[seat].choose(chinObs(s, seat));
    if (seat === 0 && a.type === 'draw') cur = { before: s.hand.hands[0].slice(), from: a.from, top: s.hand.pozo[s.hand.pozo.length - 1] };
    if (seat === 0 && a.type !== 'draw') { cur.drew = s.hand.hands[0].find(c => !cur.before.includes(c)); cur.act = a; cur.after = s.hand.hands[0].filter(c => c !== a.card); turns.push(cur); }
    if (seat === 1 && a.type !== 'draw') turns.push({ rival: true, card: a.card, type: a.type });
    chinStep(s, a, { deal: false });
  }
  return { r, start, pozo0, mano, turns, result: s.hand.result, scores: s.scores.slice() };
}

export function chinchonCurso(h, { limit }) {
  const B = CHIN['bonaerense-50'], L = CHIN['ludoteka-40'];
  const X = chinHand(CHIN_SEED), mine = X.turns.filter(t => !t.rival), res = X.result;
  if (X.mano !== 0 || mine.length !== 3 || mine[0].from !== 'pozo' || mine[2].act.type !== 'cut' || res.how !== 'cut' || !(res.shown[0].points > 0 && res.shown[0].points <= 5) || X.start[0].some(isJoker) || !mine[2].drew.startsWith('J'))
    throw new Error('chinchon tutorial: seed ' + CHIN_SEED + ' no longer gives pozo draw, two turns and a cut with a comodin');
  const sh0 = res.shown[0], sh1 = res.shown[1];
  const split0 = chinSplit(B, X.start[0]);
  const v = (c) => chinValue(B, c);
  const deckN = chinDeck(B).length;
  const rivalAfter = i => X.turns[X.turns.indexOf(mine[i]) + 1];
  const rk = c => +c.slice(0, -1);
  const mate = (cards, c) => cards.find(x => !isJoker(x) && x.slice(-1) === c.slice(-1) && Math.abs(rk(x) - rk(c)) === 1) || cards.find(x => !isJoker(x) && rk(x) === rk(c));
  const turnTxt = (t, i) => {
    const after = chinSplit(B, t.after);
    const pts = after.points;
    return '<h3>Turno ' + (i + 1) + '</h3>' + hand(t.before) +
      '<p>' + (t.from === 'pozo' ? 'Arriba del pozo está ' + cname(t.top) + (mate(t.before, t.top) ? ', que combina con ' + cname(mate(t.before, t.top)) : ', que le sirve') + ': <b>lo levanta del pozo</b>.' : 'Lo que hay en el pozo no le sirve: <b>roba del mazo</b> y le sale ' + cname(t.drew) + '.') + ' ' +
      (t.act.type === 'cut' ? 'Con eso arma dos juegos y le queda una sola carta suelta. Como suma ' + sh0.points + ' (no más de 5), <b>corta</b>: pone ' + cname(t.act.card) + ' boca abajo en el pozo y baja todo.' :
        '<b>Tira ' + cname(t.act.card) + '</b>' + (v(t.act.card) >= 10 ? ', una carta alta que no entra en ningún juego: si la guardaba, eran ' + v(t.act.card) + ' puntos en contra.' : ', que no entra en ningún juego.') + ' Le quedan ' + pts + ' puntos sueltos' + (after.melds.length ? ' y ya tiene armado ' + after.melds.map(m => 'un ' + meldName(m) + ' (' + m.map(cname).join(', ') + ')').join(' y ') : '') + '.') + '</p>' +
      (rivalAfter(i) && rivalAfter(i).rival ? '<p class="jg-note">Después juega la compu y tira ' + cname(rivalAfter(i).card) + '.</p>' : '');
  };
  const FAQ = [
    ['¿Cuántas cartas se reparten en el chinchón?', 'Siete a cada jugador. La carta siguiente se da vuelta y empieza el pozo; las demás forman el mazo.'],
    ['¿Cuándo se puede cortar?', 'Con el reglamento bonaerense, cuando las cartas que no entran en ningún juego suman ' + 5 + ' o menos. Con 40 o 48 cartas sin comodines (Ludoteka), cuando queda una sola carta suelta de ' + 4 + ' o menos.'],
    ['¿Cuánto vale el comodín?', 'Dentro de un juego reemplaza a cualquier carta. Si te queda en la mano sin usar, cuenta ' + B.jokerValue + ' puntos en contra. No se puede tirar al pozo ni poner en los juegos de los demás.'],
    ['¿Qué es hacer chinchón?', 'Cortar con las siete cartas en una sola escalera del mismo palo. Sin comodín, ganás el partido en el acto; con comodín, anotás ' + B.chinchonWithJoker + '.'],
    ['¿Cuánto anota el que corta con todo en juegos?', B.allMelded + ' puntos: se le restan diez.'],
    ['¿Hasta cuántos puntos se juega?', 'Hasta ' + limit + '. El que pasa de ' + limit + ' queda afuera y gana el último que sigue en carrera.'],
  ];
  const items = [['objetivo', 'De qué se trata'], ['mazo', 'El mazo y lo que vale cada carta'], ['reparto', 'El reparto'], ['juegos', 'Los juegos: grupos y escaleras'], ['turno', 'Tu turno: robar y tirar'], ['cortar', 'Cortar'], ['ejemplo', 'Una mano real, turno por turno'], ['puntos', 'Cómo se cuentan los puntos'], ['errores', 'Errores comunes'], ['variantes', 'Con 40 o 48 cartas'], ['preguntas', 'Preguntas'], ['corte', '¿Puedo cortar? Probalo']];
  const okG = ['7e', '7b', '7c'], okE = ['4c', '5c', '6c', '7c'], okJ = ['10o', 'J1', '12o'];
  const html = toc(items, '¿Ya sabés jugar? <a href="#corte">Probá si podés cortar</a>' + (h.built('/chinchon/jugar/') ? ' o <a href="' + h.href('/chinchon/jugar/') + '">jugá contra la compu</a>' : '') + '.') +
    sec('objetivo', 1, 'El objetivo', 'De qué se trata',
      '<p>En el chinchón cada uno tiene siete cartas y trata de <b>armar juegos</b> con ellas: tríos o cuartetos del mismo número, o escaleras del mismo palo. Las cartas que no entran en ningún juego («sueltas») <b>suman puntos en contra</b>.</p>' +
      '<p>Cuando a alguien le quedan muy pocos puntos sueltos, <b>corta</b> y la mano termina: cada uno anota lo que le quedó suelto. Se juegan manos hasta que alguien pasa de <b>' + limit + ' puntos</b> y queda afuera. <b>Gana el último que sigue en carrera</b>, o sea, el que menos puntos fue juntando.</p>' +
      tip('En una frase', 'Juntá cartas que combinen, tirá las que no y cortá apenas puedas: en el chinchón los puntos son malos.') + cite(h, ['chinchon.seven-cards', 'chinchon.melds', 'chinchon.limit-101', 'chinchon.no-rejoin'])) +
    sec('mazo', 2, 'Antes de empezar', 'El mazo y lo que vale cada carta',
      '<p>Con el reglamento de los Juegos Bonaerenses se usa la <b>baraja española de 48 cartas más ' + B.jokers + ' comodines</b>: ' + deckN + ' en total. Hay cuatro palos (espadas, bastos, oros y copas) con cartas del 1 al 12; la sota es el 10, el caballo el 11 y el rey el 12.</p>' +
      fig(hand(['1o', '5o', '9o', '10o', '11o', '12o', 'J1']), 'Cada carta vale su número: el as 1, el cinco 5, el nueve 9, la sota 10, el caballo 11 y el rey 12. El comodín, si te queda en la mano, ' + B.jokerValue + '.') +
      tip('Lo que importa', 'Las cartas altas son las más peligrosas: un rey suelto son 12 puntos en contra. Si no te entra en un juego, conviene tirarla pronto.', 'why') +
      cite(h, ['chinchon.50-cards', 'chinchon.values', 'chinchon.jokers-two', 'chinchon.ace-lowest'])) +
    sec('reparto', 3, 'Cómo empieza', 'El reparto',
      steps([
        ['Siete cartas a cada uno', '<p>Se mezcla y se reparten siete cartas a cada jugador, de a una.</p>', hand(X.start[0], 'xs')],
        ['La octava, boca arriba', '<p>La carta siguiente se da vuelta en la mesa: es el comienzo del <b>pozo</b>. En este ejemplo, ' + cname(X.pozo0) + '.</p>', hand([X.pozo0], 'xs')],
        ['El resto es el mazo', '<p>Las cartas que sobran quedan boca abajo: el mazo, de donde se roba.</p>', '<span class="jg-cd back" aria-hidden="true"></span>'],
      ]) + cite(h, ['chinchon.seven-cards', 'chinchon.eighth-card'])) +
    sec('juegos', 4, 'Lo más importante', 'Los juegos: grupos y escaleras',
      '<p>Un juego tiene <b>tres cartas o más</b>. Hay dos clases:</p>' +
      '<div class="jg-cu-two"><div><h3>Grupo</h3><p>Tres o cuatro cartas del <b>mismo número</b>, de cualquier palo.</p>' + hand(okG, 'xs') + '</div><div><h3>Escalera</h3><p>Tres o más cartas <b>seguidas del mismo palo</b>.</p>' + hand(okE, 'xs') + '</div></div>' +
      '<h3>El comodín</h3><p>Reemplaza a la carta que falta. Va <b>uno solo por juego</b>: en el dibujo hace de caballo de oros.</p>' + fig(hand(okJ, 'xs')) +
      '<h3>Lo que no vale</h3>' + errs([
        ['Escalera con palos mezclados: 4 de copas, 5 de oros, 6 de copas.', 'Toda la escalera tiene que ser del mismo palo.'],
        ['El as después del rey: rey, as y dos.', 'El as solo va abajo, con el dos y el tres.'],
        ['Dos comodines en el mismo juego.', 'Uno por juego como máximo.'],
      ]) + cite(h, ['chinchon.melds', 'chinchon.groups-3-4', 'chinchon.ace-low', 'chinchon.one-joker', 'chinchon.jokers-two'])) +
    sec('turno', 5, 'Cómo se juega', 'Tu turno: robar y tirar',
      steps([
        ['Robás una carta', '<p>Del <b>mazo</b> (sin ver qué sale) o la de arriba del <b>pozo</b> (la que tiró el anterior). Ahora tenés ocho.</p>', '<span class="jg-cd back" aria-hidden="true"></span>' + cd(X.pozo0)],
        ['Tirás una carta', '<p>Elegís la que menos te sirve y la dejás arriba del pozo. Volvés a tener siete. El comodín no se tira nunca.</p>'],
        ['Si podés, cortás', '<p>Si con tus siete cartas armás juegos y lo suelto suma 5 o menos, en vez de tirar normalmente cortás (te lo explicamos abajo).</p>'],
      ]) + tip('¿Mazo o pozo?', 'Levantá del pozo solo si esa carta te arma o te acerca a un juego: el rival ve lo que levantás y sabe qué estás juntando.') + cite(h, ['chinchon.draw-discard', 'chinchon.jokers-two'])) +
    sec('cortar', 6, 'El final de la mano', 'Cortar',
      '<p>Cortar es cerrar la mano. Podés hacerlo en tu turno, después de robar, si <b>lo que te queda suelto suma 5 o menos</b>. Tirás una carta <b>boca abajo</b> en el pozo y mostrás tus juegos.</p>' +
      steps([
        ['El que corta muestra todo', '<p>Baja sus juegos y anota lo que le quedó suelto. Si no le quedó nada suelto, anota <b>' + B.allMelded + '</b>.</p>'],
        ['Los demás muestran sus juegos', '<p>Y pueden apoyar sus cartas sueltas en los juegos que ya están en la mesa (un siete en un grupo de sietes, un cinco de copas en una escalera 2-3-4 de copas).</p>'],
        ['Cada uno anota lo suelto', '<p>Lo que no pudo bajar ni apoyar suma en contra. El comodín que quedó en la mano vale ' + B.jokerValue + '.</p>'],
      ]) +
      tip('Chinchón', 'Si cortás con las siete cartas en una sola escalera del mismo palo y <b>sin comodín</b>, ganás el partido en el acto. Con comodín, anotás ' + B.chinchonWithJoker + '.') +
      cite(h, ['chinchon.cut-5', 'chinchon.cut-face-down', 'chinchon.layoff-all', 'chinchon.all-melded', 'chinchon.chinchon-def', 'chinchon.chinchon-wins', 'chinchon.chinchon-joker'])) +
    sec('ejemplo', 7, 'Ejemplo resuelto', 'Una mano real, turno por turno',
      '<p>Esta mano la jugaron dos jugadores de nuestro código en nivel difícil, con el mazo bonaerense. Seguimos al que empieza. Al arrancar ya tenía un juego: ' + split0.melds.map(m => m.map(cname).join(', ')).join('; ') + ', y ' + split0.points + ' puntos sueltos.</p>' +
      mine.map(turnTxt).join('') +
      '<h3>Cómo queda la mano</h3><div class="jg-cu-two"><div><h3>El que cortó: ' + sh0.points + ' puntos</h3>' + sh0.melds.map(m => hand(m, 'xs')).join('') + '<p>Suelta: ' + sh0.left.map(cname).join(', ') + ' = ' + sh0.points + '.</p></div>' +
      '<div><h3>La compu: ' + sh1.points + ' puntos</h3>' + hand(sh1.left, 'xs') + '<p>' + (sh1.melds.length ? 'Bajó ' + sh1.melds.length + ' juego(s).' : 'No tenía ningún juego armado') + (sh1.laid.length ? ' y apoyó ' + sh1.laid.map(cname).join(', ') + '.' : ' ni nada para apoyar en los juegos de la mesa.') + ' Todo suma: ' + sh1.left.map(v).join(' + ') + ' = ' + sh1.points + '.</p></div></div>' +
      '<p>Después de esta mano la planilla dice <b>' + X.scores[0] + ' a ' + X.scores[1] + '</b>. Cortar rápido, aun con algunos puntos, castigó a la compu con todas sus cartas.</p>') +
    sec('puntos', 8, 'La planilla', 'Cómo se cuentan los puntos',
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Situación</th><th class="n">Puntos</th></tr></thead><tbody>' +
      '<tr><td>Carta suelta</td><td class="n">su número (el rey, 12)</td></tr><tr><td>Comodín en la mano</td><td class="n">' + B.jokerValue + '</td></tr><tr><td>Cortar con todo en juegos</td><td class="n">' + B.allMelded + '</td></tr><tr><td>Chinchón con comodín</td><td class="n">' + B.chinchonWithJoker + '</td></tr><tr><td>Chinchón sin comodín</td><td class="n">gana el partido</td></tr><tr><td>Pasar de ' + limit + '</td><td class="n">quedás afuera</td></tr></tbody></table></div>' +
      '<p>Si en una misma mano todos pasan de ' + limit + ', gana el que tenga menos; si empatan, el que cortó, y si ninguno cortó, el que era mano.</p>' +
      tip('Para anotar', 'El <a href="' + (h.built('/chinchon/anotador/') ? h.href('/chinchon/anotador/') : '#corte') + '">anotador de chinchón</a> suma las manos, tacha al que pasa de ' + limit + ' y lleva el reenganche si lo juegan.') +
      cite(h, ['chinchon.values', 'chinchon.all-melded', 'chinchon.chinchon-joker', 'chinchon.chinchon-wins', 'chinchon.limit-101', 'chinchon.all-over', 'chinchon.tie-cutter', 'chinchon.tie-mano'])) +
    sec('errores', 9, 'Para no equivocarte', 'Errores comunes',
      errs([
        ['Tirar el comodín al pozo porque «no lo necesito».', 'El comodín no se descarta: o lo usás en un juego o te cuenta ' + B.jokerValue + ' en contra.'],
        ['Cortar con 6 puntos sueltos.', 'El límite bonaerense es 5. Con 6, seguí jugando.'],
        ['Guardar figuras «por si acaso».', 'Un rey y un caballo sueltos son 23 puntos. Si no tenés juego para ellos, tiralos primero.'],
        ['Hacer escalera rey, as, dos.', 'El as solo va con el dos y el tres.'],
        ['Quedarse con ocho cartas.', 'Después de robar siempre tirás: el turno termina con siete.'],
      ])) +
    sec('variantes', 10, 'Otras mesas', 'Con 40 o 48 cartas, sin comodines',
      '<p>Muchas casas juegan con la baraja de 40 (sin ochos ni nueves) o de 48, sin comodines (reglas de Ludoteka). Cambia poco, pero cambia:</p>' +
      '<ul><li><b>Cortar:</b> solo con <b>una</b> carta suelta que valga ' + 4 + ' o menos.</li><li><b>Figuras:</b> sota, caballo y rey valen ' + chinValue(L, '12o') + '.</li><li><b>Primera vuelta:</b> nadie puede cortar en su primer turno de la mano.</li><li><b>Reenganche:</b> con tres o más jugadores, el que pasa del límite puede volver con el puntaje del que va más alto.</li></ul>' +
      cite(h, ['chinchon.l-deck', 'chinchon.l-cut', 'chinchon.l-figures-10', 'chinchon.l-first-round', 'chinchon.l-reenganche', 'chinchon.l-no-reenganche-2'])) +
    faqSec(h, 11, 'Preguntas sobre el chinchón', FAQ);
  return { html, faq: FAQ };
}

// ---------- escoba de 15 ----------
import { RULESETS as ESC, VALUE, SETENTA, setentaOf, captures } from '../../../engine/escoba/rules.mjs';
import { newMatch as escMatch, createBot as escBot, step as escStep, toAct as escAct, observation as escObs } from '../../../engine/escoba/index.mjs';

export const ESC_SEED = 71;
function escHand(seed) {
  const r = ESC.bonaerense;
  const s = escMatch(r, { players: 2, pairs: false, target: 30, seed });
  const bots = [escBot('dificil', seed * 5 + 1), escBot('dificil', seed * 5 + 2)];
  const dealer = s.hand.dealer, hands = s.hand.hands.map(x => x.slice()), table = s.hand.table.slice(), muestra = s.hand.log.slice();
  const plays = [];
  let guard = 0;
  while (!s.hand.ended && guard++ < 100) {
    const seat = escAct(s), before = s.hand.table.slice(), a = bots[seat].choose(escObs(s, seat));
    escStep(s, a, { deal: false });
    const last = s.hand.log[s.hand.log.length - 1];
    plays.push({ seat, card: a.card, take: a.take, before, escoba: last.type === 'take' && last.escobas > 0 });
  }
  return { r, dealer, hands, table, muestra, plays, piles: s.hand.piles.map(p => p.slice()), escobas: s.hand.escobas.slice(), result: s.hand.result };
}
const bestOfSuit = pile => ['e', 'b', 'o', 'c'].map(su => { const cs = pile.filter(c => c.endsWith(su)); return cs.sort((x, y) => SETENTA[+y.slice(0, -1)] - SETENTA[+x.slice(0, -1)])[0]; });

export function escobaCurso(h) {
  const X = escHand(ESC_SEED), me = (X.dealer + 1) % 2, P = X.plays.slice(0, 6), res = X.result;
  const why = res.detail.map(d => d.side + ':' + d.why).sort().join(' ');
  if (X.muestra.length || P.map(p => p.seat).join('') !== [me, 1 - me, me, 1 - me, me, 1 - me].join('') || P[0].take.length !== 2 || P[2].take.length || !P[3].take.length || !P[4].escoba || why !== [me + ':cartas', me + ':escoba', me + ':setenta', (1 - me) + ':sieteDeOros'].sort().join(' '))
    throw new Error('escoba tutorial: seed ' + ESC_SEED + ' no longer gives the deal the text explains');
  const who = seat => (seat === me ? 'Vos' : 'La compu');
  const val = c => VALUE[c];
  const sumTxt = (c, take) => [c, ...take].map(val).join(' + ') + ' = 15';
  const playTxt = (p, i) => {
    const caps = captures(p.before, p.card);
    const yo = p.seat === me;
    return '<li><div><b>' + (yo ? 'Jugás ' : 'La compu juega ') + cname(p.card) + ' (' + val(p.card) + ')</b>' +
      (p.take.length ? '<p>Con ' + p.take.map(cname).join(' y ') + ' de la mesa: ' + sumTxt(p.card, p.take) + '. <b>' + (yo ? 'Levantás' : 'Levanta') + '</b> las cartas' + (p.escoba ? ' y la mesa queda vacía: <b>¡escoba!</b> Un punto' + (yo ? ' para vos.' : '.') : '.') + '</p>'
        : '<p>' + (caps.length ? '' : 'No suma 15 con ninguna combinación de la mesa, así que <b>' + (yo ? 'la dejás' : 'la deja') + '</b> en la mesa.') + '</p>') +
      '</div><div class="jg-cu-fx"><div class="jg-cu-row"><div><small>Mesa</small>' + (p.before.length ? hand(p.before, 'xs') : '<span class="jg-note">vacía</span>') + '</div><div><small>Juega</small>' + hand([p.card], 'xs') + '</div></div></div></li>';
  };
  const piles = [X.piles[me], X.piles[1 - me]];
  const oros = p => p.filter(c => c.endsWith('o')).length;
  const st = piles.map(setentaOf), best = piles.map(bestOfSuit);
  const scale = Object.entries(SETENTA).filter(([n]) => +n <= 7).sort((a, b) => b[1] - a[1]);
  const pts = [res.points[me], res.points[1 - me]];
  const line = (label, a, b, note) => '<tr><td>' + label + '</td><td class="n">' + a + '</td><td class="n">' + b + '</td><td>' + note + '</td></tr>';
  const FAQ = [
    ['¿Cuánto vale cada carta en la escoba de 15?', 'Del as al siete, su número. La sota vale ' + VALUE['10o'] + ', el caballo ' + VALUE['11o'] + ' y el rey ' + VALUE['12o'] + '. Se juega con las 40 cartas de la baraja española.'],
    ['¿Qué es una escoba?', 'Levantar todas las cartas de la mesa con la carta que tirás, sumando 15. Vale un punto.'],
    ['¿Es obligatorio levantar?', 'Con el reglamento de los Juegos Bonaerenses, sí: si tu carta suma 15 con cartas de la mesa y no levantás, el rival puede llevarse esa baza. En otras mesas es a elección.'],
    ['¿Qué se cuenta al final de cada mano?', 'Un punto por cada escoba, uno por el siete de oros, uno para el que tiene más cartas, uno para el que junta seis oros o más y uno para el que gana el setenta. Si hay empate en cartas, oros o setenta, nadie se anota ese punto.'],
    ['¿Cómo se calcula el setenta?', 'Se toma la mejor carta de cada palo según la escala ' + scale.map(([n, v]) => (n === '1' ? 'as' : n) + ' ' + v).join(', ') + ' y figuras ' + SETENTA[10] + ', y se suman las cuatro. Hace falta tener los cuatro palos.'],
    ['¿A cuántos puntos se juega?', 'A 30 tantos con el reglamento bonaerense. Si al final empatan, se juegan más vueltas hasta desempatar.'],
  ];
  const items = [['objetivo', 'De qué se trata'], ['valores', 'Lo que vale cada carta'], ['reparto', 'El reparto'], ['turno', 'Tu turno: sumar 15'], ['ejemplo', 'Una mano real, jugada por jugada'], ['final', 'Cuando se acaban las cartas'], ['contar', 'Cómo se cuentan los puntos'], ['setenta', 'El setenta, explicado'], ['errores', 'Errores comunes'], ['variantes', 'Otras mesas'], ['preguntas', 'Preguntas'], ['herramientas', 'Buscador de escobas y conteo']];
  const html = toc(items, '¿Ya sabés jugar? <a href="#herramientas">Ir al buscador de escobas</a>' + (h.built('/escoba-de-15/jugar/') ? ' o <a href="' + h.href('/escoba-de-15/jugar/') + '">jugá contra la compu</a>' : '') + '.') +
    sec('objetivo', 1, 'El objetivo', 'De qué se trata',
      '<p>En la escoba de 15 hay cartas boca arriba en la mesa. En tu turno tirás una carta y, si <b>sumada con una o varias cartas de la mesa da exactamente 15</b>, te las llevás. Si te llevás todas las de la mesa, es <b>escoba</b>: un punto.</p>' +
      '<p>Al final de cada mano se cuentan las cartas que juntó cada uno (más cartas, más oros, el siete de oros, el setenta y las escobas). Se juega hasta <b>30 tantos</b>.</p>' +
      cite(h, ['escoba.escoba', 'escoba.target-30'])) +
    sec('valores', 2, 'Antes de empezar', 'Lo que vale cada carta',
      '<p>Se usan las <b>40 cartas</b> de la baraja española (sin ochos ni nueves). Para sumar 15, cada carta vale:</p>' +
      fig(hand(['1o', '2o', '3o', '4o', '5o', '6o', '7o', '10o', '11o', '12o']), 'Del as al siete, su número. La sota vale ' + VALUE['10o'] + ', el caballo ' + VALUE['11o'] + ' y el rey ' + VALUE['12o'] + '.') +
      tip('Para hacer la cuenta rápido', 'Pensá cuánto le falta a tu carta para llegar a 15: con un rey (10) buscás 5 en la mesa; con un as (1) buscás 14. Todas las cartas del mazo suman ' + DECK40SUM + '.', 'why') +
      cite(h, ['escoba.values', 'escoba.total-220'])) +
    sec('reparto', 3, 'Cómo empieza', 'El reparto',
      steps([
        ['Tres cartas a cada uno', '<p>El que da reparte tres cartas a cada jugador, de a una.</p>', hand(X.hands[me], 'xs')],
        ['Cuatro a la mesa', '<p>Después pone cuatro cartas boca arriba en el medio.</p>', hand(X.table, 'xs')],
        ['La muestra', '<p>Si esas cuatro suman justo 15, el que dio se las lleva y se anota una escoba. Si suman 30 (dos quinces), no vale y quedan en la mesa.</p>'],
      ]) + cite(h, ['escoba.deal', 'escoba.muestra', 'escoba.muestra-doble'])) +
    sec('turno', 4, 'Cómo se juega', 'Tu turno: sumar 15',
      steps([
        ['Tirás una carta de tu mano', '<p>Una por turno. Empieza el jugador que sigue al que dio.</p>'],
        ['Si suma 15, levantás', '<p>Tu carta más una o varias de la mesa tienen que dar exactamente 15. Te llevás todas esas cartas a tu montón, boca abajo.</p>'],
        ['Si no suma, queda en la mesa', '<p>Tu carta se suma a las de la mesa y le puede servir al rival.</p>'],
        ['Escoba', '<p>Si con tu jugada no queda ninguna carta en la mesa, es escoba: un punto para vos.</p>'],
      ]) + tip('Ojo', 'Con el reglamento bonaerense, si podés sumar 15 y no levantás, el rival se puede llevar esa baza.', 'warn') + cite(h, ['escoba.escoba', 'escoba.must-take'])) +
    sec('ejemplo', 5, 'Ejemplo resuelto', 'Una mano real, jugada por jugada',
      '<p>Así empezó una mano entre dos jugadores de nuestro código, con las reglas bonaerenses. Da la compu; vos empezás. Tus cartas: ' + X.hands[me].map(cname).join(', ') + '.</p>' +
      '<ol class="jg-cu-st">' + P.map(playTxt).join('') + '</ol>' +
      tip('Lo que se ve en esta mano', 'En la tercera jugada no había 15 posible y dejaste ' + cname(P[2].card) + '. Después de que la compu levantó, en la mesa quedaron ' + P[4].take.map(cname).join(' y ') + ': con ' + cname(P[4].card) + ' sumaste ' + sumTxt(P[4].card, P[4].take) + ' y barriste la mesa.', 'why')) +
    sec('final', 6, 'Cómo sigue', 'Cuando se acaban las cartas',
      '<p>Cuando todos se quedan sin cartas en la mano, el que da reparte otras tres a cada uno (sin poner más en la mesa) y se sigue. Así hasta que se termina el mazo.</p>' +
      '<p>Las cartas que quedan en la mesa al final se las lleva <b>el último que levantó</b>. En la mano del ejemplo se las llevó ' + X.plays.filter(p => p.take.length).slice(-1).map(p => (p.seat === me ? 'el que empezó (vos)' : 'la compu')).join('') + '. Recién entonces se cuenta.</p>' + cite(h, ['escoba.l-redeal', 'escoba.l-rest'])) +
    sec('contar', 7, 'Del reglamento', 'Cómo se cuentan los puntos',
      '<p>Al terminar la mano, cada uno da vuelta su montón. Hay cinco cosas que dan un punto cada una:</p>' +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Punto</th><th class="n">Vos</th><th class="n">Compu</th><th>En la mano del ejemplo</th></tr></thead><tbody>' +
      line('<b>Escobas</b> (una por escoba)', X.escobas[me], X.escobas[1 - me], 'Hiciste ' + X.escobas[me] + ': ' + X.escobas[me] + ' punto para vos.') +
      line('<b>Cartas</b> (el que tiene más)', piles[0].length, piles[1].length, 'Tenés más: punto para vos.') +
      line('<b>Oros</b> (seis o más)', oros(piles[0]), oros(piles[1]), 'Nadie llegó a seis: nadie se lo anota.') +
      line('<b>Siete de oros</b>', piles[0].includes('7o') ? 'sí' : 'no', piles[1].includes('7o') ? 'sí' : 'no', 'Lo levantó la compu: punto para ella.') +
      line('<b>Setenta</b> (la mejor suma)', st[0], st[1], 'Ganás el setenta: punto para vos.') +
      '<tr class="on"><td>Total de la mano</td><td class="n">' + pts[0] + '</td><td class="n">' + pts[1] + '</td><td></td></tr></tbody></table></div>' +
      '<p>Si empatan en cartas, oros o setenta, ese punto no es para nadie.</p>' +
      cite(h, ['escoba.escoba', 'escoba.cartas', 'escoba.oros-6', 'escoba.siete-oros', 'escoba.setenta-suits', 'escoba.tie-none'])) +
    sec('setenta', 8, 'El más difícil de entender', 'El setenta, explicado',
      '<p>Para el setenta no importa cuántas cartas tenés, sino <b>la mejor de cada palo</b>, con una escala propia (no la de sumar 15):</p>' +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Carta</th>' + scale.map(([n]) => '<th class="n">' + (n === '1' ? 'As' : n) + '</th>').join('') + '<th class="n">Figuras</th></tr></thead><tbody><tr><td>Vale</td>' + scale.map(([, v]) => '<td class="n">' + v + '</td>').join('') + '<td class="n">' + SETENTA[10] + '</td></tr></tbody></table></div>' +
      '<p>Se elige la carta más alta de cada uno de los cuatro palos y se suman. Si te falta un palo, no tenés setenta. En el ejemplo:</p>' +
      '<div class="jg-cu-two">' + [0, 1].map(k => '<div><h3>' + (k ? 'Compu' : 'Vos') + ': ' + st[k] + '</h3>' + hand(best[k], 'xs') + '<p>' + best[k].map(c => SETENTA[+c.slice(0, -1)]).join(' + ') + ' = ' + st[k] + '</p></div>').join('') + '</div>' +
      tip('Por eso valen tanto los sietes', 'Un siete vale ' + SETENTA[7] + ' en la escala: con los cuatro sietes tenés el setenta más alto posible. Y el seis (' + SETENTA[6] + ') vale más que el as (' + SETENTA[1] + ').', 'why') +
      cite(h, ['escoba.setenta-suits', 'escoba.scale-7', 'escoba.scale-6-1', 'escoba.scale-5-4-3', 'escoba.scale-2', 'escoba.scale-fig'])) +
    sec('errores', 9, 'Para no equivocarte', 'Errores comunes',
      errs([
        ['Contar la sota como 10.', 'En la escoba la sota vale ' + VALUE['10o'] + ', el caballo ' + VALUE['11o'] + ' y el rey ' + VALUE['12o'] + '.'],
        ['Levantar cartas que suman 15 sin usar la tuya.', 'La carta que tirás tiene que entrar en la suma.'],
        ['Dejar un 15 en la mesa para «guardarlo».', 'Con el reglamento bonaerense es obligatorio levantar.'],
        ['Creer que el setenta es sumar todas tus cartas.', 'Es la mejor carta de cada palo, con su propia escala.'],
        ['Anotarse el punto de oros con cinco.', 'Hacen falta seis oros o más.'],
      ])) +
    sec('variantes', 10, 'Otras mesas', 'Otras mesas',
      '<ul><li><b>Levantar a elección:</b> en muchas casas no es obligatorio levantar.</li><li><b>Puntos distintos:</b> en la variante de Ludoteka, en lugar del setenta hay un punto para el que tiene más sietes, y el de oros es para el que tiene más oros; si empatan, se lo anotan los dos.</li><li><b>De a cuatro:</b> se puede jugar en parejas.</li></ul>' +
      cite(h, ['escoba.l-optional', 'escoba.l-sietes', 'escoba.l-oros', 'escoba.l-tie-each', 'escoba.pairs'])) +
    faqSec(h, 11, 'Preguntas sobre la escoba de 15', FAQ);
  return { html, faq: FAQ };
}
const DECK40SUM = Object.values(VALUE).reduce((a, b) => a + b, 0);

// ---------- burako ----------
// No engine for burako: the example hand is built here and every number is computed from the cited values (BURAKO, cartas.mjs).
const COL = { r: ['#d92d20', 'rojo'], a: ['#2f6fdb', 'azul'], n: ['#1d2433', 'negro'], y: ['#c98a00', 'amarillo'] };
const tl = t => (t === 'J' ? '<span class="jg-cu-tl j" role="img" aria-label="comodín">★</span>' : '<span class="jg-cu-tl" style="--c:' + COL[t.slice(-1)][0] + '" role="img" aria-label="' + t.slice(0, -1) + ' ' + COL[t.slice(-1)][1] + '">' + t.slice(0, -1) + '</span>');
const tls = list => '<span class="jg-cu-tls">' + list.map(tl).join('') + '</span>';
export function burakoCurso(h, { B }) {
  const val = t => { if (t === 'J') return B.tiles.find(x => x.k === 'com').v; const n = +t.slice(0, -1); return B.tiles.find(x => x.k === (n === 1 ? 'uno' : n === 2 ? 'dos' : n <= 7 ? 'bajas' : 'altas')).v; };
  const sum = list => list.reduce((a, t) => a + val(t), 0);
  const dealt = 2 * B.rack + 2 * B.muertoTiles + B.piles * B.pileTiles;
  const pura = ['3r', '4r', '5r', '6r', '7r', '8r', '9r'], impura = ['12a', '12n', '12y', '12r', '12a', '12n', 'J'], pierna = ['1r', '1y', '1n'];
  const bLaid = ['5a', '6a', '7a', '8a'], bHand = ['13n', '2y', '9r'];
  if (pura.length < B.canasta || impura.length < B.canasta) throw new Error('burako tutorial: the example canastas need ' + B.canasta + ' tiles');
  const A = [['Canasta pura (sin comodín)', B.pura], ['Canasta impura (con comodín)', B.impura], ['Fichas de la canasta pura', sum(pura)], ['Fichas de la canasta impura', sum(impura)], ['Fichas de la pierna de unos', sum(pierna)], ['Cerró la mano', B.cierre]];
  const Bt = [['Fichas bajadas', sum(bLaid)], ['Fichas que le quedaron en el atril', -sum(bHand)], ['No compró el muerto', -B.muerto]];
  const tot = l => l.reduce((a, [, v]) => a + v, 0);
  const rows = l => l.map(([k, v]) => '<tr><td>' + k + '</td><td class="n">' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '</td></tr>').join('');
  const FAQ = [
    ['¿Cuántas fichas tiene el burako?', B.tilesTotal + ' fichas numeradas del 1 al 13 en cuatro colores (dos de cada una) y ' + B.jokers + ' comodines: ' + (B.tilesTotal + B.jokers) + ' en total. Además, los 2 también hacen de comodín.'],
    ['¿Qué es una canasta?', 'Un juego (pierna o escalera) de ' + B.canasta + ' fichas o más. Pura, sin comodín, vale ' + B.pura + '; impura, con comodín, vale ' + B.impura + '.'],
    ['¿Qué es el muerto?', 'Un montón de ' + B.muertoTiles + ' fichas para cada jugador. Cuando te quedás sin fichas en el atril, lo tomás y seguís jugando con él. Si termina la mano y no lo compraste, te restan ' + B.muerto + '.'],
    ['¿Cuándo se puede cerrar?', 'Cuando tenés al menos una canasta y ya compraste el muerto, y te quedás sin fichas o con una sola. El cierre vale ' + B.cierre + '.'],
    ['¿Cuánto vale cada ficha?', B.tiles.map(t => t.label.toLowerCase() + ' ' + t.v).join(', ') + '. Lo que te queda en el atril al final se resta.'],
    ['¿A cuántos puntos se juega?', 'A ' + B.goal.toLocaleString('es-AR') + '. Si los dos pasan esa cifra en la misma mano, gana el que suma más.'],
  ];
  const items = [['objetivo', 'De qué se trata'], ['fichas', 'Las fichas y lo que valen'], ['armado', 'El armado de la mesa'], ['juegos', 'Los juegos: piernas, escaleras y canastas'], ['turno', 'Tu turno, paso a paso'], ['muerto', 'El muerto'], ['cerrar', 'Cerrar la mano'], ['ejemplo', 'Una mano contada de punta a punta'], ['errores', 'Errores comunes'], ['preguntas', 'Preguntas'], ['calculadora', 'La calculadora de la mano']];
  const html = toc(items, '¿Ya sabés jugar? <a href="#calculadora">Ir a la calculadora</a>' + (h.built('/burako/anotador/') ? ' o <a href="' + h.href('/burako/anotador/') + '">abrir el anotador</a>' : '') + '.') +
    sec('objetivo', 1, 'El objetivo', 'De qué se trata',
      '<p>El burako es un juego de fichas para <b>dos jugadores</b> (en casa también se juega de a dos parejas). Cada uno arma juegos con sus fichas y los baja a la mesa; los juegos de ' + B.canasta + ' fichas o más son <b>canastas</b> y valen mucho. Cuando alguien se queda sin fichas y cumple las condiciones, <b>cierra</b> la mano y se cuenta.</p>' +
      '<p>Se juegan manos hasta que alguien llega a <b>' + B.goal.toLocaleString('es-AR') + ' puntos</b>.</p>' + cite(h, ['burako.two-players', 'burako.goal-1500', 'burako.canasta'])) +
    sec('fichas', 2, 'Antes de empezar', 'Las fichas y lo que valen',
      '<p>Hay <b>' + B.tilesTotal + ' fichas numeradas</b> del 1 al 13 en cuatro colores (rojo, amarillo, negro y azul, dos de cada una) y <b>' + B.jokers + ' comodines</b>. Ojo: en el burako <b>los 2 también son comodines</b>.</p>' +
      fig(tls(['1r', '2y', '5n', '9a', '13r', 'J']), 'Cada ficha tiene un valor para la cuenta final.') +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Ficha</th><th class="n">Puntos</th></tr></thead><tbody>' + B.tiles.map(t => '<tr><td>' + t.label + '</td><td class="n">' + t.v + '</td></tr>').join('') + '</tbody></table></div>' +
      cite(h, ['burako.tiles-104', 'burako.jokers-2', 'burako.two-is-joker', 'burako.pierna-example', 'burako.v-1', 'burako.v-2', 'burako.v-3-7', 'burako.v-8-13', 'burako.v-joker'])) +
    sec('armado', 3, 'Cómo empieza', 'El armado de la mesa',
      steps([
        ['Un atril de ' + B.rack + ' para cada uno', '<p>Cada jugador recibe ' + B.rack + ' fichas en su atril, sin mostrarlas.</p>'],
        ['Un muerto de ' + B.muertoTiles + ' para cada uno', '<p>Al costado se dejan dos montones de ' + B.muertoTiles + ' fichas: el muerto de cada jugador, para más adelante.</p>'],
        ['El mazo', '<p>Con el resto se arman ' + B.piles + ' montones de ' + B.pileTiles + ' fichas, boca abajo: de ahí se roba. En total se reparten ' + dealt + ' fichas.</p>'],
        ['Empieza el mano', '<p>El que reparte es mano: toma una ficha del mazo y puede quedarse con ella, o dejarla en el pozo y tomar otra.</p>'],
      ]) + cite(h, ['burako.piles', 'burako.mano-first'])) +
    sec('juegos', 4, 'Lo más importante', 'Los juegos: piernas, escaleras y canastas',
      '<div class="jg-cu-two"><div><h3>Pierna</h3><p>Tres o más fichas del <b>mismo número</b>, de cualquier color.</p>' + tls(['6r', '6r', '6y']) + '</div><div><h3>Escalera</h3><p>Fichas <b>seguidas del mismo color</b>. El 1 puede ir al principio o después del 13.</p>' + tls(['11a', '12a', '13a', '1a']) + '</div></div>' +
      '<h3>Canasta: siete fichas o más</h3><p>Cuando una pierna o una escalera llega a <b>' + B.canasta + ' fichas</b>, es canasta. <b>Pura</b> si no tiene comodín (' + B.pura + ' puntos), <b>impura</b> si tiene (' + B.impura + '). Se le pueden seguir agregando fichas.</p>' +
      fig('<div class="jg-cu-row"><div><small>Canasta pura</small>' + tls(pura) + '</div><div><small>Canasta impura</small>' + tls(impura) + '</div></div>') +
      tip('Comodines', 'Un juego se puede bajar con dos fichas y un comodín, y puede tener hasta dos comodines si por cada comodín hay dos fichas normales (5-6-comodín-8-9-comodín-11). Un comodín puesto en un juego se puede cambiar de lugar, pero no sacar.', 'why') +
      cite(h, ['burako.pierna', 'burako.escalera', 'burako.two-same-color', 'burako.canasta', 'burako.canasta-more', 'burako.pura-200', 'burako.impura-100', 'burako.two-plus-joker', 'burako.two-jokers', 'burako.joker-swap'])) +
    sec('turno', 5, 'Cómo se juega', 'Tu turno, paso a paso',
      steps([
        ['Robás', '<p>Una ficha del mazo, <b>o todo el pozo</b>: si querés el pozo, te llevás todas las fichas que hay en él, no solo la de arriba.</p>'],
        ['Bajás juegos (si querés)', '<p>Solo en tu turno. No hace falta un mínimo de puntos para bajar. También podés agregar fichas a tus juegos de la mesa.</p>'],
        ['Dejás una ficha en el pozo', '<p>Boca arriba. Con eso le pasás el turno al otro.</p>'],
      ]) + tip('Ficha tocada, ficha jugada', 'Si tocás una ficha del pozo, tenés que comprar el pozo; si tocás una del mazo, tenés que levantarla.', 'warn') +
      cite(h, ['burako.pozo-all', 'burako.only-turn', 'burako.no-minimum', 'burako.discard', 'burako.touched'])) +
    sec('muerto', 6, 'La segunda mano de fichas', 'El muerto',
      '<p>Cuando te quedás <b>sin fichas en el atril</b>, tomás tu muerto (' + B.muertoTiles + ' fichas) y seguís jugando con él. Hay dos formas:</p>' +
      '<div class="jg-cu-two"><div><h3>Compra directa</h3><p>Bajás todas tus fichas a la mesa, tomás el muerto y lo jugás en el mismo turno.</p></div><div><h3>Compra indirecta</h3><p>Te quedás sin fichas al tirar la última al pozo: tomás el muerto y lo jugás en tu próximo turno.</p></div></div>' +
      tip('Si no lo comprás', 'Al final de la mano te restan ' + B.muerto + ' puntos. Y si lo compraste pero no llegaste a jugarlo, todas sus fichas cuentan en contra.', 'warn') +
      cite(h, ['burako.buy-direct', 'burako.buy-indirect', 'burako.muerto-100', 'burako.muerto-unplayed'])) +
    sec('cerrar', 7, 'El final de la mano', 'Cerrar la mano',
      '<p>Cerrás cuando te quedás con el atril vacío o con una sola ficha, pero <b>solo si</b> ya tenés al menos <b>una canasta</b> y <b>compraste el muerto</b>. El cierre vale <b>' + B.cierre + '</b>.</p>' +
      '<ul><li>Si se acaba el mazo y nadie tiene canasta, la mano se juega de nuevo.</li><li>Si se acaba y alguien tiene canasta, se cuenta igual, pero sin los ' + B.cierre + ' del cierre.</li></ul>' +
      cite(h, ['burako.close-empty', 'burako.close-needs', 'burako.close-100', 'burako.no-canasta-replay', 'burako.stock-out'])) +
    sec('ejemplo', 8, 'Ejemplo resuelto', 'Una mano contada de punta a punta',
      '<p>Una mano armada para practicar la cuenta (los puntos los suma el código con la tabla de arriba). Ana compró su muerto, armó dos canastas y cerró; Beto no llegó a comprar el suyo y se quedó con fichas.</p>' +
      '<div class="jg-cu-two"><div><h3>Ana</h3>' + tls(pura) + tls(impura) + tls(pierna) + '<div class="jg-cu-tw"><table class="jg-cu-tbl"><tbody>' + rows(A) + '<tr class="on"><td>Total</td><td class="n">' + tot(A) + '</td></tr></tbody></table></div></div>' +
      '<div><h3>Beto</h3><p class="jg-note">Bajó:</p>' + tls(bLaid) + '<p class="jg-note">Le quedó en el atril:</p>' + tls(bHand) + '<div class="jg-cu-tw"><table class="jg-cu-tbl"><tbody>' + rows(Bt) + '<tr class="on"><td>Total</td><td class="n">' + (tot(Bt) < 0 ? '−' : '') + Math.abs(tot(Bt)) + '</td></tr></tbody></table></div></div></div>' +
      tip('Ojo con las fichas bajadas', 'El reglamento bonaerense dice que las fichas que no bajaste se descuentan y que, con el mazo agotado, se cuenta «normalmente». En casi todas las mesas las fichas bajadas también suman, y así lo contamos acá y en la calculadora (la podés apagar).', 'warn') +
      cite(h, ['burako.hand-minus', 'burako.stock-out'])) +
    sec('errores', 9, 'Para no equivocarte', 'Errores comunes',
      errs([
        ['Llevarse solo la ficha de arriba del pozo.', 'El pozo se toma entero.'],
        ['Cerrar sin canasta o sin haber comprado el muerto.', 'Hacen falta las dos cosas.'],
        ['Olvidarse de que los 2 son comodines.', 'Un 2 que ocupa el lugar de otra ficha es un comodín: la canasta que lo tiene es impura.'],
        ['Terminar el turno sin dejar ficha en el pozo.', 'Siempre dejás una para pasar el turno.'],
        ['Guardar comodines en el atril hasta el final.', 'Si la mano se cierra, cada comodín que te quedó te resta ' + val('J') + '.'],
      ])) +
    faqSec(h, 10, 'Preguntas sobre el burako', FAQ);
  return { html, faq: FAQ };
}

// ---------- dados ----------
export function dadosCurso(h) {
  const ways = {};
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) ways[a + b] = (ways[a + b] || 0) + 1;
  const max = Math.max(...Object.values(ways));
  const sv = servida(R.straights);
  const FAQ = [
    ['¿El tirador de dados es justo?', 'Sí: cada dado sale del generador criptográfico del navegador (crypto.getRandomValues), sin sesgo, y cada cara tiene la misma chance: 1 en 6.'],
    ['¿Qué suma sale más con dos dados?', 'El 7: hay ' + ways[7] + ' combinaciones de 36 que suman 7, una chance de ' + oneIn(36 / ways[7]) + '. El 2 y el 12 son los más difíciles: una sola combinación cada uno.'],
    ['¿Sirve para jugar a la generala?', 'Sí. Tocá «Generala (5 dados)»: tira cinco dados de seis caras y te dice si salió escalera, full, póker o generala. Las reglas completas están en nuestra guía de la generala.'],
    ['¿Si salió muchas veces el 6, ahora sale menos?', 'No. Los dados no tienen memoria: cada tiro es independiente y el 6 sigue teniendo 1 en 6.'],
  ];
  const items = [['como-se-usa', 'Cómo se usa'], ['un-dado', 'Un dado: 1 en 6'], ['dos-dados', 'Dos dados: por qué sale tanto el 7'], ['cinco-dados', 'Cinco dados: la generala'], ['preguntas', 'Preguntas']];
  const html = toc(items) +
    sec('como-se-usa', 1, 'El tirador', 'Cómo se usa',
      steps([
        ['Elegí cuántos dados y de cuántas caras', '<p>De 1 a 10 dados, de 4 a 20 caras (el común es d6, de seis caras).</p>'],
        ['Tocá «Tirar»', '<p>Aparecen los dados y la suma. Con el botón «Generala (5 dados)» se ponen cinco de seis caras y te dice qué juego salió.</p>', dice([3, 3, 5, 5, 5])],
        ['Mirá el historial', '<p>Cada tiro queda anotado y el gráfico muestra cómo se reparten las sumas contra lo que se espera.</p>'],
      ])) +
    sec('un-dado', 2, 'Lo básico', 'Un dado: 1 en 6',
      '<p>Un dado común tiene seis caras, del 1 al 6, y en las caras opuestas suman 7 (el 1 está enfrente del 6). Si el dado es parejo, <b>cada cara tiene la misma chance: 1 en 6</b>, en cada tiro.</p>' + fig(dice([1, 2, 3, 4, 5, 6])) +
      tip('No hay rachas', 'Si salieron tres seis seguidos, el próximo tiro sigue siendo 1 en 6. El dado no recuerda lo que pasó.', 'why')) +
    sec('dos-dados', 3, 'La cuenta', 'Dos dados: por qué sale tanto el 7',
      '<p>Con dos dados hay <b>36 combinaciones</b> (6 × 6). Las sumas del medio salen más porque se pueden formar de más maneras: el 7 sale con 1+6, 2+5, 3+4, 4+3, 5+2 y 6+1.</p>' +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Suma</th><th class="n">Combinaciones</th><th class="n">Chance</th><th></th></tr></thead><tbody>' +
      Object.entries(ways).map(([s, w]) => '<tr' + (w === max ? ' class="on"' : '') + '><td>' + s + '</td><td class="n">' + w + ' de 36</td><td class="n">' + oneIn(36 / w) + '</td><td><span class="jg-bar"><i style="width:' + Math.round(100 * w / max) + '%"></i></span></td></tr>').join('') + '</tbody></table></div>') +
    sec('cinco-dados', 4, 'Para la generala', 'Cinco dados: la generala',
      '<p>Con cinco dados hay ' + fmt(6 ** 5, 0) + ' tiradas posibles. En la generala, la chance de cada juego en el primer tiro es: generala ' + oneIn(sv.generala.oneIn) + ', póker ' + oneIn(sv.poker.oneIn) + ', full ' + oneIn(sv.full.oneIn) + ' y escalera ' + oneIn(sv.escalera.oneIn) + '.</p>' +
      (h.built('/generala/') ? '<p>¿No sabés jugar? En <a href="' + h.href('/generala/') + '">la guía de la generala</a> te lo explicamos desde cero, con turnos reales.</p>' : '')) +
    faqSec(h, 5, 'Preguntas sobre los dados', FAQ);
  return { html, faq: FAQ };
}
