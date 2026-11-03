// Pieces of operator, verifier and brand-check pages: licence map (inline SVG), address anatomy, operator quotes (no link
// to the operator: its address is text), screenshot figures.
import { TILES, CODE } from '../content/map.mjs';
import { anatomy } from '../../../engine/hostcheck.mjs';
import { docOf } from '../content/opdata.mjs';

const S = 40, G = 4;
function cell(area) {
  const [r, c, r2, c2] = area.split('/').map(Number);
  return { x: (c - 1) * S, y: (r - 1) * S, w: ((c2 || c + 1) - c) * S - G, h: ((r2 || r + 1) - r) * S - G };
}
// state(jid) -> 'yes' | 'no' | 'na'; label(jid) -> short text under the code for 'yes'
export function licenceMap(h, { state, title, label = () => '' }) {
  const tiles = TILES.map(t => {
    const st = state(t.id), b = cell(t.area), name = h.rg.prov(t.id).name;
    const tip = name + ': ' + (st === 'yes' ? 'figura en la lista oficial' + (label(t.id) ? ' (' + label(t.id) + ')' : '') : st === 'no' ? 'no figura en la lista oficial' : 'sin dato verificado');
    const mark = st === 'yes' ? '<path class="rl-mk" d="M' + (b.x + b.w - 15) + ' ' + (b.y + 9) + 'l4 4 7-8"/>' : st === 'no' ? '<path class="rl-mx" d="M' + (b.x + b.w - 14) + ' ' + (b.y + 6) + 'l7 7m0-7-7 7"/>' : '';
    return '<g class="rl-m-' + st + '"><title>' + h.esc(tip) + '</title><rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="7"/>' +
      '<text x="' + (b.x + 6) + '" y="' + (b.y + b.h - 8) + '">' + t.code + '</text>' + mark + '</g>';
  }).join('');
  return '<svg class="rl-lmap" viewBox="-2 -2 ' + (5 * S + 4) + ' ' + (9 * S + 4) + '" role="img" aria-label="' + h.esc(title) + '">' + tiles + '</svg>';
}
export function mapLegend() {
  return '<ul class="rl-mleg"><li><i class="rl-m-yes"></i>figura en la lista oficial</li><li><i class="rl-m-no"></i>no figura en la lista oficial</li><li><i class="rl-m-na"></i>sin dato verificado: todavía no guardamos esa lista</li></ul>';
}
export function anat(h, host, opts = {}) {
  const a = anatomy(host);
  if (!a) return '';
  const part = (cls, txt, lab) => txt ? '<span class="' + cls + '"><b>' + h.esc(txt) + '</b><small>' + h.esc(lab) + '</small></span>' : '';
  return '<div class="rl-anat' + (opts.dim ? ' rl-anat-dim' : '') + '" aria-label="' + h.esc(a.host) + '">' +
    part('rl-a-sub', a.sub ? a.sub + '.' : '', 'subdominio') + part('rl-a-name', a.name, 'nombre') + part('rl-a-end' + (a.betAr ? ' rl-a-bet' : ''), '.' + a.ending, a.betAr ? 'terminación .bet.ar' : 'otra terminación') + '</div>';
}
export function opQuote(h, D, q, label) {
  const d = docOf(D, q.doc);
  return '<blockquote class="rl-q">«' + h.esc(q.text) + '»<cite>' + h.esc(label || d.title || d.host) + ' · <span class="rl-host">' + h.esc(d.host + (d.path === '/' ? '' : d.path)) + '</span> · copia del ' + h.fmtDate(d.fetched) + '</cite></blockquote>';
}
export function opSrcQuote(h, D, q, label) {
  const d = docOf(D, q.doc);
  if (d.official) return '<blockquote class="rl-q" cite="' + h.esc(d.url) + '">«' + h.esc(q.text) + '»<cite>' + h.esc(label) + ' · <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.host) + '</a> · copia del ' + h.fmtDate(d.fetched) + '</cite></blockquote>';
  return opQuote(h, D, q, label);
}
export function shotFigure(h, s, label) {
  const u = new URL(s.finalUrl || s.url);
  return '<figure class="rl-shot"><div class="rl-shot-bar"><i></i><i></i><i></i><span>' + h.esc(u.hostname + (u.pathname === '/' ? '' : u.pathname)) + '</span></div>' +
    '<img src="' + h.asset('shots/' + s.id + '.webp') + '" width="' + s.width + '" height="' + s.height + '" loading="lazy" decoding="async" alt="' + h.esc(label + ': ' + u.hostname) + '">' +
    '<figcaption><b>' + h.esc(label) + '</b> Captura propia de la página pública · ' + h.fmtDate(s.date) + '</figcaption></figure>';
}
export function codeOf(jid) { return CODE[jid]; }
export const listsDate = h => h.fmtDate(h.regs.map(r => r.checked).sort()[0]);
