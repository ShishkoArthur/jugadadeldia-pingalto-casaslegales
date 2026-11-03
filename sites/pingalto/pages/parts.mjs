// Small shared pieces of pingalto pages: number format, source line and quote, hero, structured data.
import { readFileSync } from 'node:fs';
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
// Hero: hubs get the big layout (girl: true), tool pages a compact one with a narrower figure column; a page without an accepted
// scene (service pages) gets the text-only hero.
export function hero(h, { ey, sub, girl = false, buttons = '' }) {
  const art = girlCard(h);
  return '<section class="pa-he' + (art ? (girl ? '' : ' pa-tl') : ' pa-sm') + '"><div><p class="pa-ey">' + h.esc(ey) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
    (sub ? '<p class="pa-sb">' + sub + '</p>' : '') + (buttons ? '<div class="pa-bt">' + buttons + '</div>' : '') + '</div>' + art + '</section>';
}
// Alt's card with the page scene (sites/pingalto/content/scenes.json, data/art/publish-scenes.mjs): every scene shares one 2:3
// canvas, so the figure keeps its height share fh of the card and the head size matches across pages. Empty string when the page has none.
const SCENES = JSON.parse(readFileSync(new URL('../content/scenes.json', import.meta.url), 'utf8'));
export function girlCard(h, path = h.page.path, { lazy = false } = {}) {
  const sc = SCENES.pages[path];
  if (!sc) return '';
  const [a, b] = sc.files;
  const pc = x => +(x * 100).toFixed(2);
  const img = '<img src="' + h.asset(a.name) + '" srcset="' + h.asset(a.name) + ' ' + a.w + 'w, ' + h.asset(b.name) + ' ' + b.w + 'w" sizes="(max-width:680px) ' + Math.ceil(100 * sc.fw) + 'px, ' + Math.ceil(240 * sc.fw) + 'px" width="' + a.w + '" height="' + a.h + '" alt="' + h.esc(sc.alt) + '"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async" style="height:' + pc(sc.fh) + '%">';
  return '<figure class="pa-girl"><b aria-hidden="true"><span>ALT</span><span>GUÍA</span></b><div><span class="pa-cv">' + img + '</span></div><figcaption>la guía de pingalto</figcaption></figure>';
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
