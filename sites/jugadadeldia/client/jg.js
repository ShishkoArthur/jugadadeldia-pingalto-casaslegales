import { $, store, json } from './kit.js';
import './precios.js';
const root = document.documentElement;

function theme() {
  const btn = $('[data-jg-tema]');
  if (!btn) return;
  const dark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const sync = () => btn.setAttribute('aria-pressed', dark() ? 'true' : 'false');
  sync();
  btn.addEventListener('click', () => {
    const next = dark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('jg-tema', next);
    sync();
  });
}

function menu() {
  const btn = $('[data-jg-menu]');
  const panel = $('#jg-panel');
  if (!btn || !panel) return;
  const set = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
  btn.addEventListener('click', () => set(panel.hidden));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
  document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) set(false); });
}

export function helpLine(id) {
  const data = json('jg-data');
  const box = $('[data-jg-line]');
  if (!box || !data || box.dataset.fijo) return;
  const l = data.lines[id];
  if (!l) return;
  box.textContent = '';
  box.append('¿El juego dejó de ser un juego? Línea ' + (l.f ? data.w.free : '') + 'de ' + l.n + ': ');
  const a = document.createElement('a');
  a.href = 'tel:' + l.t; a.textContent = l.p;
  box.append(a);
}

theme();
menu();
const saved = store.get('jg-prov');
if (saved) helpLine(saved);
