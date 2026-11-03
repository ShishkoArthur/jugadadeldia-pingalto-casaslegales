// Scene cut-out for jugadadeldia and pingalto (variant of tools/key-green.mjs tuned for light pink hair and olive skin).
// Greenness is measured against the mean of red and blue (g - (r+b)/2), so a pink-plus-green mix reads as partly
// transparent instead of an opaque olive fringe; bright pixels (light paper lit by green spill) are pulled back toward opaque
// by how far their darkest channel is above the background's; a penalty 4*(r-g) when red exceeds green keeps yellow props (lemon, pencil) opaque; despill clamps green to that reference; only the largest region is kept
// (enclosed transparent holes that are only weakly green and bright, such as green-lit paper, are restored first; dark shadowed
// background between legs and chair legs stays transparent). metric 'max' measures greenness against max(r, b) instead of
// the mean: olive skin lit by the green floor is not keyed out (jugadadeldia; pink hair needs the mean). metric 'split': the mean
// in the top 40 % of the frame (pink hair), max below 50 % (legs lit by the green floor read as a white see-through patch with the
// mean: pingalto /kit/sensibilidad r2, owner 2026-11-03), blended in between, and below the split a warm pixel (red above blue: shadowed skin
// lit by the green floor) counts as less green; with 'split' and 'max' a pixel greener than red is
// despilled down to the mean of red and blue (green-lit skin turns back to skin, yellow props with red above green stay)
// (or every region above minFrac of the frame, default 0.05 %, with keepAll); then edge-fix recolours the remaining fringe.
// node data/art/cut.mjs <in.png> <out.webp> [keepAll]
import sharp from 'sharp';
import { edgeFix } from './edge-fix.mjs';
import { writeFileSync, unlinkSync } from 'node:fs';

export async function cut(inp, out, { keepAll = false, minFrac = 0.0005, band = 6, choke = 3, metric = 'mean' } = {}) {
  const { data, info } = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const edge = [];
  for (let x = 0; x < W; x += 4) for (const y of [0, 1, H - 2, H - 1]) edge.push(y * W + x);
  for (let y = 0; y < H; y += 4) for (const x of [0, 1, W - 2, W - 1]) edge.push(y * W + x);
  const mins = edge.map(i => Math.min(data[i * 4], data[i * 4 + 2])).sort((a, b) => a - b);
  const bgMin = mins[mins.length >> 1];
  const mean = (o) => (data[o] + data[o + 2]) / 2, mx = (o) => Math.max(data[o], data[o + 2]);
  const SPLIT0 = H * 0.4, SPLIT1 = H * 0.5;
  const low = (o) => { const y = ((o >> 2) / W) | 0; return y <= SPLIT0 ? 0 : y >= SPLIT1 ? 1 : (y - SPLIT0) / (SPLIT1 - SPLIT0); };
  const ref = metric === 'max' ? mx : metric === 'split' ? (o) => { const t = low(o); return mean(o) * (1 - t) + mx(o) * t; } : mean;
  const warm = metric === 'split' ? (o) => 1.5 * low(o) * Math.max(0, data[o] - data[o + 2]) : () => 0;
  const gx = (o) => data[o + 1] - ref(o) - 4 * Math.max(0, data[o] - data[o + 1])
    - 0.35 * Math.max(0, Math.min(data[o], data[o + 2]) - bgMin - 20) - warm(o);
  const ds = edge.map(i => gx(i * 4)).sort((a, b) => a - b);
  const bg = ds[ds.length >> 1];
  if (bg < 40) throw new Error(`${inp}: background is not green (median ${bg})`);
  const T1 = Math.max(10, bg * 0.12), T2 = Math.max(T1 + 12, bg * 0.5);
  let cutPx = 0;
  for (let i = 0; i < N; i++) {
    const o = i * 4, d = gx(o);
    let a = 255;
    if (d > T1) a = d >= T2 ? 0 : Math.round(255 * (1 - (d - T1) / (T2 - T1)));
    const cap = metric !== 'mean' && data[o + 1] > data[o] ? mean(o) + 2 : ref(o) + 2;
    if ((d > 0 || metric !== 'mean') && data[o + 1] > cap) data[o + 1] = Math.round(cap);
    data[o + 3] = a;
    if (a === 0) cutPx++;
  }
  {
    const seen = new Uint8Array(N), st = new Int32Array(N);
    let sp = 0;
    for (let x = 0; x < W; x++) for (const y of [0, H - 1]) { const k = y * W + x; if (data[k * 4 + 3] < 128 && !seen[k]) { seen[k] = 1; st[sp++] = k; } }
    for (let y = 0; y < H; y++) for (const x of [0, W - 1]) { const k = y * W + x; if (data[k * 4 + 3] < 128 && !seen[k]) { seen[k] = 1; st[sp++] = k; } }
    while (sp) {
      const k = st[--sp], x = k % W;
      for (const q of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, k - W, k + W]) if (q >= 0 && q < N && !seen[q] && data[q * 4 + 3] < 128) { seen[q] = 1; st[sp++] = q; }
    }
    let filled = 0;
    for (let i = 0; i < N; i++) {
      if (seen[i] || data[i * 4 + 3] >= 128) continue;
      const members = []; let s2 = 0, sum = 0, lum = 0; st[s2++] = i; seen[i] = 2;
      while (s2) {
        const k = st[--s2], x = k % W; members.push(k); sum += gx(k * 4); lum += Math.min(data[k * 4], data[k * 4 + 2]);
        for (const q of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, k - W, k + W]) if (q >= 0 && q < N && !seen[q] && data[q * 4 + 3] < 128) { seen[q] = 2; st[s2++] = q; }
      }
      if (sum / members.length < bg * 0.6 && lum / members.length > bgMin + 30) for (const k of members) { data[k * 4 + 3] = 255; filled++; }
    }
    if (filled) console.log(`  ${inp.split('/').pop()}: enclosed weakly green holes restored, ${filled} px`);
  }
  const lab = new Int32Array(N), stack = new Int32Array(N), sizes = [0];
  let best = 0, bestSize = 0;
  for (let i = 0, cur = 0; i < N; i++) {
    if (lab[i] || data[i * 4 + 3] < 40) continue;
    cur++; let sp = 0, n = 0; stack[sp++] = i; lab[i] = cur;
    while (sp) {
      const k = stack[--sp]; n++;
      const x = k % W;
      for (const q of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, k - W, k + W]) if (q >= 0 && q < N && !lab[q] && data[q * 4 + 3] >= 40) { lab[q] = cur; stack[sp++] = q; }
    }
    sizes.push(n);
    if (n > bestSize) { bestSize = n; best = cur; }
  }
  const min = N * minFrac;
  let removed = 0;
  for (let i = 0; i < N; i++) {
    if (!data[i * 4 + 3]) continue;
    const l = lab[i];
    if (l && (keepAll ? sizes[l] < min : l !== best)) { data[i * 4 + 3] = 0; removed++; }
  }
  for (let i = 0; i < N; i++) {
    if (lab[i] || !data[i * 4 + 3]) continue;
    const x = i % W, y = (i / W) | 0; let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && lab[yy * W + xx] && data[(yy * W + xx) * 4 + 3]) { near = true; break; }
    }
    if (!near) data[i * 4 + 3] = 0;
  }
  const tmp = out + '.tmp.png';
  const trimmed = await sharp(await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer()).trim({ threshold: 1 }).png().toBuffer();
  writeFileSync(tmp, trimmed);
  const r = await edgeFix(tmp, out, band, choke);
  unlinkSync(tmp);
  return { ...r, transparent: Math.round(100 * cutPx / N), bg: Math.round(bg), removed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [inp, out, mode] = process.argv.slice(2);
  if (!inp || !out) { console.error('usage: cut.mjs in.png out.webp [keepAll]'); process.exit(2); }
  const r = await cut(inp, out, { keepAll: mode === 'keepAll' });
  console.log(`${out}: ${r.width}x${r.height}, background ${r.bg}, transparent ${r.transparent}%, removed ${r.removed}`);
}
