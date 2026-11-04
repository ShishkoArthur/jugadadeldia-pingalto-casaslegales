// Quiniela and lottery guides and tools of wave 2: how to play (interactive ticket), a year of play (simulator), draw times
// (official program of the Ciudad + the feed archive), what each game gives back from $ 100, Quini 6 how to play and checker,
// Telekino checker. Every payout and chance comes from engine/lottery at build time and in the browser; times and dates from the
// saved LOTBA program (parsed at build time) and from the server feed (/data/feeds/). No result is typed by hand.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from '../../../tools/env.mjs';
import { directBet, payTable, redoblona } from '../../../engine/lottery/quiniela.mjs';
import { rules } from '../../../engine/lottery/rules.mjs';
import { odds, prizeShare, tombolina, quinielaPlusOdds, quini6PremioExtra } from '../../../engine/lottery/games.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';
import { yearExact } from '../../../engine/lottery/simulate.mjs';
import { xoshiro128ss } from '../../../engine/lottery/rng.mjs';
import { STALE_HOURS } from '../../../engine/lottery/extract.mjs';
import { parseProgramText, validateMonth, PROG_CODES, PROG_TYPES } from '../../../engine/lottery/programa.mjs';
import { hero, cite, crumbs, webPage, fmt, oneIn, money, btn, tiles, ICONS } from './parts.mjs';
import { price, priceNote } from './precios.mjs';
import { anyLoto } from './sorteos.mjs';
import { TURN_PATHS } from './extractos.mjs';

const n = q => toNumber(q);
const two = x => String(x).padStart(2, '0');
const PLACES = [[1, 'A la cabeza'], [5, 'A los 5'], [10, 'A los 10'], [20, 'A los 20']];
const radios = (name, list, val) => list.map(([v, label]) => '<label><input type="radio" name="' + name + '" value="' + v + '"' + (String(v) === String(val) ? ' checked' : '') + '>' + label + '</label>').join('');
const sel = (name, opts) => '<select class="jg-se" name="' + name + '">' + opts.map(([v, l, s]) => '<option value="' + v + '"' + (s ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
const ldQ = h => [webPage(h), crumbs(h, h.built('/quiniela/') ? [['/quiniela/', 'Quiniela']] : [])];

// The LOTBA program of the month (saved PDF): every scheduled draw with date, time, type and the participating jurisdictions.
// Parsed and checked by engine/lottery/programa.mjs; the server feed programa.json (same parser) carries the newer programmes and the
// page script prefers it when it reaches further.
let PROGRAM = null;
export function program() {
  if (PROGRAM) return PROGRAM;
  const doc = JSON.parse(readFileSync(join(ROOT, 'data/sources/lottery/lotba.json'), 'utf8')).docs['quiniela-programa'];
  const f = /ano=(\d{4})&mes=(\d{2})/.exec(doc.form || '');
  if (!f) throw new Error('program: no month in the form of the saved LOTBA program');
  const text = execFileSync('pdftotext', ['-layout', join(ROOT, doc.file), '-'], { encoding: 'utf8' });
  const rows = parseProgramText(text, f[1] + '-' + f[2]);
  const { from, to } = validateMonth(rows, f[1] + '-' + f[2]);
  PROGRAM = { fetched: doc.fetched, rows, from, to };
  return PROGRAM;
}

// The example extract of the ticket tool: 20 numbers of four digits from a fixed seed (not a real draw; the page says so).
const DEMO = () => { const g = xoshiro128ss(20261103); return Array.from({ length: 20 }, () => String(g.int(10000)).padStart(4, '0')); };

export const comoSeJuega = {
  path: '/quiniela/como-se-juega/', kind: 'lottery', section: 'quiniela', css: ['guias.css'], js: ['boleta.js'],
  title: 'Cómo se juega a la quiniela: la boleta paso a paso',
  h1: 'Cómo se juega a la quiniela',
  description: 'Cómo se juega a la quiniela, campo por campo: número, cifras, ubicación y monto en pesos, como en la boleta de la agencia, y qué cuenta como premio.',
  ld: ldQ,
  data: () => ({ demo: DEMO(), j: { lotba: { id: 'lotba-quiniela', help: 'caba', digits: Object.keys(rules('quiniela', 'lotba-quiniela').pay).map(Number) }, pba: { id: 'pba-quiniela', help: 'buenos-aires', digits: Object.keys(rules('quiniela', 'pba-quiniela').pay).map(Number) } } }),
  render(h) {
    const r = directBet({ rules: 'lotba-quiniela', digits: 2, places: 5, stake: 500 });
    const demo = DEMO(), mine = demo[2].slice(2);
    const x20 = demo.map((v, i) => '<span class="' + (i < 5 ? 'in' : '') + (i < 5 && v.endsWith(mine) ? ' hit' : '') + '" data-i="' + (i + 1) + '"><small>' + (i + 1) + '</small>' + v.slice(0, 2) + '<b>' + v.slice(2) + '</b></span>').join('');
    const ten = h.src.value('lotba.quiniela.ten-per-ticket'), cancel = h.src.value('lotba.quiniela.cancel-15');
    return hero(h, { kicker: 'Quiniela · la boleta', lede: 'Un número, cuántas cifras, en qué lugar del extracto y cuánta plata. Armá tu jugada acá y mirá qué dice cada campo de la boleta y cuándo cobrás.', actions: '<a class="jg-b p" href="#boleta">Armar una boleta</a>' + btn(h, '/quiniela/cuanto-paga/', '¿Cuánto paga?') }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" id="boleta"><span class="jg-tag">Simulá</span><h2>Tu jugada</h2><form class="jg-f" data-boleta>' +
      '<fieldset class="jg-fl"><legend>Lotería</legend><div class="jg-sg">' + radios('j', [['lotba', 'Ciudad (Nacional)'], ['pba', 'Provincia']], 'lotba') + '</div></fieldset>' +
      '<div class="jg-two"><label class="jg-fl"><span>Número</span><input class="jg-in" name="num" type="text" inputmode="numeric" maxlength="4" value="' + mine + '" autocomplete="off"></label><label class="jg-fl"><span>Apostás (pesos)</span><input class="jg-in" name="a" type="text" inputmode="decimal" value="500" autocomplete="off"></label></div>' +
      '<fieldset class="jg-fl"><legend>Ubicación</legend><div class="jg-sg">' + radios('u', PLACES, 5) + '</div></fieldset></form>' +
      '<h3>El extracto: 20 números de cuatro cifras</h3><div class="jg-x20" data-o="x20" aria-label="Extracto de ejemplo">' + x20 + '</div>' +
      '<p class="jg-note">Extracto de ejemplo, no es un sorteo real. Con borde azul, los lugares que cubre tu ubicación; en verde, donde tu número saldría premiado.</p></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Así queda la boleta</span><div class="jg-bol" data-o="bol"><dl>' +
      '<dt>Número</dt><dd data-o="b-num">' + mine + '<small>2 cifras: cuenta la terminación</small></dd><dt>Ubicación</dt><dd data-o="b-ub">A los 5<small>tiene que salir entre el lugar 1 y el 5</small></dd>' +
      '<dt>Lotería</dt><dd data-o="b-j">Ciudad</dd><dt>Importe</dt><dd data-o="b-a">' + money(500) + '<small>' + money(n(r.stake) / 5) + ' por cada lugar</small></dd></dl></div>' +
      '<p class="jg-win"><span>Si sale, cobrás</span><b data-o="pay">' + money(n(r.perHit)) + '</b></p><p class="jg-hon" data-o="why">Chance: <b>' + oneIn(r.oneIn) + '</b>. ' + r.ratio + ' veces lo apostado, dividido por los 5 lugares que cubrís.</p><p class="jg-note" data-o="err" hidden></p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Campo por campo</span><h2>Qué significa cada cosa</h2><ol class="jg-steps">' +
      '<li><b>El número</b>De 1 a ' + h.src.value('lotba.quiniela.digits-max') + ' cifras. Si jugás a 2 cifras, cuentan las dos últimas del número que sale; a 3, las tres últimas.</li>' +
      '<li><b>La ubicación</b>A la cabeza es el primer lugar del extracto. A los 5, 10 o 20 vale cualquiera de esos lugares, pero tu apuesta se reparte entre ellos.</li>' +
      '<li><b>La lotería</b>Cada extracto (Ciudad, Provincia, Córdoba…) es un sorteo aparte. En la Ciudad la apuesta mínima es ' + price(h, 'lotba.quiniela.min-bet') + ' por extracto.' + priceNote(h, 'lotba.quiniela.min-bet') + '</li>' +
      '<li><b>El importe</b>El premio incluye lo que apostaste. En un mismo ticket entran hasta ' + ten + ' jugadas.</li></ol>' +
      cite(h, ['lotba.quiniela.digits-max', 'lotba.quiniela.range-any', 'lotba.quiniela.drawn', 'lotba.quiniela.range-divide', 'lotba.quiniela.includes-stake', 'lotba.quiniela.min-bet', 'lotba.quiniela.ten-per-ticket']) + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Después del sorteo</span><h2>Cobrar o anular</h2><ol class="jg-steps"><li><b>Anular</b>Hasta ' + cancel + ' minutos después de hacer la jugada, y antes del cierre.</li><li><b>Cobrar</b>En la agencia donde jugaste, hasta la fecha que figura en el extracto oficial.</li><li><b>Premios grandes</b>Más de ' + price(h, 'lotba.quiniela.big-prize') + ' se cobran en la sede de Lotería de la Ciudad, con turno.' + priceNote(h, 'lotba.quiniela.big-prize') + '</li></ol>' +
      cite(h, ['lotba.quiniela.cancel-15', 'lotba.quiniela.collect-where', 'lotba.quiniela.big-prize']) + '</section>' +
      '<section class="jg-c w3" data-quiz-q><span class="jg-tag">5 preguntas</span><h2>¿Lo entendiste?</h2><div class="jg-qz" data-o="quiz"><p class="jg-note">Las preguntas aparecen con JavaScript.</p></div><p class="jg-hon" data-o="qres" hidden></p></section></div>';
  },
};

// The middle of the year's results in words. When more than half of the years never hit, the median is the whole stake lost:
// say that (with its share) instead of "X or worse", which cannot be worse.
export function medianText(y, money) {
  const zero = y.rows.length && y.rows[0].net === -y.spent ? y.rows[0].p : 0;
  if (y.median <= -y.spent) return 'En el <b>' + fmt(zero * 100, 1) + ' %</b> de los años no acertás ni una vez y perdés todo lo puesto.';
  return 'La mitad de los años termina en <b>' + (y.median < 0 ? '−' : '') + money(Math.abs(y.median)) + '</b> o peor.';
}
export const simulador = {
  path: '/quiniela/simulador/', kind: 'lottery', section: 'quiniela', css: ['guias.css'], js: ['simulador.js'],
  title: 'Simulador: un año jugando a la quiniela, en pesos',
  h1: 'Un año jugando a la quiniela',
  description: 'Simulá un año jugando a la quiniela con tu apuesta en pesos, cifras y ubicación: la curva del saldo y cómo terminan miles de años simulados. Sin promesas.',
  ld: ldQ,
  data: () => ({ j: { lotba: { id: 'lotba-quiniela', help: 'caba', digits: Object.keys(rules('quiniela', 'lotba-quiniela').pay).map(Number) }, pba: { id: 'pba-quiniela', help: 'buenos-aires', digits: Object.keys(rules('quiniela', 'pba-quiniela').pay).map(Number) } } }),
  render(h) {
    const b = directBet({ rules: 'lotba-quiniela', digits: 2, places: 1, stake: 500 });
    const y = yearExact({ outcomes: b.outcomes.map(o => ({ amount: o.payout, p: o.p })), stake: b.stake, plays: 52, floor: 1e-15 });
    const prog = program();
    const perWeek = new Set(prog.rows.filter(r => r.type === 'Nocturna').map(r => new Date(r.d + 'T12:00:00Z').getUTCDay())).size;
    return hero(h, { kicker: 'Quiniela · simulador', lede: 'Elegí tu jugada de siempre y cuántas veces la hacés. El código calcula el resultado exacto del año y además simula miles de años para que veas cómo terminan.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2"><span class="jg-tag">Tu año</span><h2>La jugada que repetís</h2><form class="jg-f" data-sim>' +
      '<fieldset class="jg-fl"><legend>Lotería</legend><div class="jg-sg">' + radios('j', [['lotba', 'Ciudad (Nacional)'], ['pba', 'Provincia']], 'lotba') + '</div></fieldset>' +
      '<div class="jg-two"><label class="jg-fl"><span>Cifras</span>' + sel('d', [[1, '1'], [2, '2', true], [3, '3'], [4, '4']]) + '</label><label class="jg-fl"><span>Ubicación</span>' + sel('u', PLACES.map(([v, l]) => [v, l, v === 1])) + '</label></div>' +
      '<div class="jg-two"><label class="jg-fl"><span>Apostás (pesos)</span><input class="jg-in" name="a" type="text" inputmode="decimal" value="500" autocomplete="off"></label><label class="jg-fl"><span>Cada cuánto</span>' + sel('f', [[52, 'Una vez por semana', true], [52 * perWeek, perWeek + ' veces por semana (un sorteo por día)'], [52 * perWeek * 5, 'Los 5 turnos de cada día']]) + '</label></div>' +
      '<div class="jg-r"><button class="jg-b p" type="button" data-run>Simular de nuevo</button><button class="jg-b s" type="button" data-share>Compartir</button></div></form>' +
      '<h3>El saldo, semana a semana</h3><div data-o="curve"><p class="jg-note">La curva se dibuja con JavaScript.</p></div><p class="jg-note">En naranja, un año simulado; en gris, otros 20. La línea punteada es salir hecho.</p></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">La cuenta exacta</span><p class="jg-win"><span>Ponés en el año</span><b data-o="spent">' + money(y.spent) + '</b></p>' +
      '<p class="jg-hon">En promedio volvés con <b data-o="mean">' + money(y.spent + n(y.meanNet)) + '</b>: perdés <b data-o="loss">' + money(-n(y.meanNet)) + '</b>.</p>' +
      '<p class="jg-hon">Años que terminan en ganancia: <b data-o="ahead">' + fmt(y.pAhead * 100, 1) + ' %</b>. <span data-o="median">' + medianText(y, money) + '</span></p>' +
      '<p class="jg-note" data-o="mc">Con JavaScript, además, simulamos 10.000 años para comparar.</p><p class="jg-note" data-o="err" hidden></p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">10.000 años simulados</span><h2>Cómo terminan</h2><div data-o="hist"><p class="jg-note">El histograma aparece con JavaScript.</p></div><p class="jg-note">Cada barra es un grupo de años con un resultado parecido. En verde, los que terminaron en ganancia.</p></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Cómo calculamos</span><h2>Exacto y simulado</h2><ul class="jg-ul tx"><li>El premio por jugada sale del reglamento (las veces que paga, dividido por los lugares que cubrís).</li><li>La cuenta exacta suma todas las combinaciones posibles de aciertos del año. La simulación tira el año 10.000 veces con un generador con semilla, y las dos tienen que coincidir.</li><li>Cada sorteo es independiente: no hay rachas ni números que «se deben».</li></ul>' +
      cite(h, ['lotba.quiniela.pay-2', 'lotba.quiniela.range-divide', 'lotba.quiniela.includes-stake', 'pba.quiniela.pay-5', 'lotba.quiniela.saturday-nocturna']) + '</section></div>';
  },
};

export const horarios = {
  path: '/quiniela/horarios/', kind: 'lottery', section: 'quiniela', css: ['guias.css'], js: ['horarios.js'],
  title: 'Horarios de la quiniela: ¿hay sorteo hoy?',
  h1: '¿Hay quiniela hoy? Horarios de todos los sorteos',
  description: '¿Hay quiniela hoy? La respuesta para hoy y mañana según el programa oficial y el registro de sorteos, y los horarios de la Previa a la Nocturna.',
  ld: ldQ,
  data: () => { const p = program(); return { feed: '/data/feeds/', stale: STALE_HOURS, prog: { from: p.from, to: p.to, rows: p.rows.map(r => [r.d, r.t, r.type, r.j]) }, codes: PROG_CODES }; },
  render(h) {
    const p = program();
    const types = PROG_TYPES.map(t => t.name);
    const times = Object.fromEntries(types.map(t => [t, [...new Set(p.rows.filter(r => r.type === t).map(r => r.t))]]));
    const codes = Object.keys(PROG_CODES).map(Number);
    const part = (t, c) => { const rs = p.rows.filter(r => r.type === t); const k = rs.filter(r => r.j.includes(c)).length; return k === rs.length ? '<span class="jg-ok">todos</span>' : k ? k + ' de ' + rs.length : '—'; };
    const dm = d => +d.slice(8) + '/' + +d.slice(5, 7);
    return hero(h, { kicker: 'Quiniela · hora argentina', scene: 'quiniela-horarios', lede: 'Cinco sorteos por día, de lunes a sábado, de la Previa a la Nocturna. Abajo, la respuesta para hoy y mañana y la cuenta regresiva al próximo.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" aria-live="polite"><span class="jg-tag">Hoy</span><h2>¿Hay sorteo?</h2><div data-o="now"><p class="jg-note">La respuesta se calcula con JavaScript, en hora argentina.</p></div><div data-o="next"></div></section>' +
      '<section class="jg-c"><span class="jg-sm">Los turnos</span><h2>Horarios</h2><table class="jg-tbl" data-nosnippet><tbody>' + types.map(t => { const u = TURN_PATHS[PROG_TYPES.find(x => x.name === t).turno]; return '<tr><td>' + (u && h.built(u) ? '<a href="' + h.href(u) + '">' + t + '</a>' : t) + '</td><td class="n">' + times[t].join(' / ') + ' hs</td></tr>'; }).join('') + '</tbody></table><p class="jg-note">Tocá un turno para ver su último extracto en cada provincia.</p>' +
      cite(h, ['lotba.quiniela.time-previa', 'lotba.quiniela.time-primera', 'lotba.quiniela.time-matutina', 'lotba.quiniela.time-vespertina', 'lotba.quiniela.time-nocturna'], 'Del programa oficial') + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Programa de La Quiniela de la Ciudad, del ' + dm(p.from) + ' al ' + dm(p.to) + '</span><h2>Qué extracto sale en cada turno</h2><div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Extracto</th>' + types.map(t => '<th class="n">' + t + '</th>').join('') + '</tr></thead><tbody>' +
      codes.map(c => '<tr><td>' + PROG_CODES[c] + '</td>' + types.map(t => '<td class="n">' + part(t, c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
      '<p class="jg-note">«Todos» quiere decir que esa jurisdicción participa en cada sorteo de ese turno del programa; si no, cuántos de los ' + p.rows.filter(r => r.type === types[0]).length + ' sorteos del turno.</p>' +
      cite(h, ['lotba.quiniela.jurisdictions', 'lotba.quiniela.jurisdictions-2', 'lotba.quiniela.saturday-nocturna']) + '</section>' +
      '<section class="jg-c w2"><span class="jg-sm">Lo que pasó de verdad</span><h2>Los días con sorteo en nuestro registro</h2><div data-o="days"><p class="jg-note">El registro se carga con JavaScript.</p></div><div data-o="off"></div></section>' +
      '<section class="jg-c"><span class="jg-sm">Ojo</span><h2>Feriados</h2><p>El programa oficial que guardamos va <span data-o="span">del ' + dm(p.from) + ' al ' + dm(p.to) + '</span>. Para otros días miramos lo que pasó: los días de semana sin ningún sorteo en el registro suelen ser feriados.</p><p class="jg-note">Si un feriado cambia el calendario, manda lo que diga tu agencia o el sitio de la lotería.</p>' +
      tiles(h, [['/quiniela/', 'Quiniela de hoy', 'Las cabezas a medida que salen', '#ff5a3c', ICONS.balls], ['/quiniela/extractos/', 'Extractos anteriores', 'Buscá cualquier sorteo', '#2f7cf6', ICONS.book]]) + '</section></div>';
  },
};

const GAMES = () => {
  const q = d => directBet({ rules: 'lotba-quiniela', digits: d, places: 1, stake: 100 });
  const rows = [
    { name: 'Quiniela a 1 o 2 cifras', sub: 'premio fijo · Ciudad y Provincia', v: n(q(2).evPer100), any: n(q(2).pWin), anyName: 'Quiniela a 2 cifras, a la cabeza', fixed: true, url: '/quiniela/cuanto-paga/' },
    { name: 'Quiniela a 1 cifra', chanceOnly: true, any: n(q(1).pWin), anyName: 'Quiniela a 1 cifra, a la cabeza' },
    { name: 'Quiniela a 3 cifras', sub: 'premio fijo', v: n(q(3).evPer100), any: n(q(3).pWin), anyName: 'Quiniela a 3 cifras, a la cabeza', fixed: true, url: '/quiniela/cuanto-paga/' },
    { name: 'Quiniela a 4 cifras', sub: 'premio fijo', v: n(q(4).evPer100), any: n(q(4).pWin), anyName: 'Quiniela a 4 cifras, a la cabeza', fixed: true, url: '/quiniela/cuanto-paga/' },
    { name: 'Quiniela a 5 cifras', sub: 'premio fijo · solo Provincia', v: n(directBet({ rules: 'pba-quiniela', digits: 5, places: 1, stake: 100 }).evPer100), any: n(directBet({ rules: 'pba-quiniela', digits: 5, places: 1, stake: 100 }).pWin), anyName: 'Quiniela a 5 cifras, a la cabeza', fixed: true, url: '/quiniela/cuanto-paga/' },
  ];
  const red = redoblona({ rules: 'lotba-quiniela', first: { number: 12, places: 1 }, second: { number: 34, places: 5 }, stake: 100 });
  rows.push({ name: 'Redoblona (cabeza y a los 5)', sub: 'premio fijo con tope · Ciudad', v: n(red.evPer100), any: 1 / red.oneIn, fixed: true, url: '/quiniela/redoblona/' });
  for (const k of [3, 5, 7]) { const t = tombolina({ rules: 'lotba-tombolina', numbers: k, stake: 100 }); rows.push({ name: 'Tombolina con ' + k + ' números', sub: 'premio fijo · Ciudad', v: n(t.evPer100), any: n(t.pWin), fixed: true }); }
  const pool = (name, sub, id, oddsId, url, ticket, anyOverride) => { const o = oddsId ? odds(oddsId) : null; rows.push({ name, sub, v: n(prizeShare(id).per100), any: anyOverride || (o && o.pAnyPrize ? n(ticket ? o.pAnyPrizeTicket : o.pAnyPrize) : null), fixed: false, url }); };
  pool('Quini 6 Tradicional', 'pozo · los dos sorteos', 'cas-quini6-tradicional', 'cas-quini6-tradicional', '/quini-6/', true);
  pool('Quini 6 Revancha', 'pozo', 'cas-quini6-revancha', 'cas-quini6-revancha', '/quini-6/');
  pool('Quini 6 Siempre Sale', 'pozo · gana el que más acierta', 'cas-quini6-siempresale', null, '/quini-6/');
  pool('Brinco', 'pozo', 'cas-brinco', 'cas-brinco', '/brinco/');
  pool('Loto Plus', 'pozo · las cinco modalidades', 'lotba-loto-plus', 'lotba-loto-plus-tradicional', '/loto-plus/', false, 1 / anyLoto());
  pool('Telekino', 'pozo · incluye premios en especie', 'pba-telekino', 'pba-telekino', '/telekino/');
  pool('Poceada de la Ciudad', 'pozo', 'lotba-poceada', 'lotba-poceada', '/poceada/');
  const qp = quinielaPlusOdds('pba-quiniela-plus');
  rows.push({ name: 'Quiniela Plus', sub: 'pozo · la parte Plus', v: n(prizeShare('pba-quiniela-plus').per100), any: n(qp.pAnyPrize), fixed: false, url: '/quiniela-plus/' });
  return rows;
};
const BARS = () => GAMES().filter(g => !g.chanceOnly).sort((a, b) => b.v - a.v);

export const devuelve = {
  path: '/cuanto-devuelve-cada-juego/', kind: 'lottery', section: 'loterias', css: ['guias.css'], js: ['devuelve.js'],
  title: '¿Cuánto devuelve cada juego? Quiniela, Quini 6, Loto y más',
  h1: 'De cada $ 100, cuánto vuelve',
  description: 'De cada $ 100 que jugás, cuánto vuelve en premios en la quiniela, el Quini 6, el Loto, el Telekino y la Tombolina, según cada reglamento.',
  ld: h => [webPage(h), crumbs(h, [])],
  data: () => ({ g: BARS().map(g => ({ n: g.name, v: +g.v.toFixed(4) })) }),
  render(h) {
    const g = BARS(), all = GAMES(), max = 100;
    const bar = x => '<div><span>' + (x.url && h.built(x.url) ? '<a href="' + h.href(x.url) + '">' + x.name + '</a>' : x.name) + '<small>' + x.sub + '</small></span><i style="--w:' + (100 * x.v / max).toFixed(1) + '%;--c:' + (x.fixed ? 'var(--b2)' : 'var(--b5)') + '"></i><b>' + money(x.v) + '</b></div>';
    const best = g[0], worst = g[g.length - 1];
    return hero(h, { kicker: 'Loterías · la cuenta de la casa', lede: 'Cada reglamento dice qué parte de lo que se juega vuelve en premios. Las ponemos una al lado de la otra: la diferencia hasta $ 100 se queda en comisiones, fondos y la lotería.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w3"><span class="jg-sm">De cada $ 100 apostados</span><h2>Lo que vuelve en premios</h2><div class="jg-bars" data-nosnippet>' + g.map(bar).join('') + '</div>' +
      '<p class="jg-note">Azul: premio fijo, el promedio exacto de lo que cobrás. Violeta: juegos de pozo, la parte de la recaudación que el reglamento manda a premios para los jugadores (sin premios a agencias ni reservas).</p>' +
      '<p class="jg-hon">El que más devuelve, <b>' + best.name + '</b>, igual se queda con <b>' + money(100 - best.v) + '</b> de cada $ 100. El que menos, <b>' + worst.name + '</b>, devuelve <b>' + money(worst.v) + '</b>.</p></section>' +
      '<section class="jg-c w2" data-dev><span class="jg-tag">Tu plata</span><h2>Si jugás todas las semanas</h2><form class="jg-f"><div class="jg-two"><label class="jg-fl"><span>Juego</span>' + sel('g', g.map((x, i) => [i, x.name, i === 0])) + '</label><label class="jg-fl"><span>Por semana (pesos)</span><input class="jg-in" name="a" type="text" inputmode="decimal" value="2000" autocomplete="off"></label></div></form>' +
      '<p class="jg-win no"><span>En un año, en promedio, perdés</span><b data-o="loss">' + money(2000 * 52 * (100 - g[0].v) / 100) + '</b></p><p class="jg-note">Es un promedio de muchos años: un año concreto puede salir mejor o mucho peor. Para verlo, probá el simulador.</p>' + btn(h, '/quiniela/simulador/', 'Simular un año de quiniela', true) + '</section>' +
      '<section class="jg-c"><span class="jg-sm">Chance de algún premio</span><h2>Lo que sale seguido no paga</h2><table class="jg-tbl" data-nosnippet><tbody>' + all.filter(x => x.any).sort((a, b) => b.any - a.any).map(x => '<tr><td>' + (x.anyName || x.name) + '</td><td class="n">' + oneIn(1 / x.any) + '</td></tr>').join('') + '</tbody></table></section>' +
      '<section class="jg-c w3"><span class="jg-sm">De los reglamentos</span><h2>De dónde sale cada número</h2>' + cite(h, ['lotba.quiniela.pay-2', 'lotba.quiniela.pay-3', 'lotba.quiniela.pay-4', 'pba.quiniela.pay-5', 'lotba.redoblona.pay', 'lotba.tombolina.pay', 'cas.quini6.nominal', 'cas.quini6.pool', 'cas.quini6.split', 'cas.revancha.share', 'cas.siempresale.share', 'cas.brinco.pool', 'cas.brinco.split', 'lotba.loto.fund', 'lotba.loto.modality-share', 'pba.telekino.fund', 'pba.telekino.split', 'lotba.poceada.fund', 'lotba.poceada.split', 'pba.qplus.fund', 'pba.qplus.split']) + '</section></div>';
  },
};

const q6sets = () => [{ id: 'tr', name: 'Tradicional', drawn: 6, win: [6, 5, 4] }, { id: 'se', name: 'La Segunda', drawn: 6, win: [6, 5, 4] }, { id: 're', name: 'Revancha', drawn: 6, win: [6] }, { id: 'ss', name: 'Siempre Sale', drawn: 6, win: 'most' }];

export const quini6Como = {
  path: '/quini-6/como-se-juega/', kind: 'lottery', section: 'loterias', css: ['guias.css'], js: ['volante.js'],
  title: 'Cómo se juega al Quini 6: modalidades y premios',
  h1: 'Cómo se juega al Quini 6',
  description: 'Cómo se juega al Quini 6: marcás seis números del 00 al 45 y elegís modalidades. Qué gana en cada una, cuántos sorteos juega tu boleta y la chance exacta.',
  ld: h => [webPage(h), crumbs(h, [['/quini-6/', 'Quini 6']])],
  data: () => ({ mods: { tr: odds('cas-quini6-tradicional').rows.filter(r => r.prize).map(r => [r.hits, 1 / n(r.p)]), re: odds('cas-quini6-revancha').rows.filter(r => r.prize).map(r => [r.hits, 1 / n(r.p)]) }, extra: quini6PremioExtra().oneIn }),
  render(h) {
    const o = odds('cas-quini6-tradicional'), max = o.pool - 1;
    const vol = '<div class="jg-vol" data-o="vol" role="group" aria-label="Volante: marcá 6 números">' + Array.from({ length: o.pool }, (_, i) => '<button type="button" data-n="' + i + '" aria-pressed="false">' + two(i) + '</button>').join('') + '</div>';
    const mods = [['tr', 'Tradicional', 'Primer Sorteo y La Segunda: dos sorteos'], ['re', 'Revancha', 'Un sorteo más: solo paga con 6'], ['ss', 'Siempre Sale', 'Gana el que más acierte']];
    return hero(h, { kicker: 'Quini 6 · el volante', scene: 'quini-6-como-se-juega', lede: 'Marcás ' + o.pick + ' números del 00 al ' + two(max) + ' y elegís en qué modalidades jugás. Probalo acá: el volante te dice en cuántos sorteos entra tu boleta y qué gana en cada uno.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" data-volante><span class="jg-tag">Volante</span><h2>Marcá tus 6 números</h2>' + vol + '<div class="jg-r" style="margin-top:12px"><button class="jg-b s" type="button" data-rand>Al azar</button><button class="jg-b s" type="button" data-clear>Borrar</button></div>' +
      '<h3>Modalidades</h3><div class="jg-sg" role="group" aria-label="Modalidades">' + mods.map(([k, l]) => '<label><input type="checkbox" name="m" value="' + k + '"' + (k === 'tr' ? ' checked' : '') + '>' + l + '</label>').join('') + '</div></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Tu boleta</span><p class="jg-win"><span>Juega en</span><b data-o="draws">2</b><span>sorteos</span></p><div class="jg-mods2" data-o="mods">' + mods.map(([k, l, s]) => '<div data-m="' + k + '"' + (k === 'tr' ? ' class="on"' : '') + '><b>' + l + '</b><small>' + s + '</small></div>').join('') + '<div data-m="ex" class="on"><b>Premio Extra</b><small>6 aciertos entre los 18 números de Tradicional, La Segunda y Revancha</small></div></div><p class="jg-hon" data-o="sum">Marcá 6 números para ver tu boleta.</p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Paso a paso</span><h2>Qué gana en cada modalidad</h2><ol class="jg-steps">' +
      '<li><b>Tradicional</b>Con la misma boleta se hacen dos sorteos (Primer Sorteo y La Segunda). En cada uno hay premio con ' + o.rows.filter(r => r.prize).map(r => r.hits).join(', ') + ' aciertos: chance de algo en el día, ' + oneIn(o.oneInAnyPrizeTicket) + '.</li>' +
      '<li><b>Revancha</b>Otro sorteo, solo paga a quien acierta los 6: ' + oneIn(odds('cas-quini6-revancha').rows[0].oneIn) + '.</li>' +
      '<li><b>Siempre Sale</b>Si nadie acierta 6, cobran los de 5; si no, los de 4, y así. Siempre hay ganador, pero la chance depende de cuántas boletas se vendan.</li>' +
      '<li><b>Premio Extra</b>Se juntan los 18 números de Tradicional, La Segunda y Revancha: si tus 6 están ahí, entrás al reparto. Chance: ' + oneIn(quini6PremioExtra().oneIn) + '.</li></ol>' +
      cite(h, ['cas.quini6.max', 'cas.quini6.pick', 'cas.quini6.tradicional-draws', 'cas.quini6.tiers', 'cas.revancha.six-only', 'cas.siempresale.requires', 'cas.siempresale.rule', 'cas.extra.rule']) + '</section>' +
      '<section class="jg-c"><span class="jg-sm">Lo que no publicamos</span><h2>Precio y horario</h2><p>El precio de cada modalidad y el horario de cierre los fija la programación mensual de la Lotería de Santa Fe, y su sitio no responde desde nuestro servidor. Sin el documento, no ponemos un número: consultalo en tu agencia.</p>' + btn(h, '/quini-6/controlar/', 'Controlar mi Quini 6', true) + '</section></div>';
  },
};

export const quini6Controlar = {
  path: '/quini-6/controlar/', kind: 'lottery', section: 'loterias', css: ['guias.css'], js: ['controlar.js'],
  title: 'Controlar Quini 6: revisá varias boletas a la vez',
  h1: 'Controlá tu Quini 6',
  description: 'Controlá tu Quini 6: cargá tus boletas y el extracto, y mirá los aciertos de cada una en Tradicional, La Segunda, Revancha, Siempre Sale y Extra.',
  ld: h => [webPage(h), crumbs(h, [['/quini-6/', 'Quini 6']])],
  data: () => ({ min: 0, max: odds('cas-quini6-tradicional').pool - 1, pick: 6, sets: q6sets(), key: 'jg-q6-boletas' }),
  render(h) {
    const o = odds('cas-quini6-tradicional');
    const six = (name, label) => '<div class="jg-six" data-six="' + name + '">' + Array.from({ length: 6 }, (_, i) => '<input type="text" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="' + label + ' ' + (i + 1) + '">').join('') + '</div>';
    return hero(h, { kicker: 'Quini 6 · control', scene: 'quini-6-controlar', lede: 'Cargá todas tus boletas una vez (quedan en tu teléfono) y después solo los números del extracto. La tabla te muestra los aciertos de cada boleta en cada modalidad.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" data-q6c><span class="jg-tag">1</span><h2>Tus boletas</h2><div class="jg-tix" data-o="tix"></div><div class="jg-r" style="margin-top:10px"><button class="jg-b s" type="button" data-add>Agregar boleta</button></div><p class="jg-note">Hasta 10 boletas. Se guardan solo en este navegador; no van en el link ni a ningún servidor.</p></section>' +
      '<section class="jg-c t2" data-q6d><span class="jg-tag">2</span><h2>El extracto</h2><p class="jg-mu">Copialo del extracto oficial de tu agencia o de la Lotería de Santa Fe.</p>' +
      q6sets().map(s => '<fieldset class="jg-fl"><legend>' + s.name + '</legend>' + six(s.id, s.name) + '</fieldset>').join('') +
      '<label class="jg-fl"><span>O pegá los 24 números en orden</span><textarea class="jg-in jg-ta" rows="3" inputmode="numeric" data-paste placeholder="Tradicional, La Segunda, Revancha y Siempre Sale"></textarea></label></section>' +
      '<section class="jg-c w2" aria-live="polite"><span class="jg-tag">3</span><h2>Resultado</h2><div data-o="res"><p class="jg-note">Cargá al menos una boleta y una modalidad del extracto.</p></div></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Qué paga cada modalidad</span><h2>Cuándo hay premio</h2><ul class="jg-ul tx"><li><b>Tradicional y La Segunda:</b> ' + o.rows.filter(r => r.prize).map(r => r.hits).join(', ') + ' aciertos.</li><li><b>Revancha:</b> solo 6.</li><li><b>Siempre Sale:</b> el que más acierta en ese sorteo; la tabla te dice cuántos hiciste.</li><li><b>Premio Extra:</b> tus 6 entre los 18 números de las tres primeras.</li></ul>' +
      '<p class="jg-hon">El monto en pesos depende de cuántos ganadores haya en cada categoría: lo informa el extracto oficial, no lo inventamos.</p>' + cite(h, ['cas.quini6.tiers', 'cas.revancha.six-only', 'cas.siempresale.rule', 'cas.extra.rule', 'cas.quini6.four-min']) + '</section></div>';
  },
};

export const telekinoControlar = {
  path: '/telekino/controlar/', kind: 'lottery', section: 'loterias', css: ['guias.css'], js: ['telekino.js'],
  title: 'Controlar Telekino: revisá tu cartón',
  h1: 'Controlá tu cartón de Telekino',
  description: 'Controlá tu cartón de Telekino en una grilla de 5 por 5: marcás tus 15 números y se iluminan los aciertos del sorteo, con su categoría y el Rekino.',
  ld: h => [webPage(h), crumbs(h, [['/telekino/', 'Telekino']])],
  data: () => { const o = odds('pba-telekino'); return { pool: o.pool, pick: o.pick, drawn: o.drawn, win: o.rows.filter(r => r.prize).map(r => r.hits), odds: Object.fromEntries(o.rows.map(r => [r.hits, 1 / n(r.p)])), key: 'jg-tk-cartones' }; },
  render(h) {
    const o = odds('pba-telekino');
    const grid = '<div class="jg-k25" data-o="grid">' + Array.from({ length: o.pool }, (_, i) => '<button type="button" data-n="' + (i + 1) + '" aria-pressed="false">' + (i + 1) + '</button>').join('') + '</div>';
    const lo = Math.min(...o.rows.filter(r => r.prize).map(r => r.hits));
    return hero(h, { kicker: 'Telekino · control', scene: 'telekino-controlar', lede: 'Tocá los ' + o.pick + ' números de tu cartón en la grilla y después cargá los que salieron. Los aciertos se prenden en verde y te decimos la categoría.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2" data-tk><span class="jg-tag">Tu cartón</span><h2>Marcá tus ' + o.pick + ' números</h2><div class="jg-sg" role="group" aria-label="Qué estás marcando" style="margin-bottom:12px"><button type="button" data-mode="m" aria-pressed="true">Mi cartón</button><button type="button" data-mode="d" aria-pressed="false">Los que salieron</button></div>' + grid +
      '<p class="jg-note" data-o="count">Marcados: 0 de ' + o.pick + '.</p><div class="jg-r"><label class="jg-fl" style="flex:1 1 180px"><span>Sorteo</span>' + sel('s', [['tk', 'Telekino', true], ['rk', 'Rekino']]) + '</label><button class="jg-b s" type="button" data-save>Guardar cartón</button><button class="jg-b s" type="button" data-clear>Borrar</button></div>' +
      '<label class="jg-fl"><span>O pegá los ' + o.drawn + ' números que salieron</span><textarea class="jg-in jg-ta" rows="2" inputmode="numeric" data-paste></textarea></label><div class="jg-chipl" data-o="saved"></div></section>' +
      '<section class="jg-c t2" aria-live="polite"><span class="jg-sm">Resultado</span><p class="jg-win"><span>Aciertos</span><b data-o="hits">-</b></p><p class="jg-hon" data-o="cat">Marcá tu cartón y los números del sorteo.</p>' +
      '<table class="jg-tbl" data-nosnippet><tbody>' + o.rows.filter(r => r.prize).map(r => '<tr data-h="' + r.hits + '"><td>' + r.hits + ' aciertos</td><td class="n">' + oneIn(r.oneIn) + '</td></tr>').join('') + '</tbody></table></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Del reglamento</span><h2>Cómo se gana</h2><ul class="jg-ul tx"><li>Salen ' + o.drawn + ' números de ' + o.pool + ', sin reposición.</li><li>Hay premio desde ' + lo + ' aciertos.</li><li>El Rekino es otro sorteo con el mismo cartón: gana quien más acierte.</li></ul>' + cite(h, ['pba.telekino.drawn', 'pba.telekino.universe', 'pba.telekino.no-replacement', 'pba.telekino.lowest', 'pba.telekino.rekino']) + '</section></div>';
  },
};
