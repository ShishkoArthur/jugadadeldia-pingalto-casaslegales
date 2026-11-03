import { fmt, fmtPct, fmtInput, parseNum } from '../../../engine/games/num.mjs';
export { fmt, fmtPct, fmtInput, parseNum };
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export function data() {
  const el = document.getElementById('pa-d');
  if (!el) return null;
  try { return JSON.parse(el.textContent); } catch (e) { return null; }
}
export const out = (k, html) => { const el = document.querySelector('[data-o="' + k + '"]'); if (el) el.innerHTML = html; return el; };
export function num(el) {
  if (!el) return NaN;
  return parseNum(el.value, { whole: el.inputMode === 'numeric' || el.getAttribute('inputmode') === 'numeric' });
}
export const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { return null; } return v; },
};
export function params() { return new URLSearchParams(location.search); }
export function setParams(obj) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v !== '' && v != null && !(typeof v === 'number' && !Number.isFinite(v))) p.set(k, String(v));
  const q = p.toString();
  history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
}
export function share() {
  const btn = document.querySelector('[data-pa-share]');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(location.href); ok = true; } catch (e) { ok = false; }
    out('copied', ok ? 'Link copiado' : 'Copiá la dirección de la barra del navegador');
  });
}
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
