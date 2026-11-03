// Accepted page scenes -> files the site build serves.
// data/art/<site>/scenes.json (status accepted) + cut-outs data/art/<site>/cut/<id>.webp (one scale by head size, build-scenes.mjs)
// -> sites/<site>/static/scenes/<slug>-<w>.webp (two widths, 1x and 2x of the slot) and sites/<site>/content/scenes.json
// { canvas, pages: { url: { files: [{ name, w, h }], fw, fh, alt } } }. Every scene sits on the same canvas CW x CH (2:3, the slot
// shape): a figure keeps its share of the canvas (fw = W / CW, fh = H / CH), so heads are the same size on every page.
// Only pages the site builds get files; alt comes from ALT in scenes.mjs and must exist. Run after a scene is accepted, then render.
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
const CW = 1134, CH = 1700, SLOTS = [240, 480];

const man = JSON.parse(readFileSync(join(HERE, site, 'scenes.json'), 'utf8'));
const { PAGES } = await import(pathToFileURL(join(ROOT, 'sites', site, 'pages/index.mjs')).href);
const built = new Set(PAGES.map(p => p.path));
const OUT = join(ROOT, 'sites', site, 'static/scenes');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const pages = {};
let bytes = 0;
for (const [url, e] of Object.entries(man.pages)) {
  if (e.status !== 'accepted' || !built.has(url)) continue;
  const alt = ALT[site][url];
  if (!alt) throw new Error(url + ': no alt text in ALT of scenes.mjs');
  const src = join(ROOT, e.file);
  if (!existsSync(src)) throw new Error(url + ': no cut-out ' + e.file);
  const m = await sharp(src).metadata();
  if (m.width > CW || m.height > CH) throw new Error(url + ': ' + m.width + 'x' + m.height + ' does not fit the canvas ' + CW + 'x' + CH);
  const files = [];
  for (const slot of SLOTS) {
    const w = Math.round(m.width * slot / CW), hh = Math.round(m.height * slot / CW);
    const name = 'scenes/' + slug(url) + '-' + w + '.webp';
    const buf = await sharp(src).resize({ width: w, height: hh }).webp({ quality: 80, alphaQuality: 85, effort: 6, smartSubsample: true }).toBuffer();
    writeFileSync(join(ROOT, 'sites', site, 'static', name), buf);
    bytes += buf.length;
    files.push({ name, w, h: hh, kb: Math.round(buf.length / 1024) });
  }
  pages[url] = { image: e.image, files, fw: +(m.width / CW).toFixed(4), fh: +(m.height / CH).toFixed(4), alt };
}
const missing = [...built].filter(u => !pages[u]);
writeFileSync(join(ROOT, 'sites', site, 'content/scenes.json'), JSON.stringify({ canvas: { w: CW, h: CH }, pages }, null, 1) + '\n');
console.log(`${site}: ${Object.keys(pages).length} scenes published, ${readdirSync(OUT).length} files, ${Math.round(bytes / 1024)} KB; pages without a scene: ${missing.join(' ') || 'none'}`);
