// Beginner tutorials of the lotteries (owner 2026-11-05): quiniela, redoblona, Quini 6, Loto Plus, Brinco, Telekino, Poceada and
// Quiniela Plus. Payouts and chances from engine/lottery, rules from the cited regulations (h.src), prices from the saved LOTBA
// programme (precios.mjs). The example draws come from a seeded generator and the pages say they are examples, not real draws.
import { directBet, payTable, redoblona, settleDirect, settleRedoblona } from '../../../engine/lottery/quiniela.mjs';
import { rules } from '../../../engine/lottery/rules.mjs';
import { odds, prizeShare, quini6PremioExtra, lotoPlusMultiplicador, quinielaPlusOdds } from '../../../engine/lottery/games.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';
import { xoshiro128ss } from '../../../engine/lottery/rng.mjs';
import { cite, fmt, oneIn, money, btn } from './parts.mjs';
import { price, priceNote } from './precios.mjs';
import { toc, sec, tip, steps, errs, fig, ball, faqSec } from './curso.mjs';

const n = q => toNumber(q);
const two = x => String(x).padStart(2, '0');
const four = x => String(x).padStart(4, '0');
const PL = { 1: 'a la cabeza', 5: 'a los 5', 10: 'a los 10', 20: 'a los 20' };

// Seeded example draws (not real): the quiniela extract of the "cómo se juega" tool, and k distinct numbers from 0..max.
export const demoExtract = () => { const g = xoshiro128ss(20261103); return Array.from({ length: 20 }, () => g.int(10000)); };
function drawDistinct(seed, k, min, max) { const g = xoshiro128ss(seed), out = []; while (out.length < k) { const x = min + g.int(max - min + 1); if (!out.includes(x)) out.push(x); } return out; }
const sorted = a => a.slice().sort((x, y) => x - y);

// The extract drawn as 20 numbered places; `cover` places get a blue border, `hits` places go green.
export function extract(ex, { cover = 0, from = 1, hit = () => false, digits = 0 } = {}) {
  return '<div class="jg-cu-x" role="img" aria-label="Extracto de ejemplo de 20 números">' + ex.map((v, i) => {
    const s = four(v), p = i + 1, inR = p >= from && p < from + cover;
    return '<span class="' + (p === 1 ? 'cab ' : '') + (inR ? 'in ' : '') + (inR && hit(v, p) ? 'hit' : '') + '"><small>' + p + '</small>' + (digits ? s.slice(0, 4 - digits) + '<b>' + s.slice(4 - digits) + '</b>' : s) + '</span>';
  }).join('') + '</div>';
}
const boleta = (title, rows) => '<div class="jg-cu-bol"><strong>' + title + '</strong>' + rows.map(([k, v]) => '<div><span>' + k + '</span><b>' + v + '</b></div>').join('') + '</div>';
const balls = (list, cls = () => '') => '<span class="jg-cu-balls">' + list.map(x => ball(typeof x === 'number' ? two(x) : x, cls(x))).join('') + '</span>';

function rgSec(h, id, nn, per100, game) {
  return sec(id, nn, 'Antes de jugar', 'Lo que conviene saber antes de jugar',
    '<p>De cada $ 100 que se juegan ' + game + ', vuelven en premios <b>' + money(per100) + '</b> en promedio, según el reglamento. El resto se lo quedan la lotería, las agencias y los fondos. Ningún sistema, número «que se debe» o cábala cambia eso: cada sorteo es independiente.</p>' +
    '<ul><li>Jugá solo plata que podés perder sin que te cambie el mes.</li><li>Decidí antes cuánto vas a jugar y no lo subas para «recuperar».</li><li>Es solo para mayores de 18 años.</li></ul>' +
    (h.built('/juego-responsable/') ? '<p>Si sentís que el juego dejó de ser un rato de diversión, en <a href="' + h.href('/juego-responsable/') + '">juego responsable</a> están las líneas gratuitas de ayuda de cada provincia.</p>' : ''), 'jg-cu-rg');
}

// ---------- quiniela: how to play ----------
export function quinielaCurso(h) {
  const L = rules('quiniela', 'lotba-quiniela');
  const ex = demoExtract();
  const mine = ex[2] % 100, place = 3;
  const sA = settleDirect({ rules: 'lotba-quiniela', digits: 2, number: mine, places: 1, stake: 500, extract: ex });
  const sB = settleDirect({ rules: 'lotba-quiniela', digits: 2, number: mine, places: 5, stake: 500, extract: ex });
  const n3 = ex[0] % 1000;
  const sC = settleDirect({ rules: 'lotba-quiniela', digits: 3, number: n3, places: 1, stake: 200, extract: ex });
  if (sA.hits !== 0 || sB.hits !== 1 || sC.hits !== 1 || ex.slice(0, 5).filter(v => v % 100 === mine).length !== sB.hits) throw new Error('quiniela tutorial: the demo extract changed');
  const tbl = payTable({ rules: 'lotba-quiniela', stake: 100 });
  const pays = [1, 2, 3, 4].map(d => directBet({ rules: 'lotba-quiniela', digits: d, places: 1, stake: 100 }));
  const ev2 = n(pays[1].evPer100);
  const s = four(ex[2]);
  const FAQ = [
    ['¿Cómo se juega a la quiniela?', 'Elegís un número de 1 a 4 cifras, la ubicación (a la cabeza o a los 5, 10 o 20), la lotería (Ciudad, Provincia, Córdoba…) y cuánta plata ponés. Si tu número sale en los lugares que elegiste, cobrás ' + fmt(L.pay[2].v, 0) + ' veces lo apostado a 2 cifras, dividido por la cantidad de lugares.'],
    ['¿Qué significa jugar a la cabeza?', 'Que tu número tiene que salir en el primer lugar del extracto, el más importante. A los 5, 10 o 20 vale cualquiera de esos primeros lugares, pero tu apuesta se reparte entre ellos.'],
    ['¿Cuánto paga la quiniela a la cabeza?', 'Por cada $ 100: a 1 cifra ' + money(n(pays[0].perHit)) + ', a 2 cifras ' + money(n(pays[1].perHit)) + ', a 3 cifras ' + money(n(pays[2].perHit)) + ' y a 4 cifras ' + money(n(pays[3].perHit)) + '. El premio incluye lo que apostaste.'],
    ['¿Qué número cuenta si juego a 2 cifras?', 'Las dos últimas cifras del número que sale. Si sale el ' + s + ', a 2 cifras cuenta el ' + s.slice(2) + ' y a 3 cifras el ' + s.slice(1) + '.'],
    ['¿Hasta cuándo puedo anular una jugada?', 'En la Ciudad, hasta ' + h.src.value('lotba.quiniela.cancel-15') + ' minutos después de hacerla, y siempre antes del cierre del sorteo.'],
    ['¿Dónde cobro si gano?', 'En la agencia donde jugaste, hasta la fecha que dice el extracto oficial. Los premios grandes se cobran en la sede de la lotería.'],
  ];
  const items = [['que-es', 'Qué es la quiniela'], ['extracto', 'El sorteo: 20 números'], ['cifras', 'Tu número y las cifras'], ['ubicacion', 'A la cabeza o a los 5, 10 y 20'], ['pagos', 'Cuánto paga'], ['boleta', 'La boleta, campo por campo'], ['ejemplo', 'Un extracto leído paso a paso'], ['cobrar', 'Después del sorteo'], ['antes', 'Antes de jugar'], ['errores', 'Errores comunes'], ['preguntas', 'Preguntas'], ['simulador', 'Armá tu boleta']];
  const html = toc(items, '¿Ya sabés cómo funciona? <a href="#simulador">Armá una boleta de práctica</a>' + (h.built('/quiniela/cuanto-paga/') ? ' o <a href="' + h.href('/quiniela/cuanto-paga/') + '">calculá cuánto paga</a>' : '') + '.') +
    sec('que-es', 1, 'Lo básico', 'Qué es la quiniela',
      '<p>La quiniela es una apuesta a <b>un número</b>. Cada lotería (la de la Ciudad, la de la Provincia, la de Córdoba…) hace varios sorteos por día y en cada uno saca <b>20 números de cuatro cifras</b>, del 0000 al 9999. Vos elegís un número, en qué lugares tiene que salir y cuánta plata ponés. Si sale donde dijiste, cobrás un premio fijo: varias veces lo que apostaste.</p>' +
      tip('En una frase', 'Número + cifras + ubicación + lotería + plata. Con esas cinco cosas armás cualquier jugada.') + cite(h, ['lotba.quiniela.drawn', 'lotba.quiniela.digits-max'])) +
    sec('extracto', 2, 'El sorteo', 'El sorteo: 20 números',
      '<p>El resultado de cada sorteo se llama <b>extracto</b>: una lista de 20 números en orden, del lugar 1 al 20. El primero es <b>la cabeza</b>, el número «del día» que se nombra en la tele y en la agencia.</p>' +
      fig(extract(ex), 'Un extracto de ejemplo (no es un sorteo real). En naranja, la cabeza: el lugar 1.') +
      '<p>Cada lotería tiene su propio extracto en cada turno (la Previa, la Primera, la Matutina, la Vespertina y la Nocturna): jugar a la Ciudad y a la Provincia son dos apuestas distintas.</p>' + cite(h, ['lotba.quiniela.drawn'])) +
    sec('cifras', 3, 'Tu número', 'Tu número y las cifras',
      '<p>Podés jugar un número de <b>1, 2, 3 o 4 cifras</b> (en la Provincia, también 5). Lo que cuenta son <b>las últimas cifras</b> del número que sale: si sale el <b>' + s + '</b>…</p>' +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Jugás a</th><th>Te sirve el</th><th class="n">Paga (veces)</th><th class="n">Chance en un lugar</th></tr></thead><tbody>' +
      [1, 2, 3, 4].map(d => '<tr><td>' + d + ' cifra' + (d > 1 ? 's' : '') + '</td><td>' + s.slice(4 - d) + '</td><td class="n">' + fmt(L.pay[d].v, 0) + '</td><td class="n">1 en ' + fmt(10 ** d, 0) + '</td></tr>').join('') + '</tbody></table></div>' +
      tip('Más cifras, más premio y menos chance', 'A 2 cifras hay 100 terminaciones posibles: acertar es 1 en 100 y paga ' + fmt(L.pay[2].v, 0) + ' veces. A 4 cifras hay 10.000: paga ' + fmt(L.pay[4].v, 0) + ' veces, pero sale muchísimo menos.', 'why') +
      cite(h, ['lotba.quiniela.digits-max', 'lotba.quiniela.pay-1', 'lotba.quiniela.pay-2', 'lotba.quiniela.pay-3', 'lotba.quiniela.pay-4', 'pba.quiniela.pay-5'])) +
    sec('ubicacion', 4, 'Dónde tiene que salir', 'A la cabeza o a los 5, 10 y 20',
      '<p><b>A la cabeza</b>: tu número tiene que salir en el lugar 1. <b>A los 5</b>: en cualquiera de los primeros 5 lugares (y lo mismo a los 10 o a los 20). Cubrís más lugares, pero <b>tu apuesta se divide</b> por la cantidad de lugares.</p>' +
      fig(extract(ex, { cover: 5 }), 'A los 5: valen los lugares con borde azul, del 1 al 5.') +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Con $ 100 a 2 cifras</th><th class="n">Si sale, cobrás</th><th class="n">Chance</th></tr></thead><tbody>' +
      tbl.filter(t => t.digits === 2).map(t => '<tr><td>' + PL[t.places] + '</td><td class="n">' + money(n(t.perHit)) + '</td><td class="n">' + oneIn(t.oneIn) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>Fijate que el promedio no cambia: a la cabeza cobrás mucho con poca chance; a los 20, poco con más chance. En los dos casos vuelven ' + money(ev2) + ' de cada $ 100.</p>' +
      tip('Si tu número sale dos veces', 'En la Ciudad, si tu número se repite dentro de tus lugares, cobrás una vez por cada vez que aparece.') +
      cite(h, ['lotba.quiniela.range-any', 'lotba.quiniela.range-divide', 'lotba.quiniela.repeats-count'])) +
    sec('pagos', 5, 'Del reglamento', 'Cuánto paga',
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Cifras</th>' + [1, 5, 10, 20].map(p => '<th class="n">' + PL[p] + '</th>').join('') + '</tr></thead><tbody>' +
      [1, 2, 3, 4].map(d => '<tr><td>' + d + '</td>' + [1, 5, 10, 20].map(p => '<td class="n">' + money(n(tbl.find(t => t.digits === d && t.places === p).perHit)) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
      '<p class="jg-note">Lo que cobrás con $ 100 en la Ciudad, premio incluido lo apostado. La Provincia paga lo mismo de 1 a 4 cifras y suma las 5 cifras (' + fmt(rules('quiniela', 'pba-quiniela').pay[5].v, 0) + ' veces).</p>' +
      (h.built('/quiniela/cuanto-paga/') ? '<p>Para otra plata u otra lotería, usá la <a href="' + h.href('/quiniela/cuanto-paga/') + '">calculadora de cuánto paga</a>.</p>' : '') +
      cite(h, ['lotba.quiniela.includes-stake', 'lotba.quiniela.pay-2', 'lotba.quiniela.range-divide'])) +
    sec('boleta', 6, 'En la agencia', 'La boleta, campo por campo',
      '<p>En la agencia le decís al agenciero tu jugada (o la escribís en un papelito) y te da un <b>ticket</b> impreso. Fijate que diga exactamente esto:</p>' +
      fig(boleta('Ticket de ejemplo', [['Lotería', 'Ciudad'], ['Sorteo', 'Nocturna'], ['Número', two(mine)], ['Ubicación', 'a los 5'], ['Importe', money(500)]]), 'Un ticket con una jugada. En el mismo ticket pueden ir hasta ' + h.src.value('lotba.quiniela.ten-per-ticket') + ' jugadas.') +
      steps([
        ['Lotería y sorteo', '<p>Qué extracto jugás (Ciudad, Provincia…) y de qué turno. La apuesta mínima en la Ciudad es ' + price(h, 'lotba.quiniela.min-bet') + ' por extracto.' + priceNote(h, 'lotba.quiniela.min-bet') + '</p>'],
        ['Número', '<p>De 1 a 4 cifras. La cantidad de cifras la define el número que escribís: «' + two(mine) + '» es a 2 cifras; «' + s.slice(1) + '», a 3.</p>'],
        ['Ubicación', '<p>A la cabeza o a los 5, 10 o 20.</p>'],
        ['Importe', '<p>La plata que ponés en esa jugada. Si es a los 5, se reparte entre los 5 lugares.</p>'],
      ]) + cite(h, ['lotba.quiniela.min-bet', 'lotba.quiniela.ten-per-ticket', 'pba.quiniela.agency-ticket'])) +
    sec('ejemplo', 7, 'Ejemplo resuelto', 'Un extracto leído paso a paso',
      '<p>Para practicar la lectura, supongamos que jugaste tres jugadas a este extracto de ejemplo (no es un sorteo real; los números los elegimos mirando el extracto).</p>' +
      '<h3>Jugada 1: el ' + two(mine) + ' a la cabeza, ' + money(500) + '</h3>' + fig(extract(ex, { cover: 1, digits: 2, hit: v => v % 100 === mine })) +
      '<p>La cabeza es el ' + four(ex[0]) + ': termina en ' + two(ex[0] % 100) + ', no en ' + two(mine) + '. <b>No cobrás nada</b>, aunque el ' + two(mine) + ' aparezca más abajo: jugaste solo al lugar 1.</p>' +
      '<h3>Jugada 2: el ' + two(mine) + ' a los 5, ' + money(500) + '</h3>' + fig(extract(ex, { cover: 5, digits: 2, hit: v => v % 100 === mine })) +
      '<p>En el lugar ' + place + ' salió el ' + s + ': termina en ' + two(mine) + ' y está dentro de los 5. Tu apuesta se dividió en 5 (' + money(500 / 5) + ' por lugar) y ese lugar paga ' + fmt(L.pay[2].v, 0) + ' veces: <b>cobrás ' + money(n(sB.payout)) + '</b>.</p>' +
      '<h3>Jugada 3: el ' + String(n3).padStart(3, '0') + ' a la cabeza, ' + money(200) + '</h3>' + fig(extract(ex, { cover: 1, digits: 3, hit: v => v % 1000 === n3 })) +
      '<p>La cabeza ' + four(ex[0]) + ' termina en ' + String(n3).padStart(3, '0') + ': a 3 cifras paga ' + fmt(L.pay[3].v, 0) + ' veces. <b>Cobrás ' + money(n(sC.payout)) + '</b>.</p>' +
      tip('Leé siempre de derecha a izquierda', 'Para saber si ganaste, mirá las últimas cifras de cada número, solo en los lugares que jugaste.', 'why')) +
    sec('cobrar', 8, 'Después del sorteo', 'Controlar, cobrar o anular',
      steps([
        ['Controlá con el extracto oficial', '<p>Lo publica la lotería y lo tiene tu agencia. Nosotros copiamos los extractos en la página de cada lotería.</p>' + (h.built('/quiniela/') ? '<p><a href="' + h.href('/quiniela/') + '">La quiniela de hoy</a></p>' : '')],
        ['Cobrá en la agencia', '<p>Con el ticket, en la agencia donde jugaste, hasta la fecha que figura en el extracto. Más de ' + price(h, 'lotba.quiniela.big-prize') + ' se cobra en la sede de Lotería de la Ciudad.' + priceNote(h, 'lotba.quiniela.big-prize') + '</p>'],
        ['¿Te equivocaste? Anulá', '<p>En la Ciudad tenés hasta ' + h.src.value('lotba.quiniela.cancel-15') + ' minutos después de hacer la jugada, y siempre antes del cierre.</p>'],
      ]) + cite(h, ['lotba.quiniela.collect-where', 'lotba.quiniela.big-prize', 'lotba.quiniela.cancel-15'])) +
    rgSec(h, 'antes', 9, ev2, 'a la quiniela a 1 o 2 cifras') +
    sec('errores', 10, 'Para no equivocarte', 'Errores comunes',
      errs([
        ['Creer que a los 5 cobrás lo mismo que a la cabeza.', 'A los 5 tu apuesta se divide en 5: cobrás la quinta parte.'],
        ['Mirar el número entero cuando jugaste a 2 cifras.', 'Cuentan solo las dos últimas cifras.'],
        ['Jugar a la Provincia y controlar con el extracto de la Ciudad.', 'Cada lotería tiene su extracto: controlá el que jugaste.'],
        ['Buscar números que «están por salir».', 'Cada sorteo es independiente: todos los números tienen la misma chance siempre.'],
        ['Tirar el ticket antes de ver el extracto.', 'Sin ticket no cobrás: guardalo hasta controlar.'],
      ])) +
    faqSec(h, 11, 'Preguntas sobre cómo se juega', FAQ);
  return { html, faq: typeof FAQ === 'undefined' ? [] : FAQ };
}

// ---------- redoblona ----------
export function redoblonaCurso(h) {
  const L = rules('quiniela', 'lotba-quiniela').redoblona, P = rules('quiniela', 'pba-quiniela').redoblona;
  const ex = demoExtract();
  const a = ex[0] % 100;
  const k = ex.slice(1, 6).findIndex(v => v % 100 !== a);
  const b = ex[1 + k] % 100;
  const st = 100;
  const win = settleRedoblona({ rules: 'lotba-quiniela', first: { number: a, places: 1 }, second: { number: b, places: 5 }, stake: st, extract: ex });
  const r = redoblona({ rules: 'lotba-quiniela', first: { number: a, places: 1 }, second: { number: b, places: 5 }, stake: st });
  const first = st * L.pay.v, raw = first * L.pay.v / 5;
  if (n(win.payout) !== Math.min(raw, st * L.cap.v)) throw new Error('redoblona tutorial: the worked example does not match the engine');
  const ev = n(r.evPer100), d2 = n(directBet({ rules: 'lotba-quiniela', digits: 2, places: 1, stake: 100 }).evPer100);
  const FAQ = [
    ['¿Qué es la redoblona?', 'Una jugada a dos números de 2 cifras en el mismo extracto. Si sale el primero en su ubicación, lo que ganás se juega entero al segundo; si también sale, cobrás las dos ganancias multiplicadas.'],
    ['¿Cuánto paga la redoblona?', 'En la Ciudad, ' + L.pay.v + ' veces al primer número y otras ' + L.pay.v + ' al segundo, dividido por los lugares de cada uno, con un tope de ' + fmt(L.cap.v, 0) + ' veces lo apostado. En la Provincia, ' + P.pay.v + ' y ' + P.pay.v + ' veces, con tope de ' + fmt(P.cap.v, 0) + ' veces por lugar.'],
    ['¿Qué pasa si sale solo el primer número?', 'No cobrás nada: en la redoblona tienen que salir los dos.'],
    ['¿Puedo hacer redoblona entre la Ciudad y la Provincia?', 'No. Los dos números tienen que estar en el extracto de la misma lotería.'],
    ['¿Qué chance tiene una redoblona a la cabeza y a los 5?', oneIn(r.oneIn) + ' con números distintos, en la Ciudad. Es mucho menos que una jugada a la cabeza a 2 cifras (1 en 100).'],
  ];
  const items = [['que-es', 'Qué es la redoblona'], ['como', 'Cómo se arma'], ['cuenta', 'Cómo se calcula el premio'], ['ejemplo', 'Un extracto leído paso a paso'], ['tope', 'El tope'], ['chance', 'La chance y lo que vuelve'], ['provincia', 'Ciudad o Provincia'], ['antes', 'Antes de jugar'], ['errores', 'Errores comunes'], ['preguntas', 'Preguntas'], ['calculadora', 'La calculadora']];
  const html = toc(items, '¿Ya sabés cómo funciona? <a href="#calculadora">Ir a la calculadora</a>.') +
    sec('que-es', 1, 'Lo básico', 'Qué es la redoblona',
      '<p>La redoblona es una quiniela a <b>dos números de 2 cifras a la vez</b>, en el mismo extracto. Funciona como una cadena: si sale el primero, el premio que ganaste se vuelve a apostar entero al segundo. Si sale también el segundo, cobrás mucho. Si falla cualquiera de los dos, <b>no cobrás nada</b>.</p>' +
      cite(h, ['lotba.redoblona.two-digits', 'lotba.redoblona.one-extract'])) +
    sec('como', 2, 'La jugada', 'Cómo se arma',
      steps([
        ['El primer número y su ubicación', '<p>Casi siempre se juega <b>a la cabeza</b>, pero puede ser a los 5, 10 o 20.</p>', balls([a], () => 'on')],
        ['El segundo número y su ubicación', '<p>Por ejemplo, a los 5. Cuando el primero va a la cabeza, el segundo se cuenta desde el lugar 2: «a los 5» quiere decir del 2 al 6.</p>', balls([b])],
        ['La plata', '<p>Lo que ponés en la redoblona entera. Una sola apuesta.</p>'],
      ]) + cite(h, ['lotba.redoblona.two-digits', 'lotba.redoblona.first-at-one'])) +
    sec('cuenta', 3, 'La fórmula', 'Cómo se calcula el premio',
      '<p>En la Ciudad, cada número paga <b>' + L.pay.v + ' veces</b>, dividido por la cantidad de lugares que cubre. Con ' + money(st) + ', el primero a la cabeza y el segundo a los 5:</p>' +
      steps([
        ['Primer número a la cabeza', '<p>' + money(st) + ' × ' + L.pay.v + ' = <b>' + money(first) + '</b>. Esa plata no se cobra: pasa al segundo número.</p>'],
        ['Segundo número a los 5', '<p>' + money(first) + ' ÷ 5 lugares × ' + L.pay.v + ' = <b>' + money(raw) + '</b>.</p>'],
        ['Tope', '<p>El premio no puede pasar de ' + fmt(L.cap.v, 0) + ' veces lo apostado (' + money(st * L.cap.v) + '). Acá no llega, así que cobrás ' + money(Math.min(raw, st * L.cap.v)) + '.</p>'],
      ]) + cite(h, ['lotba.redoblona.pay', 'lotba.redoblona.second-amount', 'lotba.redoblona.cap'])) +
    sec('ejemplo', 4, 'Ejemplo resuelto', 'Un extracto leído paso a paso',
      '<p>Con el extracto de ejemplo (no es un sorteo real) y una redoblona de ' + money(st) + ' al <b>' + two(a) + '</b> a la cabeza y al <b>' + two(b) + '</b> a los 5:</p>' +
      fig(extract(ex, { cover: 6, digits: 2, hit: (v, p) => (p === 1 ? v % 100 === a : p >= 2 && p <= 6 && v % 100 === b) }), 'El lugar 1 para el primer número; del 2 al 6 para el segundo.') +
      '<p>La cabeza termina en ' + two(a) + ': el primero salió. En el lugar ' + (k + 2) + ' aparece el ' + four(ex[1 + k]) + ', que termina en ' + two(b) + ': también salió el segundo. <b>Cobrás ' + money(n(win.payout)) + '</b>, la misma cuenta de arriba.</p>' +
      tip('Si el primero no salía', 'Con otra cabeza, la redoblona perdía entera, aunque el ' + two(b) + ' saliera en el lugar ' + (k + 2) + '.', 'warn')) +
    sec('tope', 5, 'El límite', 'El tope',
      '<p>En la Ciudad, el premio de una redoblona tiene un máximo: <b>' + fmt(L.cap.v, 0) + ' veces</b> lo apostado, salvo de la cabeza a los 2 lugares (' + fmt(L.cap12.v, 0) + ' veces) y de la cabeza a los 3 (' + fmt(L.cap13.v, 0) + ' veces). Por eso la redoblona a la cabeza y a la cabeza no existe, y las de pocos lugares cobran menos de lo que daría la multiplicación.</p>' +
      cite(h, ['lotba.redoblona.cap', 'lotba.redoblona.cap-1-2', 'lotba.redoblona.cap-1-3'])) +
    sec('chance', 6, 'La cuenta completa', 'La chance y lo que vuelve',
      '<p>Para la redoblona del ejemplo, el código calcula todas las combinaciones posibles del extracto: la chance de cobrar algo es <b>' + oneIn(r.oneIn) + '</b>, y de cada $ 100 vuelven en promedio <b>' + money(ev) + '</b>. Una jugada simple a la cabeza a 2 cifras devuelve ' + money(d2) + ': el tope le recorta a la redoblona sus premios más grandes.</p>') +
    sec('provincia', 7, 'Diferencias', 'Ciudad o Provincia',
      '<div class="jg-cu-two"><div><h3>Ciudad</h3><p>' + L.pay.v + ' y ' + L.pay.v + ' veces. Tope de ' + fmt(L.cap.v, 0) + ' veces lo apostado.</p></div><div><h3>Provincia</h3><p>' + P.pay.v + ' y ' + P.pay.v + ' veces. Tope de ' + fmt(P.cap.v, 0) + ' veces lo apostado por lugar. Si el primer número va más lejos que el segundo, se paga como apuesta directa.</p></div></div>' +
      cite(h, ['lotba.redoblona.pay', 'pba.redoblona.pay', 'pba.quiniela.cap', 'pba.redoblona.first-beyond-second'])) +
    rgSec(h, 'antes', 8, ev, 'a una redoblona como la del ejemplo') +
    sec('errores', 9, 'Para no equivocarte', 'Errores comunes',
      errs([
        ['Pensar que si sale uno solo, cobrás algo.', 'Tienen que salir los dos.'],
        ['Mezclar loterías: el primero a la Ciudad y el segundo a la Provincia.', 'Los dos van en el mismo extracto.'],
        ['Contar el lugar 1 para el segundo número cuando el primero va a la cabeza.', 'El segundo se cuenta desde el lugar 2.'],
        ['Hacer la multiplicación sin el tope.', 'El premio nunca pasa el máximo del reglamento.'],
      ])) +
    faqSec(h, 10, 'Preguntas sobre la redoblona', FAQ);
  return { html, faq: typeof FAQ === 'undefined' ? [] : FAQ };
}

// ---------- Quini 6: how to play ----------
export function quini6Curso(h) {
  const o = odds('cas-quini6-tradicional'), rv = odds('cas-quini6-revancha'), ex = quini6PremioExtra(), max = o.pool - 1;
  const D = { tr: drawDistinct(601, 6, 0, max), se: drawDistinct(602, 6, 0, max), re: drawDistinct(603, 6, 0, max), ss: drawDistinct(604, 6, 0, max) };
  const extraNums = [...D.tr, ...D.se];
  const mine = sorted([...D.tr.slice(0, 4), ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => !extraNums.includes(x) && !D.re.includes(x)).slice(0, 2)]);
  const hits = k => D[k].filter(x => mine.includes(x)).length;
  const H = { tr: hits('tr'), se: hits('se'), re: hits('re'), ss: hits('ss') };
  if (H.tr !== 4) throw new Error('quini6 tutorial: example ticket must have 4 hits in Tradicional');
  const all18 = new Set([...D.tr, ...D.se, ...D.re]);
  const inExtra = mine.filter(x => all18.has(x)).length;
  const per = id => money(n(prizeShare(id).per100));
  const vol = sel => '<div class="jg-cu-balls">' + Array.from({ length: o.pool }, (_, i) => ball(two(i), sel.includes(i) ? 'on' : '')).join('') + '</div>';
  const res = k => (k === 'tr' || k === 'se' ? (o.rows.find(r => r.hits === H[k] && r.prize) ? '<b>premio de ' + H[k] + ' aciertos</b>' : 'sin premio (hacen falta 4 o más)') : k === 're' ? (H.re === 6 ? '<b>premio</b>' : 'sin premio (solo paga con 6)') : 'depende de los demás: cobra quien tenga más aciertos en el país');
  const FAQ = [
    ['¿Cómo se juega al Quini 6?', 'Marcás 6 números del 00 al ' + two(max) + ' en el volante y elegís las modalidades: Tradicional (dos sorteos, el Primer Sorteo y La Segunda), Revancha y Siempre Sale. Cada modalidad saca sus propios 6 números.'],
    ['¿Con cuántos aciertos se cobra?', 'En Tradicional y La Segunda, con 6, 5 o 4. En Revancha, solo con 6. En Siempre Sale, cobra la apuesta con más aciertos del sorteo.'],
    ['¿Qué es el Premio Extra?', 'Se juntan los 18 números de Tradicional, La Segunda y Revancha: si tus 6 están entre ellos, entrás al reparto. Chance: ' + oneIn(ex.oneIn) + '.'],
    ['¿Puedo jugar solo Siempre Sale?', 'No: para jugar Siempre Sale tenés que jugar también Tradicional y Revancha.'],
    ['¿Qué chance hay de sacar los 6?', oneIn(o.rows[0].oneIn) + ' en cada sorteo: hay ' + fmt(Number(o.combinations), 0) + ' combinaciones de 6 números.'],
  ];
  const items = [['que-es', 'Qué es el Quini 6'], ['volante', 'El volante: 6 números'], ['modalidades', 'Las cuatro modalidades'], ['extra', 'El Premio Extra'], ['ejemplo', 'Un sorteo de ejemplo'], ['chance', 'La chance de cada premio'], ['controlar', 'Cómo controlar y cobrar'], ['antes', 'Antes de jugar'], ['errores', 'Errores comunes'], ['preguntas', 'Preguntas'], ['probar', 'Probá el volante']];
  const html = toc(items, '¿Ya sabés cómo funciona? <a href="#probar">Probá el volante</a>' + (h.built('/quini-6/') ? ' o <a href="' + h.href('/quini-6/') + '">mirá el último sorteo</a>' : '') + '.') +
    sec('que-es', 1, 'Lo básico', 'Qué es el Quini 6',
      '<p>El Quini 6 es la lotería de pozo de la Lotería de Santa Fe que se juega en todo el país. Elegís <b>' + o.pick + ' números del 00 al ' + two(max) + '</b> y, según las modalidades que pagues, tu boleta entra en varios sorteos de 6 números. Si acertás suficientes, cobrás una parte del pozo de ese sorteo.</p>' +
      tip('Pozo, no premio fijo', 'A diferencia de la quiniela, el premio en pesos depende de cuánto se vendió y de cuántos ganadores hay: lo informa el extracto oficial después del sorteo.') +
      cite(h, ['cas.quini6.max', 'cas.quini6.pick'])) +
    sec('volante', 2, 'La boleta', 'El volante: 6 números',
      '<p>En el volante hay ' + o.pool + ' números, del 00 al ' + two(max) + '. Marcás 6 distintos (en el dibujo, en naranja) y las modalidades que querés jugar. En la agencia te dan el ticket con tus números.</p>' + fig(vol(mine), 'Un volante de ejemplo con 6 números marcados.') +
      cite(h, ['cas.quini6.max', 'cas.quini6.pick'])) +
    sec('modalidades', 3, 'Qué juega tu boleta', 'Las cuatro modalidades',
      '<div class="jg-cu-two">' +
      '<div><h3>Tradicional: Primer Sorteo</h3><p>Salen 6 números. Premio con <b>6, 5 o 4 aciertos</b>. Con 4 cobrás, como mínimo, lo que pagaste.</p></div>' +
      '<div><h3>Tradicional: La Segunda</h3><p>Otro sorteo de 6 números <b>con la misma boleta</b>, incluido en la Tradicional. Mismos premios: 6, 5 o 4.</p></div>' +
      '<div><h3>Revancha</h3><p>Un sorteo más, que se paga aparte. Solo cobra quien acierta <b>los 6</b>.</p></div>' +
      '<div><h3>Siempre Sale</h3><p>Otro sorteo: cobra la apuesta con <b>más aciertos</b>. Si nadie hace 6, los de 5; si no, los de 4… Para jugarla tenés que jugar también Tradicional y Revancha.</p></div></div>' +
      cite(h, ['cas.quini6.tradicional-draws', 'cas.quini6.tiers', 'cas.quini6.four-min', 'cas.revancha.six-only', 'cas.siempresale.requires', 'cas.siempresale.rule'])) +
    sec('extra', 4, 'Un premio más', 'El Premio Extra',
      '<p>Se juntan los <b>18 números</b> de Tradicional, La Segunda y Revancha. Si tus 6 números están todos entre esos 18 (y no hiciste 6 en ninguno de los sorteos), cobrás una parte del Premio Extra, que sale del fondo de reserva. La chance es ' + oneIn(ex.oneIn) + '.</p>' +
      cite(h, ['cas.extra.rule', 'cas.extra.from-reserve'])) +
    sec('ejemplo', 5, 'Ejemplo resuelto', 'Un sorteo de ejemplo',
      '<p>Tu boleta: <b>' + mine.map(two).join(' - ') + '</b>, con las cuatro modalidades. Los números de cada sorteo son de ejemplo, sacados por nuestro generador (no es un sorteo real).</p>' +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Sorteo</th><th>Números</th><th class="n">Aciertos</th><th>Resultado</th></tr></thead><tbody>' +
      [['tr', 'Primer Sorteo'], ['se', 'La Segunda'], ['re', 'Revancha'], ['ss', 'Siempre Sale']].map(([k, l]) => '<tr' + (k === 'tr' ? ' class="on"' : '') + '><td>' + l + '</td><td>' + balls(sorted(D[k]), x => (mine.includes(x) ? 'ok' : '')) + '</td><td class="n">' + H[k] + '</td><td>' + res(k) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>Premio Extra: de tus 6 números, ' + inExtra + ' están entre los 18 de los tres primeros sorteos. Hacen falta los 6: no entra.</p>' +
      tip('Cómo leerlo', 'Cada sorteo se mira por separado. En verde, tus números que salieron. Una misma boleta puede ganar en un sorteo y perder en los otros.', 'why')) +
    sec('chance', 6, 'La cuenta', 'La chance de cada premio',
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Aciertos en un sorteo</th><th class="n">Chance</th></tr></thead><tbody>' + o.rows.filter(r => r.prize).map(r => '<tr><td>' + r.hits + '</td><td class="n">' + oneIn(r.oneIn) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>Con los dos sorteos de la Tradicional, la chance de algún premio es ' + oneIn(o.oneInAnyPrizeTicket) + '. Hay ' + fmt(Number(o.combinations), 0) + ' combinaciones posibles de 6 números y solo una saca los 6. En Revancha, también ' + oneIn(rv.rows[0].oneIn) + '.</p>') +
    sec('controlar', 7, 'Después del sorteo', 'Cómo controlar y cobrar',
      steps([
        ['Buscá el extracto', '<p>La Lotería de Santa Fe publica los números de cada modalidad. También los tenés en tu agencia' + (h.built('/quini-6/') ? ' y en <a href="' + h.href('/quini-6/') + '">nuestra página del Quini 6</a>' : '') + '.</p>'],
        ['Contá los aciertos de cada sorteo', '<p>Por separado: Primer Sorteo, La Segunda, Revancha y Siempre Sale.</p>' + (h.built('/quini-6/controlar/') ? '<p>Con varias boletas, usá <a href="' + h.href('/quini-6/controlar/') + '">el control de boletas</a>.</p>' : '')],
        ['Cobrá con el ticket', '<p>El monto de cada premio lo dice el extracto oficial. Consultá en tu agencia dónde y hasta cuándo se cobra.</p>'],
      ])) +
    rgSec(h, 'antes', 8, n(prizeShare('cas-quini6-tradicional').per100), 'al Quini 6 Tradicional') +
    sec('errores', 9, 'Para no equivocarte', 'Errores comunes',
      errs([
        ['Sumar los aciertos de dos sorteos distintos.', 'Cada sorteo se cuenta por separado: 3 en el Primero y 2 en La Segunda no son 5.'],
        ['Creer que en Revancha se cobra con 5.', 'Revancha solo paga los 6 aciertos.'],
        ['Jugar Siempre Sale sola.', 'Va junto con Tradicional y Revancha.'],
        ['Repetir siempre «los números que más salen».', 'Todos los números tienen la misma chance en cada sorteo.'],
      ])) +
    faqSec(h, 10, 'Preguntas sobre cómo se juega al Quini 6', FAQ);
  return { html, faq: typeof FAQ === 'undefined' ? [] : FAQ };
}

// ---------- tutorials appended to the results pages ----------
// Each returns the sections (with their own table of contents) that go after the results and the checker.
export function lotoCurso(h) {
  const o = odds('lotba-loto-plus-tradicional'), m = lotoPlusMultiplicador(), max = o.pool - 1;
  const D = { tr: drawDistinct(701, 6, 0, max), ma: drawDistinct(702, 6, 0, max), de: drawDistinct(703, 6, 0, max), so: drawDistinct(704, 6, 0, max) };
  const mine = sorted([...D.ma.slice(0, 5), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find(x => !D.ma.includes(x) && !D.tr.includes(x))]);
  const plusMine = 7, plusOut = drawDistinct(705, 1, 0, Number(m.pPlus.d) - 1)[0];
  const H = k => D[k].filter(x => mine.includes(x)).length;
  if (H('ma') !== 5) throw new Error('loto tutorial: example ticket must have 5 hits in Match');
  const res = k => (k === 'de' ? (H(k) === 6 ? 'premio' : 'sin premio (solo paga con 6)') : k === 'so' ? 'depende de los demás: cobra quien más acierta' : (o.rows.find(r => r.hits === H(k) && r.prize) ? '<b>premio de ' + H(k) + ' aciertos</b>' : 'sin premio (hacen falta 4 o más)'));
  const html = toc([['aprender', 'Cómo se juega, paso a paso'], ['loto-jugada', 'La jugada'], ['loto-modalidades', 'Las modalidades'], ['loto-ejemplo', 'Un sorteo de ejemplo'], ['loto-antes', 'Antes de jugar'], ['loto-errores', 'Errores comunes']]) +
    sec('aprender', 1, 'Para empezar', 'Cómo se juega al Loto Plus, paso a paso',
      '<p>El Loto Plus es la lotería de pozo de la Lotería de la Ciudad. Elegís <b>' + o.pick + ' números del 00 al ' + two(max) + '</b> y un <b>número Plus</b> del 0 al ' + (Number(m.pPlus.d) - 1) + '. Con esa jugada participás de varios sorteos de 6 números, uno por modalidad.</p>' +
      steps([['Marcás 6 números', '<p>Del 00 al ' + two(max) + ', distintos.</p>', balls(mine, () => 'on')], ['Elegís el número Plus', '<p>Uno solo, del 0 al ' + (Number(m.pPlus.d) - 1) + '. Sirve para el Multiplicador.</p>', ball(plusMine, 'on')], ['Pagás la jugada', '<p>La jugada cuesta ' + price(h, 'lotba.loto.price') + '.' + priceNote(h, 'lotba.loto.price') + '</p>']]) +
      cite(h, ['lotba.loto.universe', 'lotba.loto.pick', 'lotba.loto.plus-universe', 'lotba.loto.price'])) +
    sec('loto-jugada', 2, 'Los sorteos', 'La jugada',
      '<p>En cada modalidad se sacan <b>6 números sin repetición</b> del 00 al ' + two(max) + ', y contás cuántos de los tuyos salieron. Cada modalidad es un sorteo aparte: se cuentan por separado.</p>' + cite(h, ['lotba.loto.draws'])) +
    sec('loto-modalidades', 3, 'Qué gana en cada una', 'Las modalidades',
      '<div class="jg-cu-two"><div><h3>Tradicional</h3><p>Premio con 6, 5 o 4 aciertos.</p></div><div><h3>Match</h3><p>Otro sorteo, mismos premios: 6, 5 o 4.</p></div><div><h3>Desquite</h3><p>Solo cobra quien acierta los 6.</p></div><div><h3>Sale o Sale</h3><p>Cobra la jugada con más aciertos: si nadie hace 6, los de 5; si no, los de 4.</p></div></div>' +
      tip('Multiplicador', 'Si hacés 6 aciertos en Tradicional, Match o Desquite <b>y además</b> acertás el número Plus, cobrás ' + m.extraTimes + ' veces ese premio. Chance: ' + oneIn(m.oneIn) + '.') +
      cite(h, ['lotba.loto.tradicional-split', 'lotba.loto.match-split', 'lotba.loto.desquite-split', 'lotba.loto.saleosale-rule', 'lotba.loto.multiplicador-rule', 'lotba.loto.multiplicador-pay'])) +
    sec('loto-ejemplo', 4, 'Ejemplo resuelto', 'Un sorteo de ejemplo',
      '<p>Tu jugada: <b>' + mine.map(two).join(' - ') + '</b>, Plus <b>' + plusMine + '</b>. Los números son de ejemplo, de nuestro generador (no es un sorteo real).</p>' +
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Modalidad</th><th>Números</th><th class="n">Aciertos</th><th>Resultado</th></tr></thead><tbody>' +
      [['tr', 'Tradicional'], ['ma', 'Match'], ['de', 'Desquite'], ['so', 'Sale o Sale']].map(([k, l]) => '<tr' + (k === 'ma' ? ' class="on"' : '') + '><td>' + l + '</td><td>' + balls(sorted(D[k]), x => (mine.includes(x) ? 'ok' : '')) + '</td><td class="n">' + H(k) + '</td><td>' + res(k) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>Número Plus del sorteo: ' + plusOut + '. ' + (plusOut === plusMine ? 'Coincide, pero el Multiplicador solo cuenta con 6 aciertos.' : 'No coincide; igual, el Multiplicador solo se aplica a quien hizo 6 aciertos.') + '</p>') +
    rgSec(h, 'loto-antes', 5, n(prizeShare('lotba-loto-plus').per100), 'al Loto Plus') +
    sec('loto-errores', 6, 'Para no equivocarte', 'Errores comunes',
      errs([['Sumar aciertos de Tradicional y Match.', 'Cada modalidad se cuenta sola.'], ['Creer que el Plus da premio por sí solo.', 'El Plus solo multiplica un premio de 6 aciertos.'], ['Esperar premio en Desquite con 5.', 'Desquite paga solo los 6.']]));
  return { html, faq: typeof FAQ === 'undefined' ? [] : FAQ };
}

export function brincoCurso(h) {
  const b = odds('cas-brinco'), q = odds('cas-quini6-tradicional'), max = b.pool - 1;
  const D = drawDistinct(801, 6, 0, max);
  const mine = sorted([...D.slice(0, 3), ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => !D.includes(x)).slice(0, 3)]);
  const hits = D.filter(x => mine.includes(x)).length;
  if (hits !== 3) throw new Error('brinco tutorial: example ticket must have 3 hits');
  const FAQ = [
    ['¿Cómo se juega al Brinco?', 'Elegís 6 números del 00 al ' + two(max) + '. En el sorteo salen 6 números y cobrás si acertás 6, 5, 4 o 3.'],
    ['¿Con 3 aciertos se cobra?', 'Sí: con 3 aciertos te devuelven lo que pagaste por la jugada.'],
    ['¿Es más fácil que el Quini 6?', 'Sí: con ' + b.pool + ' números en lugar de ' + q.pool + ', sacar los 6 es ' + oneIn(b.rows[0].oneIn) + ' contra ' + oneIn(q.rows[0].oneIn) + ' en un sorteo del Quini 6.'],
    ['¿Quién organiza el Brinco?', 'La Lotería de Santa Fe, como modalidad del Quini 6. Se vende en las agencias de todo el país.'],
  ];
  const html = toc([['aprender', 'Cómo se juega, paso a paso'], ['brinco-premios', 'Qué paga'], ['brinco-ejemplo', 'Un sorteo de ejemplo'], ['brinco-antes', 'Antes de jugar'], ['brinco-errores', 'Errores comunes'], ['preguntas', 'Preguntas']]) +
    sec('aprender', 1, 'Para empezar', 'Cómo se juega al Brinco, paso a paso',
      steps([['Marcás 6 números', '<p>Del 00 al ' + two(max) + ': hay ' + b.pool + ' para elegir.</p>', balls(mine, () => 'on')], ['Se sacan 6 números', '<p>En el sorteo se extraen 6 números del mismo universo.</p>'], ['Contás tus aciertos', '<p>Cuántos de tus 6 salieron. Con 3 o más, hay premio.</p>']]) +
      cite(h, ['cas.brinco.universe', 'cas.brinco.draw'])) +
    sec('brinco-premios', 2, 'Del reglamento', 'Qué paga',
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Aciertos</th><th>Premio</th><th class="n">Chance</th></tr></thead><tbody>' + b.rows.filter(r => r.prize).map(r => '<tr><td>' + r.hits + '</td><td>' + (r.hits === 3 ? 'te devuelven la jugada' : 'parte del pozo') + '</td><td class="n">' + oneIn(r.oneIn) + '</td></tr>').join('') + '</tbody></table></div>' +
      cite(h, ['cas.brinco.three-price', 'cas.brinco.split'])) +
    sec('brinco-ejemplo', 3, 'Ejemplo resuelto', 'Un sorteo de ejemplo',
      '<p>Tu jugada: <b>' + mine.map(two).join(' - ') + '</b>. Números del sorteo (de ejemplo, no es un sorteo real):</p>' + fig(balls(sorted(D), x => (mine.includes(x) ? 'ok' : '')), 'En verde, tus números que salieron.') +
      '<p>Hiciste <b>' + hits + ' aciertos</b>: te devuelven lo que pagaste. Para cobrar del pozo hacen falta 4 o más.</p>') +
    rgSec(h, 'brinco-antes', 4, n(prizeShare('cas-brinco').per100), 'al Brinco') +
    sec('brinco-errores', 5, 'Para no equivocarte', 'Errores comunes',
      errs([['Marcar números del 40 al 45 como en el Quini 6.', 'El Brinco llega hasta el ' + two(max) + '.'], ['Pensar que con 3 aciertos ganaste plata.', 'Con 3 te devuelven la jugada: quedás igual.']])) +
    faqSec(h, 6, 'Preguntas sobre el Brinco', FAQ);
  return { html, faq: typeof FAQ === 'undefined' ? [] : FAQ };
}

export function telekinoCurso(h) {
  const o = odds('pba-telekino'), low = Math.min(...o.rows.filter(r => r.prize).map(r => r.hits));
  const drawn = drawDistinct(901, o.drawn, 1, o.pool);
  const out = Array.from({ length: o.pool }, (_, i) => i + 1).filter(x => !drawn.includes(x));
  const carton = sorted([...drawn.slice(0, 12), ...out.slice(0, o.pick - 12)]);
  const hits = carton.filter(x => drawn.includes(x)).length;
  if (hits !== 12) throw new Error('telekino tutorial: example card must have 12 hits');
  const grid = (marked, cls) => '<div class="jg-cu-balls" style="display:grid;grid-template-columns:repeat(5,40px);justify-content:center">' + Array.from({ length: o.pool }, (_, i) => ball(i + 1, cls(i + 1, marked))).join('') + '</div>';
  const html = toc([['aprender', 'Cómo se juega, paso a paso'], ['tk-categorias', 'Las categorías'], ['tk-ejemplo', 'Un sorteo de ejemplo'], ['tk-rekino', 'El Rekino'], ['tk-antes', 'Antes de jugar'], ['tk-errores', 'Errores comunes']]) +
    sec('aprender', 1, 'Para empezar', 'Cómo se juega al Telekino, paso a paso',
      steps([['Comprás un cartón', '<p>Trae <b>' + o.pick + ' números</b> del 1 al ' + o.pool + ', ya impresos: no los elegís.</p>'], ['Se sacan ' + o.drawn + ' bolillas', '<p>Del bolillero salen ' + o.drawn + ' de las ' + o.pool + ', sin reposición.</p>'], ['Contás tus aciertos', '<p>Cuántos números de tu cartón salieron. Con ' + low + ' o más, hay premio.</p>']]) +
      fig(grid(carton, (x, m) => (m.includes(x) ? 'on' : 'no')), 'Un cartón de ejemplo: en naranja, sus ' + o.pick + ' números.') +
      cite(h, ['pba.telekino.ticket', 'pba.telekino.drawn', 'pba.telekino.no-replacement', 'pba.telekino.universe'])) +
    sec('tk-categorias', 2, 'Del reglamento', 'Las categorías',
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Aciertos</th><th class="n">Chance</th></tr></thead><tbody>' + o.rows.filter(r => r.prize).map(r => '<tr><td>' + r.hits + '</td><td class="n">' + oneIn(r.oneIn) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>Con ' + (low - 1) + ' o menos no hay premio. Fijate que con ' + o.pick + ' de ' + o.pool + ' números, casi todos los cartones aciertan bastante: lo difícil es llegar a ' + low + '.</p>' + cite(h, ['pba.telekino.lowest', 'pba.telekino.none-below'])) +
    sec('tk-ejemplo', 3, 'Ejemplo resuelto', 'Un sorteo de ejemplo',
      '<p>Las ' + o.drawn + ' bolillas de un sorteo de ejemplo (no es real) contra el cartón de arriba:</p>' + fig(grid(carton, (x, m) => (m.includes(x) && drawn.includes(x) ? 'ok' : drawn.includes(x) ? '' : 'no')), 'En verde, los números del cartón que salieron; en blanco, bolillas que salieron y no están en el cartón.') +
      '<p>El cartón hizo <b>' + hits + ' aciertos</b>: ' + (hits >= low ? 'tiene premio de la categoría de ' + hits + '.' : 'no llega a ' + low + ': sin premio.') + ' Después se juega el Rekino con el mismo cartón.</p>') +
    sec('tk-rekino', 4, 'La segunda chance', 'El Rekino',
      '<p>Después del sorteo principal salen <b>' + o.drawn + ' bolillas nuevas</b> y gana el cartón con más aciertos. Como depende de los cartones vendidos, no tiene una chance fija.</p>' + cite(h, ['pba.telekino.rekino'])) +
    rgSec(h, 'tk-antes', 5, n(prizeShare('pba-telekino').per100), 'al Telekino') +
    sec('tk-errores', 6, 'Para no equivocarte', 'Errores comunes',
      errs([['Esperar premio con 10 aciertos.', 'El premio empieza en ' + low + '.'], ['Tirar el cartón después del sorteo principal.', 'El mismo cartón juega el Rekino.']]));
  return { html, faq: typeof FAQ === 'undefined' ? [] : FAQ };
}

export function poceadaCurso(h) {
  const o = odds('lotba-poceada');
  const drawn = drawDistinct(1001, o.drawn, 0, 99);
  const mine = sorted([...drawn.slice(0, 5), ...Array.from({ length: 100 }, (_, i) => i).filter(x => !drawn.includes(x)).slice(0, o.pick - 5)]);
  const hits = mine.filter(x => drawn.includes(x)).length;
  if (hits !== 5) throw new Error('poceada tutorial: example ticket must have 5 hits');
  const split = h.src.value('lotba.poceada.split');
  const FAQ = [
    ['¿Cómo se juega a la Poceada?', 'Elegís ' + o.pick + ' números distintos del 00 al 99. Se toman ' + o.drawn + ' números distintos del sorteo y contás cuántos de los tuyos están. Hay premio con 8, 7, 6 y 5 aciertos.'],
    ['¿Con 5 aciertos qué cobro?', 'Te devuelven lo que pagaste por la apuesta.'],
    ['¿Cuánto cuesta la Poceada?', 'La apuesta simple cuesta ' + price(h, 'lotba.poceada.price') + ' según el programa oficial.'],
    ['¿Qué chance hay de acertar los 8?', oneIn(o.rows[0].oneIn) + ': hay ' + fmt(Number(o.combinations), 0) + ' jugadas posibles de 8 números.'],
  ];
  const html = toc([['aprender', 'Cómo se juega, paso a paso'], ['pc-premios', 'Qué paga'], ['pc-ejemplo', 'Un sorteo de ejemplo'], ['pc-antes', 'Antes de jugar'], ['pc-errores', 'Errores comunes'], ['preguntas', 'Preguntas']]) +
    sec('aprender', 1, 'Para empezar', 'Cómo se juega a la Poceada, paso a paso',
      steps([['Elegís ' + o.pick + ' números', '<p>Distintos, del 00 al 99. La apuesta simple cuesta ' + price(h, 'lotba.poceada.price') + '.' + priceNote(h, 'lotba.poceada.price') + '</p>', balls(mine, () => 'on')], ['Se toman ' + o.drawn + ' números del sorteo', '<p>Veinte números distintos de dos cifras.</p>'], ['Contás tus aciertos', '<p>Con 5 o más, hay premio; con los 8, el pozo grande.</p>']]) +
      cite(h, ['lotba.poceada.pick', 'lotba.poceada.distinct', 'lotba.poceada.price'])) +
    sec('pc-premios', 2, 'Del reglamento', 'Qué paga',
      '<div class="jg-cu-tw"><table class="jg-cu-tbl"><thead><tr><th>Aciertos</th><th>Premio</th><th class="n">Chance</th></tr></thead><tbody>' + o.rows.filter(r => r.prize).map(r => { const s = split.find(x => x[0] === r.hits); return '<tr><td>' + r.hits + '</td><td>' + (r.hits === 5 ? 'te devuelven la apuesta' : fmt(s[1], 1) + ' % del pozo de premios') + '</td><td class="n">' + oneIn(r.oneIn) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      cite(h, ['lotba.poceada.split', 'lotba.poceada.five-refund'])) +
    sec('pc-ejemplo', 3, 'Ejemplo resuelto', 'Un sorteo de ejemplo',
      '<p>Tu jugada: <b>' + mine.map(two).join(' - ') + '</b>. Los ' + o.drawn + ' números de un sorteo de ejemplo (no es real):</p>' + fig(balls(sorted(drawn), x => (mine.includes(x) ? 'ok' : '')), 'En verde, tus números.') +
      '<p><b>' + hits + ' aciertos</b>: te devuelven la apuesta. Para cobrar del pozo hacen falta 6 o más.</p>') +
    rgSec(h, 'pc-antes', 4, n(prizeShare('lotba-poceada').per100), 'a la Poceada') +
    sec('pc-errores', 5, 'Para no equivocarte', 'Errores comunes',
      errs([['Repetir un número en la jugada.', 'Los 8 tienen que ser distintos.'], ['Creer que con 5 aciertos ganaste.', 'Con 5 recuperás lo que pagaste.']])) +
    faqSec(h, 6, 'Preguntas sobre la Poceada', FAQ);
  return { html, faq: typeof FAQ === 'undefined' ? [] : FAQ };
}

export function qplusCurso(h) {
  const o = quinielaPlusOdds('pba-quiniela-plus');
  const g = xoshiro128ss(1101), ex = Array.from({ length: 20 }, () => g.int(10000));
  const last = ex.map(v => v % 100), firstTwo = ex.map(v => Math.floor(v / 100)), mid = ex.map(v => Math.floor(v / 10) % 100);
  const uniq = a => [...new Set(a)];
  const mine = sorted([...uniq(last).slice(0, 5), ...Array.from({ length: 100 }, (_, i) => i).filter(x => !last.includes(x)).slice(0, 3)]);
  const hitsOf = arr => mine.filter(x => arr.includes(x)).length;
  const H = [hitsOf(last), hitsOf(firstTwo), hitsOf(mid)];
  const ac = k => k + (k === 1 ? ' acierto' : ' aciertos');
  if (H[0] !== 5) throw new Error('quiniela plus tutorial: example ticket must have 5 hits in the Plus');
  const FAQ = [
    ['¿Cómo se juega a la Quiniela Plus?', 'Elegís 8 números distintos del 00 al 99 y se comparan con los 20 números de la Quiniela Nocturna de la Provincia. Cada número tuyo que aparece es un acierto.'],
    ['¿Qué diferencia hay entre Plus, Súper Plus y Chance Plus?', 'Miran distintas cifras del mismo extracto: el Plus las dos últimas, el Súper Plus las dos primeras y el Chance Plus las dos del medio.'],
    ['¿Cuánto cuesta?', 'Con una apuesta fija de ' + money(h.src.value('pba.qplus.price')) + ' jugás las tres modalidades.'],
    ['¿Cuándo se sortea?', 'De lunes a sábados, con la Quiniela Nocturna de la Provincia de las ' + h.src.value('pba.qplus.nocturna') + ' hs.'],
  ];
  const cells = arr => '<div class="jg-cu-x">' + ex.map((v, i) => { const s = four(v); return '<span' + (mine.includes(arr[i]) ? ' class="hit"' : '') + '><small>' + (i + 1) + '</small>' + (arr === last ? s.slice(0, 2) + '<b>' + s.slice(2) + '</b>' : arr === firstTwo ? '<b>' + s.slice(0, 2) + '</b>' + s.slice(2) : s[0] + '<b>' + s.slice(1, 3) + '</b>' + s[3]) + '</span>'; }).join('') + '</div>';
  const html = toc([['aprender', 'Cómo se juega, paso a paso'], ['qp-cifras', 'Tres juegos con el mismo extracto'], ['qp-ejemplo', 'Un extracto de ejemplo'], ['qp-antes', 'Antes de jugar'], ['qp-errores', 'Errores comunes'], ['preguntas', 'Preguntas']]) +
    sec('aprender', 1, 'Para empezar', 'Cómo se juega a la Quiniela Plus, paso a paso',
      steps([['Elegís 8 números', '<p>Distintos, del 00 al 99. Con una apuesta fija de ' + money(h.src.value('pba.qplus.price')) + ' jugás las tres modalidades.</p>', balls(mine, () => 'on')], ['Esperás la Nocturna de la Provincia', '<p>No hay bolillero propio: se usa el extracto de la Quiniela Nocturna, a las ' + h.src.value('pba.qplus.nocturna') + ' hs, de lunes a sábados.</p>'], ['Contás tus aciertos', '<p>Cada número tuyo que aparece en el extracto es un punto. Hay premio desde ' + Math.min(...o.rows.filter(r => r.prize).map(r => r.hits)) + '.</p>']]) +
      cite(h, ['pba.qplus.pick', 'pba.qplus.distinct-pick', 'pba.qplus.price', 'pba.qplus.nocturna', 'pba.qplus.points'])) +
    sec('qp-cifras', 2, 'Las modalidades', 'Tres juegos con el mismo extracto',
      '<div class="jg-cu-two"><div><h3>Plus</h3><p>Mira las <b>dos últimas cifras</b> de cada número: del 4721, el 21.</p></div><div><h3>Súper Plus</h3><p>Las <b>dos primeras</b>: del 4721, el 47. Gana quien más acierta.</p></div><div><h3>Chance Plus</h3><p>Las <b>dos del medio</b>: del 4721, el 72.</p></div></div>' + cite(h, ['pba.qplus.points', 'pba.qplus.superplus-rule'])) +
    sec('qp-ejemplo', 3, 'Ejemplo resuelto', 'Un extracto de ejemplo',
      '<p>Tu jugada: <b>' + mine.map(two).join(' - ') + '</b>. Un extracto de ejemplo (no es un sorteo real), leído de las tres formas:</p>' +
      '<h3>Plus: ' + ac(H[0]) + '</h3>' + fig(cells(last)) + '<h3>Súper Plus: ' + ac(H[1]) + '</h3>' + fig(cells(firstTwo)) + '<h3>Chance Plus: ' + ac(H[2]) + '</h3>' + fig(cells(mid)) +
      '<p>En el Plus hiciste ' + H[0] + ': ' + (o.rows.find(r => r.hits === H[0] && r.prize) ? 'hay premio de ' + H[0] + ' aciertos.' : 'sin premio.') + ' Si un número aparece dos veces en el extracto, cuenta una sola vez.</p>') +
    rgSec(h, 'qp-antes', 4, n(prizeShare('pba-quiniela-plus').per100), 'a la Quiniela Plus') +
    sec('qp-errores', 5, 'Para no equivocarte', 'Errores comunes',
      errs([['Controlar con la Nocturna de la Ciudad.', 'Se usa la Nocturna de la Provincia.'], ['Mirar solo la cabeza.', 'Cuentan los 20 lugares del extracto.']])) +
    faqSec(h, 6, 'Preguntas sobre la Quiniela Plus', FAQ);
  return { html, faq: typeof FAQ === 'undefined' ? [] : FAQ };
}
