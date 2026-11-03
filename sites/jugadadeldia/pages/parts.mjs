// Shared pieces of jugadadeldia.com pages: hero with the girl slot, quotes with their source, Spanish cards, breadcrumbs.
import { fmt } from '../../../engine/games/num.mjs';

export { fmt };
export const pct = (x, d = 2) => fmt(x * 100, d) + ' %';
export const oneIn = n => '1 en ' + fmt(n, n < 100 ? 1 : 0);
export const money = n => '$ ' + fmt(n, 2);

// The girl of the site goes here later (owner's choice jdd-girl-r3-10; scenes per page). Until then a decorative panel of the
// same 2:3 size, with the scene name the images will use.
export const girl = scene => '<figure class="jg-girl" data-girl="' + scene + '" aria-hidden="true"><i class="jg-ba"></i><i class="jg-ba c3"></i><i class="jg-ba c4"></i><b></b></figure>';

export function hero(h, { kicker, lede, scene, actions = '' }) {
  return '<section class="jg-hero' + (scene ? '' : ' no-g') + '"><div><span class="jg-k">' + kicker + '</span><h1>' + h.esc(h.page.h1) + '</h1>' +
    (lede ? '<p class="jg-lede">' + lede + '</p>' : '') + (actions ? '<div class="jg-r">' + actions + '</div>' : '') + '</div>' + (scene ? girl(scene) : '') + '</section>';
}

export function cite(h, ids, label = 'De dónde sale') {
  const list = (Array.isArray(ids) ? ids : [ids]).map(id => h.src.fact(id));
  const by = new Map();
  for (const f of list) { if (!by.has(f.doc)) by.set(f.doc, { d: f.d, q: [] }); if (!by.get(f.doc).q.includes(f.quote)) by.get(f.doc).q.push(f.quote); }
  const body = [...by.values()].map(({ d, q }) => q.map(x => '<blockquote>' + h.esc(x) + '</blockquote>').join('') +
    '<cite>' + h.esc(d.title) + ' · <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(new URL(d.url).hostname.replace(/^www\./, '')) + '</a> · copia del ' + h.fmtDate(d.fetched) + '</cite>').join('');
  return '<details class="jg-src" data-nosnippet><summary>' + label + '</summary>' + body + '</details>';
}

export const btn = (h, path, label, primary) => h.built(path) ? '<a class="jg-b' + (primary ? ' p' : '') + '" href="' + h.href(path) + '">' + label + '</a>' : '';
export function tiles(h, list) {
  const items = list.filter(t => h.built(t[0]));
  if (!items.length) return '';
  return '<div class="jg-tg">' + items.map(([u, title, sub, color, icon]) => '<a href="' + h.href(u) + '"><i style="--c:' + color + '">' + icon + '</i><span><b>' + title + '</b><small>' + sub + '</small></span></a>').join('') + '</div>';
}
export const ICONS = {
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  calc: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6zM9 7h6M9 12h6M9 16h6"/></svg>',
  check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
  balls: '<svg viewBox="0 0 24 24"><circle cx="7.5" cy="16" r="4"/><circle cx="16.5" cy="16" r="4"/><circle cx="12" cy="8" r="4"/></svg>',
  cards: '<svg viewBox="0 0 24 24"><path d="M5 4h10v16H5zM15 7l4 1-3 12-1-.3M10 8v8"/></svg>',
  dice: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9h0M15 9h0M12 12h0M9 15h0M15 15h0" stroke-width="3"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/></svg>',
  hand: '<svg viewBox="0 0 24 24"><path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.6-1.5L8 13"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4l12 8-12 8z"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16"/></svg>',
};

// Spanish deck: suit symbols (one sprite per page) and a card face; the client (client/cards.js) draws the same markup.
export const SUIT = { e: 'espadas', b: 'bastos', o: 'oros', c: 'copas' };
export const NUM = { 1: 'as', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'sota', 11: 'caballo', 12: 'rey' };
export const SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
  '<symbol id="p-o" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="5.2" stroke="#fff" stroke-width="1.6"/><circle cx="12" cy="12" r="1.6" fill="#fff" stroke="none"/></symbol>' +
  '<symbol id="p-c" viewBox="0 0 24 24"><path d="M5 3h14c0 6-3 9-7 9S5 9 5 3z" fill="currentColor"/><path d="M12 12v6M7.5 21h9" stroke-width="2.6"/></symbol>' +
  '<symbol id="p-e" viewBox="0 0 24 24"><path d="M12 1.5l2.6 3L12 16l-2.6-11.5z" fill="currentColor"/><path d="M6.5 16h11M12 16v6" stroke-width="2.6"/></symbol>' +
  '<symbol id="p-b" viewBox="0 0 24 24"><path d="M9.5 2.5c3-1 6 .5 5.5 4l-1.7 15h-3.6L8.3 7c-.4-2.2.1-3.9 1.2-4.5z" fill="currentColor"/><path d="M10 8.5h4M10.6 13.5h3" stroke="#fff" stroke-width="1.6"/></symbol>' +
  '</defs></svg>';
export function card(c, extra = '') {
  const m = /^(\d+)([ebco])$/.exec(c);
  if (!m) throw new Error('card: bad card ' + c);
  const n = +m[1], s = m[2];
  const face = n >= 10 ? ({ 10: 'S', 11: 'C', 12: 'R' })[n] : String(n);
  return '<span class="jg-cd" data-s="' + s + '"' + extra + ' role="img" aria-label="' + NUM[n] + ' de ' + SUIT[s] + '"><b>' + face + '</b><svg><use href="#p-' + s + '"/></svg><small>' + n + '</small></span>';
}

export function crumbs(h, list) {
  return h.crumbs([['/', 'Inicio'], ...list, [h.page.path, h.page.h1]]);
}
export const webPage = (h, extra = {}) => ({ ...h.webPage(), author: { '@type': 'Person', name: 'Denis Krazok', url: 'https://' + h.site.domain + '/quien-escribe/' }, ...extra });
