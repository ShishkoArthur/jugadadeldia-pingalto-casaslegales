// Small shared pieces of casaslegales pages.
export function src(h, slug, extra = '') {
  const d = h.doc(slug);
  return '<p class="rl-src">Fuente: <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.host) + '</a> · copia guardada el ' + h.fmtDate(d.fetched) + (extra ? ' · ' + extra : '') + '</p>';
}
export function quote(h, q, label) {
  const d = h.doc(q.doc);
  return '<blockquote class="rl-q" cite="' + h.esc(d.url) + '">«' + h.esc(q.text) + '»<cite>' + h.esc(label) + ' · <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.host) + '</a> · copia del ' + h.fmtDate(d.fetched) + '</cite></blockquote>';
}
export function rgQuote(h, e, label) {
  return quote(h, { doc: 'rg:' + e.doc, text: e.quote }, label);
}
export function hostHtml(h, host, jur) {
  const pre = /^(pba|caba|cba|cordoba)\./.exec(host);
  return '<span class="rl-host">' + (pre ? '<b>' + h.esc(pre[0]) + '</b>' + h.esc(host.slice(pre[0].length)) : h.esc(host)) + '</span>';
}
export function sectionHead(h, title, note) {
  return '<div class="rl-hh"><h2>' + h.esc(title) + '</h2>' + (note ? '<p>' + h.esc(note) + '</p>' : '') + '</div>';
}
