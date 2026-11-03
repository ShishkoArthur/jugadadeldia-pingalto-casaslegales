// Scene cut-outs, single scale and contact sheet for one site (round from scenes.mjs).
// data/img-review/<id>.png -> cut (data/art/cut.mjs; keepAll scenes keep separate props down to 0.005 % of the frame) ->
// data/art/<site>/cut/raw/<id>.webp. Scale by head size, so standing, seated and kneeling figures match: heads are marked by eye
// on data/img-review/heads-<site>-<round>.jpg (data/art/head.mjs) into data/art/<site>/heads.json { id: { top, chin } }; the base
// is marked as "base" and fixes the target: a standing figure from hair to soles is BODY px, its head HEAD = BODY * baseHead / baseBody.
// -> data/art/<site>/cut/<id>.webp (trimmed, transparent) -> data/art/<site>/scenes.json {page url -> image id, status review}
// -> data/art/<site>/scenes-measure.json -> data/img-review/contact-<site>-scenes-<round>.jpg with page labels.
// node data/art/build-scenes.mjs <jugadadeldia|pingalto> [--recut]
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { cut } from './cut.mjs';
import { headSheet } from './head.mjs';
import { SITES, jobId, sceneOpts, ROUND } from './scenes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../..');
const site = process.argv[2];
const RECUT = process.argv.includes('--recut');
if (!SITES[site]) { console.error('usage: build-scenes.mjs <jugadadeldia|pingalto> [--recut]'); process.exit(2); }
const SRC = join(ROOT, 'data/img-review'), CUT = join(HERE, site, 'cut'), TMP = join(CUT, 'raw');
mkdirSync(TMP, { recursive: true });
const BODY = 1500;

const isHair = site === 'pingalto'
  ? (r, g, b) => r > 150 && r - g > 28 && b - g > 0
  : (r, g, b) => r < 95 && g < 80 && r >= b - 2 && r - b < 40;

async function measureBody(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  let bottom = 0, top = -1;
  for (let y = H - 1; y >= 0 && !bottom; y--) {
    let n = 0;
    for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) n++;
    if (n > 3) bottom = y;
  }
  const need = Math.max(4, Math.round(W * 0.01));
  for (let y = 0; y < H * 0.35 && top < 0; y++) {
    let n = 0;
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      if (data[o + 3] > 200 && isHair(data[o], data[o + 1], data[o + 2])) n++;
    }
    if (n >= need) top = y;
  }
  return { W, H, body: bottom - Math.max(0, top) };
}

const pages = Object.keys(SITES[site].scenes);
const rows = [];
for (const url of pages) {
  const id = jobId(site, url), src = join(SRC, id + '.png');
  if (!existsSync(src)) { console.log(`${id}: missing`); continue; }
  const raw = join(TMP, id + '.webp');
  let transparent = null;
  if (RECUT || !existsSync(raw) || statSync(raw).mtimeMs < statSync(src).mtimeMs) {
    const o = sceneOpts(site, url);
    const c = await cut(src, raw, { ...(o.keepAll ? { keepAll: true, minFrac: 0.00005 } : {}), metric: site === 'jugadadeldia' ? 'max' : 'mean' });
    transparent = c.transparent;
    if (c.transparent < 50) console.log(`${id}: LOW TRANSPARENCY ${c.transparent}%`);
  }
  const m = await sharp(raw).metadata();
  rows.push({ url, id, raw, W: m.width, H: m.height, transparent });
}

const headsPath = join(HERE, site, 'heads.json');
const heads = existsSync(headsPath) ? JSON.parse(readFileSync(headsPath, 'utf8')) : {};
const unmarked = rows.filter(r => !heads[r.id]);
if (unmarked.length || !heads.base) {
  const items = [...(heads.base ? [] : [{ file: join(ROOT, `data/art/base/${site}/girl-base-cut.webp`), label: 'base' }]),
    ...unmarked.map(r => ({ file: r.raw, label: r.id }))];
  for (let i = 0; i < items.length; i += 8) {
    const out = join(SRC, `heads-${site}-${ROUND}-${i / 8 + 1}.jpg`);
    await headSheet(items.slice(i, i + 8), out);
    console.log(`mark heads on ${out}`);
  }
  console.log(`${items.length} heads to mark in ${headsPath}`);
  process.exit(1);
}
const baseBody = (await measureBody(join(ROOT, `data/art/base/${site}/girl-base-cut.webp`))).body;
const baseHead = heads.base.chin - heads.base.top;
const HEAD = Math.round(BODY * baseHead / baseBody);

const manPath = join(HERE, site, 'scenes.json');
const man = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : { site, base: `data/art/base/${site}/girl-base.png`, pages: {} };
const measPath = join(HERE, site, 'scenes-measure.json');
const oldMeas = existsSync(measPath) ? JSON.parse(readFileSync(measPath, 'utf8')).scenes || {} : {};
const meas = {};
for (const r of rows) {
  const head = heads[r.id].chin - heads[r.id].top;
  const k = HEAD / head;
  const out = join(CUT, r.id + '.webp');
  const res = await sharp(r.raw).resize({ width: Math.round(r.W * k), height: Math.round(r.H * k) }).webp({ quality: 86, alphaQuality: 90 }).toFile(out);
  r.k = k;
  meas[r.id] = { pose: SITES[site].scenes[r.url][0], head, scale: +k.toFixed(3), transparent: r.transparent ?? oldMeas[r.id]?.transparent ?? null, size: `${res.width}x${res.height}` };
  const prev = man.pages[r.url] || {};
  man.pages[r.url] = { image: r.id, file: `data/art/${site}/cut/${r.id}.webp`, status: prev.status === 'accepted' && prev.image === r.id ? 'accepted' : 'review', alt: '' };
  console.log(`${r.id}: head ${head}px, scale ${k.toFixed(3)}${k > 1 ? '  UPSCALED' : ''}, ${res.width}x${res.height}`);
}
writeFileSync(manPath, JSON.stringify(man, null, 1) + '\n');
writeFileSync(measPath, JSON.stringify({ round: ROUND, scaleBy: 'head (hair top to chin, marked by eye)', bodyPx: BODY, headPx: HEAD,
  base: { head: baseHead, body: baseBody }, scenes: meas }, null, 1) + '\n');

const TH = 520, COLS = 8, LBL = 34, scale = TH / Math.max(...rows.map(r => r.H * r.k));
const tiles = [];
for (const r of rows) {
  const b = await sharp(join(CUT, r.id + '.webp')).resize({ height: Math.max(1, Math.round(r.H * r.k * scale)) }).png().toBuffer();
  tiles.push({ r, b, m: await sharp(b).metadata() });
}
const TW = Math.max(220, ...tiles.map(t => t.m.width)) + 10;
const nRows = Math.ceil(tiles.length / COLS);
const sheetW = TW * Math.min(COLS, tiles.length), sheetH = nRows * (TH + LBL);
const comp = [];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
tiles.forEach((t, i) => {
  const x = (i % COLS) * TW, y = Math.floor(i / COLS) * (TH + LBL);
  const w = Math.min(t.m.width, TW), h = Math.min(t.m.height, TH);
  comp.push({ input: t.b, left: x + Math.round((TW - w) / 2), top: y + TH - h });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${LBL}"><rect width="100%" height="100%" fill="#222"/><text x="${TW / 2}" y="22" font-family="DejaVu Sans, sans-serif" font-size="${Math.min(15, Math.floor((TW - 8) / (t.r.url.length * 0.6)))}" fill="#fff" text-anchor="middle">${esc(t.r.url)}</text></svg>`;
  comp.push({ input: Buffer.from(svg), left: x, top: y + TH });
});
const out = join(SRC, `contact-${site}-scenes-${ROUND}.jpg`);
await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#d9d6cf' } }).composite(comp).jpeg({ quality: 82 }).toFile(out);
console.log(`${out}: ${rows.length} scenes, head ${HEAD}px (base head ${baseHead} / body ${baseBody})`);
