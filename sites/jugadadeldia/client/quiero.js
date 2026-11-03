import { $, $$, page, fmt } from './kit.js';
import { cardHtml } from './cards.js';
import { envidoPoints, envidoVsRandom, bazasVsRandom, hasFlor } from '../../../engine/truco/index.mjs';
import { envidoQuieroValue, envidoNoQuieroValue, TRUCO_CALLS } from '../../../engine/truco/rules.mjs';
import { DECK_40 } from '../../../engine/cards/spanish.mjs';

const D = page();
const box = $('[data-quiero]');
const out = k => $('[data-o="' + k + '"]');
const N = 10;
const T2 = +Object.keys(TRUCO_CALLS)[0];
let round = 0, ok = 0, lost = 0, cur = null;
const rnd = n => { const b = new Uint32Array(1), lim = 4294967296 - (4294967296 % n); do crypto.getRandomValues(b); while (b[0] >= lim); return b[0] % n; };
function deal() {
  let hand;
  do { const d = DECK_40.slice(); hand = []; for (let i = 0; i < 3; i++) hand.push(d.splice(rnd(d.length), 1)[0]); } while (hasFlor(hand));
  return hand;
}
function situation() {
  const hand = deal(), mano = rnd(2) === 0, kind = ['envido', 'realEnvido', 'truco'][rnd(3)];
  let p, q, nq, title;
  if (kind === 'truco') {
    p = bazasVsRandom(hand, { mano }).p; q = T2 * p - T2 * (1 - p); nq = -1; title = 'Te cantan truco antes de la primera carta';
  } else {
    const chain = [kind];
    p = envidoVsRandom(hand, { mano, flor: false }).win.p;
    const v = envidoQuieroValue(D.rules, chain, [0, 0], 0);
    q = v * p - v * (1 - p); nq = -envidoNoQuieroValue(chain); title = kind === 'envido' ? 'Te cantan envido' : 'Te cantan real envido';
  }
  return { hand, mano, kind, p, q, nq, title, best: q > nq ? 'q' : 'n' };
}
function show() {
  cur = situation();
  out('n').textContent = (round + 1) + ' de ' + N;
  out('title').textContent = cur.title;
  out('hand').innerHTML = cur.hand.map(c => cardHtml(c)).join('');
  out('ctx').innerHTML = '<span>' + (cur.mano ? 'Sos mano' : 'No sos mano') + '</span>' + (cur.kind !== 'truco' ? '<span>Tus tantos: ' + envidoPoints(cur.hand) + '</span>' : '');
  out('res').innerHTML = '';
  $$('[data-a]', box).forEach(b => { b.disabled = false; });
  $('[data-next]', box).hidden = true;
}
function answer(a) {
  const pts = x => (x > 0 ? '+' : '') + fmt(x, 2);
  const right = a === cur.best, diff = Math.abs(cur.q - cur.nq);
  if (right) ok++; else lost += diff;
  round++;
  $$('[data-a]', box).forEach(b => { b.disabled = true; });
  out('res').innerHTML = '<p class="jg-hon"><b>' + (right ? 'Coincidís con el motor.' : 'El motor hubiera dicho «' + (cur.best === 'q' ? 'quiero' : 'no quiero') + '».') + '</b> ' +
    (cur.kind === 'truco' ? 'Con las cartas a la vista ganarías la mano ' : 'Tu envido le gana a una mano al azar ') + fmt(cur.p * 100, 1) + ' % de las veces. Queriendo se esperan ' + pts(cur.q) + ' puntos; sin querer, ' + pts(cur.nq) + '.</p>';
  out('ok').textContent = ok; out('done').textContent = round;
  out('lost').textContent = round === N ? 'Serie terminada: ' + ok + ' de ' + N + '. Con las respuestas distintas dejaste ' + fmt(lost, 2) + ' puntos esperados en la mesa.' : 'Puntos esperados que dejaste en la mesa: ' + fmt(lost, 2) + '.';
  const nx = $('[data-next]', box); nx.hidden = false; nx.textContent = round === N ? 'Otra serie' : 'Siguiente';
}
if (box) {
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (b && !b.disabled) answer(b.dataset.a);
    if (e.target.closest('[data-next]')) { if (round === N) { round = 0; ok = 0; lost = 0; out('ok').textContent = 0; out('done').textContent = 0; } show(); }
  });
  show();
}
