// Gates on the BUILT output of one site: node tools/check-dist.mjs <site> [folder]   (default folder dist/<site>)
// Any finding exits 1 (no deploy). Every rule is proven by corrupting a copy of a fresh build:
//   node tools/check-dist.mjs <site> --selftest
// Site specifics (markers of the help block, help pages, 18+, menu; URL scheme; asset folder) come from sites/<site>/config.mjs
// and the page list from sites/<site>/pages/index.mjs, so the gates stay the same while every site keeps its own HTML.
import { readFileSync, readdirSync, statSync, existsSync, cpSync, writeFileSync, rmSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parse as parseJs } from 'acorn';
import { ROOT } from './env.mjs';
import { loadSite, LIMITS, decode } from './render.mjs';
import { isOperatorHost } from './lib/operators.mjs';
import { verifyRegistries, loadRegistries, loadRg } from './lib/sources.mjs';
import { verify as verifyRg, freshness } from './verify-rg.mjs';
import { daysBetween } from '../engine/format.mjs';

const BUDGET = 160 * 1024;
const FONT_BUDGET = 90 * 1024;
const ch = String.fromCharCode;
const CYR = new RegExp('[' + ch(0x400) + '-' + ch(0x52f) + ch(0x2de0) + '-' + ch(0x2dff) + ch(0xa640) + '-' + ch(0xa69f) + ']|\\\\u04[0-9a-fA-F]{2}');
// Bait and promises (PLAYBOOK 7.1): English and es-AR. Never list these words in a text about the method: the gate catches them.
const BAIT_EN = String.raw`\b(winning (strategy|system|tips?)|win big|beat the (house|odds|bookies?)|best (online )?(casinos?|betting sites?|sportsbooks?|bonus(es)?)|top \d+|guaranteed?|free (bets?|spins?)|bonus codes?|(welcome|deposit|no-deposit) bonus(es)?|promo codes?|risk[- ]free|sure win|easy money|bet now)\b`;
const BAIT_ES = String.raw`(gan[aá] seguro|gan[aá] siempre|ganancias? segura|apuestas? segura|garantizad[oa]s?|\bbono\b|bonos? (de bienvenida|sin dep[oó]sito|gratis|exclusivos?)|c[oó]digos? promocional(es)?|c[oó]digo de (bono|promoci[oó]n)|mejor(es)? casinos?|mejor(es)? casas? de apuestas|\btop ?\d+\b|sistema ganador|estrategia ganadora|m[eé]todo infalible|dinero f[aá]cil|plata f[aá]cil|apuestas? gratis|giros gratis|sin riesgo|apost[aá] (ya|ahora)|registrate y|jackpots?)`;
const BAIT = new RegExp(BAIT_EN + '|' + BAIT_ES, 'i');
const PROMISE = /\b(coming soon|stay tuned)\b|pr[oó]ximamente|muy pronto|en breve|en las pr[oó]ximas semanas/i;
const AFFIL = /[?&](btag|affid|aff_id|affiliate|aff|ref|refid|clickid|subid|pid|tracking)=|\/(go|out|visit|aff|affiliate|track|recommends)\/|utm_(medium|source)=(affiliate|partner)/i;
const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
const TEXT_EXT = /\.(html|js|mjs|css|json|xml|txt|svg|webmanifest)$/;
const ALLOWED_EXT = /\.(html|css|js|mjs|woff2|svg|png|ico|webp|jpg|xml|txt|json)$/;

function walk(dir) { const out = []; for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) out.push(...walk(p)); else out.push(p); } return out; }
function visibleText(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<blockquote[\s\S]*?<\/blockquote>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/i, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
}

export async function check(id, dist, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const S = await loadSite(id);
  const { SITE } = S;
  const problems = [];
  const bad = (code, f, m) => problems.push({ code, file: f ? relative(dist, f) : '', msg: m });
  const ORIGIN = 'https://' + SITE.domain;
  const files = walk(dist), htmls = files.filter(f => f.endsWith('.html'));
  const pageByFile = new Map(S.PAGES.map(p => [join(dist, SITE.fileOf(p.path)), p]));
  const notFoundFile = join(dist, SITE.notFoundFile);
  const html = Object.fromEntries(htmls.map(f => [f, readFileSync(f, 'utf8')]));
  // the server's lookup (Caddy try_files {path} {path}.html {path}/index.html)
  const resolveFile = u => { const c = u.split('#')[0].split('?')[0]; const f = join(dist, c); return [f, f + '.html', join(f, 'index.html')].find(x => existsSync(x) && statSync(x).isFile()) || null; };
  const pathOfFile = new Map([...pageByFile].map(([f, p]) => [f, p.path]));
  const ids = f => new Set([...html[f].matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const kindOf = u => { const f = resolveFile(u); const p = f && pageByFile.get(f); return p ? p.kind : null; };
  const isAsset = u => u.startsWith('/' + SITE.assetDir + '/');
  const sizeOf = f => (existsSync(f) ? statSync(f).size : 0);

  const G = SITE.gate;
  const brandPairs = G.brandLinks ? G.brandLinks.names() : [];
  for (const f of htmls) {
    const H = html[f], p = pageByFile.get(f), is404 = f === notFoundFile, vis = visibleText(H);
    if (!p && !is404) { bad('extrafile', f, 'HTML file that is not a page of the site'); continue; }
    const where = p ? p.path : '404';
    const h1 = (H.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) bad('h1', f, 'H1 count ' + h1);
    const hl = (H.match(/<html lang="([^"]+)"/) || [])[1];
    if (hl !== SITE.htmlLang) bad('langattr', f, 'html lang="' + hl + '"');
    if (/\{\{[^}]*\}\}/.test(H.replace(/<script[\s\S]*?<\/script>/g, ''))) bad('placeholder', f, 'unfilled {{token}}');
    if (/\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/.test(vis)) bad('junk', f, 'undefined/NaN/null/[object Object] in text');
    const bm = (vis + ' ' + decode((H.match(/<title>([^<]*)/) || [])[1] || '') + ' ' + decode((H.match(/name="description" content="([^"]*)"/) || [])[1] || '')).match(BAIT);
    if (bm) bad('bait', f, 'bait words "' + bm[0] + '"');
    if (PROMISE.test(vis)) bad('promise', f, 'promise of a date');
    if (SITE.gate.decimalComma) {
      if (/<input\b[^>]*\stype="number"/.test(H)) bad('decimal', f, 'number input (shows the decimal point of the visitor system; use text + inputmode)');
      if (/<input\b(?![^>]*type="(range|hidden)")[^>]*\svalue="-?\d+\.\d+"/.test(H)) bad('decimal', f, 'input value with a decimal point');
      const dm = visibleText(H.replace(/<(code|pre|kbd|samp)\b[\s\S]*?<\/\1>/gi, ' ')).replace(SITE.gate.decimalOk || /$^/g, ' ').match(/(?<![\w.,\/:+-])\d+\.\d{1,2}(?![\d.,\w])/);
      if (dm) bad('decimal', f, 'decimal point in text "' + dm[0] + '" (es-AR writes a decimal comma)');
    }
    for (const [, src] of H.matchAll(/<script\b[^>]*\ssrc="([^"]+)"/gi)) if (/^(https?:)?\/\//i.test(src)) bad('extscript', f, 'external script ' + src);
    for (const [, tag] of H.matchAll(/<link\b([^>]*)>/gi)) {
      const href = (tag.match(/\shref="([^"]+)"/) || [])[1] || '';
      if (/rel="(stylesheet|preload|modulepreload|preconnect)"/.test(tag) && /^(https?:)?\/\//.test(href) && !FONT_HOSTS.has(new URL(href, ORIGIN).hostname)) bad('extstyle', f, 'external style/resource ' + href);
      if (/rel="(stylesheet|preload|icon|apple-touch-icon|modulepreload)"/.test(tag) && href.startsWith('/') && !existsSync(join(dist, href))) bad('src', f, 'missing file ' + href);
    }
    if (/@import\s+url\(\s*['"]?(https?:)?\/\//i.test(H)) bad('extstyle', f, '@import of an external stylesheet');
    for (const m of H.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let o; try { o = JSON.parse(m[1]); } catch { bad('jsonld', f, 'JSON-LD does not parse'); continue; }
      if (/"@type":"Person"/.test(JSON.stringify(o)) && SITE.noPerson !== false) bad('jsonld', f, 'Person in structured data (this site has no named author)');
    }
    // links
    for (const [, raw] of H.replace(/<link\b[^>]*>/gi, '').matchAll(/\shref="([^"]*)"/g)) {
      const u = decode(raw);
      if (/^(mailto:|tel:)/.test(u)) continue;
      if (/^https?:/.test(u)) {
        let host; try { host = new URL(u).hostname; } catch { bad('link', f, 'bad URL ' + u); continue; }
        if (host === SITE.domain) { bad('link', f, 'absolute link to the own domain ' + u + ' (use a path)'); continue; }
        if (isOperatorHost(host)) bad('operator', f, 'link to a betting operator ' + u);
        if (AFFIL.test(u)) bad('affiliate', f, 'affiliate link ' + u);
        continue;
      }
      if (u.startsWith('#')) { if (u.length > 1 && !ids(f).has(u.slice(1))) bad('anchor', f, 'dangling anchor ' + u); continue; }
      if (!u.startsWith('/')) { bad('link', f, 'relative or empty link "' + u + '"'); continue; }
      const base = u.split(/[?#]/)[0];
      if (!isAsset(base) && !SITE.pathRe.test(base)) { bad('urlscheme', f, 'link outside the URL scheme of the site ' + u); continue; }
      const tf = resolveFile(base);
      if (!tf) { bad('link', f, 'dead link ' + u); continue; }
      const hash = u.split('#')[1];
      if (hash && html[tf] && !ids(tf).has(hash)) bad('anchor', f, 'dangling anchor ' + u);
    }
    if (/\srel="[^"]*\bsponsored\b/.test(H)) bad('affiliate', f, 'rel=sponsored');
    for (const [, src] of H.matchAll(/\ssrc="([^"]+)"/g)) {
      if (src.startsWith('/') && !existsSync(join(dist, src))) bad('src', f, 'missing file ' + src);
      if (/^https?:/.test(src)) { try { if (isOperatorHost(new URL(src).hostname)) bad('operator', f, 'resource from an operator ' + src); } catch { bad('src', f, 'bad src ' + src); } }
    }
    for (const [, img] of H.matchAll(/<img\b([^>]*)>/g)) if (!/\salt="[^"]+"/.test(img)) bad('alt', f, 'img without alt');
    // meta
    const title = decode((H.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
    if (!title || title.length > LIMITS.title) bad('title', f, 'title ' + title.length + ' chars');
    const robots = /<meta name="robots" content="[^"]*noindex/.test(H);
    if (is404) {
      if (!robots) bad('noindex', f, '404 without noindex');
    } else {
      if (robots) bad('noindex', f, 'noindex on a built page (owner 2026-11-03: the whole index is open)');
      const desc = decode((H.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
      if (desc.length < LIMITS.descMin || desc.length > LIMITS.descMax) bad('desc', f, 'description ' + desc.length + ' chars (' + LIMITS.descMin + '-' + LIMITS.descMax + ')');
      const canon = (H.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
      if (canon !== ORIGIN + p.path) bad('canonical', f, 'canonical ' + canon + ' instead of ' + ORIGIN + p.path);
      const ogUrl = (H.match(/<meta property="og:url" content="([^"]+)"/) || [])[1];
      if (!/<meta property="og:title" content="[^"]+"/.test(H) || !/<meta property="og:description" content="[^"]+"/.test(H) || ogUrl !== ORIGIN + p.path) bad('og', f, 'og:title/og:description/og:url missing or wrong');
    }
    // help and age (only on gambling sites; a site without them sets gate.gambling = false in its config; a gambling site may
    // list page kinds that are not gambling - gate.noRgKinds, e.g. card games on jugadadeldia - those carry no help block)
    const noRg = !!(p && (SITE.gate.noRgKinds || []).includes(p.kind));
    if (noRg && SITE.gate.rgBlock.test(H)) bad('rgblock', f, 'help block on a ' + p.kind + ' page (not a gambling page)');
    if (SITE.gate.gambling !== false && !noRg) {
    if (!SITE.gate.age.test(H)) bad('age', f, 'no 18+ mark');
    if (!/href="tel:\d+"/.test(H)) bad('tel', f, 'no tel: link with digits (help line)');
    const helpMarked = SITE.gate.helpMark.test(H);
    if (p && p.help && !helpMarked) bad('helpmark', f, 'help page without the help mark');
    if (p && !p.help && helpMarked) bad('helpmark', f, 'help mark on a page that is not a help page');
    if (!helpMarked && !SITE.gate.rgBlock.test(H)) bad('rgblock', f, 'no help block');
    if (helpMarked) {
      if (SITE.gate.siteMenu.test(H)) bad('helpnav', f, 'site menu on a help page');
      for (const [, u] of H.matchAll(/href="(\/[^"#?]*)/g)) { const k = kindOf(u); if (k && S.BETTING_KINDS.includes(k)) { bad('helplink', f, 'help page links to a ' + k + ' page ' + u); break; } }
    }
    }
    // brand links (gate.brandLinks): inside the registry tables and lists of the site, an element whose whole text is the name of
    // a listed brand must sit inside an <a> to that brand's page
    if (G.brandLinks) for (const box of containers(H, G.brandLinks.scope)) for (const { name, href } of brandPairs) {
      const re = new RegExp('>\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*<', 'g');
      for (const m of box.matchAll(re)) {
        const a = box.lastIndexOf('<a ', m.index), c = box.lastIndexOf('</a>', m.index);
        const got = a > c ? (box.slice(a, box.indexOf('>', a)).match(/\shref="([^"]*)"/) || [])[1] : null;
        if (got !== href) bad('brandlink', f, name + (got ? ' links to ' + got + ' instead of ' + href : ' is not a link to ' + href));
      }
    }
    // weight: HTML + CSS + JS loaded with the page; fonts apart
    {
      let w = Buffer.byteLength(H), fw = 0;
      for (const [, u] of H.matchAll(/<link rel="stylesheet" href="(\/[^"]+)"/g)) {
        w += sizeOf(join(dist, u));
        if (existsSync(join(dist, u))) for (const [, fu] of readFileSync(join(dist, u), 'utf8').matchAll(/url\((\/[^)]+\.woff2)\)/g)) fw += sizeOf(join(dist, fu));
      }
      for (const [, u] of H.matchAll(/<script[^>]*\ssrc="(\/[^"]+)"/g)) w += sizeOf(join(dist, u));
      if (w > BUDGET) bad('weight', f, 'page weight ' + Math.round(w / 1024) + ' KB > ' + BUDGET / 1024 + ' KB');
      if (fw > FONT_BUDGET) bad('weight', f, 'fonts ' + Math.round(fw / 1024) + ' KB > ' + FONT_BUDGET / 1024 + ' KB');
    }
    void where;
  }
  // every page of the site is built, at its file
  for (const [f, p] of pageByFile) if (!html[f]) bad('missing', null, 'page not built ' + p.path + ' (' + relative(dist, f) + ')');
  if (!existsSync(notFoundFile)) bad('missing', null, 'no ' + SITE.notFoundFile);
  // index open: sitemap = exactly the built pages (404 excluded), robots allows everything and names the sitemap
  const sm = existsSync(join(dist, 'sitemap.xml')) ? readFileSync(join(dist, 'sitemap.xml'), 'utf8') : '';
  if (!sm.includes('<urlset')) bad('sitemap', null, 'no sitemap.xml');
  const locs = [...sm.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1]);
  const want = new Set(S.PAGES.map(p => ORIGIN + p.path));
  for (const l of locs) if (!want.has(l)) bad('sitemap', null, 'sitemap has ' + l + ' (not a built page or another host)');
  for (const u of want) if (!locs.includes(u)) bad('sitemap', null, 'sitemap misses ' + u);
  const rb = existsSync(join(dist, 'robots.txt')) ? readFileSync(join(dist, 'robots.txt'), 'utf8') : '';
  if (!rb || /^Disallow:\s*\/\S*\s*$/m.test(rb) || !rb.includes('Sitemap: ' + ORIGIN + '/sitemap.xml')) bad('robots', null, 'robots.txt missing, blocking, or without the sitemap line');
  // served files: own asset scheme, no comments, no Cyrillic
  for (const f of files) {
    const r = relative(dist, f).replace(/\\/g, '/');
    if (!ALLOWED_EXT.test(r)) bad('extrafile', f, 'unexpected file type ' + r);
    if (r.startsWith(SITE.assetDir + '/') && SITE.assetName(r.slice(SITE.assetDir.length + 1), createHashHex(readFileSync(f))) !== r.slice(SITE.assetDir.length + 1)) bad('assetname', f, 'asset name does not follow the site scheme');
    if (!TEXT_EXT.test(f)) continue;
    const t = f.endsWith('.html') ? html[f] : readFileSync(f, 'utf8');
    if (CYR.test(t)) bad('cyrillic', f, 'Cyrillic in a served file');
    if (/\.(html|svg|xml)$/.test(f) && t.includes('<!--')) bad('comments', f, 'HTML/XML comment');
    const css = f.endsWith('.css') ? t : f.endsWith('.html') ? [...t.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('') : '';
    if (css.includes('/*')) bad('comments', f, 'CSS comment');
    const js = /\.m?js$/.test(f) ? [t] : f.endsWith('.html') ? [...t.matchAll(/<script(?![^>]*type="application\/(?:ld\+)?json")(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]) : [];
    for (const code of js) {
      let n = 0;
      try { parseJs(code, { ecmaVersion: 'latest', sourceType: 'module', onComment: () => { n++; } }); } catch (e) { bad('comments', f, 'JS does not parse: ' + e.message); }
      if (n) bad('comments', f, n + ' JS comment(s)');
    }
  }
  // sources: byte-for-byte verification and freshness (any document older than its maxAgeDays fails the gate)
  {
    const msgs = [];
    if (verifyRegistries({ today, log: m => { if (m.startsWith('  BAD')) msgs.push(m.trim()); } })) msgs.filter(m => !/days old/.test(m)).forEach(m => bad('verify', null, m));
    for (const r of loadRegistries()) for (const [slug, d] of Object.entries(r.docs)) { const a = daysBetween(d.fetched, today); if (a < 0 || a > (r.maxAgeDays || 100)) bad('fresh', null, r.id + ' ' + slug + ' copied ' + d.fetched + ' (' + a + ' days)'); }
    const pack = loadRg(), fr = freshness(pack, today);
    for (const s of Object.keys(pack.docs)) if (!fr.docOk(s)) bad('fresh', null, 'help package ' + s + ' copied ' + pack.docs[s].fetched);
    const rgMsgs = [];
    if (verifyRg({ today, log: m => { if (m.startsWith('  BAD') && !/older than/.test(m)) rgMsgs.push(m.trim()); } })) rgMsgs.forEach(m => bad('verify', null, m));
  }
  return { problems, pages: htmls.length, files: files.length };
}
function createHashHex(buf) { return createHash('sha256').update(buf).digest('hex'); }
// the HTML of every element opened by a tag matching scope (a global RegExp whose group 1 is the tag name), nesting counted
function containers(H, scope) {
  const out = [];
  for (const m of H.matchAll(scope)) {
    const tag = m[1], re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'g');
    re.lastIndex = m.index;
    let depth = 0, x;
    while ((x = re.exec(H))) { depth += x[1] ? -1 : 1; if (!depth) { out.push(H.slice(m.index, re.lastIndex)); break; } }
  }
  return out;
}

async function selftest(id) {
  const S = await loadSite(id);
  const base = join(ROOT, 'dist', '_selftest-' + id);
  execFileSync(process.execPath, [join(ROOT, 'tools/render.mjs'), id], { env: { ...process.env, OUT: base }, stdio: ['ignore', 'ignore', 'inherit'] });
  let fail = 0;
  const clean = (await check(id, base)).problems;
  console.log('selftest ' + id + ': clean build - findings ' + clean.length);
  for (const x of clean) console.log('   ' + x.code + ' ' + x.file + ' ' + x.msg);
  if (clean.length) fail++;
  const F = p => S.SITE.fileOf(p);
  const RG = S.SITE.gate.gambling !== false;
  const A_PATH = S.SITE.gate.samplePage || '/metodologia';
  const A = F(A_PATH), HOME = F('/'), HELP = RG ? F(S.PAGES.find(p => p.help).path) : null, PROV = RG ? (S.PAGES.find(p => p.kind === 'province') || S.PAGES.find(p => S.BETTING_KINDS.includes(p.kind))).path : null;
  const G = S.SITE.gate, HELP_ATTR = G.helpAttr || 'data-calma';
  const rep = (a, b) => s => { if (!s.includes(a)) throw new Error('selftest: missing "' + a.slice(0, 40) + '"'); return s.replace(a, b); };
  const body = x => rep('</main>', x + '</main>');
  const cyr = ch(0x43f, 0x440, 0x438);
  const asset = (re, fn) => tmp => { const d = join(tmp, S.SITE.assetDir), f = readdirSync(d).find(x => re.test(x)); writeFileSync(join(d, f), fn(readFileSync(join(d, f), 'utf8'))); };
  const cases = [
    ['h1', A, body('<h1>x</h1>')],
    ['title', A, s => s.replace(/<title>[^<]*/, '<title>' + 'x'.repeat(70))],
    ['desc', A, s => s.replace(/<meta name="description" content="[^"]*"/, '<meta name="description" content="corta"')],
    ['canonical', A, s => s.replace(/<link rel="canonical" href="[^"]+"/, '<link rel="canonical" href="https://' + S.SITE.domain + '/otra"')],
    ['og', A, s => s.replace(/<meta property="og:title"[^>]*>/, '')],
    ['link', A, body('<a href="' + (G.deadLink || '/no-existe') + '">x</a>')],
    ['link', A, body('<a href="relativo">x</a>')],
    ['urlscheme', A, body('<a href="/metodologia.html">x</a>')],
    ['urlscheme', A, body('<a href="' + (G.offScheme || '/licencias/') + '">x</a>')],
    ['anchor', A, body('<a href="#no-existe">x</a>')],
    ['src', A, body('<img src="/' + S.SITE.assetDir + '/no-existe.webp" alt="x">')],
    ['alt', A, body('<img src="/favicon.svg">')],
    ['placeholder', A, s => s.replace(/<meta name="description" content="/, '<meta name="description" content="{{lic_total}} ')],
    ['junk', A, body('<p>NaN</p>')],
    ['junk', A, body('<p>[object Object]</p>')],
    ['bait', A, body('<p>Ganá seguro con este bono</p>')],
    ['bait', A, body('<p>el mejor casino del país</p>')],
    ['bait', A, body('<p>código promocional</p>')],
    ['bait', A, body('<p>premio garantizado</p>')],
    ['bait', A, body('<p>top 10 de sitios</p>')],
    ['promise', A, body('<p>Próximamente</p>')],
    ['extscript', A, body('<script src="https://cdn.example.com/x.js"></script>')],
    ['extstyle', A, rep('</head>', '<link rel="stylesheet" href="https://cdn.example.com/x.css"></head>')],
    ['jsonld', A, body('<script type="application/ld+json">{oops</script>')],
    ['operator', A, body('<a href="https://pba.ejemplo.bet.ar/">x</a>')],
    ['operator', A, body('<a href="https://www.betsson.com.ar/">x</a>')],
    ['affiliate', A, body('<a href="https://example.org/oferta?btag=123">x</a>')],
    ['weight', A, body('<p hidden>' + 'x'.repeat(170 * 1024) + '</p>')],
    ['rgblock', A, s => s.replace(S.SITE.gate.rgBlock, '<aside class="otra"')],
    ['tel', A, s => s.replace(/href="tel:[^"]*"/g, 'href="/"')],
    ['age', A, s => s.replace(S.SITE.gate.age, 'class="x">18+<')],
    ['noindex', A, rep('<head>', '<head><meta name="robots" content="noindex,follow">')],
    ['noindex', S.SITE.notFoundFile, s => s.replace(/<meta name="robots" content="[^"]*">/, '')],
    ['helpmark', HELP, s => s.replace(new RegExp('(<body[^>]*)\\s' + HELP_ATTR), '$1')],
    ['helpmark', A, s => s.replace('<body', '<body ' + HELP_ATTR)],
    ['helplink', HELP, body('<a href="' + PROV + '">x</a>')],
    ['helpnav', HELP, body(G.navSample || '<nav class="rl-nav" id="x"></nav>')],
    ['sitemap', 'sitemap.xml', rep('</urlset>', '<url><loc>https://' + S.SITE.domain + '/no-existe</loc></url></urlset>')],
    ['sitemap', 'sitemap.xml', s => s.replace(new RegExp('<url><loc>[^<]*' + A_PATH + '</loc>[^\\n]*\\n?'), '')],
    ['robots', 'robots.txt', () => 'User-agent: *\nDisallow: /\n'],
    ['comments', A, body('<!-- nota -->')],
    ['comments', A, body('<script>/* nota */</script>')],
    ['cyrillic', A, body('<p>' + cyr + '</p>')],
    ['langattr', A, s => s.replace('<html lang="' + S.SITE.htmlLang + '"', '<html lang="en"')],
  ];
  const run = async (name, prep, o = {}) => {
    const tmp = base + '-' + name;
    rmSync(tmp, { recursive: true, force: true });
    cpSync(base, tmp, { recursive: true });
    prep(tmp);
    const r = (await check(id, tmp, o)).problems, hit = r.filter(x => x.code === name).length;
    console.log((hit ? '  ok    ' : '  BAD   ') + 'corruption "' + name + '" - findings of its own rule ' + hit + ' (total ' + r.length + ')');
    if (!hit) fail++;
    rmSync(tmp, { recursive: true, force: true });
  };
  if (S.SITE.noPerson !== false) cases.push(['jsonld', A, body('<script type="application/ld+json">{"@type":"Person","name":"x"}</script>')]);
  if (G.noRgKinds && G.rgSample) { const NR = S.PAGES.find(p => G.noRgKinds.includes(p.kind)); if (NR) cases.push(['rgblock', F(NR.path), body(G.rgSample)]); }
  for (const [path, fn] of (G.brandLinks && G.brandLinks.corrupt) || []) cases.push(['brandlink', F(path), fn]);
  if (S.SITE.gate.decimalComma) cases.push(['decimal', A, body('<p>Sensibilidad 0.39</p>')], ['decimal', A, body('<input id="z" type="number" value="1">')]);
  const RG_ONLY = new Set(['rgblock', 'tel', 'age', 'helpmark', 'helplink', 'helpnav']);
  for (const [name, file, mut] of cases.filter(c => RG || !RG_ONLY.has(c[0]))) await run(name, tmp => { const f = join(tmp, file); writeFileSync(f, mut(readFileSync(f, 'utf8'))); });
  await run('comments', asset(/\.css$/, s => '/* x */' + s));
  await run('comments', asset(/\.js$/, s => '// x\n' + s));
  await run('cyrillic', asset(/\.js$/, s => s + 'var z="' + cyr + '";'));
  await run('assetname', tmp => { const d = join(tmp, S.SITE.assetDir); const f = readdirSync(d).find(x => x.endsWith('.css')); cpSync(join(d, f), join(d, 'site.css')); });
  await run('extrafile', tmp => writeFileSync(join(tmp, 'notas.exe'), 'x'));
  await run('missing', tmp => rmSync(join(tmp, A)));
  await run('fresh', () => {}, { today: '2099-01-01' });
  // a registry quote changed in the saved document: byte-for-byte verification must fail (restored right after)
  {
    const r = loadRegistries()[0], d = Object.values(r.docs)[0], fpath = join(ROOT, d.file), old = readFileSync(fpath);
    try { writeFileSync(fpath, Buffer.concat([old, Buffer.from(' ')])); await run('verify', () => {}); } finally { writeFileSync(fpath, old); }
  }
  rmSync(base, { recursive: true, force: true });
  console.log(fail ? 'selftest ' + id + ': FAILED ' + fail : 'selftest ' + id + ': every rule catches its corruption, clean build - 0 findings');
  return fail;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const args = process.argv.slice(2), id = args.find(a => !a.startsWith('--'));
  if (!id) { console.error('usage: node tools/check-dist.mjs <site> [folder] [--selftest]'); process.exit(2); }
  if (args.includes('--selftest')) process.exit(await selftest(id) ? 1 : 0);
  const dist = args.filter(a => !a.startsWith('--'))[1] || join(ROOT, 'dist', id);
  if (!existsSync(dist)) { console.error('no build at ' + dist + ' (node tools/render.mjs ' + id + ')'); process.exit(1); }
  const r = await check(id, dist);
  for (const p of r.problems) console.log('  BAD [' + p.code + '] ' + p.file + ' ' + p.msg);
  console.log(`check-dist ${id}: ${r.pages} HTML files, ${r.files} files - ` + (r.problems.length ? `FAILED: ${r.problems.length}` : 'all checks passed'));
  process.exit(r.problems.length ? 1 : 0);
}
