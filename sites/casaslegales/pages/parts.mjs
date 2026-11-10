// Small shared pieces of casaslegales pages.
import { opPath } from '../content/operators.mjs';
import { officialUrl, DEAD } from '../content/official.mjs';

// every brand of a verified list is a link to its operator page (gate brandlink in tools/check-dist.mjs)
export function brandLink(h, brand, text) {
  return '<a href="' + h.href(opPath(brand)) + '">' + h.esc(text === undefined ? h.names[brand] : text) + '</a>';
}
// data-rv: the key of the copy in /data/feeds/listas.json (server recheck); ui.js adds "revisada el ..." when it is newer than data-rvd
export const rvAttr = (h, key, d) => ' data-rv="' + h.esc(key) + '" data-rvd="' + h.esc(d.fetched) + '"';
export function src(h, slug, extra = '') {
  const d = h.doc(slug);
  return '<p class="rl-src"' + rvAttr(h, slug, d) + '>Fuente: <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.host) + '</a> · copia guardada el ' + h.fmtDate(d.fetched) + (extra ? ' · ' + extra : '') + '</p>';
}
export function quote(h, q, label) {
  const d = h.doc(q.doc);
  return '<blockquote class="rl-q" cite="' + h.esc(d.url) + '">«' + h.esc(q.text).replace(/@/g, '<span>@</span>') + '»<cite' + rvAttr(h, q.doc, d) + '>' + h.esc(label) + ' · <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.host) + '</a> · copia del ' + h.fmtDate(d.fetched) + '</cite></blockquote>';
}
export function rgQuote(h, e, label) {
  return quote(h, { doc: 'rg:' + e.doc, text: e.quote }, label);
}
export function hostHtml(h, host, jur) {
  const pre = /^(pba|caba|cba|cordoba|larioja)\./.exec(host);
  return '<span class="rl-host">' + (pre ? '<b>' + h.esc(pre[0]) + '</b>' + h.esc(host.slice(pre[0].length)) : h.esc(host)) + '</span>';
}
export function sectionHead(h, title, note, icon) {
  return '<div class="rl-hh"' + (icon ? ' data-i="' + icon + '"' : '') + '><h2>' + h.esc(title) + '</h2>' + (note ? '<p>' + h.esc(note) + '</p>' : '') + '</div>';
}
// "Ir al sitio oficial (<province>)": the address the verified list of that province names for the brand (content/official.mjs)
export function officialLink(h, jid, brand, opts = {}) {
  const r = h.reg(jid), l = r.licensees.find(x => x.brand === brand && (!opts.host || x.host === opts.host));
  if (!l) throw new Error('official link: ' + brand + ' is not in the ' + jid + ' list');
  const u = officialUrl(l), p = h.rg.prov(jid).name;
  if (DEAD[l.host]) return '<p class="rl-offx">' + h.esc(new URL(u).hostname) + ' (lista de ' + h.esc(p) + ') no respondía cuando la revisamos, el ' + h.fmtDate(DEAD[l.host]) + ': su nombre no apuntaba a ningún servidor. Por eso no hay botón.</p>';
  return '<a class="rl-off' + (opts.small ? ' rl-off-s' : '') + '" href="' + h.esc(u) + '" rel="nofollow noopener" target="_blank"><span>Ir al sitio oficial (' + h.esc(p) + ')</span><small>' + h.esc(new URL(u).hostname) + ' · según ' + h.esc(r.regulator.short) + '</small></a>';
}
export function officialLinks(h, brand, jids, opts = {}) {
  if (!jids.length) return '';
  return '<div class="rl-offs">' + jids.map(j => officialLink(h, j, brand, opts)).join('') + '</div>' +
    (opts.note === false ? '' : '<p class="rl-offn">Enlace a la dirección que publica la lista oficial de cada provincia, sin códigos de afiliado. Solo mayores de 18; entrá al sitio de la provincia donde estás.</p>');
}
