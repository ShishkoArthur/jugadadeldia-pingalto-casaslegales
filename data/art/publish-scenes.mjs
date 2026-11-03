// Accepted page scenes -> files the site build serves. A scene in review goes live only when the agent checked it at full size
// (field checked, owner rule 2026-11-03: deploy at once); the owner then accepts it or asks for another.
// data/art/<site>/scenes.json (status accepted) + cut-outs data/art/<site>/cut/<id>.webp (one scale by head size, build-scenes.mjs)
// -> sites/<site>/static/scenes/<slug>-<w>.webp and sites/<site>/content/scenes.json { rule, pages: { url: { files: [{ name, w, h }], ar, g, alt } } }.
// Each cut-out is trimmed to the figure's bounding box (alpha > 40) plus a small margin (top 3 %, sides 3 %, bottom 1 % of its height),
// so a seated or kneeling pose carries no empty canvas. Sizing rule (the page code applies it): a single figure fills its frame; the
// frame of a page is as tall as K * width * g, where g = (figure height / standing height FULL) ^ 0.7 on the common head scale. Standing
// figures get the full frame, a seated one a shorter frame at a slightly larger scale (head on screen at most ~1.25 x the standing one),
// so heads stay comparable from page to page; a frame is never wider than the figure needs (ar = width / height of the file).
// Three heights per scene (H_SET, capped at the cut-out height) for srcset. Only pages the site builds get files; alt comes from ALT in
// scenes.mjs and must exist. Run after a scene is accepted, then render.
// node data/art/publish-scenes.mjs <jugadadeldia|pingalto>
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { ALT, slug } from './scenes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../..');
const site = process.argv[2];
if (!ALT[site]) { console.error('usage: publish-scenes.mjs <jugadadeldia|pingalto>'); process.exit(2); }
const FULL = 1700, H_SET = [300, 560, 840], EXP = 0.7, A_MIN = 40;

const man = JSON.parse(readFileSync(join(HERE, site, 'scenes.json'), 'utf8'));
const { PAGES } = await import(pathToFileURL(join(ROOT, 'sites', site, 'pages/index.mjs')).href);
const built = new Set(PAGES.map(p => p.path));
const OUT = join(ROOT, 'sites', site, 'static/scenes');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const pages = {};
let bytes = 0;
for (const [url, e] of Object.entries(man.pages)) {
  if (!(e.status === 'accepted' || (e.status === 'review' && e.checked)) || !built.has(url)) continue;
  const alt = ALT[site][url];
  if (!alt) throw new Error(url + ': no alt text in ALT of scenes.mjs');
  const src = join(ROOT, e.file);
  if (!existsSync(src)) throw new Error(url + ': no cut-out ' + e.file);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] <= A_MIN) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) throw new Error(url + ': empty cut-out ' + e.file);
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const mt = Math.round(bh * 0.03), ms = Math.round(bh * 0.03), mb = Math.round(bh * 0.01);
  const trimmed = await sharp(src).extract({ left: x0, top: y0, width: bw, height: bh })
    .extend({ top: mt, bottom: mb, left: ms, right: ms, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const W = bw + 2 * ms, H = bh + mt + mb;
  const files = [];
  for (const th of [...new Set(H_SET.map(x => Math.min(x, H)))]) {
    const hh = th, w = Math.round(W * th / H);
    const name = 'scenes/' + slug(url) + '-' + w + '.webp';
    const buf = await sharp(trimmed).resize({ width: w, height: hh }).webp({ quality: 80, alphaQuality: 85, effort: 6, smartSubsample: true }).toBuffer();
    writeFileSync(join(ROOT, 'sites', site, 'static', name), buf);
    bytes += buf.length;
    files.push({ name, w, h: hh, kb: Math.round(buf.length / 1024) });
  }
  pages[url] = { image: e.image, files, ar: +(W / H).toFixed(4), g: +Math.min(1, Math.pow(bh / FULL, EXP)).toFixed(4), alt };
}
const missing = [...built].filter(u => !pages[u]);
writeFileSync(join(ROOT, 'sites', site, 'content/scenes.json'), JSON.stringify({ rule: { full: FULL, exp: EXP, margin: 'top 3 %, sides 3 %, bottom 1 % of the figure height' }, pages }, null, 1) + '\n');
console.log(`${site}: ${Object.keys(pages).length} scenes published, ${readdirSync(OUT).length} files, ${Math.round(bytes / 1024)} KB; pages without a scene: ${missing.join(' ') || 'none'}`);
