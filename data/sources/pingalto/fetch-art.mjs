// Game art that pingalto hosts itself (owner 2026-11-10), listed in data/sources/pingalto/assets.json.
//   node data/sources/pingalto/fetch-art.mjs <set> [--write]
// riot-lol: the square portrait of every League of Legends champion from Riot's Data Dragon (the version of the saved champion
// list, sources.json "ddragon-champs"). valorant-agents / valorant-maps: the agent icons and map banners that the saved
// valorant-api.com lists name (valorant-api.com mirrors the original Riot art; Riot has no open image files for Valorant).
// robots.txt of the host is read first; a 4xx answer means no rules (RFC 9309), a 5xx or a rule against us or AI agents stops
// the run, and a 403 for a file stops it too (never worked around). The originals are large (agent icons are 1024 px, about
// 570 KB), so each set keeps a light WebP of a fixed width drawn by Chromium (Playwright from another project, as tools/qa does:
// PLAYWRIGHT_DIR); the list records the original's URL, size and sha256 next to the file we serve. Without --write nothing is saved.
// Clash Royale and Brawl Stars art is copied on the server by the feeds (tools/feeds/pingalto/art-copy.mjs).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { robotsAllow, isPng, isWebp } from '../../../tools/feeds/pingalto/art-copy.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const LIST = join(ROOT, 'data/sources/pingalto/assets.json');
const UA = 'Pingalto/1.0 (pingalto.com)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = b => createHash('sha256').update(b).digest('hex');
const doc = slug => JSON.parse(readFileSync(join(ROOT, JSON.parse(readFileSync(join(ROOT, 'data/sources/pingalto/sources.json'), 'utf8')).docs[slug].file), 'utf8'));
const slug = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const SETS = {
  'riot-lol': { width: 104, list: () => { const c = doc('ddragon-champs'); return Object.values(c.data).map(x => ({ file: x.image.full.replace(/\.png$/, '.webp'), url: 'https://ddragon.leagueoflegends.com/cdn/' + c.version + '/img/champion/' + x.image.full, of: x.id })); } },
  'valorant-agents': { width: 128, list: () => doc('valapi-agents').data.filter(a => a.isPlayableCharacter && a.displayIcon).map(a => ({ file: slug(a.displayName) + '.webp', url: a.displayIcon, of: a.uuid })) },
  'valorant-ranks': { width: 64, list: async () => {
    const r = await fetch('https://valorant-api.com/v1/competitivetiers?language=es-MX', { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error('competitivetiers ' + r.status);
    const d = (await r.json()).data, last = d[d.length - 1];
    const ranks = JSON.parse(readFileSync(join(ROOT, 'data/sources/pingalto/sources.json'), 'utf8')).facts.val_ranks.value;
    return ranks.map(n => { const t = last.tiers.find(x => x.smallIcon && (x.tierName === n.toUpperCase() + ' 1' || x.tierName === n.toUpperCase())); if (!t) throw new Error('no tier for ' + n); return { file: slug(n) + '.webp', url: t.smallIcon, of: n }; });
  } },
  'valorant-minimaps': { width: 640, list: () => doc('valapi-maps').data.filter(m => ['Ascent', 'Split'].includes(m.displayName) && m.displayIcon).map(m => ({ file: slug(m.displayName) + '.webp', url: m.displayIcon, of: m.uuid })) },
  'valorant-maps': { width: 456, list: () => doc('valapi-maps').data.filter(m => /^Sitios /.test(m.tacticalDescription || '') && m.listViewIcon).map(m => ({ file: slug(m.displayName) + '.webp', url: m.listViewIcon, of: m.uuid })) },
};

async function shrinker() {
  const dir = process.env.PLAYWRIGHT_DIR || resolve(ROOT, '../manuallysites/casinovictoriaargentina/node_modules/playwright');
  const { chromium } = createRequire(import.meta.url)(dir);
  const b = await chromium.launch(), p = await b.newPage();
  const one = async (buf, w) => {
    const url = await p.evaluate(async ([src, w]) => {
      const i = new Image(); i.src = src; await i.decode();
      const c = document.createElement('canvas'); c.width = w; c.height = Math.round(w * i.naturalHeight / i.naturalWidth);
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(i, 0, 0, c.width, c.height);
      return c.toDataURL('image/webp', 0.85);
    }, ['data:image/png;base64,' + buf.toString('base64'), w]);
    return Buffer.from(url.split(',')[1], 'base64');
  };
  return { one, close: () => b.close() };
}

async function main() {
  const id = process.argv[2], write = process.argv.includes('--write');
  if (!SETS[id]) { console.error('set must be one of ' + Object.keys(SETS).join(', ')); return 2; }
  const A = JSON.parse(readFileSync(LIST, 'utf8'));
  const set = A.sets.find(s => s.id === id);
  if (!set) { console.error('no set ' + id + ' in assets.json'); return 2; }
  const S = SETS[id], want = await S.list();
  const host = new URL(want[0].url).origin;
  const rb = await fetch(host + '/robots.txt', { headers: { 'User-Agent': UA } });
  if (rb.status >= 500) { console.error('robots.txt answers ' + rb.status + ': stop'); return 1; }
  if (rb.ok && !robotsAllow(await rb.text(), new URL(want[0].url).pathname)) { console.error('robots.txt keeps us or AI agents out: stop'); return 1; }
  console.log('robots.txt ' + rb.status + (rb.ok ? ' (rules allow us)' : ' (no rules)'));
  const dir = join(ROOT, set.dir), day = new Date().toISOString().slice(0, 10), files = [];
  if (write) mkdirSync(dir, { recursive: true });
  const sh = await shrinker();
  try {
    for (const w of want) {
      if (!/^[\w.-]+\.webp$/.test(w.file)) throw new Error('file name ' + w.file);
      const old = (set.files || []).find(f => f.file === w.file && f.url === w.url && f.width === S.width);
      if (old && existsSync(join(dir, w.file))) { files.push(old); continue; }
      await sleep(300);
      const r = await fetch(w.url, { headers: { 'User-Agent': UA } });
      if (r.status === 403) throw new Error('403 for ' + w.url + ': not bypassed, stop');
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + w.url);
      const src = Buffer.from(await r.arrayBuffer());
      if (!isPng(src) && !(src.length > 200 && src.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))) throw new Error('not a PNG ' + w.url);
      const b = await sh.one(src, S.width);
      if (!isWebp(b)) throw new Error('WebP failed for ' + w.url);
      if (write) writeFileSync(join(dir, w.file), b);
      files.push({ file: w.file, of: w.of, url: w.url, fetched: day, width: S.width, bytes: b.length, sha256: sha(b), srcBytes: src.length, srcSha256: sha(src) });
    }
  } finally { await sh.close(); }
  files.sort((a, b) => a.file < b.file ? -1 : 1);
  console.log(id + ': ' + files.length + ' files, ' + Math.round(files.reduce((t, f) => t + f.bytes, 0) / 1024) + ' KB served (originals ' + Math.round(files.reduce((t, f) => t + (f.srcBytes || 0), 0) / 1024) + ' KB)');
  if (write) {
    const keep = new Set(files.map(f => f.file));
    for (const f of readdirSync(dir)) if (!keep.has(f)) unlinkSync(join(dir, f));
    set.files = files; set.fetched = day; set.width = S.width;
    writeFileSync(LIST, JSON.stringify(A, null, 1) + '\n'); console.log('assets.json updated');
  }
  return 0;
}
process.exit(await main());
