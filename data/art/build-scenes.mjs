// Scene cut-outs, single scale and contact sheet for one site.
// data/img-review/<id>.png -> cut (data/art/cut.mjs) -> measure "hair top to soles" (raised hands are skin, not hair, so they do not
// count) -> scale every scene to the median of that height -> data/art/<site>/cut/<id>.webp (trimmed, transparent) ->
// data/art/<site>/scenes.json {page url -> image id, status review} -> data/img-review/contact-<site>-scenes.jpg with page labels.
// node data/art/build-scenes.mjs <jugadadeldia|pingalto>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { cut } from './cut.mjs';
import { SITES, jobId } from './scenes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../..');
const site = process.argv[2];
if (!SITES[site]) { console.error('usage: build-scenes.mjs <jugadadeldia|pingalto>'); process.exit(2); }
const SRC = join(ROOT, 'data/img-review'), CUT = join(HERE, site, 'cut'), TMP = join(CUT, 'raw');
mkdirSync(TMP, { recursive: true });
const BODY = 1500;

const isHair = site === 'pingalto'
  ? (r, g, b) => r > 150 && r - g > 28 && b - g > 0
  : (r, g, b) => r < 95 && g < 80 && r >= b - 2 && r - b < 40;

async function measure(file) {
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
  return { W, H, top: Math.max(0, top), bottom, body: bottom - Math.max(0, top) };
}

const pages = Object.keys(SITES[site].scenes);
const manPath = join(HERE, site, 'scenes.json');
const man = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : { site, base: `data/art/base/${site}/girl-base.png`, pages: {} };
const rows = [];
for (const url of pages) {
  const id = jobId(site, url), src = join(SRC, id + '.png');
  if (!existsSync(src)) { console.log(`${id}: missing`); continue; }
  const raw = join(TMP, id + '.webp');
  const c = await cut(src, raw);
  const m = await measure(raw);
  rows.push({ url, id, raw, ...m, transparent: c.transparent });
}
const med = rows.map(r => r.body).sort((a, b) => a - b)[rows.length >> 1];
const meas = {};
for (const r of rows) {
  const k = BODY / r.body;
  const out = join(CUT, r.id + '.webp');
  const res = await sharp(r.raw).resize({ width: Math.round(r.W * k), height: Math.round(r.H * k) }).webp({ quality: 86, alphaQuality: 90 }).toFile(out);
  meas[r.id] = { body: r.body, scale: +k.toFixed(3), offMedian: +((r.body / med - 1) * 100).toFixed(1), transparent: r.transparent, size: `${res.width}x${res.height}` };
  const prev = man.pages[r.url] || {};
  man.pages[r.url] = { image: r.id, file: `data/art/${site}/cut/${r.id}.webp`, status: prev.status === 'accepted' && prev.image === r.id ? 'accepted' : 'review', alt: '' };
  const warn = r.transparent < 50 ? '  LOW TRANSPARENCY' : '';
  console.log(`${r.id}: body ${r.body}px (${meas[r.id].offMedian}% vs median), transparent ${r.transparent}%${warn}`);
}
writeFileSync(manPath, JSON.stringify(man, null, 1) + '\n');
writeFileSync(join(HERE, site, 'scenes-measure.json'), JSON.stringify({ bodyPx: BODY, medianSourceBody: med, scenes: meas }, null, 1) + '\n');

const TH = 520, COLS = 8, LBL = 34, scale = TH / Math.max(...rows.map(r => r.H * BODY / r.body));
const tiles = [];
for (const r of rows) {
  const b = await sharp(join(CUT, r.id + '.webp')).resize({ height: Math.max(1, Math.round(r.H * (BODY / r.body) * scale)) }).png().toBuffer();
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
const out = join(SRC, `contact-${site}-scenes.jpg`);
await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#d9d6cf' } }).composite(comp).jpeg({ quality: 82 }).toFile(out);
console.log(`${out}: ${rows.length} scenes, median body ${med}px`);
