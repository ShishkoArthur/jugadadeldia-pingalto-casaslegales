// Small shared pieces of pingalto pages: number format, source line and quote, hero, structured data.
import { fmt, fmtFixed, fmtPct, fmtInput } from '../../../engine/games/num.mjs';
export { fmt, fmtFixed, fmtPct, fmtInput };

const KIND = { official: ['oficial', 'pa-of'], community: ['comunidad', 'pa-cm'], reference: ['referencia', ''] };
export function kindTag(h, kind) {
  const [t, c] = KIND[kind] || KIND.reference;
  return '<span class="pa-tag' + (c ? ' ' + c : '') + '">' + t + '</span>';
}
const host = u => new URL(u).hostname.replace(/^www\./, '');
export function srcLine(h, slug, extra = '') {
  const d = h.pa.doc(slug);
  return '<p class="pa-src">Fuente ' + kindTag(h, d.kind) + ' <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.publisher) + '</a> · copia del ' + h.fmtDate(d.fetched) + (extra ? ' · ' + extra : '') + '</p>';
}
export function quote(h, factId, lang = 'en') {
  const f = h.pa.src.facts[factId], d = h.pa.doc(f.doc);
  return '<blockquote class="pa-q" cite="' + h.esc(d.url) + '"' + (lang ? ' lang="' + lang + '"' : '') + '>«' + h.esc(f.quote) + '»<cite lang="es">' + kindTag(h, d.kind) + ' <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.publisher) + '</a> · ' + h.esc(host(d.url)) + ' · copia del ' + h.fmtDate(d.fetched) + '</cite></blockquote>';
}
export function hero(h, { ey, sub, girl = false, buttons = '' }) {
  return '<section class="pa-he' + (girl ? '' : ' pa-sm') + '"><div><p class="pa-ey">' + h.esc(ey) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
    (sub ? '<p class="pa-sb">' + sub + '</p>' : '') + (buttons ? '<div class="pa-bt">' + buttons + '</div>' : '') + '</div>' + (girl ? girlCard() : '') + '</section>';
}
export function girlCard() {
  return '<div class="pa-girl" role="img" aria-label="Lugar de Alt, la guía de pingalto"><b><span>ALT</span><span>GUÍA</span></b><div><svg viewBox="0 0 100 150" aria-hidden="true"><path d="M50 10c-13 0-20 9-20 22 0 8-3 14-6 18 8 2 14-1 16-4h20c2 3 8 6 16 4-3-4-6-10-6-18 0-13-7-22-20-22zM44 50h12l2 8 14 6 4 34-8 2-2-20-4 24 3 44h-9l-6-36-6 36h-9l3-44-4-24-2 20-8-2 4-34 14-6z"/></svg></div><span>la guía de pingalto</span></div>';
}
export function ldPage(h, extra = []) {
  const O = 'https://' + h.site.domain;
  const org = { '@type': 'Organization', name: 'pingalto', url: O + '/' };
  const crumbs = h.page.path === '/' ? [] : [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'pingalto', item: O + '/' }, { '@type': 'ListItem', position: 2, name: h.page.h1, item: O + h.page.path }] }];
  return [{ '@context': 'https://schema.org', '@type': 'WebPage', name: h.page.h1, url: O + h.page.path, inLanguage: h.site.htmlLang, dateModified: h.pa.src.checked, publisher: org }, ...crumbs, ...extra];
}
export function sec(title, inner, id) {
  return '<section class="pa-sec"' + (id ? ' id="' + id + '"' : '') + '><h2>' + title + '</h2>' + inner + '</section>';
}
