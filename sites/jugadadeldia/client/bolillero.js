import { $, $$, store } from './kit.js';

const box = $('[data-bol]'), cts = $('[data-cartones]');
const KEY = 'jg-bolillero';
const out = k => $('[data-o="' + k + '"]');
const rnd = n => { const b = new Uint32Array(1), lim = 4294967296 - (4294967296 % n); do crypto.getRandomValues(b); while (b[0] >= lim); return b[0] % n; };
let S = null, voice = false;
const range = r => (r === '99' ? Array.from({ length: 100 }, (_, i) => i) : Array.from({ length: 90 }, (_, i) => i + 1));
const label = (r, n) => (r === '99' ? String(n).padStart(2, '0') : String(n));
function load() { try { const v = JSON.parse(store.get(KEY)); if (v && Array.isArray(v.out)) return v; } catch (e) { return null; } return null; }
const save = () => store.set(KEY, JSON.stringify(S));
function board() {
  const all = range(S.r);
  out('board').innerHTML = all.map(n => '<span class="' + (S.out.includes(n) ? 'on' : '') + (S.out[S.out.length - 1] === n ? ' last' : '') + '">' + label(S.r, n) + '</span>').join('');
  const last = S.out[S.out.length - 1];
  out('ball').textContent = last === undefined ? '?' : label(S.r, last);
  out('info').textContent = S.out.length ? 'Salieron ' + S.out.length + ' de ' + all.length + '. Quedan ' + (all.length - S.out.length) + '.' : 'Tocá «Sacar bolilla».';
  $('[data-draw]', box).disabled = S.out.length === all.length;
}
function say(n) {
  if (!voice || !('speechSynthesis' in window)) return;
  try { const u = new SpeechSynthesisUtterance(String(n)); u.lang = 'es-AR'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { return; }
}
function draw() {
  const left = range(S.r).filter(n => !S.out.includes(n));
  if (!left.length) return;
  const n = left[rnd(left.length)];
  S.out.push(n); save(); board(); say(n);
  const b = out('ball'); b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
}
function carton() {
  const cols = Array.from({ length: 9 }, (_, c) => { const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9; return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i); });
  let rows;
  do {
    rows = Array.from({ length: 3 }, () => { const pick = []; while (pick.length < 5) { const c = rnd(9); if (!pick.includes(c)) pick.push(c); } return pick; });
  } while (cols.some((_, c) => !rows.some(r => r.includes(c))));
  const grid = Array.from({ length: 3 }, () => Array(9).fill(null));
  for (let c = 0; c < 9; c++) {
    const rs = [0, 1, 2].filter(r => rows[r].includes(c)), pool = cols[c].slice(), nums = [];
    for (let k = 0; k < rs.length; k++) nums.push(pool.splice(rnd(pool.length), 1)[0]);
    nums.sort((a, b) => a - b).forEach((v, k) => { grid[rs[k]][c] = v; });
  }
  return grid;
}
function cartones() {
  const n = +$('select[name=n]', cts).value;
  out('cts').innerHTML = Array.from({ length: n }, (_, i) => '<div class="jg-ct"><small>Cartón ' + (i + 1) + '</small><table>' + carton().map(r => '<tr>' + r.map(v => '<td>' + (v ?? '') + '</td>').join('') + '</tr>').join('') + '</table></div>').join('');
}
if (box) {
  S = load() || { r: '90', out: [] };
  $('select[name=r]', box).value = S.r;
  board();
  $('select[name=r]', box).addEventListener('change', e => { S = { r: e.target.value, out: [] }; save(); board(); });
  box.addEventListener('click', e => {
    if (e.target.closest('[data-draw]')) draw();
    if (e.target.closest('[data-undo]')) { S.out.pop(); save(); board(); }
    if (e.target.closest('[data-new]')) { S.out = []; save(); board(); }
    const v = e.target.closest('[data-voice]');
    if (v) { voice = !voice; v.setAttribute('aria-pressed', voice ? 'true' : 'false'); v.textContent = voice ? 'Voz: sí' : 'Voz: no'; }
  });
  document.addEventListener('keydown', e => { if (e.key === ' ' && e.target === document.body) { e.preventDefault(); draw(); } });
}
if (cts) {
  cartones();
  cts.addEventListener('click', e => { if (e.target.closest('[data-make]')) cartones(); if (e.target.closest('[data-print]')) window.print(); });
  $('select[name=n]', cts).addEventListener('change', cartones);
}
