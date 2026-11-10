// Official Clash Royale card art for pingalto.com (owner 2026-11-10: official game images, unmodified, from the publisher's own
// source, with the publisher's notice). Helper of clash.mjs, not a feed (no fetch/validate/compute: the runner skips it).
// The /v1/cards answer of the official API lists iconUrls.medium (and iconUrls.evolutionMedium for cards with an evolution) on
// api-assets.clashroyale.com. Each image is downloaded once into <out>/clash-art/<id>[-evo]-<10 hex of sha1(url)>.png: a new or
// changed URL gives a new file, an unchanged one is never fetched again. The bytes are stored as received (PNG signature and size
// checked). Files no longer named by the API are removed. The switch is data/sources/pingalto/assets.json (publishers.supercell.enabled):
// off, or the file missing (it reaches the server with the feed code, docs/FEEDS.md), means no download and the folder is emptied.
// robots.txt of the image host is read first (a 4xx answer means no rules, a 5xx or no answer means "not now").
import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const ART_DIR = 'clash-art';
export const ART_HOST = 'api-assets.clashroyale.com';
export const ART_MAX = 220;
const KINDS = [['medium', ''], ['evolutionMedium', '-evo']];
const URL_RE = /^\/cards\/300\/[\w-]{8,80}\.png$/;
export const FILE_RE = /^\d{6,10}(-evo)?-[0-9a-f]{10}\.png$/;
const AGENTS = ['pingalto', 'claudebot', 'claude-user', 'claude-searchbot', 'anthropic-ai'];
const LIST = new URL('../../../data/sources/pingalto/assets.json', import.meta.url);

export function artSwitch(file = LIST) {
  try {
    const p = JSON.parse(readFileSync(file, 'utf8')).publishers.supercell;
    return { on: p.enabled === true, why: p.enabled === true ? '' : 'supercell art switched off in assets.json' };
  } catch { return { on: false, why: 'assets.json not found next to the feed code' }; }
}

export function artUrl(u) {
  let x; try { x = new URL(u); } catch { return null; }
  return x.protocol === 'https:' && x.hostname === ART_HOST && !x.search && !x.hash && URL_RE.test(x.pathname) ? x.href : null;
}
export const artFile = (id, suffix, url) => id + suffix + '-' + createHash('sha1').update(url).digest('hex').slice(0, 10) + '.png';
export const isPng = b => Buffer.isBuffer(b) && b.length >= 1000 && b.length <= 2e6 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

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

async function robotsOk(ctx) {
  try { return robotsAllow((await ctx.getText('https://' + ART_HOST + '/robots.txt', { ttlHours: 20 })).text, '/cards/300/x.png') ? '' : 'robots.txt of ' + ART_HOST + ' keeps us or AI agents out of /cards/'; }
  catch (e) { return e.status >= 400 && e.status < 500 ? '' : 'robots.txt of ' + ART_HOST + ' did not answer (' + String(e.message).slice(0, 60) + ')'; }
}

const junk = f => FILE_RE.test(f) || /^\d{6,10}(-evo)?-[0-9a-f]{10}\.png\.tmp-\d+$/.test(f);
const empty = dir => { if (existsSync(dir)) for (const f of readdirSync(dir)) if (junk(f)) unlinkSync(join(dir, f)); };

// -> { on, files: { <card id>: { img?, evo? } }, list: [{ file, url, card, fetched }], got, kept, notes }
export async function syncArt(ctx, items, o = {}) {
  const sw = o.switch || artSwitch();
  const dir = join(ctx.outDir, ART_DIR), notes = [], files = {}, list = [];
  if (!sw.on) { empty(dir); return { on: false, files, list, got: 0, kept: 0, notes: [sw.why] }; }
  const prevAt = new Map(((o.prev && o.prev.files) || []).map(x => [x.file, x.fetched]));
  const want = [];
  for (const c of items) for (const [k, suffix] of KINDS) {
    const raw = c.iconUrls && c.iconUrls[k];
    if (!raw) continue;
    const url = artUrl(raw);
    if (!url) { notes.push('card ' + c.id + ': unexpected ' + k + ' url'); continue; }
    want.push({ id: c.id, k: suffix ? 'evo' : 'img', url, file: artFile(c.id, suffix, url) });
  }
  mkdirSync(dir, { recursive: true });
  const missing = want.filter(w => !existsSync(join(dir, w.file)));
  const block = missing.length ? await robotsOk(ctx) : '';
  if (block) notes.push(block + ': ' + missing.length + ' new images wait');
  let got = 0;
  const max = o.max || ART_MAX;
  for (const w of missing) {
    if (block || got >= max) break;
    try {
      const r = await ctx.getBytes(w.url, { accept: 'image/png' });
      if (!isPng(r.buf)) { notes.push('card ' + w.id + ': not a PNG of a sane size'); continue; }
      const tmp = join(dir, w.file + '.tmp-' + process.pid);
      writeFileSync(tmp, r.buf);
      renameSync(tmp, join(dir, w.file));
      prevAt.set(w.file, (ctx.now || new Date()).toISOString());
      got++;
    } catch (e) { notes.push('card ' + w.id + ': ' + String(e.message).slice(0, 80)); }
  }
  if (got >= max && missing.length > got) notes.push((missing.length - got) + ' images left for the next run');
  const today = (ctx.now || new Date()).toISOString();
  for (const w of want) {
    if (!existsSync(join(dir, w.file))) continue;
    (files[w.id] = files[w.id] || {})[w.k] = w.file;
    list.push({ file: w.file, url: w.url, card: w.id, fetched: prevAt.get(w.file) || today });
  }
  const keep = new Set(want.map(w => w.file));
  if (items.length >= 80) for (const f of readdirSync(dir)) if (junk(f) && !keep.has(f)) unlinkSync(join(dir, f));
  return { on: true, files, list, got, kept: list.length - got, notes };
}
