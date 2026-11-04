// Shared i18n engine (docs/I18N.md). A site turns English on with SITE.langs = ['es', 'en']; its pages keep their Spanish code and
// the build renders every page a second time in "en" mode: the layout gets h.lang = 'en', h.site.htmlLang = 'en', English title,
// description and H1 from data/plan/<site>.json (urlEn, titleEn, descriptionEn, h1En), and the finished HTML goes through htmlToEn():
// every text run between block tags (inline tags kept as <tN> markers), translatable attributes, JSON-LD strings and official
// quotes are looked up in the site dictionary (sites/<site>/i18n/en.mjs, exact Spanish -> English) and then in the translation
// memory (data/i18n/<site>-en.json, filled by tools/translate.mjs through the Claude API); internal links go to the /en/ pages.
// Browser modules get English variants the same way (string literals, data/i18n/<site>-en.json "code"). The build never calls the
// API: a missing string stops it with the list (node tools/translate.mjs <site>).
// Numbers: English separators ("$ 1,234.50", "40.5%"), dates "4 Nov 2026", times stay 24-hour ("21:00, Argentina time").
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse } from 'acorn';
import { ROOT } from '../env.mjs';

export const HREFLANG = { es: 'es-AR', en: 'en' };
export const OG_LOCALE = { es: 'es_AR', en: 'en_US' };
export const LANG_LABEL = { es: 'Español', en: 'English' };
export const langsOf = SITE => SITE.langs || ['es'];
export const hasEn = SITE => langsOf(SITE).includes('en');
// a path of the site: its own scheme, or "/en" + a path of its scheme
export const sitePath = (SITE, u) => SITE.pathRe.test(u) || (hasEn(SITE) && u.startsWith('/en/') && SITE.pathRe.test(u.slice(3)));
export const langOfPath = u => (u === '/en/' || u.startsWith('/en/') ? 'en' : 'es');

// ---------- English page data from the plan ----------
export function planEn(id) {
  const f = join(ROOT, 'data/plan', id + '.json');
  if (!existsSync(f)) return new Map();
  const rows = JSON.parse(readFileSync(f, 'utf8'));
  const out = new Map();
  for (const r of Array.isArray(rows) ? rows : []) if (r && r.url && r.urlEn) out.set(r.url, { path: r.urlEn, title: r.titleEn, description: r.descriptionEn, h1: r.h1En });
  return out;
}

// ---------- translation memory ----------
export const memoryFile = id => join(ROOT, 'data/i18n', id + '-en.json');
export const glossaryFile = id => join(ROOT, 'data/i18n', id + '-glossary.json');
export function loadMemory(id) {
  const f = memoryFile(id);
  const m = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
  return { text: m.text || {}, code: m.code || {} };
}
export function saveMemory(id, mem) {
  const sort = o => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]]));
  mkdirSync(dirname(memoryFile(id)), { recursive: true });
  writeFileSync(memoryFile(id), JSON.stringify({ _about: 'Spanish -> English for ' + id + ' (tools/translate.mjs; docs/I18N.md). text: page strings, code: browser module strings "file :: literal".', text: sort(mem.text), code: sort(mem.code) }, null, 1) + '\n');
}
export const loadGlossary = id => (existsSync(glossaryFile(id)) ? JSON.parse(readFileSync(glossaryFile(id), 'utf8')) : { keep: [], terms: {} });

// ---------- numbers ----------
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LEGAL = /(Ley|Leyes|Decreto|Res\.|Resoluci[oó]n|Disposici[oó]n|N[°º]|Nro\.?|nro\.?|Expte\.?|Expediente|Acordada|Ordenanza|Law|Decree)\s*$/;
// es-AR number writing -> English: "1.234,50" -> "1,234.50", "2,5" -> "2.5", "40,0 %" -> "40.0%", "04/11/2026" -> "4 Nov 2026".
// Law and decree numbers keep their official form ("Ley 15.079").
export function numEn(s) {
  s = s.replace(/(?<![\d/])(\d{1,2})\/(\d{1,2})\/(\d{4})(?![\d/])/g, (m, d, mo, y) => (+mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31 ? +d + ' ' + MON[+mo - 1] + ' ' + y : m));
  s = s.replace(/(?<![\d.,])(?:(\d{1,3}(?:\.\d{3})+)(?:,(\d+))?|(\d+),(\d+))(?![\d]|[.,]\d)/g, (m, gi, gf, di, df, off, all) => {
    if (gi) return LEGAL.test(all.slice(Math.max(0, off - 18), off)) ? m : gi.replace(/\./g, ',') + (gf ? '.' + gf : '');
    return di + '.' + df;
  });
  return s.replace(/(\d)[   ]%/g, '$1%');
}
// numbers a translation must keep: every digit run of the source, except that small whole numbers may be spelled out
const NUM_RE = /\d+(?:[.,:]\d+)*/g;
const ES_WORDS = /\b(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|primer[oa]?|segund[oa]|tercer[oa]?|cuart[oa]|quint[oa]|sext[oa]|mitad|medio|media|doble|triple|ambos|ambas|par|pares)\b/i;
const EN_WORDS = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|first|second|third|fourth|fifth|sixth|half|double|triple|both|single|pair|once|twice|a|an)\b/i;
const small = t => /^(?:[1-9]|1[0-2])$/.test(t);
export function numbersProblem(src, out) {
  const S = src.match(NUM_RE) || [], T = out.match(NUM_RE) || [];
  const ss = new Set(S), ts = new Set(T);
  for (const t of ss) if (!ts.has(t) && !(small(t) && EN_WORDS.test(out))) return 'number "' + t + '" of the source is missing';
  for (const t of ts) if (!ss.has(t) && !(small(t) && ES_WORDS.test(src))) return 'number "' + t + '" is not in the source';
  return null;
}

// ---------- HTML ----------
const BLOCK = new Set(('html head body header footer main nav section article aside div p ul ol li dl dt dd h1 h2 h3 h4 h5 h6 table thead tbody tfoot tr td th caption ' +
  'figure figcaption blockquote form fieldset legend label button select option optgroup textarea details summary dialog pre hr address canvas noscript ' +
  'template iframe video audio picture source meta link title script style input meter progress').split(' '));
const VOID = new Set('br img wbr input hr meta link source col area embed param track'.split(' '));
const ATTRS = ['alt', 'title', 'aria-label', 'placeholder'];
const LETTERS = /[A-Za-zÀ-ɏ]{2,}/;
export const hasWords = s => LETTERS.test(String(s).replace(/<[^>]*>/g, ' ').replace(/&\w+;/g, ' '));
const dec = s => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const escText = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => escText(s).replace(/"/g, '&quot;');
const tagName = t => (t.match(/^<\/?([a-zA-Z][\w-]*)/) || [])[1]?.toLowerCase() || '';
const attr = (t, a) => { const m = t.match(new RegExp('\\s' + a + '="([^"]*)"')); return m ? m[1] : null; };
// tokens: atomic pieces (script, style, svg, elements with translate="no"), tags and text
function tokenize(html) {
  const out = [];
  const re = /<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<svg\b[\s\S]*?<\/svg>|<!--[\s\S]*?-->|<[^>]+>|[^<]+/g;
  let m;
  while ((m = re.exec(html))) {
    const t = m[0];
    if (t[0] !== '<') { out.push({ k: 'text', v: t }); continue; }
    if (/^<(script|style|svg|!--)/i.test(t)) { out.push({ k: 'atom', v: t, name: tagName(t) }); continue; }
    const name = tagName(t), close = t.startsWith('</');
    if (!close && (/\stranslate="no"/.test(t) || name === 'blockquote') && !VOID.has(name) && !t.endsWith('/>')) {
      // whole element as one piece, nesting counted
      const tre = new RegExp('<(/?)' + name + '\\b[^>]*>', 'g');
      tre.lastIndex = m.index;
      let depth = 0, x, end = -1;
      while ((x = tre.exec(html))) { depth += x[1] ? -1 : 1; if (!depth) { end = tre.lastIndex; break; } }
      if (end > 0) { out.push({ k: 'atom', v: html.slice(m.index, end), name, quote: name === 'blockquote' && !/\stranslate="no"/.test(t) }); re.lastIndex = end; continue; }
    }
    out.push({ k: 'tag', v: t, name, close, block: BLOCK.has(name), void: VOID.has(name) || t.endsWith('/>') });
  }
  return out;
}
// a run of text and inline tags -> { key, apply(en) }; key is the decoded text with <tN>, </tN>, <tN/> markers, numbers already English
function runKey(items) {
  const marks = [], stack = [];
  let key = '';
  items.forEach(it => {
    if (it.k === 'text') { key += numEn(dec(it.v)); return; }
    if (it.k === 'atom' || it.void) { marks.push(it.v); key += '<t' + marks.length + '/>'; return; }
    if (!it.close) { marks.push(it.v); stack.push([it.name, marks.length, key.length]); key += '<t' + marks.length + '>'; return; }
    const i = stack.map(s => s[0]).lastIndexOf(it.name);
    if (i >= 0) { const [, n] = stack[i]; stack.splice(i); marks.push(it.v); key += '</t' + n + '>'; marks[marks.length - 1] = { close: n, v: it.v }; return; }
    marks.push(it.v); key += '<t' + marks.length + '/>';
  });
  // unclosed open markers become void markers
  for (const [, n] of stack) key = key.replace('<t' + n + '>', '<t' + n + '/>');
  return { key, marks };
}
const MARK_RE = /<(\/?)t(\d+)(\/?)>/g;
// markers of a key: "o3", "c3", "v3"
const markList = k => [...k.matchAll(MARK_RE)].map(m => (m[1] ? 'c' : m[3] ? 'v' : 'o') + m[2]);
export function markersProblem(src, out) {
  const a = markList(src).sort().join(' '), b = markList(out).sort().join(' ');
  if (a !== b) return 'markers must be exactly ' + (a || '(none)') + ', got ' + (b || '(none)');
  const order = markList(out);
  for (const x of order) if (x[0] === 'c' && order.indexOf('o' + x.slice(1)) > order.indexOf(x)) return 'closing marker before its opening one: t' + x.slice(1);
  if (/<(?!\/?t\d+\/?>)[a-zA-Z/!]/.test(out)) return 'HTML tag that is not a marker';
  return null;
}
function fromKey(en, marks) {
  return en.split(/(<\/?t\d+\/?>)/).map((p, i) => {
    if (i % 2 === 0) return escText(p);
    const m = p.match(/<(\/?)t(\d+)(\/?)>/), n = +m[2];
    if (m[1]) { const c = marks.find(x => x && x.close === n); return c ? c.v : ''; }
    const v = marks[n - 1];
    return typeof v === 'string' ? v : '';
  }).join('');
}
const edge = s => { const a = s.match(/^\s*/)[0], b = s.slice(a.length).match(/\s*$/)[0]; return [a, s.slice(a.length, s.length - b.length), b]; };

// Numbers and dates of a string become {1}, {2}… in the memory key, so a changed count or date needs no new translation and a
// translation can never change a number: "Del {1} al {2}" -> "From {1} to {2}".
const PH_RE = /\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}|\d+(?:[.,:]\d+)*/g;
export function placeholders(s) {
  const vals = [];
  const key = s.replace(/[{}]/g, c => (c === '{' ? '\u2983' : '\u2984')).split(/(<\/?t\d+\/?>)/).map((p, i) => (i % 2 ? p : p.replace(PH_RE, m => { vals.push(m); return '{' + vals.length + '}'; }))).join('');
  return { key, vals };
}
const fill = (en, vals) => en.replace(/\{(\d+)\}/g, (m, i) => vals[+i - 1]).replace(/\u2983/g, '{').replace(/\u2984/g, '}');
export function placeholdersProblem(src, out) {
  const l = s => (s.match(/\{\d+\}/g) || []).sort().join(' ');
  if (l(src) !== l(out)) return 'number slots must be exactly ' + (l(src) || '(none)') + ' (each once), got ' + (l(out) || '(none)');
  if (/\d/.test(out.replace(/\{\d+\}|<\/?t\d+\/?>/g, ''))) return 'digits outside the {N} slots: write numbers only as the given slots';
  return null;
}

// Translator: dictionary first (exact Spanish), then the memory; misses are reported (collect mode) and the Spanish is kept.
export function translator({ dict = {}, mem, known = new Set(), onMiss = () => {} }) {
  const tr = (s, where, kind = 'text') => {
    const [a, core, b] = edge(s);
    if (!core || !hasWords(core.replace(/<\/?t\d+\/?>/g, ' '))) return a + core + b;
    if (known.has(core)) return a + core + b;
    if (Object.hasOwn(dict, core)) return a + dict[core] + b;
    const { key, vals } = placeholders(core);
    if (Object.hasOwn(dict, key)) return a + fill(dict[key], vals) + b;
    if (Object.hasOwn(mem.text, key)) return a + fill(mem.text[key], vals) + b;
    onMiss({ kind, s: key, where });
    return null;
  };
  return tr;
}
// a run of inline content -> raw pieces (tags, spaces) and text pieces; a run that is only whole elements is split per element and a
// wrapper element is peeled, so menus, tiles and table rows give one short string per label
const isWs = it => it.k === 'text' && !/\S/.test(it.v);
const isVoidish = it => it.k === 'atom' || (it.k === 'tag' && it.void);
function pieces(items) {
  let i = 0, j = items.length - 1;
  const lead = [], tail = [];
  while (i <= j && (isWs(items[i]) || isVoidish(items[i]))) lead.push(items[i++]);
  while (j >= i && (isWs(items[j]) || isVoidish(items[j]))) tail.unshift(items[j--]);
  const core = items.slice(i, j + 1);
  const raw = x => (x.length ? [{ raw: true, items: x }] : []);
  if (!core.length) return raw(lead.concat(tail));
  const groups = [];
  let depth = 0, ok = true, cur = null;
  for (const it of core) {
    if (it.k === 'tag' && !it.void && !it.close) { if (!depth) { cur = []; groups.push({ el: cur }); } depth++; cur.push(it); continue; }
    if (it.k === 'tag' && it.close) { depth--; if (depth < 0) { ok = false; break; } cur.push(it); continue; }
    if (!depth) { if (isWs(it) || isVoidish(it)) { groups.push({ sep: it }); continue; } ok = false; break; }
    cur.push(it);
  }
  if (ok && !depth && groups.some(g => g.el)) {
    const els = groups.filter(g => g.el);
    if (els.length === 1 && els[0].el.at(-1).name === els[0].el[0].name) {
      const el = els[0].el;
      const inner = el.slice(1, -1);
      return [...raw(lead), ...raw(groups.slice(0, groups.indexOf(els[0])).map(g => g.sep)), ...raw([el[0]]), ...pieces(inner), ...raw([el.at(-1)]), ...raw(groups.slice(groups.indexOf(els[0]) + 1).map(g => g.sep)), ...raw(tail)];
    }
    if (els.length > 1) return [...raw(lead), ...groups.flatMap(g => (g.sep ? raw([g.sep]) : pieces(g.el))), ...raw(tail)];
  }
  return [...raw(lead), { raw: false, items: core }, ...raw(tail)];
}

// en version of a finished page. opts: { tr, mapPath(esPath) -> enPath|null, origin, quoteNote(enHtml) -> html, where }
export function htmlToEn(html, { tr, mapPath, origin, quoteNote, where = '' }) {
  const bodyAt = html.search(/<body[\s>]/);
  const head = bodyAt > 0 ? html.slice(0, bodyAt) : '', body = bodyAt > 0 ? html.slice(bodyAt) : html;
  const toks = tokenize(body);
  let out = '';
  let run = [];
  const plain = items => items.map(t => (t.k === 'text' ? escText(numEn(dec(t.v))) : t.v)).join('');
  const flush = () => {
    if (!run.length) return;
    for (const pc of pieces(run)) {
      const textOnly = pc.items.filter(t => t.k === 'text').map(t => t.v).join('');
      if (pc.raw || !hasWords(textOnly)) { out += plain(pc.items); continue; }
      const { key, marks } = runKey(pc.items);
      const [a, core, b] = edge(key);
      const en = tr(core, where);
      out += en == null ? plain(pc.items) : escText(a) + fromKey(en, marks) + escText(b);
    }
    run = [];
  };
  for (const t of toks) {
    if (t.k === 'text' || (t.k === 'tag' && !t.block) || (t.k === 'atom' && !t.quote && t.name !== 'script' && t.name !== 'style')) { run.push(t.k === 'tag' ? { ...t, v: attrsEn(t.v, tr, where) } : t); continue; }
    flush();
    if (t.k === 'atom' && t.quote) {
      out += t.v.replace(/^<blockquote\b/, m => m + (/\slang=/.test(t.v.slice(0, t.v.indexOf('>'))) ? '' : ' lang="es-AR"'));
      if (quoteNote) {
        const inner = t.v.replace(/^<blockquote[^>]*>/, '').replace(/<\/blockquote>$/, '');
        const sub = htmlToEn('<body>' + inner, { tr, mapPath, origin, where }).replace(/^<body>/, '');
        out += quoteNote(sub);
      }
      continue;
    }
    if (t.k === 'atom' && t.name === 'script' && /type="application\/ld\+json"/.test(t.v)) { out += ldEn(t.v, tr, mapPath, origin, where); continue; }
    out += t.k === 'tag' ? attrsEn(t.v, tr, where) : t.v;
  }
  flush();
  let res = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, s => ldEn(s, tr, mapPath, origin, where)) + out;
  // internal links: every href to a page with an English version, except the language links (they carry hreflang)
  res = res.replace(/<(a|link)\b[^>]*>/g, tag => {
    if (/\shreflang="/.test(tag)) return tag;
    return tag.replace(/\shref="([^"]*)"/, (m, u) => ' href="' + mapHref(u, mapPath, origin) + '"');
  });
  res = res.replace(/(<meta property="og:url" content=")([^"]*)"/, (m, a, u) => a + mapHref(u, mapPath, origin) + '"');
  return res;
}
function mapHref(u, mapPath, origin) {
  const abs = origin && u.startsWith(origin + '/');
  const rel = abs ? u.slice(origin.length) : u;
  if (!rel.startsWith('/')) return u;
  const m = rel.match(/^([^?#]*)(.*)$/);
  const to = mapPath(m[1]);
  return to ? (abs ? origin : '') + to + m[2] : u;
}
function attrsEn(tag, tr, where) {
  let t = tag;
  for (const a of ATTRS) t = t.replace(new RegExp('(\\s' + a + '=")([^"]*)"'), (m, p, v) => { const e = tr(numEn(dec(v)), where, 'attr'); return e == null ? m : p + escAttr(e) + '"'; });
  if (/^<input\b/.test(t) && /\stype="text"/.test(t) && !/\sreadonly/.test(t)) t = t.replace(/(\svalue=")([^"]*)"/, (m, p, v) => { const e = tr(dec(v), where, 'attr'); return e == null ? m : p + escAttr(e) + '"'; });
  return t;
}
const LD_TEXT = new Set(['name', 'description', 'text', 'headline', 'alternativeHeadline', 'caption', 'abstract', 'disambiguatingDescription', 'jobTitle', 'knowsAbout']);
function ldEn(script, tr, mapPath, origin, where) {
  const m = script.match(/^(<script[^>]*>)([\s\S]*)(<\/script>)$/);
  let o;
  try { o = JSON.parse(m[2]); } catch { return script; }
  const walk = (x, k) => {
    if (typeof x === 'string') {
      if (k === 'inLanguage') return 'en';
      if (/^https?:\/\//.test(x)) return mapHref(x, mapPath, origin);
      if (LD_TEXT.has(k)) { const e = tr(numEn(x), where, 'ld'); return e == null ? x : e; }
      return x;
    }
    if (Array.isArray(x)) return x.map(v => walk(v, k));
    if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([kk, v]) => [kk, walk(v, kk)]));
    return x;
  };
  return m[1] + JSON.stringify(walk(o, '')).replace(/</g, '\\u003c') + m[3];
}

// ---------- browser modules ----------
// String literals and template parts of a module that may be visible text. Literals in code positions (imports, keys, comparisons,
// selectors, attribute names, storage keys, class names) are skipped here; the model keeps the rest that is code ("same string").
const SKIP_CALL = new Set(['$', '$$', 'querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName', 'closest', 'matches', 'getAttribute',
  'removeAttribute', 'hasAttribute', 'toggleAttribute', 'addEventListener', 'removeEventListener', 'createElement', 'createElementNS', 'fetch', 'json',
  'getItem', 'setItem', 'removeItem', 'includes', 'indexOf', 'lastIndexOf', 'startsWith', 'endsWith', 'split', 'match', 'matchAll', 'test', 'padStart', 'padEnd',
  'DateTimeFormat', 'NumberFormat', 'Error', 'TypeError', 'RangeError', 'contains', 'add', 'remove', 'toggle', 'has', 'delete', 'replaceAll', 'search',
  'require', 'postMessage', 'play', 'SpeechSynthesisUtterance', 'setParams', 'params']);
const FIRST_ARG_ONLY = new Set(['setAttribute', 'get', 'set', 'replace', 'del', 'store', 'feed', 'load', 'stat', 'jsonFeed']);
const CODE_KEY = new Set(['year', 'month', 'day', 'hour', 'minute', 'second', 'weekday', 'cache', 'behavior', 'block', 'inline', 'method', 'credentials', 'as', 'id', 'key', 'k', 'kind', 'type', 'cls', 'class', 'className', 'rules', 'slug', 'feed', 'jur', 'mode', 'lang', 'href', 'src', 'tag', 'el',
  'sel', 'selector', 'event', 'icon', 'color', 'c', 'v', 'dir', 'theme', 'unit', 'format', 'timeZone', 'hourCycle', 'style']);
// visible words in a code string: tags, attribute pieces and code-like tokens removed
function codeWords(v) {
  if (/^(true|false|null|numeric|2-digit|long|short|narrow|smooth|auto|none|start|end|center|nearest)$/.test(v)) return false;
  if (/^[\w.\/:#\[\]=@-]+$/.test(v) && /[\/_.\[#:=@]/.test(v)) return false;
  const t = v.replace(/<\/?[a-zA-Z][^>]*>?/g, ' ').replace(/[\w-]+="[^"]*"?/g, ' ').replace(/^[^<>]*?">/, ' ').replace(/&\w+;/g, ' ');
  return LETTERS.test(t);
}
function calleeName(c) { return c.type === 'Identifier' ? c.name : c.type === 'MemberExpression' && !c.computed ? c.property.name : ''; }
export function codeStrings(src) {
  const ast = parse(src, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
  const lines = src.split('\n');
  const out = [], codeTokens = new Set();
  const visit = (node, parent, pkey) => {
    if (!node || typeof node.type !== 'string') return;
    const isStr = node.type === 'Literal' && typeof node.value === 'string';
    if (isStr || node.type === 'TemplateElement') {
      const value = isStr ? node.value : node.value.cooked;
      let skip = false;
      if (isStr) {
        if (/^(Import|Export)/.test(parent.type) || parent.type === 'ImportExpression') skip = true;
        else if (parent.type === 'Property' && pkey === 'key') skip = true;
        else if (parent.type === 'Property' && pkey === 'value' && !parent.computed && CODE_KEY.has(parent.key.name || parent.key.value)) skip = true;
        else if (parent.type === 'MemberExpression' && pkey === 'property') skip = true;
        else if (parent.type === 'BinaryExpression' && /^(===|!==|==|!=|in)$/.test(parent.operator)) skip = true;
        else if (parent.type === 'SwitchCase' && pkey === 'test') skip = true;
        else if ((parent.type === 'CallExpression' || parent.type === 'NewExpression') && pkey === 'arguments') {
          const n = calleeName(parent.callee);
          if (SKIP_CALL.has(n) || (FIRST_ARG_ONLY.has(n) && parent.arguments[0] === node)) skip = true;
        } else if (parent.type === 'AssignmentExpression' && parent.left.type === 'MemberExpression' && /^(className|id|type|href|src|key|name|value|lang|rel)$/.test(parent.left.property.name || '')) skip = true;
        else if (parent.type === 'AssignmentExpression' && parent.left.type === 'MemberExpression' && parent.left.object.type === 'MemberExpression' && /^(dataset|style)$/.test(parent.left.object.property.name || '')) skip = true;
      }
      if (skip) { codeTokens.add(value); return; }
      if (!codeWords(value)) return;
      const ln = lines[node.loc.start.line - 1];
      const col = node.loc.start.column;
      out.push({ start: node.start, end: node.end, tpl: !isStr, value, ctx: ln.slice(Math.max(0, col - 120), col + 160).trim() });
      return;
    }
    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'start' || k === 'end') continue;
      const v = node[k];
      if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && visit(c, node, k));
      else if (v && typeof v.type === 'string') visit(v, node, k);
    }
  };
  visit(ast, { type: 'Root' }, '');
  for (const s of out) if (/^[\w-]+$/.test(s.value) && codeTokens.has(s.value)) s.code = true;
  return { strings: out.filter(s => !s.code), codeTokens };
}
// English source of a module: every translated literal replaced (structure unchanged), page paths in literals mapped to /en/
export function codeToEn(src, file, { mem, onMiss, mapPath }) {
  const { strings } = codeStrings(src);
  let res = '', at = 0, miss = 0;
  for (const s of strings) {
    const key = file + ' :: ' + s.value;
    let en;
    if (Object.hasOwn(mem.code, key)) en = mem.code[key];
    else { onMiss({ kind: 'code', file, s: s.value, ctx: s.ctx }); miss++; continue; }
    if (en === s.value) continue;
    res += src.slice(at, s.start) + (s.tpl ? en.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') : JSON.stringify(en));
    at = s.end;
  }
  res += src.slice(at);
  // page paths inside strings ('/quiniela/', href="/truco/") -> English paths
  res = res.replace(/(["'`=])(\/[a-z0-9-]+\/(?:[a-z0-9-]+\/){0,3})(?=["'`#?])/g, (m, q, p) => { const to = mapPath(p); return to ? q + to : m; });
  parse(res, { ecmaVersion: 'latest', sourceType: 'module' });
  return { code: res, miss };
}
// what a code translation must keep: the same HTML tags, edge spaces, numbers; no new template syntax
export function codeProblem(src, out, tpl) {
  const tags = s => (s.match(/<[^>]+>/g) || []).sort().join(' ');
  if (tags(src) !== tags(out)) return 'HTML tags must stay exactly: ' + (tags(src) || '(none)');
  const [a, , b] = edge(src), [c, , d] = edge(out);
  if (a !== c || b !== d) return 'keep the leading/trailing spaces exactly ("' + a + '" ... "' + b + '")';
  if (tpl && (/`/.test(out) || /\$\{/.test(out))) return 'no backtick or ${ in a template part';
  return numbersProblem(numEn(src), out);
}

// ---------- Spanish left on an English page (gate) ----------
// unambiguous Spanish words, and pairs of short Spanish words ("de la", "y el"); allowed names are removed first
const ES_STRONG = ['del', 'las', 'los', 'que', 'para', 'por', 'una', 'como', 'cómo', 'más', 'pero', 'hay', 'vos', 'cuánto', 'cuál', 'qué', 'dónde', 'cuándo', 'también',
  'según', 'desde', 'hasta', 'cada', 'esta', 'estos', 'esa', 'ese', 'muy', 'hoy', 'número', 'números', 'sorteo', 'sorteos', 'jugada', 'jugadas', 'apuesta', 'apuestas',
  'premio', 'premios', 'juego', 'juegos', 'jugá', 'mirá', 'calculá', 'elegí', 'tocá', 'podés', 'tenés', 'sabés', 'querés', 'ganás', 'cobrás', 'línea', 'ayuda', 'reglas',
  'cartas', 'puntos', 'tirada', 'salió', 'salen', 'cifras', 'cifra', 'cuenta', 'gratis', 'gratuita', 'sí', 'año', 'años', 'mes', 'semana', 'días', 'ganador', 'ganadores'];
const STRONG_RE = new RegExp('(?<![\\p{L}\\p{N}])(' + ES_STRONG.join('|') + ')(?![\\p{L}\\p{N}])', 'giu');
const PAIR_RE = /(?<![\p{L}\p{N}])(de|la|el|y|en|es|se|su|lo|al|un|con)\s+(la|el|los|las|un|una|de|del|su|sus|lo)(?![\p{L}\p{N}])/giu;
export function spanishLeft(text, allow = []) {
  let t = ' ' + text + ' ';
  for (const a of [...allow].sort((x, y) => y.length - x.length)) if (a) t = t.split(a).join(' • ');
  const hits = [];
  for (const re of [STRONG_RE, PAIR_RE]) for (const m of t.matchAll(re)) hits.push(m[0] + ' | ' + t.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ').trim());
  return hits;
}
