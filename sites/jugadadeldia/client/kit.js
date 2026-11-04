import { fmt, fmtFixed, fmtPct, fmtInput, parseNum } from '../../../engine/games/num.mjs';
export { fmt, fmtPct, fmtInput, parseNum };
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { return null; } return v; },
  del(k) { try { localStorage.removeItem(k); } catch (e) { return null; } return null; },
};
export const json = id => { const el = document.getElementById(id); if (!el) return null; try { return JSON.parse(el.textContent); } catch (e) { return null; } };
export const page = () => json('jg-page') || {};
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const pesos = n => '$ ' + (Math.abs(Math.round(n * 100) % 100) === 0 ? fmt(n, 0) : fmtFixed(n, 2));
export const oneIn = n => '1 en ' + fmt(n, n < 100 ? 1 : 0);
export const wait = ms => new Promise(r => setTimeout(r, ms));
export function frame(fn) {
  let done = false;
  const go = () => { if (!done) { done = true; fn(); } };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go);
  setTimeout(go, 60);
}
export function params() { return new URLSearchParams(location.search); }
export function setParams(obj) {
  const u = new URL(location.href);
  for (const [k, v] of Object.entries(obj)) { if (v === null || v === undefined || v === '') u.searchParams.delete(k); else u.searchParams.set(k, v); }
  history.replaceState(null, '', u.pathname + (u.search ? u.search : '') + u.hash);
}
export async function share(btn, title) {
  const url = location.href;
  try {
    if (navigator.share) { await navigator.share({ title, url }); return; }
    await navigator.clipboard.writeText(url);
    const t = btn.textContent; btn.textContent = 'Link copiado'; setTimeout(() => { btn.textContent = t; }, 1600);
  } catch (e) { return; }
}
let ctx = null;
export const sound = {
  on() { return store.get('jg-sonido') === '1'; },
  set(v) { store.set('jg-sonido', v ? '1' : '0'); },
  play(kind) {
    if (!this.on()) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      const f = { card: 520, win: 880, lose: 220, call: 660, roll: 330, tick: 1200 }[kind] || 440;
      o.type = kind === 'roll' ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(f, ctx.currentTime);
      if (kind === 'win') o.frequency.linearRampToValueAtTime(f * 1.5, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === 'win' ? 0.35 : 0.12));
      o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.4);
    } catch (e) { return; }
  },
};
export function soundToggle(btn) {
  if (!btn) return;
  const sync = () => { btn.setAttribute('aria-pressed', sound.on() ? 'true' : 'false'); btn.textContent = sound.on() ? 'Sonido: sí' : 'Sonido: no'; };
  sync();
  btn.addEventListener('click', () => { sound.set(!sound.on()); sync(); sound.play('tick'); });
}
