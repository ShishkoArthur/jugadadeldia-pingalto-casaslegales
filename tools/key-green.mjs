// Cut out green background (chroma key) → WebP with transparency.
// node tools/key-green.mjs <input.png> <output.webp> [height=660]
// Alpha from pixel "greenness" (g − max(r,b)); on the semi-transparent edge
// green is suppressed (despill), otherwise hair glows green.
import sharp from 'sharp';

const [inp, out, hArg, mode] = process.argv.slice(2);
const NOTRIM = mode === 'notrim';
if (!inp || !out) { console.error('usage: key-green.mjs in.png out.webp [height]'); process.exit(2); }
const H = +(hArg || 660);
const { data, info } = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const px = info.width * info.height;
// Thresholds based on the image background (canadabetting 27.10): the generator gives a "studio" green with shadows, not pure #00FF00 —
// take the median "greenness" d = g − max(r,b) along the frame edge; below T1 — opaque, above T2 — transparent.
const edge = [];
for (let x = 0; x < info.width; x += 4) for (const y of [0, 1, info.height - 2, info.height - 1]) edge.push(y * info.width + x);
for (let y = 0; y < info.height; y += 4) for (const x of [0, 1, info.width - 2, info.width - 1]) edge.push(y * info.width + x);
const ds = edge.map(i => data[i * 4 + 1] - Math.max(data[i * 4], data[i * 4 + 2])).sort((a, b) => a - b);
const bgD = ds[ds.length >> 1];
if (bgD < 30) throw new Error(`background is not green (median d=${bgD}) — cutout impossible`);
const T1 = Math.max(12, Math.round(bgD * 0.22)), T2 = Math.max(T1 + 10, Math.round(bgD * 0.55));
console.log(`  background: median d=${bgD}, thresholds ${T1}/${T2}`);
let cut = 0;
for (let i = 0; i < px; i++) {
  const o = i * 4, r = data[o], g = data[o + 1], b = data[o + 2];
  const m = Math.max(r, b);
  const d = g - m;
  let a = 255;
  if (d > T1) a = d >= T2 ? 0 : Math.round(255 * (1 - (d - T1) / (T2 - T1)));
  if (d > 0) data[o + 1] = m + Math.round(d * 0.15); // despill
  data[o + 3] = a;
  if (a === 0) cut++;
}
// Keep only the figure: the largest connected opaque region. The generator sometimes
// draws detached gloves/boots — they are separate regions and get removed.
{
  const W = info.width, Hh = info.height, lab = new Int32Array(W * Hh);
  let best = 0, bestSize = 0, cur = 0;
  const sizes = [0];
  const stack = new Int32Array(W * Hh);
  for (let i = 0; i < W * Hh; i++) {
    if (lab[i] || data[i * 4 + 3] < 40) continue;
    cur++; let sp = 0, n = 0; stack[sp++] = i; lab[i] = cur;
    while (sp) {
      const k = stack[--sp]; n++;
      const x = k % W, y = (k / W) | 0;
      const nb = [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < Hh - 1 ? k + W : -1];
      for (const q of nb) if (q >= 0 && !lab[q] && data[q * 4 + 3] >= 40) { lab[q] = cur; stack[sp++] = q; }
    }
    sizes.push(n);
    if (n > bestSize) { bestSize = n; best = cur; }
  }
  let removed = 0;
  for (let i = 0; i < W * Hh; i++) if (data[i * 4 + 3] && lab[i] !== best) {
    // semi-transparent fringe of the figure (label 0) stays, detached regions — zeroed
    if (lab[i]) { data[i * 4 + 3] = 0; removed++; }
  }
  // semi-transparent fringe (alpha < 40) stays only near the figure (radius 2 px)
  for (let i = 0; i < W * Hh; i++) {
    if (lab[i] || !data[i * 4 + 3]) continue;
    const x = i % W, y = (i / W) | 0; let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < Hh && lab[yy * W + xx] === best) { near = true; break; }
    }
    if (!near) { data[i * 4 + 3] = 0; removed++; }
  }
  if (removed) console.log('  detached pixels removed: ' + removed + ' (regions ' + (sizes.length - 2) + ')');
}
const img = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
const trimmed = await img.png().toBuffer().then(b => NOTRIM ? b : sharp(b).trim({ threshold: 1 }).toBuffer());
const res = await sharp(trimmed).resize({ height: H, withoutEnlargement: true }).webp({ quality: 86, alphaQuality: 90 }).toFile(out);
console.log(`${out}: ${res.width}x${res.height}, ${(res.size / 1024).toFixed(0)} KB, transparent ${(100 * cut / px).toFixed(0)}%`);
