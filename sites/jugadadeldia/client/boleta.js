import { $, $$, page, fmt, parseNum, pesos, oneIn, esc } from './kit.js';
import { helpLine } from './jg.js';
import { directBet } from '../../../engine/lottery/quiniela.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';

const D = page();
const form = $('[data-boleta]');
const out = k => $('[data-o="' + k + '"]');
const PLACE = { 1: 'A la cabeza', 5: 'A los 5', 10: 'A los 10', 20: 'A los 20' };
const NAME = { lotba: 'Ciudad', pba: 'Provincia' };

function calc() {
  const f = new FormData(form);
  const j = f.get('j'), raw = String(f.get('num') || '').trim(), u = +f.get('u'), a = parseNum(f.get('a'));
  const err = out('err');
  err.hidden = true;
  helpLine(D.j[j].help);
  const d = raw.length;
  const cells = $$('span', out('x20'));
  cells.forEach((c, i) => { c.classList.toggle('in', i < u); c.classList.remove('hit'); });
  if (!/^\d{1,4}$/.test(raw) || !(a > 0) || Math.round(a * 100) !== a * 100 || !D.j[j].digits.includes(d)) {
    out('pay').textContent = '-';
    err.hidden = false;
    err.textContent = 'Escribí un número de 1 a 4 cifras y cuánto apostás, en pesos.';
    return;
  }
  const r = directBet({ rules: D.j[j].id, digits: d, places: u, stake: a });
  let hits = 0;
  cells.forEach((c, i) => { const v = D.demo[i]; if (i < u && v.endsWith(raw)) { c.classList.add('hit'); hits++; } });
  out('b-num').innerHTML = esc(raw) + '<small>' + d + (d === 1 ? ' cifra: cuenta la última' : ' cifras: cuentan las ' + d + ' últimas') + '</small>';
  out('b-ub').innerHTML = PLACE[u] + '<small>' + (u === 1 ? 'tiene que salir primero' : 'tiene que salir entre el lugar 1 y el ' + u) + '</small>';
  out('b-j').textContent = NAME[j];
  out('b-a').innerHTML = pesos(a) + (u > 1 ? '<small>' + pesos(a / u) + ' por cada lugar</small>' : '');
  out('pay').textContent = pesos(toNumber(r.perHit));
  out('why').innerHTML = 'Chance: <b>' + oneIn(r.oneIn) + '</b>. ' + r.ratio + ' veces lo apostado' + (u > 1 ? ', dividido por los ' + u + ' lugares que cubrís' : '') + '. ' +
    (hits ? 'En el extracto de ejemplo tu número sale ' + (hits === 1 ? 'una vez' : hits + ' veces') + ' en tus lugares: cobrarías ' + pesos(toNumber(r.perHit) * hits) + '.' : 'En el extracto de ejemplo no sale en tus lugares.');
}

function quiz() {
  const box = out('quiz');
  if (!box) return;
  const L = id => D.j.lotba.id;
  const a = directBet({ rules: L(), digits: 2, places: 1, stake: 100 }), b = directBet({ rules: L(), digits: 2, places: 10, stake: 100 });
  const c = directBet({ rules: L(), digits: 3, places: 1, stake: 100 });
  const Q = [
    { q: 'Jugás 25 a la cabeza y sale 4825 en el primer lugar. ¿Ganaste?', o: ['Sí', 'No'], ok: 0, why: 'A 2 cifras cuentan las dos últimas: 4825 termina en 25.' },
    { q: 'Jugás 25 a la cabeza y sale 4825 en el lugar 3. ¿Ganaste?', o: ['Sí', 'No'], ok: 1, why: 'A la cabeza vale solo el primer lugar.' },
    { q: 'Con $ 100 a 2 cifras, ¿cuánto cobrás a la cabeza?', o: [pesos(toNumber(a.perHit)), pesos(toNumber(b.perHit))], ok: 0, why: 'A la cabeza cobrás ' + a.ratio + ' veces lo apostado.' },
    { q: 'Con $ 100 a 2 cifras, ¿cuánto cobrás a los 10?', o: [pesos(toNumber(a.perHit)), pesos(toNumber(b.perHit))], ok: 1, why: 'La apuesta se reparte entre los 10 lugares.' },
    { q: '¿Qué cobra más con $ 100 a la cabeza: 2 o 3 cifras?', o: ['2 cifras', '3 cifras'], ok: 1, why: '3 cifras paga ' + pesos(toNumber(c.perHit)) + ', pero sale ' + oneIn(c.oneIn) + ' veces en vez de ' + oneIn(a.oneIn) + '.' },
  ];
  let right = 0, done = 0;
  box.innerHTML = Q.map((x, i) => '<div data-q="' + i + '"><p>' + (i + 1) + '. ' + esc(x.q) + '</p><div class="jg-r">' + x.o.map((o, k) => '<button class="jg-b s" type="button" data-k="' + k + '">' + esc(o) + '</button>').join('') + '</div><p class="jg-note" hidden></p></div>').join('');
  box.addEventListener('click', e => {
    const bt = e.target.closest('button[data-k]');
    if (!bt) return;
    const q = bt.closest('[data-q]');
    if (q.dataset.done) return;
    q.dataset.done = '1';
    const x = Q[+q.dataset.q], k = +bt.dataset.k;
    bt.classList.add(k === x.ok ? 'y' : 'n');
    if (k !== x.ok) $$('button', q)[x.ok].classList.add('y');
    const note = $('p.jg-note', q); note.hidden = false; note.textContent = (k === x.ok ? 'Bien. ' : 'No. ') + x.why;
    if (k === x.ok) right++;
    if (++done === Q.length) { const r = out('qres'); r.hidden = false; r.textContent = right + ' de ' + Q.length + ' bien.'; }
  });
}

if (form) { form.addEventListener('input', calc); form.addEventListener('change', calc); calc(); }
quiz();
