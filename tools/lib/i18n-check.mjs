// Gates of the English versions (tools/check-dist.mjs calls i18nGate for a site with SITE.langs including 'en'; docs/I18N.md):
//   hreflang   every page with a counterpart carries exactly es-AR, en and x-default (= Spanish), the targets exist and point back;
//              a page without a counterpart carries none; the sitemap lists the same pairs
//   langlink   an English page links only to English pages, a Spanish page only to Spanish ones (language links with hreflang apart)
//   langswitch a page with a counterpart has a link to it with hreflang (the switcher of the site's header)
//   spanish    visible text of an English page with Spanish words left (glossary names, quotes in Spanish, lang="es" and
//              translate="no" elements apart)
//   decimal    a decimal comma on an English page ("2,5")
//   oglocale   og:locale of an English page is en_US
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { HREFLANG, OG_LOCALE, loadGlossary, spanishLeft } from './i18n.mjs';
import { loadRg } from './sources.mjs';

const dec = s => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
// the HTML without every element whose opening tag matches re (nesting counted)
function drop(H, re) {
  let out = H, m;
  const r = new RegExp(re.source, 'g');
  while ((m = r.exec(out))) {
    const name = m[1], tre = new RegExp('<(/?)' + name + '\\b[^>]*>', 'g');
    tre.lastIndex = m.index;
    let depth = 0, x, end = -1;
    while ((x = tre.exec(out))) { depth += x[1] ? -1 : 1; if (!depth) { end = tre.lastIndex; break; } }
    if (end < 0) break;
    out = out.slice(0, m.index) + ' ' + out.slice(end);
    r.lastIndex = m.index;
  }
  return out;
}
export function englishText(H) {
  let b = H.replace(/<head[\s\S]*?<\/head>/i, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
  b = drop(b, /<(blockquote)\b[^>]*>/);
  b = drop(b, /<([a-z][\w-]*)\b[^>]*\s(?:lang="es[^"]*"|translate="no")[^>]*>/);
  const attrs = [...b.matchAll(/\s(?:alt|title|aria-label|placeholder)="([^"]*)"/g)].map(m => m[1]).join(' • ');
  const t = b.replace(/<\/?(?:b|i|em|strong|a|span|small|abbr|sup|sub|time|mark|cite|q|code|s|u)\b[^>]*>/g, ' ').replace(/<[^>]+>/g, ' • ');
  return dec(t + ' • ' + attrs).replace(/(?:https?:\/\/)?\b[\w-]+(?:\.[\w-]+)*\.(?:ar|com|org|net|gov|gob)\b(?:\/\S*)?/g, ' ').replace(NAME_CHAIN, ' ').replace(/\s+/g, ' ');
}
// Spanish proper names: capitalized words joined by de/del/la/y ("Instituto Provincial de Juegos de Azar del Neuquén", "LOTERÍA DE LA CIUDAD")
const CAP = '[A-ZÁÉÍÓÚÑ][\\p{L}.]*';
const LINK = '(?:de|del|la|las|los|y|e|DE|DEL|LA|LAS|LOS|Y)';
const NAME_CHAIN = new RegExp(CAP + '(?:\\s+' + CAP + ')*(?:\\s+' + LINK + ')+\\s+' + CAP + '(?:\\s+(?:' + LINK + '\\s+)*' + CAP + ')*', 'gu');

// names of institutions in the help package (they stay in Spanish on English pages)
function institutions() {
  const out = new Set();
  const walk = (x, k) => {
    if (typeof x === 'string') { if ((k === 'short' || k === 'name') && /^(Instituto|Lotería|Caja|Ente|Administración|Programa|Dirección|Asociación|Sociedad|Ministerio|Secretaría|Juego|Agencia|Superintendencia|Comisión|Consejo|Banco|Hospital|Centro)\b/.test(x)) { out.add(x); out.add(x.replace(/\s*\([^)]*\)\s*$/, '')); } return; }
    if (Array.isArray(x)) x.forEach(v => walk(v, k)); else if (x && typeof x === 'object') for (const [kk, v] of Object.entries(x)) walk(v, kk);
  };
  walk(loadRg(), '');
  return [...out];
}
export function i18nGate({ S, dist, html, pageByFile, bad, sitemap }) {
  const { SITE } = S;
  const ORIGIN = 'https://' + SITE.domain;
  const enOf = new Map(S.PAGES_EN.map(p => [p.esPath, p.path])), esOf = new Map(S.PAGES_EN.map(p => [p.path, p.esPath]));
  const G = loadGlossary(S.id);
  const allow = [...(G.keep || []), ...((SITE.i18n && SITE.i18n.allow) || []), ...institutions()];
  const alternates = H => [...H.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(m => m[1] + ' ' + m[2]).sort();
  const want = esPath => [HREFLANG.es + ' ' + ORIGIN + esPath, HREFLANG.en + ' ' + ORIGIN + enOf.get(esPath), 'x-default ' + ORIGIN + esPath].sort();
  const fileOf = u => join(dist, SITE.fileOf(u));
  for (const [f, p] of pageByFile) {
    const H = html[f];
    if (!H) continue;
    const en = p.lang === 'en', esPath = en ? p.esPath : p.path, pair = enOf.has(esPath);
    const alts = alternates(H);
    if (!pair) { if (alts.length) bad('hreflang', f, 'hreflang on a page without an English version'); }
    else {
      const w = want(esPath);
      if (alts.join('|') !== w.join('|')) bad('hreflang', f, 'hreflang set ' + (alts.join(', ') || '(none)') + ' instead of ' + w.join(', '));
      const other = en ? esPath : enOf.get(esPath), of = fileOf(other);
      if (!existsSync(of)) bad('hreflang', f, 'hreflang to a missing page ' + other);
      else if (alternates(html[of] || readFileSync(of, 'utf8')).join('|') !== w.join('|')) bad('hreflang', f, 'hreflang not reciprocal: ' + other);
      const sw = [...H.matchAll(/<a\b[^>]*\shreflang="[^"]+"[^>]*>/g)].map(m => (m[0].match(/\shref="([^"]*)"/) || [])[1]);
      if (!sw.includes(other)) bad('langswitch', f, 'no language link (with hreflang) to ' + other);
      const loc = sitemap.match(new RegExp('<url><loc>' + (ORIGIN + p.path).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</loc>.*?</url>'));
      if (loc && (loc[0].match(/<xhtml:link /g) || []).length !== 3) bad('hreflang', null, 'sitemap: ' + p.path + ' without its 3 alternates');
    }
    // links stay in the language of the page
    for (const [tag] of H.replace(/<head[\s\S]*?<\/head>/i, '').matchAll(/<a\b[^>]*>/g)) {
      if (/\shreflang="/.test(tag)) continue;
      const u = dec((tag.match(/\shref="([^"]*)"/) || [])[1] || '');
      if (!u.startsWith('/') || u.startsWith('/' + SITE.assetDir + '/') || /\.\w+$/.test(u.split(/[?#]/)[0])) continue;
      const base = u.split(/[?#]/)[0], isEn = base === '/en/' || base.startsWith('/en/') || esOf.has(base);
      if (en && !isEn) { bad('langlink', f, 'English page links to the Spanish page ' + u); break; }
      if (!en && isEn) { bad('langlink', f, 'Spanish page links to the English page ' + u); break; }
    }
    if (!en) continue;
    const og = (H.match(/<meta property="og:locale" content="([^"]+)"/) || [])[1];
    if (og && og !== OG_LOCALE.en) bad('oglocale', f, 'og:locale ' + og + ' on an English page');
    const text = englishText(H);
    const meta = englishText('<body><p>' + ((H.match(/<title>([^<]*)/) || [])[1] || '') + '</p><p>' + ((H.match(/name="description" content="([^"]*)"/) || [])[1] || '') + '</p>');
    const hits = spanishLeft(text + ' \u2022 ' + meta, allow);
    if (hits.length) bad('spanish', f, hits.length + ' Spanish word(s) left: ' + hits.slice(0, 3).join(' || '));
    const dm = text.match(/(?<![\w.,])\d+,\d{1,2}(?![\d,\w])/);
    if (dm) bad('decimal', f, 'decimal comma on an English page "' + dm[0] + '"');
  }
}
