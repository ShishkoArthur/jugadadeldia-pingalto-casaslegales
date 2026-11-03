// Isometric relief of the 24 jurisdictions (design "Relieve alto", owner 2026-11-03): every tile has a top and two side faces,
// and its height comes from the verified data - a jurisdiction with an official list rises with the number of sites in it.
// One markup for every map of the site: home (buttons), province hub (links), province, guide, operator and operator x province
// (static tiles). Heights are computed here, never typed in a page.
import { TILES } from '../content/map.mjs';

// height in px at scale 1: list = 10 + 6 per site, provincial platform 12, no source 6, no data 4
export function isoHeight(st, n) {
  if (st === 'list') {
    if (!Number.isInteger(n) || n < 0) throw new Error('isoHeight: bad count ' + n);
    return 10 + 6 * n;
  }
  return st === 'platform' ? 12 : st === 'blocked' ? 6 : 4;
}

// tiles: id -> { kind: list|platform|none|blocked|yes|no, h, on, label, attrs, href, title }
export function isoMap(h, tileOf, { size = 'm', aria, tag = 'i', group = false, ladder = '' } = {}) {
  let links = false;
  const tiles = TILES.map(t => {
    const x = tileOf(t);
    if (x.href) links = true;
    const cls = 'rl-k-' + x.kind + (x.on ? ' rl-on' : '');
    const el = x.href ? 'a' : tag;
    const attrs = (x.href ? ' href="' + x.href + '"' : '') + (x.attrs || '') + (x.title ? ' title="' + h.esc(x.title) + '"' : '');
    return '<' + el + ' class="' + cls + '" style="grid-area:' + t.area + ';--h:' + x.h + '"' + attrs + '><b>' + t.code + '</b>' +
      (x.label ? '<u aria-hidden="true">' + h.esc(x.label) + '</u>' : '') + '</' + el + '>';
  }).join('');
  const role = group || links ? ' role="group"' : aria ? ' role="img"' : ' aria-hidden="true"';
  return '<div class="rl-iso rl-iso-' + size + '" data-nosnippet><div class="rl-isog"' + (group ? ' data-rl-map' : '') + role + (aria ? ' aria-label="' + h.esc(aria) + '"' : '') + '>' + tiles + '</div>' + ladder + '</div>';
}

// "height ladder": the jurisdictions with an official list, tallest first, bar height = sites in the list
export function isoLadder(h, P) {
  const rows = P.all.filter(x => x.st === 'list').sort((a, b) => b.n - a.n || a.code.localeCompare(b.code));
  return '<ol class="rl-esc" aria-label="Sitios en cada lista oficial verificada">' +
    rows.map(x => '<li style="--n:' + x.n + '"><i></i><span>' + h.esc(x.code) + '</span><b>' + x.n + '</b></li>').join('') + '</ol>';
}
