// Static checks of a live site from its HTML: node tools/qa/static.mjs <site> [--probe 5]
// title <= 60 and unique, description 115-155, canonical = url, JSON-LD parses (FAQPage shape), no links to the other two sites,
// robots.txt, live sitemap = sitemap of a fresh build (dist/<site>), feeds health, casaslegales official links (allowlisted host, nofollow)
// and --probe N of them answered from this machine (any 2xx/3xx/4xx geo answer is a reachable site).
import fs from 'node:fs';
import path from 'node:path';
const SITE = process.argv[2];
const BASE = 'https://' + SITE + '.com';
const OTHERS = ['jugadadeldia.com', 'pingalto.com', 'casaslegales.com'].filter(d => d !== SITE + '.com');
const PROBE = +(process.argv[process.argv.indexOf('--probe') + 1] || 0) || 0;
const out = { site: SITE, issues: [], notes: [] };
const bad = (k, m) => out.issues.push(k + ': ' + m);
const get = async (u, o = {}) => { for (let a = 0; a < 3; a++) { try { const r = await fetch(u, { redirect: 'manual', ...o }); return { s: r.status, loc: r.headers.get('location'), ct: r.headers.get('content-type') || '', t: await r.text() }; } catch (e) { if (a === 2) return { s: 0, t: '', err: e.message }; } } };
const dec = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const len = s => [...dec(s)].length;

const sm = await get(BASE + '/sitemap.xml?qa=' + Date.now());
const urls = [...sm.t.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
out.pages = urls.length;
const robots = await get(BASE + '/robots.txt');
if (robots.s !== 200) bad('robots', 'status ' + robots.s);
if (!/Sitemap:\s*https:\/\/[^\s]+\/sitemap\.xml/i.test(robots.t)) bad('robots', 'no Sitemap line');
if (/User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*$/im.test(robots.t)) bad('robots', 'Disallow: / for *');
const distSm = path.resolve('dist', SITE, 'sitemap.xml');
if (fs.existsSync(distSm)) {
  const d = new Set([...fs.readFileSync(distSm, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));
  const l = new Set(urls);
  for (const u of d) if (!l.has(u)) bad('sitemap', 'built but not live ' + u);
  for (const u of l) if (!d.has(u)) bad('sitemap', 'live but not built ' + u);
} else out.notes.push('no dist sitemap to compare');

let officialHosts = null;
if (SITE === 'casaslegales') {
  const { SITE: CFG } = await import(path.resolve('sites/casaslegales/config.mjs'));
  officialHosts = CFG.gate.officialLinks.hosts();
}
const titles = new Map(); const offLinks = new Map(); let ld = 0, faq = 0;
for (const u of urls) {
  const r = await get(u);
  if (r.s !== 200) { bad('status', r.s + ' ' + u); continue; }
  const h = r.t; const p = u.replace(BASE, '') || '/';
  const t = (/<title>([^<]*)<\/title>/.exec(h) || [])[1];
  const d = (/<meta name="description" content="([^"]*)"/.exec(h) || [])[1];
  const c = (/<link rel="canonical" href="([^"]*)"/.exec(h) || [])[1];
  if (!t) bad('title', 'missing ' + p); else { if (len(t) > 60) bad('title', len(t) + ' > 60 ' + p + ' "' + dec(t) + '"'); const k = dec(t).toLowerCase(); titles.set(k, [...(titles.get(k) || []), p]); }
  if (!d) bad('desc', 'missing ' + p); else if (len(d) < 115 || len(d) > 155) bad('desc', len(d) + ' ' + p);
  if (c !== u) bad('canonical', p + ' -> ' + c);
  if (/name="robots" content="[^"]*noindex/.test(h)) bad('noindex', p);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    ld++;
    let j; try { j = JSON.parse(m[1]); } catch (e) { bad('jsonld', 'parse ' + p + ' ' + e.message); continue; }
    const nodes = [j, ...(Array.isArray(j['@graph']) ? j['@graph'] : [])].flat();
    for (const n of nodes) {
      if (!n || n['@type'] !== 'FAQPage') continue;
      faq++;
      const q = n.mainEntity;
      if (!Array.isArray(q) || !q.length) { bad('faq', 'no mainEntity ' + p); continue; }
      for (const x of q) if (x['@type'] !== 'Question' || !x.name || !x.acceptedAnswer || x.acceptedAnswer['@type'] !== 'Answer' || !x.acceptedAnswer.text) bad('faq', 'bad question ' + p + ' "' + String(x.name).slice(0, 40) + '"');
      const vis = q.filter(x => !h.includes(x.name.replace(/&/g, '&amp;').slice(0, 30)) && !h.includes(x.name.slice(0, 30)));
      if (vis.length) bad('faq', vis.length + ' questions not in visible HTML ' + p);
    }
  }
  for (const m of h.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>/g)) {
    const href = dec(m[1]);
    for (const o of OTHERS) if (href.includes(o)) bad('crosslink', p + ' -> ' + href);
    if (!officialHosts || !/^https?:/.test(href)) continue;
    const host = new URL(href).hostname;
    const isOff = /class="rl-off/.test(m[0]);
    if (officialHosts.has(host) || isOff) {
      if (isOff && !officialHosts.has(host) && !/(^|\.)apple\.com$|^play\.google\.com$/.test(host)) bad('official', 'host not allowlisted ' + host + ' on ' + p);
      if (!/rel="[^"]*nofollow/.test(m[0])) bad('official', 'no nofollow ' + href + ' on ' + p);
      if (/[?#]/.test(href) && officialHosts.has(host)) bad('official', 'query/fragment ' + href + ' on ' + p);
      offLinks.set(href, (offLinks.get(href) || 0) + 1);
    }
  }
}
for (const [t, ps] of titles) if (ps.length > 1) bad('dupTitle', '"' + t + '" ' + ps.join(' '));
out.jsonld = ld; out.faqPages = faq; out.officialLinks = offLinks.size;

const hl = await get(BASE + '/data/feeds/_health.json?qa=' + Date.now());
if (hl.s !== 200) bad('feeds', '_health ' + hl.s);
else { const j = JSON.parse(hl.t); if (!j.ok) bad('feeds', 'health not ok ' + JSON.stringify(j.problems)); for (const [k, f] of Object.entries(j.feeds || {})) if (f.enabled && (f.stale || f.failing)) bad('feeds', k + ' stale/failing ' + f.ageHours + 'h'); out.feedAgeH = Math.round((Date.now() - Date.parse(j.generated)) / 36e5 * 10) / 10; }

if (PROBE && offLinks.size) {
  const list = [...offLinks.keys()].filter(u => !/apple|google/.test(u));
  const pick = []; for (let i = 0; i < PROBE && list.length; i++) pick.push(list.splice(Math.floor(i * 7919 % list.length), 1)[0]);
  out.probe = [];
  for (const u of pick) {
    let s = 0, loc = '', err = '';
    try { const r = await fetch(u, { method: 'GET', redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/131.0 Safari/537.36' }, signal: AbortSignal.timeout(20000) }); s = r.status; loc = r.headers.get('location') || ''; } catch (e) { err = (e.cause && e.cause.code) || e.message; }
    out.probe.push(u + ' ' + (s || err) + (loc ? ' -> ' + loc.slice(0, 80) : ''));
    if (!s) bad('probe', u + ' ' + err);
  }
}
console.log(JSON.stringify(out, null, 1));
