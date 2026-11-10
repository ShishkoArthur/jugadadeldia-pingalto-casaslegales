import { esc } from './fdkit.js';

export const RAR = { common: 'Común', rare: 'Especial', epic: 'Épica', legendary: 'Legendaria', champion: 'Campeón' };
export const RORD = ['common', 'rare', 'epic', 'legendary', 'champion'];

export const artBase = el => el && el.dataset.fdArt === '1' ? el.dataset.fdSrc : null;
const ex = c => c.e === null || c.e === undefined ? '?' : c.e;

export function face(c, base, evo) {
  const src = base && (evo && c.ei ? c.ei : c.img);
  return '<span class="pa-crf">' + (src ? '<img src="' + esc(base + src) + '" alt="" width="285" height="420" loading="lazy" decoding="async">' : '') + '<em>' + esc(c.n) + '</em></span><b class="pa-crx">' + ex(c) + '</b>' + (c.evo ? '<i class="pa-crv">EVO</i>' : '');
}

export function label(c) {
  return c.n + ', ' + ex(c) + ' de elixir, ' + RAR[c.r] + (c.evo ? ', con evolución' : '');
}

export function chip(c, base, extra = '') {
  return '<span class="pa-crd pa-crm pa-cr-' + c.r + '" title="' + esc(label(c)) + '">' + face(c, base) + '<span class="pa-crn">' + esc(c.n) + '</span>' + (extra ? '<small>' + extra + '</small>' : '') + '</span>';
}

export function noArt(root) {
  root.addEventListener('error', e => {
    const t = e.target;
    if (!t || t.tagName !== 'IMG' || !t.parentElement) return;
    const p = t.parentElement;
    if (p.classList.contains('pa-crf')) p.classList.add('pa-crno');
    if (p.classList.contains('pa-bsm')) p.remove(); else t.remove();
  }, true);
}

export function pic(base, src, cls, w = 170, h = 170) {
  return base && src ? '<img class="' + cls + '" src="' + esc(base + src) + '" alt="" width="' + w + '" height="' + h + '" loading="lazy" decoding="async">' : '';
}
