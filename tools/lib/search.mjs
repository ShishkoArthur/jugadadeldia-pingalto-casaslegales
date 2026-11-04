// Build step of the site search (owner 2026-11-04 "search in a dynamic format"): after tools/render.mjs has written every page,
// give each H2/H3 inside <main> an id (so a result can jump to its section), then write one compact index per language of the
// page (<html lang>) to SITE.search.file(lang): H1, title, description, key terms of the plan, FAQ questions and every section
// heading with the start of its text. Tables, scripts, quotes of sources and data-nosnippet blocks are left out (no feed numbers).
// The matching itself lives in engine/search.mjs (shared with the browser).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { decodeEntities } from '../../engine/text.mjs';
import { fold } from '../../engine/search.mjs';
import { ROOT } from '../env.mjs';

const ch = String.fromCharCode;
const CYR = new RegExp('[' + ch(0x400) + '-' + ch(0x52f) + ']');
const SNIP = 120;

const strip = h => h.replace(/<(script|style|svg|table|blockquote|template|noscript|select|output|form|button|label|figure)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<(details|div|section|aside|p|ul|ol)\b[^>]*\sdata-nosnippet\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<p\b[^>]*>(Cargando|Loading)[^<]*<\/p>/g, ' ');
export const textOf = h => decodeEntities(strip(h).replace(/<\/?(a|b|i|em|strong|small|mark|abbr|code|sup|sub|kbd|q|s|u)\b[^>]*>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const cut = (s, n = SNIP) => s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '') + '…';

// plan "keys": "quiniela matutina 40k/37 · quiniela matutina de hoy 37k/34" -> the search terms without volumes and notes
export function planTerms(keys) {
  const out = new Set();
  for (let k of String(keys || '').split(/\s*·\s*/)) {
    k = k.replace(/\([^)]*\)/g, ' ').replace(/\s[\d.,]+k?\s*\/\s*[\d\-]+.*$/i, ' ').trim();
    if (!k || CYR.test(k) || /^[-—]+$/.test(k)) continue;
    for (const w of k.split(/\s+/)) if (w.length > 1 && !/^\d+$/.test(w)) out.add(w);
  }
  return [...out].join(' ');
}

// ids for H2/H3 without one, unique in the page
export function addAnchors(html) {
  const m = html.match(/<main\b[^>]*>/);
  if (!m) return html;
  const start = m.index, end = html.indexOf('</main>', start);
  if (end < 0) return html;
  const used = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]));
  const main = html.slice(start, end).replace(/<(h2|h3)((?:\s[^>]*)?)>([\s\S]*?)<\/\1>/g, (all, tag, attrs, inner) => {
    if (/\sid="/.test(attrs)) return all;
    const base = fold(textOf(inner)).split(' ').slice(0, 6).join('-').slice(0, 48).replace(/-+$/, '');
    if (!base) return all;
    let id = base, n = 2;
    while (used.has(id)) id = base + '-' + n++;
    used.add(id);
    return '<' + tag + ' id="' + id + '"' + attrs + '>' + inner + '</' + tag + '>';
  });
  return html.slice(0, start) + main + html.slice(end);
}

export function entryOf(html, page, terms) {
  const get = re => decodeEntities((html.match(re) || [])[1] || '').trim();
  const m = html.match(/<main\b[^>]*>([\s\S]*)<\/main>/);
  const main = m ? m[1] : '';
  const heads = [...main.matchAll(/<(h2|h3)\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)];
  const s = [];
  heads.forEach((h, i) => {
    const head = textOf(h[3]);
    if (!head) return;
    const next = heads[i + 1] ? heads[i + 1].index : main.length;
    let x = cut(textOf(main.slice(h.index + h[0].length, next)));
    if ((x.match(/\d/g) || []).length > x.length * 0.15) x = '';
    s.push([h[2], head, x]);
  });
  const faq = [];
  for (const [, j] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let o; try { o = JSON.parse(j); } catch { continue; }
    for (const x of [].concat(o)) if (x && x['@type'] === 'FAQPage') for (const q of x.mainEntity || []) if (q && q.name && !s.some(e => fold(e[1]) === fold(q.name))) faq.push(q.name);
  }
  const t = textOf(get(/<h1\b[^>]*>([\s\S]*?)<\/h1>/));
  const n = get(/<title>([^<]*)<\/title>/);
  const e = { u: page.path, t, d: get(/<meta name="description" content="([^"]*)"/) };
  if (fold(n) !== fold(t)) e.n = n;
  const k = [terms, ...faq].filter(Boolean).join(' · ');
  if (k) e.k = k;
  if (page.help || page.kind === 'service') e.x = 1;
  if (s.length) e.s = s;
  return e;
}

// writes the index of every language; returns [{ lang, file, pages, bytes, gz }]
export function writeSearch({ dist, site, pages, id }) {
  const planFile = join(ROOT, 'data/plan', id + '.json');
  const plan = existsSync(planFile) ? JSON.parse(readFileSync(planFile, 'utf8')) : [];
  const norm = u => (u.replace(/\/+$/, '') || '/');
  const keys = new Map(plan.map(x => [norm(x.url), x.keys]));
  const byLang = {};
  for (const p of pages) {
    const f = join(dist, site.fileOf(p.path));
    if (!existsSync(f)) continue;
    let html = readFileSync(f, 'utf8');
    const anchored = addAnchors(html);
    if (anchored !== html) writeFileSync(f, (html = anchored));
    const lang = ((html.match(/<html lang="([a-z]{2})/) || [])[1]) || 'es';
    (byLang[lang] = byLang[lang] || []).push(entryOf(html, p, p.lang && p.lang !== 'es' ? '' : planTerms(keys.get(norm(p.path)))));
  }
  const out = [];
  for (const [lang, list] of Object.entries(byLang)) {
    const file = site.search.file(lang);
    const body = JSON.stringify({ v: 1, lang, p: list });
    if (CYR.test(body)) throw new Error('search index ' + file + ': Cyrillic in the index');
    mkdirSync(dirname(join(dist, file)), { recursive: true });
    writeFileSync(join(dist, file), body);
    out.push({ lang, file, pages: list.length, bytes: body.length, gz: gzipSync(body).length });
  }
  return out;
}
