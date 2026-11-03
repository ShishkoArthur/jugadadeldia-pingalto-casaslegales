// Quiniela tools: ¿cuánto paga? (direct bets) and redoblona. Payouts only from the cited regulations of the Ciudad (LOTBA) and
// the Provincia de Buenos Aires (IPLyC); the engine (engine/lottery/quiniela.mjs) computes every amount and chance, here at
// build time for the first view and in the browser (client/cuanto.js, client/redoblona.js) for every change.
import { directBet, payTable, redoblona } from '../../../engine/lottery/quiniela.mjs';
import { rules } from '../../../engine/lottery/rules.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';
import { hero, cite, crumbs, webPage, fmt, oneIn, money, btn } from './parts.mjs';
import { price, priceNote } from './precios.mjs';

const J = { lotba: { id: 'lotba-quiniela', name: 'Ciudad', long: 'La Quiniela de la Ciudad', help: 'caba' }, pba: { id: 'pba-quiniela', name: 'Provincia', long: 'Quiniela de la Provincia de Buenos Aires', help: 'buenos-aires' } };
const PLACES = [[1, 'A la cabeza'], [5, 'A los 5'], [10, 'A los 10'], [20, 'A los 20']];
const radios = (name, list, val) => list.map(([v, label, extra = '']) => '<label' + extra + '><input type="radio" name="' + name + '" value="' + v + '"' + (String(v) === String(val) ? ' checked' : '') + '>' + label + '</label>').join('');
const n = q => toNumber(q);

export const cuantoPaga = {
  path: '/quiniela/cuanto-paga/', kind: 'lottery', section: 'quiniela', css: [], js: ['cuanto.js'],
  title: '¿Cuánto paga la quiniela? Calculadora de premios en pesos',
  h1: '¿Cuánto paga la quiniela?',
  description: 'Calculá cuánto paga la quiniela según tu provincia, las cifras y la ubicación: a la cabeza, a los 5, 10 o 20. El premio en pesos y la chance real.',
  ld: h => [webPage(h), crumbs(h, [])],
  data: () => ({ j: Object.fromEntries(Object.entries(J).map(([k, v]) => [k, { id: v.id, help: v.help, digits: Object.keys(rules('quiniela', v.id).pay).map(Number), min: rules('quiniela', v.id).minBet ? rules('quiniela', v.id).minBet.v : null }])) }),
  render(h) {
    const r = directBet({ rules: J.lotba.id, digits: 2, places: 1, stake: 100 });
    const table = id => '<div class="jg-tw"><table class="jg-tbl jg-pt" data-nosnippet><thead><tr><th>Cifras</th><th>Ubicación</th><th class="n">Cobrás con $ 100</th><th class="n">Chance</th><th class="n">Vuelve de cada $ 100</th></tr></thead><tbody>' +
      payTable({ rules: J[id].id, stake: 100 }).map(t => '<tr data-d="' + t.digits + '" data-u="' + t.places + '"><td>' + t.digits + '</td><td>' + PLACES.find(p => p[0] === t.places)[1] + '</td><td class="n">' + money(n(t.perHit)) + '</td><td class="n">' + oneIn(t.oneIn) + '</td><td class="n">' + money(n(t.evPer100)) + (t.unclear ? '*' : '') + '</td></tr>').join('') + '</tbody></table></div>';
    const L = rules('quiniela', J.lotba.id), P = rules('quiniela', J.pba.id);
    return hero(h, { kicker: 'Quiniela · calculadora', scene: 'quiniela-cuanto-paga', lede: 'Elegí la lotería, las cifras y la ubicación. El premio sale del reglamento oficial y la chance la calcula el código, sobre las 20 ubicaciones del extracto.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2 jg-calc" id="calculadora"><span class="jg-tag">Calculadora</span><h2>Tu jugada</h2><form class="jg-f" data-cuanto>' +
      '<fieldset class="jg-fl"><legend>Lotería</legend><div class="jg-sg">' + radios('j', [['lotba', 'Ciudad (Nacional)'], ['pba', 'Provincia']], 'lotba') + '</div></fieldset>' +
      '<fieldset class="jg-fl"><legend>Cifras</legend><div class="jg-sg">' + radios('d', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5', ' data-solo="pba"']], 2) + '</div></fieldset>' +
      '<fieldset class="jg-fl"><legend>Ubicación</legend><div class="jg-sg">' + radios('u', PLACES, 1) + '</div></fieldset>' +
      '<label class="jg-fl"><span>Apostás (pesos)</span><input class="jg-in" name="a" type="text" inputmode="decimal" autocomplete="off" value="100" aria-describedby="jg-min"></label><p class="jg-note" id="jg-min">En la Ciudad la apuesta mínima es de ' + price(h, 'lotba.quiniela.min-bet') + ' por extracto.' + priceNote(h, 'lotba.quiniela.min-bet') + '</p></form></section>' +
      '<section class="jg-c t2 jg-out" aria-live="polite"><span class="jg-sm">Si sale</span><p class="jg-win"><span>Cobrás</span><b data-o="pay">' + money(n(r.perHit)) + '</b></p><p class="jg-ch"><span data-o="times">' + r.ratio + ' veces lo apostado</span><span data-o="per">a la cabeza</span></p>' +
      '<p class="jg-hon">Chance: <b data-o="odds">' + oneIn(r.oneIn) + '</b> · de cada $ 100 apostados vuelven en promedio <b data-o="ev">' + money(n(r.evPer100)) + '</b></p>' +
      '<div class="jg-ret" aria-hidden="true"><div><span>Apostás</span><i style="--w:100%"></i><b>$ 100</b></div><div><span>Vuelve</span><i data-o="bar" style="--w:' + fmt(n(r.evPer100), 2).replace(',', '.') + '%"></i><b data-o="ev2">' + money(n(r.evPer100)) + '</b></div></div>' +
      '<p class="jg-note" data-o="warn" hidden></p><div class="jg-r"><button class="jg-b s" type="button" data-share>Compartir esta jugada</button></div>' +
      '<details class="jg-src"><summary>La cuenta</summary><p>Premio = apuesta ÷ lugares × veces que paga. A los 5, tu apuesta se reparte entre 5 ubicaciones: si tu número sale en una, cobrás esa parte por las veces del reglamento. El premio incluye lo apostado.</p></details></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Todas las jugadas</span><h2>Lo que paga cada combinación</h2><div class="jg-sg" role="group" aria-label="Lotería de la tabla"><button type="button" aria-pressed="true" data-tab="lotba">Ciudad</button><button type="button" aria-pressed="false" data-tab="pba">Provincia</button></div>' +
      '<div data-tabla="lotba">' + table('lotba') + '</div><div data-tabla="pba" hidden>' + table('pba') + '<p class="jg-note">* En la Provincia, el reglamento pone un tope de ' + fmt(P.directCap.v, 0) + ' veces la parte apostada por lugar cuando el número se repite, pero no dice cómo se aplica a 3 a 5 cifras, que con un solo acierto ya pagan más: el promedio puede ser apenas menor.</p></div>' +
      '<p class="jg-hon">Fijate la última columna: con 1 o 2 cifras vuelven <b>' + money(n(directBet({ rules: J.lotba.id, digits: 2, places: 1, stake: 100 }).evPer100)) + '</b> de cada $ 100, con 4 cifras solo <b>' + money(n(directBet({ rules: J.lotba.id, digits: 4, places: 1, stake: 100 }).evPer100)) + '</b>. La ubicación cambia el premio, no el promedio.</p></section>' +
      '<section class="jg-c"><span class="jg-sm">Del reglamento</span><h2>Las veces que paga</h2><p>Ciudad: ' + Object.entries(L.pay).map(([d, x]) => d + ' cifra' + (d === '1' ? '' : 's') + ' ' + fmt(x.v, 0)).join(' · ') + ' veces. Provincia: lo mismo y 5 cifras ' + fmt(P.pay[5].v, 0) + ' veces.</p>' +
      cite(h, ['lotba.quiniela.pay-2', 'lotba.quiniela.pay-4', 'lotba.quiniela.includes-stake', 'lotba.quiniela.range-divide', 'lotba.quiniela.min-bet', 'pba.quiniela.pay-5', 'pba.quiniela.range-divide', 'pba.quiniela.cap']) + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Preguntas</span><h2>Lo que más se pregunta</h2><div class="jg-q">' +
      '<details><summary>¿Qué es jugar a la cabeza?</summary><div>Que tu número tiene que salir primero en el extracto. A los 5, 10 o 20 vale cualquiera de esos primeros lugares, pero el premio se divide por la cantidad de lugares.</div></details>' +
      '<details><summary>¿Cuánto paga a la cabeza con $ 100?</summary><div>A 2 cifras, ' + money(n(r.perHit)) + ' en la Ciudad y en la Provincia. A 4 cifras, ' + money(n(directBet({ rules: J.lotba.id, digits: 4, places: 1, stake: 100 }).perHit)) + '.</div></details>' +
      '<details><summary>¿Hay números que salen más?</summary><div>No. Cada terminación de dos cifras tiene la misma chance en cada lugar: 1 en 100. Lo que salió ayer no cambia lo que sale hoy.</div></details>' +
      '<details><summary>¿Y si mi número sale dos veces?</summary><div>En la Ciudad cobrás cada vez que se repite dentro de tus ubicaciones. En la Provincia las repeticiones también suman, con el tope del reglamento.</div></details>' +
      '</div>' + (h.built('/quiniela/redoblona/') ? '<p>' + btn(h, '/quiniela/redoblona/', 'Calcular una redoblona') + '</p>' : '') + '</section></div>';
  },
};

export const redoblonaPage = {
  path: '/quiniela/redoblona/', kind: 'lottery', section: 'quiniela', js: ['redoblona.js'],
  title: 'Redoblona: qué es, cuánto paga y qué chance tiene',
  h1: 'Redoblona: cuánto paga y qué chance tiene',
  description: 'Qué es la redoblona en la quiniela, cuánto paga en pesos según el reglamento de tu provincia y qué chance real tiene, calculada número por número.',
  ld: h => [webPage(h), crumbs(h, [['/quiniela/cuanto-paga/', '¿Cuánto paga la quiniela?']])],
  data: () => ({ j: { lotba: { id: J.lotba.id, help: 'caba' }, pba: { id: J.pba.id, help: 'buenos-aires' } } }),
  render(h) {
    const r = redoblona({ rules: J.lotba.id, first: { number: 12, places: 1 }, second: { number: 34, places: 5 }, stake: 100 });
    const top = r.outcomes[r.outcomes.length - 1];
    const L = rules('quiniela', J.lotba.id).redoblona, P = rules('quiniela', J.pba.id).redoblona;
    const sel = (name, val) => '<select class="jg-se" name="' + name + '">' + PLACES.map(([v, l]) => '<option value="' + v + '"' + (v === val ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
    const dist = '<table class="jg-tbl" data-nosnippet><thead><tr><th class="n">Cobrás</th><th class="n">Chance</th></tr></thead><tbody data-o="dist">' + r.outcomes.slice().reverse().map(o => '<tr><td class="n">' + money(n(o.amount)) + '</td><td class="n">' + (o.amount.n > 0n ? oneIn(1 / n(o.p)) : fmt(n(o.p) * 100, 3) + ' %') + '</td></tr>').join('') + '</tbody></table>';
    return hero(h, { kicker: 'Quiniela · redoblona', scene: 'quiniela-redoblona', lede: 'Dos números de dos cifras en el mismo extracto: si salen los dos, lo que ganás con el primero se vuelve a jugar al segundo. Paga mucho y sale muy poco.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2"><span class="jg-tag">Calculadora</span><h2>Armá la redoblona</h2><form class="jg-f" data-redo>' +
      '<fieldset class="jg-fl"><legend>Lotería</legend><div class="jg-sg">' + radios('j', [['lotba', 'Ciudad (Nacional)'], ['pba', 'Provincia']], 'lotba') + '</div></fieldset>' +
      '<div class="jg-two"><label class="jg-fl"><span>Primer número</span><input class="jg-in" name="a" type="text" inputmode="numeric" maxlength="2" value="12" autocomplete="off"></label><label class="jg-fl"><span>Ubicación</span>' + sel('ua', 1) + '</label></div>' +
      '<div class="jg-two"><label class="jg-fl"><span>Segundo número</span><input class="jg-in" name="b" type="text" inputmode="numeric" maxlength="2" value="34" autocomplete="off"></label><label class="jg-fl"><span>Ubicación</span>' + sel('ub', 5) + '</label></div>' +
      '<label class="jg-fl"><span>Apostás (pesos)</span><input class="jg-in" name="s" type="text" inputmode="decimal" value="100" autocomplete="off"></label></form></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Si salen los dos</span><p class="jg-win"><span>Cobrás</span><b data-o="top">' + money(n(top.amount)) + '</b></p>' +
      '<p class="jg-hon">Chance de cobrar algo: <b data-o="odds">' + oneIn(r.oneIn) + '</b> · de cada $ 100 vuelven en promedio <b data-o="ev">' + money(n(r.evPer100)) + '</b></p><p class="jg-note" data-o="err" hidden></p>' +
      '<h3>Todo lo que puede pasar</h3>' + dist + '<div class="jg-r"><button class="jg-b s" type="button" data-share>Compartir</button></div></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Comparación</span><h2>Redoblona o dos jugadas</h2><p>Con la misma plata a 2 cifras a la cabeza, de cada $ 100 vuelven ' + money(n(directBet({ rules: J.lotba.id, digits: 2, places: 1, stake: 100 }).evPer100)) + ' en promedio. La redoblona de arriba devuelve <b data-o="ev3">' + money(n(r.evPer100)) + '</b>: el tope del reglamento le recorta los premios más grandes.</p>' +
      '<p class="jg-hon">Ciudad: el primer acierto paga ' + L.pay.v + ' veces y ese premio se juega ' + L.pay.v + ' veces al segundo, con tope de ' + fmt(L.cap.v, 0) + ' veces la apuesta (' + fmt(L.cap12.v, 0) + ' de 1 a 2 ubicaciones, ' + fmt(L.cap13.v, 0) + ' de 1 a 3). Provincia: ' + P.pay.v + ' y ' + P.pay.v + ' veces, tope ' + fmt(P.cap.v, 0) + ' veces lo apostado por lugar.</p></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Del reglamento</span><h2>Las reglas de la redoblona</h2><ul><li>Son dos números de dos cifras en el mismo extracto.</li><li>Si el primero va a la cabeza y el segundo «a los 5», el segundo se cuenta desde el lugar 2.</li><li>En la Provincia, si el primero llega a un lugar más lejos que el segundo, se paga como apuesta directa.</li></ul>' +
      cite(h, ['lotba.redoblona.two-digits', 'lotba.redoblona.pay', 'lotba.redoblona.cap', 'lotba.redoblona.cap-1-2', 'lotba.redoblona.cap-1-3', 'lotba.redoblona.first-at-one', 'lotba.redoblona.one-extract', 'pba.redoblona.pay', 'pba.quiniela.cap', 'pba.redoblona.first-beyond-second']) + '</section></div>';
  },
};
