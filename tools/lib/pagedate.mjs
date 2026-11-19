// The date of a page (JSON-LD dateModified, sitemap <lastmod>, the footer date of a site that shows one): the newest of
// (a) the copy dates of the saved documents the page cites - every http(s) address in an href/cite attribute of the page body that
//     is a saved copy in data/sources (an object with "url" or "linkedFrom" and a "fetched"/"date" day; the newest copy wins), and
// (b) the last commit day (git log -1 --format=%cs) of the page's own module (the pages/*.mjs file that holds its render function)
//     and of the sites/<site>/content/ files that module imports directly.
// Not the build day: the same commit and the same copies give the same dates on every build.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const newest = list => list.filter(d => DAY.test(d || '')).sort().at(-1) || null;

// last commit day of every file under dirs, from one "git log" pass (first appearance = last commit); {} without git
export function gitDays(root, dirs) {
  let out = '';
  try { out = execFileSync('git', ['-c', 'core.quotePath=false', 'log', '--format=@%cs', '--name-only', '--', ...dirs], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return {}; }
  return parseGitLog(out);
}
export function parseGitLog(out) {
  const days = {};
  let d = null;
  for (const line of String(out).split(/\r?\n/)) {
    if (line.startsWith('@')) d = line.slice(1).trim();
    else if (line.trim() && d && !(line.trim() in days)) days[line.trim()] = d;
  }
  return days;
}

// url -> newest copy day of the saved documents in a parsed JSON tree
export function copyDays(trees, into = new Map()) {
  const add = (u, d) => { if (typeof u !== 'string' || !/^https?:\/\//.test(u) || !DAY.test(d || '')) return; for (const k of urlKeys(u)) if (!into.has(k) || into.get(k) < d) into.set(k, d); };
  const visit = o => {
    if (Array.isArray(o)) { for (const x of o) visit(x); return; }
    if (!o || typeof o !== 'object') return;
    const d = DAY.test(o.fetched || '') ? o.fetched : DAY.test(o.date || '') ? o.date : null;
    if (d) { add(o.url, d); add(o.linkedFrom, d); }
    for (const v of Object.values(o)) if (v && typeof v === 'object') visit(v);
  };
  for (const t of trees) visit(t);
  return into;
}
// every data/sources/**/*.json except the saved copies themselves (_docs)
export function loadCopyDays(root) {
  const trees = [];
  const walk = d => { for (const f of readdirSync(d, { withFileTypes: true })) { if (f.isDirectory()) { if (f.name !== '_docs') walk(join(d, f.name)); } else if (f.name.endsWith('.json')) { try { trees.push(JSON.parse(readFileSync(join(d, f.name), 'utf8'))); } catch (e) {} } } };
  const base = join(root, 'data/sources');
  if (existsSync(base)) walk(base);
  return copyDays(trees);
}
// the same address with and without the final slash and the #fragment
export function urlKeys(u) {
  const a = String(u).split('#')[0];
  return [...new Set([a, a.replace(/\/$/, ''), a.endsWith('/') ? a : a + '/'])];
}
const unent = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
// http(s) addresses in href="..." and cite="..." of an HTML fragment
export function citedUrls(html) {
  const out = new Set();
  for (const m of String(html).matchAll(/\b(?:href|cite)="(https?:\/\/[^"]+)"/g)) out.add(unent(m[1]));
  return [...out];
}
export function citedDay(html, days) {
  return newest(citedUrls(html).map(u => urlKeys(u).map(k => days.get(k)).filter(Boolean)).flat());
}

// files (relative to root, forward slashes) whose text holds the source of fn; pages/ files first
export function moduleOf(fn, files) {
  const src = typeof fn === 'function' ? Function.prototype.toString.call(fn) : '';
  if (src.length < 8 || /\[native code\]/.test(src)) return [];
  return Object.keys(files).filter(f => files[f].includes(src));
}
// sites/<site>/content/ files a module imports directly
export function contentImports(file, text, contentDir) {
  const out = [];
  for (const m of String(text).matchAll(/\bfrom\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const abs = resolve(dirname(file), m[1]);
    const r = relative(contentDir, abs);
    if (r && !r.startsWith('..') && !isAbsolute(r)) out.push(abs);
  }
  return out;
}

// page dates of one site: date(page, bodyHtml) -> 'YYYY-MM-DD'
export function pageDater({ root, siteDir, fallback, git = null, copies = null, log = () => {} }) {
  const rel = p => relative(root, p).replace(/\\/g, '/');
  const pagesDir = join(siteDir, 'pages'), contentDir = join(siteDir, 'content');
  const texts = {};
  for (const d of [pagesDir, contentDir]) if (existsSync(d)) for (const f of readdirSync(d).filter(f => f.endsWith('.mjs')).sort()) texts[rel(join(d, f))] = readFileSync(join(d, f), 'utf8');
  const days = git || gitDays(root, [rel(siteDir)]);
  const cdays = copies || loadCopyDays(root);
  const index = rel(join(pagesDir, 'index.mjs'));
  const byFn = new Map();
  const filesOf = p => {
    const fn = p.render;
    if (byFn.has(fn)) return byFn.get(fn);
    let mods = moduleOf(fn, texts);
    const inPages = mods.filter(f => f.startsWith(rel(pagesDir) + '/'));
    if (inPages.length) mods = inPages;
    if (!mods.length) { log('page date: no module holds the render function of ' + p.path + ', using ' + index); mods = [index]; }
    const files = new Set(mods);
    for (const m of mods) for (const c of contentImports(join(root, m), texts[m] || '', contentDir)) files.add(rel(c));
    const out = [...files].sort();
    byFn.set(fn, out);
    return out;
  };
  const date = (p, body) => {
    const files = filesOf(p);
    const g = newest(files.map(f => days[f]));
    const c = citedDay(body, cdays);
    return newest([g, c]) || fallback;
  };
  date.filesOf = filesOf;
  date.gitDay = f => days[f] || null;
  return date;
}
