import { $, $$, store, sound, soundToggle } from './kit.js';
import { scoreBlock } from './cards.js';

const root = $('[data-anotador]');
const KEY = 'jg-anotador-v1';
let S = { target: 30, a: 0, b: 0, names: { a: 'Nosotros', b: 'Ellos' }, log: [] };
let lock = null;
const out = k => $('[data-o="' + k + '"]', root);
function save() { store.set(KEY, JSON.stringify(S)); }
function load() { try { const x = JSON.parse(store.get(KEY) || 'null'); if (x && [15, 30, 40].includes(x.target)) S = { ...S, ...x }; } catch (e) { return; } }
function stage(n) {
  if (S.target === 15) return '';
  const half = S.target / 2;
  return n < half ? 'en las malas, faltan ' + (half - n) + ' para las buenas' : n >= S.target ? '' : 'en las buenas, faltan ' + (S.target - n);
}
function render() {
  for (const k of ['a', 'b']) {
    out('n' + k).textContent = S[k];
    out('p' + k).innerHTML = scoreBlock(S[k], S.target);
    out('s' + k).textContent = stage(S[k]);
    const inp = $('[data-name="' + k + '"]', root);
    if (document.activeElement !== inp) inp.value = S.names[k];
  }
  $$('[data-target]', root).forEach(b => b.setAttribute('aria-pressed', +b.dataset.target === S.target ? 'true' : 'false'));
  const w = S.a >= S.target ? 'a' : S.b >= S.target ? 'b' : null;
  out('win').hidden = !w;
  if (w) out('win').textContent = '¡Ganó ' + S.names[w] + '! ' + S[w] + ' a ' + S[w === 'a' ? 'b' : 'a'];
  $$('[data-add]', root).forEach(b => { b.disabled = !!w && +b.dataset.v > 0; });
  out('log').innerHTML = S.log.length ? S.log.slice(-40).map(x => '<li>' + (x.v > 0 ? '+' : '') + x.v + ' ' + escapeHtml(S.names[x.k]) + ' (' + x.a + ' a ' + x.b + ')</li>').join('') : '<li class="e">Todavía no anotaron ningún punto.</li>';
}
const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function add(k, v) {
  const n = Math.max(0, Math.min(S.target, S[k] + v));
  if (n === S[k]) return;
  S[k] = n;
  S.log.push({ k, v, a: S.a, b: S.b });
  sound.play(S[k] >= S.target ? 'win' : 'tick');
  try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { lock = lock || null; }
  save(); render();
}
async function wake() {
  try { if ('wakeLock' in navigator && document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen'); } catch (e) { lock = null; }
}
if (root) {
  load();
  soundToggle($('[data-sound]', root));
  render();
  wake();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake(); });
  root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.add) add(b.dataset.add, +b.dataset.v);
    else if (b.dataset.target) { const t = +b.dataset.target; if (t !== S.target && (S.a || S.b) && !confirm('¿Cambiar a ' + t + ' y empezar de cero?')) return; S = { ...S, target: t, a: 0, b: 0, log: [] }; save(); render(); }
    else if ('undo' in b.dataset) { const x = S.log.pop(); if (x) { S[x.k] = Math.max(0, Math.min(S.target, S[x.k] - x.v)); save(); render(); } }
    else if ('reset' in b.dataset) { if ((S.a || S.b) && !confirm('¿Empezar un partido nuevo?')) return; S = { ...S, a: 0, b: 0, log: [] }; save(); render(); }
    else if ('full' in b.dataset) { const el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => null); }
    else if ('share' in b.dataset) {
      const text = 'Truco a ' + S.target + ': ' + S.names.a + ' ' + S.a + ', ' + S.names.b + ' ' + S.b;
      if (navigator.share) navigator.share({ text, url: location.href }).catch(() => null);
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { b.textContent = 'Copiado'; setTimeout(() => { b.textContent = 'Compartir resultado'; }, 1500); }).catch(() => null);
    }
  });
  $$('[data-name]', root).forEach(inp => inp.addEventListener('input', () => { S.names[inp.dataset.name] = inp.value.trim() || (inp.dataset.name === 'a' ? 'Nosotros' : 'Ellos'); save(); out('log').innerHTML = ''; render(); }));
}
