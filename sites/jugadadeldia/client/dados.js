import { $, store, sound, soundToggle } from './kit.js';
import { dieHtml, cryptoInt } from './dice.js';
import { handOf } from '../../../engine/lottery/dice.mjs';

const root = $('[data-dados]');
const out = k => $('[data-o="' + k + '"]', root);
let hist = [];
const NAME = { generala: 'Generala', poker: 'Póker', full: 'Full', escalera: 'Escalera' };
function dist(n, c) {
  let d = new Map([[0, 1]]);
  for (let i = 0; i < n; i++) { const nx = new Map(); for (const [s, p] of d) for (let f = 1; f <= c; f++) nx.set(s + f, (nx.get(s + f) || 0) + p / c); d = nx; }
  return d;
}
function chart(n, c) {
  const box = out('hist');
  const mine = hist.filter(x => x.n === n && x.c === c);
  if (!mine.length) { box.innerHTML = ''; return; }
  const th = dist(n, c), keys = [...th.keys()].sort((a, b) => a - b);
  const cnt = new Map(); mine.forEach(x => cnt.set(x.sum, (cnt.get(x.sum) || 0) + 1));
  const max = Math.max(...keys.map(k => Math.max(th.get(k), (cnt.get(k) || 0) / mine.length)));
  box.innerHTML = keys.map(k => '<div title="' + k + '"><span class="jg-th" style="height:' + (100 * th.get(k) / max) + '%"></span><i style="height:' + (100 * (cnt.get(k) || 0) / mine.length / max) + '%"></i><small>' + k + '</small></div>').join('');
  out('hn').textContent = mine.length + (mine.length === 1 ? ' tirada' : ' tiradas') + ' con ' + n + 'd' + c + '. Barras de color: lo que salió; grises: lo esperado.';
}
function roll() {
  const f = $('[data-cfg]', root);
  const n = +f.elements.n.value, c = +f.elements.c.value;
  const v = Array.from({ length: n }, () => cryptoInt(c) + 1);
  out('dice').innerHTML = v.map((x, i) => dieHtml(x, { roll: true, i, tag: 'span', sides: c })).join('');
  const sum = v.reduce((a, b) => a + b, 0);
  out('sum').textContent = sum;
  out('hand').textContent = n === 5 && c === 6 ? (handOf(v, 'escalera-12345-23456') ? NAME[handOf(v, 'escalera-12345-23456')] + ' servida' : 'Sin jugada servida') : '';
  hist.push({ n, c, sum, v });
  if (hist.length > 500) hist.shift();
  store.set('jg-dados', JSON.stringify(hist.slice(-200)));
  out('log').innerHTML = hist.slice(-8).reverse().map(x => '<li><span>' + x.v.join(' · ') + '</span><b>' + x.sum + '</b></li>').join('');
  chart(n, c);
  sound.play('roll');
}
if (root) {
  try { hist = JSON.parse(store.get('jg-dados') || '[]'); } catch (e) { hist = []; }
  soundToggle($('[data-sound]', root));
  $('[data-roll]', root).addEventListener('click', roll);
  $('[data-gen5]', root).addEventListener('click', () => { const f = $('[data-cfg]', root); f.elements.n.value = '5'; f.elements.c.value = '6'; roll(); });
  $('[data-cfg]', root).addEventListener('change', () => { const f = $('[data-cfg]', root); chart(+f.elements.n.value, +f.elements.c.value); });
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !e.target.closest('input,select,textarea,button')) { e.preventDefault(); roll(); } });
  roll();
}
