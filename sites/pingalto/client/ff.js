import { start, answer, triesLeft } from '../../../engine/games/bisect.mjs';
import { $, $$, data, out, store, params, setParams, share, fmt, esc } from './kit.js';

const D = data();
if (D && $('.pa-sl')) {
  const KEY = 'pa-ff';
  const rows = $$('.pa-sl [data-row]');
  const field = (i, k) => $('#ff-' + k + i);
  let saved = null;
  try { saved = JSON.parse(store.get(KEY) || 'null'); } catch (e) { saved = null; }
  const q = params();
  rows.forEach((r, i) => {
    const fromUrl = q.get('v' + i), maxUrl = q.get('m' + i);
    if (fromUrl != null) field(i, 'v').value = fromUrl; else if (saved && saved.v && saved.v[i] != null) field(i, 'v').value = saved.v[i];
    if (maxUrl != null) field(i, 'm').value = maxUrl; else if (saved && saved.m && saved.m[i] != null) field(i, 'm').value = saved.m[i];
    if (saved && saved.n && saved.n[i]) field(i, 'n').value = saved.n[i];
  });
  let cur = 0, s = null;
  const int = v => { const n = Number(String(v).trim()); return Number.isInteger(n) ? n : NaN; };
  const persist = () => {
    const v = rows.map((r, i) => field(i, 'v').value), m = rows.map((r, i) => field(i, 'm').value), n = rows.map((r, i) => field(i, 'n').value);
    store.set(KEY, JSON.stringify({ v, m, n }));
    const p = {}; v.forEach((x, i) => { if (x !== '') p['v' + i] = x; }); m.forEach((x, i) => { if (x !== '') p['m' + i] = x; });
    setParams(p);
  };
  const btns = $$('[data-a]');
  const paint = () => {
    const name = field(cur, 'n').value || D.sliders[cur];
    out('name', esc(name));
    if (!s) { out('value', '-'); btns.forEach(b => { b.disabled = true; }); return; }
    const max = int(field(cur, 'm').value);
    out('value', fmt(s.value, 0));
    const box = $('[data-o="int"]');
    box.querySelector('i').style.left = (s.lo / max) * 100 + '%';
    box.querySelector('i').style.width = ((s.hi - s.lo) / max) * 100 + '%';
    box.querySelector('b').style.left = (s.value / max) * 100 + '%';
    out('left', 'Intentos que quedan: ' + (s.done ? 0 : 'hasta ' + triesLeft(s)));
    out('tries', 'Probados: ' + (s.tries.length ? s.tries.map(t => fmt(t.value, 0)).join(' · ') : '-'));
    btns.forEach(b => { b.disabled = s.done; });
    out('say', s.done ? 'Tu valor para <b>' + esc(name) + '</b> es <b>' + fmt(s.value, 0) + '</b>. Ya quedó cargado en «Hoy tenés». Pasá al siguiente deslizador.' : 'Poné <b>' + fmt(s.value, 0) + '</b> en ' + esc(name) + ', hacé la prueba y contanos qué pasó.');
  };
  const begin = i => {
    cur = i;
    $$('[data-pick]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.pick) === i)));
    const v = int(field(i, 'v').value), m = int(field(i, 'm').value);
    if (!(m > 0) || !(v >= 0) || v > m) { s = null; paint(); out('say', 'Completá «Hoy tenés» y «Máximo» con números enteros (el valor no puede pasar el máximo).'); return; }
    s = start({ value: v, lo: 0, hi: m });
    paint();
  };
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => begin(Number(b.dataset.pick))));
  btns.forEach(b => b.addEventListener('click', () => {
    if (!s) return;
    s = answer(s, b.dataset.a);
    if (s.done) { field(cur, 'v').value = String(s.value); persist(); }
    paint();
  }));
  $('.pa-sl').addEventListener('input', persist);
  share();
  paint();
}
