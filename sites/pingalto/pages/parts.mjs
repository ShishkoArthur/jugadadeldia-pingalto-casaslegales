// Small shared pieces of pingalto pages: number format, source line and quote, hero, structured data.
import { readFileSync } from 'node:fs';
import { fmt, fmtFixed, fmtPct, fmtInput } from '../../../engine/games/num.mjs';
import { bgOf, bgName } from '../content/visual.mjs';
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
// scene (service pages) gets the text-only hero. A page of a game section (content/visual.mjs) lays our own background of that game
// under a veil in the theme colour: --hb1 on phones, --hb2 on wide screens (the browser fetches only the one it shows).
export function heroBg(h, path = h.page.path) {
  const id = bgOf(path);
  return id ? { cls: ' pa-hb', style: ' style="--hb1:url(' + h.asset(bgName(id, 960)) + ');--hb2:url(' + h.asset(bgName(id, 1600)) + ')"' } : { cls: '', style: '' };
}
export function hero(h, { ey, sub, girl = false, buttons = '' }) {
  const art = girlCard(h), bg = heroBg(h);
  return '<section class="pa-he' + (art ? (girl ? '' : ' pa-tl') : ' pa-sm') + bg.cls + '"' + bg.style + '><div><p class="pa-ey">' + h.esc(ey) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
    (sub ? '<p class="pa-sb">' + sub + '</p>' : '') + (buttons ? '<div class="pa-bt">' + buttons + '</div>' : '') + '</div>' + art + '</section>';
}
// Alt's card with the page scene (sites/pingalto/content/scenes.json, data/art/publish-scenes.mjs). The figure fills its frame: the
// frame is K times its width tall, times g of the scene (seated poses get a shorter frame and a slightly larger scale), and never wider
// than the figure needs. --r1 is the frame aspect on wide screens (K1), --r2 on small cards (K2). Frame widths in css/pa.css: the hero
// column is clamp(300px, 30vw, 380px) (frame = column - 20 px), 260 px at <= 860; on phones the hero card spans the row and its frame
// is g * clamp(320px, 100vw, 420px) tall (--g, --a = file width / height). A small card (/equipo) has a 170 px frame. sizes = frame
// width * share of the image in it, so phones with DPR 3 get at least 3x pixels. Empty string when the page has none.
const SCENES = JSON.parse(readFileSync(new URL('../content/scenes.json', import.meta.url), 'utf8'));
const K1 = 1.3, K2 = 1.55, FIT = 0.94;
const frameH = (sc, k) => Math.min(k * sc.g, FIT / sc.ar);
const px = x => Math.ceil(x) + 'px';
function sizes(sc, small) {
  const x1 = frameH(sc, K1) * sc.ar, x2 = frameH(sc, K2) * sc.ar;
  if (small) return '(max-width:680px) ' + px(170 * x2) + ', ' + px(170 * x1);
  return ['(max-width:420px) ' + Math.ceil(100 * sc.g * sc.ar) + 'vw', '(max-width:680px) ' + px(420 * sc.g * sc.ar),
    '(max-width:1000px) ' + px(280 * x1), '(max-width:1266px) calc((30vw - 20px) * ' + x1.toFixed(3) + ')', px(360 * x1)].join(', ');
}
export function girlCard(h, path = h.page.path, { lazy = false, small = false } = {}) {
  const sc = SCENES.pages[path];
  if (!sc) return '';
  const r = k => +(1 / frameH(sc, k)).toFixed(4);
  const a = sc.files[0];
  const set = sc.files.map(f => h.asset(f.name) + ' ' + f.w + 'w').join(', ');
  const img = '<img src="' + h.asset(a.name) + '" srcset="' + set + '" sizes="' + sizes(sc, small) + '" width="' + a.w + '" height="' + a.h + '" alt="' + h.esc(sc.alt) + '"' + (lazy ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async">';
  return '<figure class="pa-girl" style="--g:' + sc.g + ';--a:' + sc.ar + '"><b aria-hidden="true"><span>ALT</span><span>GUÍA</span></b><div style="--r1:' + r(K1) + ';--r2:' + r(K2) + '">' + img + '</div><figcaption>la guía de pingalto</figcaption></figure>';
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
