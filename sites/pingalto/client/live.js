import { load, arDay } from './fdkit.js';
import { fmt } from '../../../engine/games/num.mjs';
import { verCmp } from '../../../engine/games/riot.mjs';

export const isEn = () => /^en/.test(document.documentElement.lang || '');
export function feed(el, name) {
  const src = el && el.dataset.fdSrc;
  if (!src) return Promise.resolve(null);
  return load(src, name).then(d => (d && d.data ? d : null), () => null);
}
export const newer = (a, b) => { try { return verCmp(a, b) > 0; } catch (e) { return false; } };
const MON = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
export function fdate(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return isEn() ? +d + ' ' + MON[+m - 1] + ' ' + y : d + '/' + m + '/' + y;
}
export const dayOf = doc => arDay(doc.updated);
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function swap(root, pairs) {
  const map = new Map(pairs.filter(([a, b]) => a !== '' && a !== b).map(([a, b]) => [String(a), String(b)]));
  if (!root || !map.size) return;
  const re = new RegExp('(?<![\\d.,/])(' + [...map.keys()].sort((a, b) => b.length - a.length).map(reEsc).join('|') + ')(?![\\d]|[.,/]\\d)', 'g');
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  for (const n of nodes) { const t = n.nodeValue.replace(re, m => map.get(m)); if (t !== n.nodeValue) n.nodeValue = t; }
  const vers = [...map].filter(([a]) => /^\d+(\.\d+){2,}$/.test(a));
  for (const a of root.querySelectorAll ? root.querySelectorAll('a[href]') : []) { let u = a.getAttribute('href'); for (const [x, y] of vers) u = u.split('/' + x + '/').join('/' + y + '/'); if (u !== a.getAttribute('href')) a.setAttribute('href', u); }
}
export const num = n => fmt(n, 0);
export function swapAll(sel, pairs) { for (const el of document.querySelectorAll(sel)) swap(el, pairs); }
