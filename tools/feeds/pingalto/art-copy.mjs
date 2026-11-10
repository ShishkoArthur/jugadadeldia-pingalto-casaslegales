// Game art that the pingalto feeds copy to the site (owner 2026-11-10: official images, else a robots-allowed fan mirror of the
// original art; every source listed in data/sources/pingalto/assets.json, one switch per publisher). Helper, not a feed.
// copyArt downloads each wanted image once into <out>/<dir>/, checks it is a PNG, optionally derives a light WebP of a fixed
// width with cwebp (package libwebp-tools in the feed image; without it the PNG is kept as received), and removes files of
// the folder that are no longer wanted. robots.txt of the host is read before the first new download of a run (a 4xx answer
// means no rules, a 5xx or no answer means "not now", a rule against us or AI agents means never). A broken image never
// fails a feed: that entry is left out and the page shows its text tile.
import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync, renameSync, unlinkSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';

const LIST = new URL('../../../data/sources/pingalto/assets.json', import.meta.url);
const AGENTS = ['pingalto', 'claudebot', 'claude-user', 'claude-searchbot', 'anthropic-ai'];

export function artSwitch(pubs, file = LIST) {
  try {
    const P = JSON.parse(readFileSync(file, 'utf8')).publishers;
    const off = [].concat(pubs).filter(p => !(P[p] && P[p].enabled === true));
    return { on: off.length === 0, why: off.length ? 'art switched off in assets.json: ' + off.join(', ') : '' };
  } catch { return { on: false, why: 'assets.json not found next to the feed code' }; }
}

export const isPng = b => Buffer.isBuffer(b) && b.length >= 200 && b.length <= 2e6 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
export const isWebp = b => Buffer.isBuffer(b) && b.length >= 100 && b.length <= 3e5 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP';

export function robotsAllow(txt, path) {
  const groups = [];
  let cur = null, agentLine = false;
  for (const raw of String(txt || '').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z-]+)\s*:\s*([^#]*)/.exec(raw);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { if (!cur || !agentLine) groups.push(cur = { agents: [], rules: [] }); cur.agents.push(v.toLowerCase()); agentLine = true; }
    else if (k === 'allow' || k === 'disallow') { agentLine = false; if (cur && v) cur.rules.push({ allow: k === 'allow', path: v }); }
    else agentLine = false;
  }
  const re = p => new RegExp('^' + p.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$|\$$/, '$'));
  for (const a of AGENTS) {
    const own = groups.filter(g => g.agents.includes(a));
    const rules = (own.length ? own : a === 'pingalto' ? groups.filter(g => g.agents.includes('*')) : []).flatMap(g => g.rules);
    let best = null;
    for (const r of rules) { let ok; try { ok = re(r.path).test(path); } catch { continue; } if (ok && (!best || r.path.length > best.len || (r.path.length === best.len && r.allow))) best = { len: r.path.length, allow: r.allow }; }
    if (best && !best.allow) return false;
  }
  return true;
}

async function robotsOf(ctx, origin) {
  try { return { txt: (await ctx.getText(origin + '/robots.txt', { ttlHours: 20 })).text, why: '' }; }
  catch (e) { return e.status >= 400 && e.status < 500 ? { txt: '', why: '' } : { txt: null, why: 'robots.txt of ' + new URL(origin).host + ' did not answer (' + String(e.message).slice(0, 60) + ')' }; }
}
const robotsWhy = (r, origin, path) => r.txt === null ? r.why : robotsAllow(r.txt, path) ? '' : 'robots.txt of ' + new URL(origin).host + ' keeps us or AI agents out of ' + path.replace(/[^/]+$/, '');

let cwebpOk = null;
const run = (cmd, args) => new Promise(res => execFile(cmd, args, { timeout: 30000 }, (err, so, se) => res({ ok: !err, err: err ? String(se || err.message).slice(0, 120) : '' })));
export async function hasCwebp() { if (cwebpOk === null) cwebpOk = (await run('cwebp', ['-version'])).ok; return cwebpOk; }
export async function cwebpConvert(buf, width) {
  if (!(await hasCwebp())) return null;
  const base = join(tmpdir(), 'pa-art-' + process.pid + '-' + Math.random().toString(36).slice(2));
  try {
    writeFileSync(base + '.png', buf);
    const r = await run('cwebp', ['-quiet', '-q', '82', '-alpha_q', '90', '-m', '6', '-resize', String(width), '0', base + '.png', '-o', base + '.webp']);
    if (!r.ok) throw new Error('cwebp: ' + r.err);
    return readFileSync(base + '.webp');
  } finally { rmSync(base + '.png', { force: true }); rmSync(base + '.webp', { force: true }); }
}

// want: [{ key, url, base }] (base: file name without extension, unique in the folder). o: { dir, sw: { on, why }, prev: [{ file, fetched }],
// max, webp: width or 0, convert(buf, width) (tests), fileRe (files of this folder; anything else in it is never touched), now }
// -> { on, files: { <key>: <file> }, list: [{ file, url, key, fetched }], got, notes, webp }
export async function copyArt(ctx, want, o) {
  const dir = join(ctx.outDir, o.dir), notes = [], files = {}, list = [];
  const mine = f => o.fileRe.test(f) || (/\.tmp-\d+$/.test(f) && o.fileRe.test(f.replace(/\.tmp-\d+$/, '')));
  const clear = keep => { if (existsSync(dir)) for (const f of readdirSync(dir)) if (mine(f) && !keep.has(f)) unlinkSync(join(dir, f)); };
  if (!o.sw.on) { clear(new Set()); return { on: false, files, list, got: 0, notes: [o.sw.why], webp: false }; }
  const convert = o.convert || cwebpConvert;
  let webp = !!o.webp && !(ctx.env && ctx.env.PA_ART_PNG);
  if (webp && !o.convert && !(await hasCwebp())) { webp = false; notes.push('cwebp not installed: originals kept as PNG'); }
  const ext = webp ? '.webp' : '.png';
  const prevAt = new Map((o.prev || []).map(x => [x.file, x.fetched]));
  mkdirSync(dir, { recursive: true });
  const items = want.map(w => ({ ...w, file: w.base + ext }));
  const missing = items.filter(w => !existsSync(join(dir, w.file)));
  const robots = new Map(), blocked = new Set();
  let got = 0;
  const max = o.max || 220, stamp = (o.now || ctx.now || new Date()).toISOString();
  for (const w of missing) {
    if (got >= max) { notes.push((missing.length - got) + ' images left for the next run'); break; }
    const u = new URL(w.url);
    if (!robots.has(u.origin)) robots.set(u.origin, await robotsOf(ctx, u.origin));
    const why = robotsWhy(robots.get(u.origin), u.origin, u.pathname);
    if (why) { blocked.add(why); continue; }
    try {
      const r = await ctx.getBytes(w.url, { accept: 'image/png' });
      if (!isPng(r.buf)) { notes.push(w.key + ': not a PNG of a sane size'); continue; }
      let out = r.buf;
      if (webp) { out = await convert(r.buf, o.webp); if (!isWebp(out)) { notes.push(w.key + ': WebP conversion failed'); continue; } }
      const tmp = join(dir, w.file + '.tmp-' + process.pid);
      writeFileSync(tmp, out);
      renameSync(tmp, join(dir, w.file));
      prevAt.set(w.file, stamp);
      got++;
    } catch (e) { notes.push(w.key + ': ' + String(e.message).slice(0, 80)); }
  }
  for (const why of blocked) notes.push(why + ': new images there wait');
  for (const w of items) {
    if (!existsSync(join(dir, w.file))) continue;
    files[w.key] = w.file;
    list.push({ file: w.file, url: w.url, key: w.key, fetched: prevAt.get(w.file) || stamp });
  }
  if (o.prune !== false) clear(new Set(items.map(w => w.file)));
  return { on: true, files, list, got, notes, webp };
}
