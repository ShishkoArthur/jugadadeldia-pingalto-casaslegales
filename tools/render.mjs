// Shared static build for the three sites: node tools/render.mjs <jugadadeldia|pingalto|casaslegales>  ->  dist/<site>/
// (OUT=<folder> for another folder, TODAY=YYYY-MM-DD to build as of a date). Everything visible comes from sites/<site>/
// (config, layout, css, client, pages, content, static); this file only assembles: verified data, hashed assets, pages, 404,
// sitemap.xml and robots.txt. The build stops on an unverified or stale source, an unknown {{token}}, a link to an unbuilt
// page, undefined/NaN/[object Object] in a page, a bad path for the site's URL scheme, or a title/description out of range.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './env.mjs';
import { loadRegistries, verifyRegistries, brandNames, loadRg } from './lib/sources.mjs';
import { verify as verifyRg, displayable, freshness } from './verify-rg.mjs';
import { ownerCopyReminder } from './lib/ownercopy.mjs';
import { fmtDate, fmtInt } from '../engine/format.mjs';
import { iconFiles } from './lib/icons.mjs';
import { hasEn, planEn, sitePath, HREFLANG, OG_LOCALE, LANG_LABEL, loadMemory, translator, htmlToEn, codeToEn } from './lib/i18n.mjs';

export const SITES = ['jugadadeldia', 'pingalto', 'casaslegales'];
export const LIMITS = { title: 60, descMin: 115, descMax: 155 };
const sha = b => createHash('sha256').update(b).digest('hex');
export const decode = s => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LT = '\\' + 'u003c';

export async function loadSite(id) {
  if (!SITES.includes(id)) throw new Error('unknown site "' + id + '" (one of ' + SITES.join(', ') + ')');
  const dir = join(ROOT, 'sites', id);
  if (!existsSync(join(dir, 'config.mjs'))) throw new Error('sites/' + id + '/config.mjs does not exist yet');
  const imp = f => import(pathToFileURL(join(dir, f)).href);
  const { SITE } = await imp('config.mjs');
  const pages = await imp('pages/index.mjs');
  const layout = await imp('layout.mjs');
  const facts = existsSync(join(dir, 'content/facts.mjs')) ? (await imp('content/facts.mjs')).facts : () => ({});
  // English (docs/I18N.md): SITE.langs includes 'en'; a page has an English version when its plan row has urlEn/titleEn/descriptionEn/h1En
  const enMeta = hasEn(SITE) ? planEn(id) : new Map();
  const PAGES_EN = pages.PAGES.filter(p => enMeta.has(p.path)).map(p => ({ ...p, ...enMeta.get(p.path), lang: 'en', esPath: p.path }));
  const enUi = hasEn(SITE) && existsSync(join(dir, 'i18n/en.mjs')) ? (await imp('i18n/en.mjs')).UI || {} : {};
  return { id, dir, SITE, PAGES: pages.PAGES, NOT_FOUND: pages.NOT_FOUND, BETTING_KINDS: pages.BETTING_KINDS || [], layout, facts, enMeta, PAGES_EN, enUi };
}

// collect: true -> English strings missing from the memory are returned ({ misses }) instead of stopping the build (tools/translate.mjs)
export async function build(id, { collect = false, out = null } = {}) {
  const S = await loadSite(id);
  const { SITE, dir } = S;
  const DIST = out ? resolve(out) : process.env.OUT ? resolve(process.env.OUT) : join(ROOT, 'dist', id);
  const EN = hasEn(SITE) && S.PAGES_EN.length > 0;
  const ORIGIN = 'https://' + SITE.domain;
  const toEn = u => (S.enMeta.get(u) || {}).path || null;
  const misses = new Map();
  const onMiss = m => { const k = m.kind + '\u0000' + (m.file || '') + '\u0000' + m.s; if (!misses.has(k)) misses.set(k, m); };
  const mem = EN ? loadMemory(id) : null;
  const TODAY = process.env.TODAY || new Date().toISOString().slice(0, 10);

  // ---- verified data (any problem stops the build) ----
  const regProblems = [];
  if (verifyRegistries({ today: TODAY, log: m => { if (m.startsWith('  BAD')) regProblems.push(m.trim()); } })) throw new Error('registries are not verified:\n' + regProblems.join('\n') + '\n(node tools/verify-sources.mjs)');
  const rgPack = loadRg();
  const rgProblems = [];
  if (verifyRg({ today: TODAY, log: m => { if (m.startsWith('  BAD')) rgProblems.push(m.trim()); } })) throw new Error('help package is not verified:\n' + rgProblems.join('\n') + '\n(node tools/verify-rg.mjs)');
  const fr = freshness(rgPack, TODAY);
  const staleRg = Object.keys(rgPack.docs).filter(s => !fr.docOk(s));
  if (staleRg.length) throw new Error('help package: documents older than ' + fr.maxAge + ' days: ' + staleRg.join(', ') + ' (node tools/verify-rg.mjs --recheck --write)');
  if ((SITE.registries || []).length) ownerCopyReminder(TODAY, m => console.log('render ' + id + ': ' + m));
  const allRegs = loadRegistries();
  const regs = (SITE.registries || []).map(r => allRegs.find(x => x.id === r) || (() => { throw new Error('no registry ' + r); })());
  const disp = displayable(rgPack, TODAY);
  const provName = Object.fromEntries(rgPack.provinces.map(p => [p.id, p.name]));
  const rg = {
    pack: rgPack,
    disp,
    crisis: disp.crisis[0],
    prov(jid) {
      const p = rgPack.provinces.find(x => x.id === jid);
      if (!p) throw new Error('help package: no jurisdiction ' + jid);
      const d = disp.provinces[jid];
      return { id: jid, name: p.name, line: d.line, selfExclusion: d.selfExclusion, age: d.age, regulator: (p.regulators || []).find(fr.entryOk) || null };
    },
  };
  // every saved document the site can cite, registry ones by slug and help ones as "rg:<slug>"
  const DOCS = {};
  const pathShort = u => { const x = new URL(u); let s = (x.pathname + x.search).replace(/\/$/, ''); try { s = decodeURIComponent(s); } catch (e) {} return s.length > 34 ? s.slice(0, 33) + '…' : s; };
  for (const r of regs) for (const [slug, d] of Object.entries(r.docs)) {
    if (DOCS[slug]) throw new Error('document slug used twice: ' + slug);
    const quotes = Object.values(r.quotes).filter(q => q.doc === slug).length + r.licensees.filter(l => l.evidence.doc === slug).length + (r.law || []).filter(l => l.date && l.date.doc === slug).length;
    DOCS[slug] = { ...d, slug, key: slug, jur: r.id, jurName: provName[r.id], host: new URL(d.url).hostname.replace(/^www\./, ''), pathShort: pathShort(d.url), use: r.list.doc === slug ? 'lista oficial de licencias' : 'norma', quotes };
  }
  const { citations } = await import('./verify-rg.mjs');
  const cites = citations(rgPack);
  for (const [slug, d] of Object.entries(rgPack.docs)) {
    const p = rgPack.provinces.find(x => JSON.stringify(x).includes('"' + slug + '"'));
    const isLaw = (rgPack.law || []).some(f => f.doc === slug || (f.also || []).some(a => a.doc === slug));
    const isCrisis = ((rgPack.national || {}).crisis || []).some(e => e.doc === slug);
    DOCS['rg:' + slug] = { ...d, slug, key: 'rg:' + slug, jur: p ? p.id : 'ar', jurName: p ? p.name : 'Argentina', host: new URL(d.url).hostname.replace(/^www\./, ''), pathShort: pathShort(d.url),
      use: isCrisis ? 'línea nacional de salud mental' : isLaw ? 'proyecto de ley federal' : 'ayuda, edad y autoexclusión', quotes: cites.filter(c => c[2] === slug).length };
  }
  const checked = [...regs.map(r => r.checked), rgPack.checked].sort()[0];

  // ---- assets: /<assetDir>/<name by the site's scheme> ----
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, SITE.assetDir), { recursive: true });
  const assets = {};
  const assetsEn = {};
  const emitAsset = (name, buf, into = assets) => {
    const file = SITE.assetName(name, sha(buf));
    if (!/^[\w.-]+$/.test(file)) throw new Error('asset name ' + file);
    writeFileSync(join(DIST, SITE.assetDir, file), buf);
    return (into[name] = '/' + SITE.assetDir + '/' + file);
  };
  for (const f of SITE.fonts) emitAsset(f, readFileSync(join(dir, 'static/fonts', f)));
  for (const f of SITE.images || []) emitAsset(f, readFileSync(join(dir, 'static', f)));
  const minCss = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s{2,}/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}')
    .replace(/url\(fonts\/([\w.-]+\.woff2)\)/g, (m, f) => { if (!assets[f]) throw new Error('CSS: font not in config.fonts ' + f); return 'url(' + assets[f] + ')'; });
  for (const f of readdirSync(join(dir, 'css')).filter(f => f.endsWith('.css')).sort()) emitAsset(f, minCss(readFileSync(join(dir, 'css', f), 'utf8')));
  // browser modules: sites/<site>/client/*.js and the engine modules they import; imports are resolved by path (engine dirs may
  // share file names: engine/truco/rules.mjs, engine/lottery/rules.mjs) and rewritten to hashed files. Asset name = file name,
  // or "<dir>-<file name>" when two allowed modules share it.
  {
    const { minify } = await import('terser');
    const SRC = new Map();
    for (const f of readdirSync(join(dir, 'client')).filter(f => f.endsWith('.js'))) SRC.set(join(dir, 'client', f), f);
    for (const sub of ['', ...(SITE.engineDirs || [])]) for (const f of readdirSync(join(ROOT, 'engine', sub)).filter(f => f.endsWith('.mjs'))) SRC.set(join(ROOT, 'engine', sub, f), f);
    const seen = {};
    for (const n of SRC.values()) seen[n] = (seen[n] || 0) + 1;
    for (const [p, n] of SRC) if (seen[n] > 1) SRC.set(p, basename(dirname(p)) + '-' + n);
    // English variants (EN): string literals from the memory, page paths to /en/ (tools/lib/i18n.mjs codeToEn), own hashed files
    const mini = new Map();
    const bundle = async (lang, into) => {
      const done = {};
      const one = async (abs, stack = []) => {
        if (done[abs]) return done[abs];
        if (stack.includes(abs)) throw new Error('import cycle ' + [...stack, abs].join(' -> '));
        if (!SRC.has(abs)) throw new Error('no module ' + abs + ' (from ' + stack.at(-1) + '; engine dirs in config.engineDirs)');
        let src = readFileSync(abs, 'utf8');
        if (lang === 'en') src = codeToEn(src, abs.slice(ROOT.length + 1), { mem, onMiss, mapPath: toEn }).code;
        const hs = sha(src);
        if (!mini.has(hs)) mini.set(hs, (await minify(src, { module: true, compress: { passes: 1 }, mangle: true, format: { comments: false, ascii_only: true } })).code);
        let code = mini.get(hs);
        const deps = [...new Set([...code.matchAll(/(?:from|import)\s*\(?\s*["']((?:\.{1,2}\/)+(?:[\w-]+\/)*[\w.-]+\.m?js)["']/g)].map(m => m[1]))];
        for (const d of deps) { const to = await one(resolve(dirname(abs), d), [...stack, abs]); code = code.split('"' + d + '"').join('"./' + basename(to) + '"').split("'" + d + "'").join("'./" + basename(to) + "'"); }
        return (done[abs] = emitAsset(SRC.get(abs), code, into));
      };
      for (const f of readdirSync(join(dir, 'client')).filter(f => f.endsWith('.js'))) await one(join(dir, 'client', f));
    };
    await bundle('es', assets);
    if (EN) await bundle('en', assetsEn);
  }
  // icons from the site logo (sites/<site>/logo.mjs, drawn by tools/lib/icons.mjs): favicon.svg, favicon.ico (16/32/48),
  // apple-touch-icon.png, icon-192/512 and maskable PNGs, site.webmanifest
  {
    const { LOGO } = await import(pathToFileURL(join(dir, 'logo.mjs')).href);
    for (const [n, b] of Object.entries(await iconFiles(LOGO, SITE))) writeFileSync(join(DIST, n), b);
  }

  // ---- pages ----
  const PAGES = S.PAGES;
  const paths = new Set();
  for (const p of [...PAGES, S.NOT_FOUND, ...(EN ? S.PAGES_EN : [])]) {
    if (!sitePath(SITE, p.path) || (p.lang !== 'en' && p.path.startsWith('/en/'))) throw new Error(p.path + ': path does not follow the URL scheme of ' + id);
    if (paths.has(p.path)) throw new Error('two pages with path ' + p.path);
    paths.add(p.path);
  }
  const BUILT = new Set(PAGES.map(p => p.path));
  const BUILT_ALL = new Set([...BUILT, ...(EN ? S.PAGES_EN.map(p => p.path) : [])]);
  const h = {
    site: SITE, today: TODAY, checked, esc, fmtDate, fmtInt, regs, rg,
    names: brandNames(),
    reg: rid => regs.find(r => r.id === rid) || (() => { throw new Error('no registry ' + rid + ' in config.registries'); })(),
    doc: slug => DOCS[slug] || (() => { throw new Error('no saved document ' + slug); })(),
    docs: () => Object.values(DOCS),
    asset: n => assets[n] || (() => { throw new Error('no asset ' + n); })(),
    built: u => BUILT.has(u),
    pages: PAGES,
    href: u => { const base = u.split(/[?#]/)[0]; if (!BUILT.has(base)) throw new Error('link to an unbuilt page ' + u); return u; },
    jsonScript: o => JSON.stringify(o).replace(/</g, LT),
    page: null,
    // language of the pass: 'es' (site root) or 'en' (/en/); pages keep their Spanish path while rendering in both passes
    lang: 'es',
    // language links of the current page for the layout's switcher: [{ lang, code, label, href, current }] ([] without a counterpart)
    langs: () => { const u = h.page && (h.page.esPath || h.page.path), e = EN && toEn(u); return e ? [['es', u], ['en', e]].map(([l, href]) => ({ lang: l, code: HREFLANG[l], label: LANG_LABEL[l], href, current: l === h.lang })) : []; },
    // a Spanish string of layout or page code in the language of the pass (English from sites/<site>/i18n/en.mjs or the memory)
    tr: s => (h.lang === 'en' && trEn ? trEn(s, h.page && h.page.path, 'text') ?? s : s),
  };
  let trEn = null;
  const FACTS = S.facts(h);
  h.t = s => String(s).replace(/\{\{(\w+)\}\}/g, (m, k) => { if (FACTS[k] === undefined) throw new Error('unknown token ' + m + (h.page ? ' on ' + h.page.path : '')); return String(FACTS[k]); });
  h.org = (full = false) => ({ '@context': full ? 'https://schema.org' : undefined, '@type': 'Organization', name: SITE.domain, url: ORIGIN + '/', ...(full ? { description: SITE.orgDescription || undefined } : {}) });
  h.webPage = () => ({ '@context': 'https://schema.org', '@type': 'WebPage', name: h.page.h1, url: ORIGIN + h.page.path, inLanguage: SITE.htmlLang, dateModified: checked, publisher: h.org() });
  h.crumbs = list => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: list.map(([u, n], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: ORIGIN + (u === '/' ? '/' : u) })) });
  h.clientData = () => SITE.clientData ? SITE.clientData(h) : null;
  if (S.layout.clientData) h.clientData = () => S.layout.clientData(h);

  const written = [];
  const tidy = html => html.replace(/>\s*\n\s*</g, '><').replace(/\n\s*/g, ' ');
  // hreflang pairs (+ x-default = Spanish) on both versions of a page that has an English one
  const alternates = esPath => { const e = EN && toEn(esPath); return e ? '<link rel="alternate" hreflang="' + HREFLANG.es + '" href="' + ORIGIN + esPath + '"><link rel="alternate" hreflang="' + HREFLANG.en + '" href="' + ORIGIN + e + '"><link rel="alternate" hreflang="x-default" href="' + ORIGIN + esPath + '">' : ''; };
  function emit(p, file, post = null) {
    h.page = p;
    const body = p.render(h);
    if (p.ld) p.ldOut = p.ld(h); else p.ldOut = [];
    let html = tidy(S.layout.page(h, { ...p, ld: p.ldOut }, body));
    if (post) html = post(html);
    if (!p.is404) html = html.replace('</head>', alternates(p.esPath || p.path) + '</head>');
    const vis = html.replace(/<script[\s\S]*?<\/script>/g, '');
    const bad = vis.match(/\b(undefined|NaN)\b|\[object Object\]|>null<|\{\{[^}]*\}\}/);
    if (bad) throw new Error(p.path + ': "' + bad[0] + '" in HTML: ...' + vis.slice(Math.max(0, bad.index - 100), bad.index + 40));
    for (const m of vis.matchAll(/href="(\/[^"#?]*)/g)) if (!m[1].startsWith('/' + SITE.assetDir + '/') && !/\.\w+$/.test(m[1]) && !BUILT_ALL.has(m[1])) throw new Error(p.path + ': link to an unbuilt page ' + m[1]);
    mkdirSync(dirname(join(DIST, file)), { recursive: true });
    writeFileSync(join(DIST, file), html);
    written.push(p.lang === 'en' ? p.enPath : p.path);
  }
  for (const P of PAGES) {
    const p = { ...P };
    h.page = p;
    p.title = h.t(P.title); p.description = h.t(P.description); p.h1 = h.t(P.h1);
    if (p.title.length > LIMITS.title) throw new Error(`${p.path}: title ${p.title.length} > ${LIMITS.title}: ${p.title}`);
    if (p.description.length < LIMITS.descMin || p.description.length > LIMITS.descMax) throw new Error(`${p.path}: description ${p.description.length} chars, outside ${LIMITS.descMin}-${LIMITS.descMax}: ${p.description}`);
    emit(p, SITE.fileOf(p.path));
  }
  emit({ ...S.NOT_FOUND, title: h.t(S.NOT_FOUND.title), h1: h.t(S.NOT_FOUND.h1), is404: true }, SITE.notFoundFile);
  written.pop();

  // ---- English pass: the same pages rendered with h.lang = 'en', then translated from the memory (tools/lib/i18n.mjs) ----
  if (EN) {
    const known = new Set();
    const dict = { ...S.enUi };
    for (const P of PAGES) {
      const m = S.enMeta.get(P.path);
      if (!m) continue;
      h.page = P;
      for (const [k, v] of [['title', m.title], ['description', m.description], ['h1', m.h1]]) { if (typeof v !== 'string' || !v) throw new Error(P.path + ': plan row without ' + k + 'En'); known.add(v); dict[h.t(P[k])] = v; }
    }
    trEn = translator({ dict, mem, known, onMiss });
    const siteEs = h.site, assetEs = h.asset;
    h.lang = 'en';
    h.site = { ...SITE, htmlLang: HREFLANG.en, ogLocale: OG_LOCALE.en };
    h.asset = n => assetsEn[n] || assetEs(n);
    try {
      for (const P of PAGES) {
        const m = S.enMeta.get(P.path);
        if (!m) continue;
        const p = { ...P, lang: 'en', esPath: P.path, enPath: m.path, title: m.title, description: m.description, h1: m.h1 };
        if (p.title.length > LIMITS.title) throw new Error(`${m.path}: title ${p.title.length} > ${LIMITS.title}: ${p.title}`);
        if (p.description.length < LIMITS.descMin || p.description.length > LIMITS.descMax) throw new Error(`${m.path}: description ${p.description.length} chars, outside ${LIMITS.descMin}-${LIMITS.descMax}: ${p.description}`);
        emit(p, SITE.fileOf(m.path), html => htmlToEn(html, { tr: trEn, mapPath: toEn, origin: ORIGIN, quoteNote: SITE.i18n && SITE.i18n.quoteNote, citeEn: !!(SITE.i18n && SITE.i18n.citeEn), where: m.path }));
      }
    } finally { h.lang = 'es'; h.site = siteEs; h.asset = assetEs; }
    if (misses.size && !collect) {
      const list = [...misses.values()];
      throw new Error('English: ' + list.length + ' strings are not in data/i18n/' + id + '-en.json (node tools/translate.mjs ' + id + '), e.g.\n' + list.slice(0, 12).map(x => '  ' + (x.where || x.file) + ': ' + x.s.slice(0, 90)).join('\n'));
    }
  }

  // site search (tools/lib/search.mjs): anchors on H2/H3 and one index per language of the written pages (English ones too)
  if (SITE.search) for (const x of (await import('./lib/search.mjs')).writeSearch({ dist: DIST, site: SITE, pages: [...PAGES, ...(EN ? S.PAGES_EN : [])], id })) console.log('build ' + id + ': search index ' + x.file + ' (' + x.lang + ') ' + x.pages + ' pages, ' + Math.round(x.gz / 1024) + ' KB gzip');

  // ---- index: open (owner 2026-11-03) - every built page except 404 is in the sitemap, robots allows everything ----
  writeFileSync(join(DIST, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + ORIGIN + '/sitemap.xml\n');
  const esOf = new Map(EN ? S.PAGES_EN.map(p => [p.path, p.esPath]) : []);
  const alts = u => { const es = esOf.get(u) || u, e = EN && toEn(es); return e ? [[HREFLANG.es, es], [HREFLANG.en, e], ['x-default', es]].map(([c, x]) => '<xhtml:link rel="alternate" hreflang="' + c + '" href="' + ORIGIN + x + '"/>').join('') : ''; };
  writeFileSync(join(DIST, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' + (EN ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : '') + '>\n' +
    written.map(u => '<url><loc>' + ORIGIN + u + '</loc><lastmod>' + checked + '</lastmod>' + alts(u) + '</url>').join('\n') + '\n</urlset>\n');
  console.log(`build ${id}: ${written.length} pages + 404${EN ? ' (' + S.PAGES_EN.length + ' in English)' : ''}, ${Object.keys(assets).length} assets, ${regs.length} registries, ${Object.keys(DOCS).length} documents -> ${DIST}` + (misses.size ? ' - ' + misses.size + ' English strings missing' : ''));
  return { dist: DIST, pages: written, misses: [...misses.values()] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const id = process.argv[2];
  build(id).catch(e => { console.error('render ' + (id || '') + ': ' + e.message); process.exit(1); });
}
