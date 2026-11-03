// Scene cut-out for jugadadeldia and pingalto (variant of tools/key-green.mjs tuned for light pink hair and olive skin).
// Greenness is measured against the mean of red and blue (g - (r+b)/2), so a pink-plus-green mix reads as partly
// transparent instead of an opaque olive fringe; bright pixels (light paper lit by green spill) are pulled back toward opaque
// by how far their darkest channel is above the background's; a penalty 4*(r-g) when red exceeds green keeps yellow props (lemon, pencil) opaque; despill clamps green to that mean; only the largest region is kept
// (enclosed transparent holes that are only weakly green, such as green-lit paper, are restored first)
// (or every region above 0.05 % of the frame with keepAll); then edge-fix recolours the remaining fringe.
// node data/art/cut.mjs <in.png> <out.webp> [keepAll]
import sharp from 'sharp';
import { edgeFix } from './edge-fix.mjs';
import { writeFileSync, unlinkSync } from 'node:fs';

export async function cut(inp, out, { keepAll = false, band = 6, choke = 3 } = {}) {
  const { data, info } = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const edge = [];
  for (let x = 0; x < W; x += 4) for (const y of [0, 1, H - 2, H - 1]) edge.push(y * W + x);
  for (let y = 0; y < H; y += 4) for (const x of [0, 1, W - 2, W - 1]) edge.push(y * W + x);
  const mins = edge.map(i => Math.min(data[i * 4], data[i * 4 + 2])).sort((a, b) => a - b);
  const bgMin = mins[mins.length >> 1];
  const gx = (o) => data[o + 1] - (data[o] + data[o + 2]) / 2 - 4 * Math.max(0, data[o] - data[o + 1])
    - 0.35 * Math.max(0, Math.min(data[o], data[o + 2]) - bgMin - 20);
  const ds = edge.map(i => gx(i * 4)).sort((a, b) => a - b);
  const bg = ds[ds.length >> 1];
  if (bg < 40) throw new Error(`${inp}: background is not green (median ${bg})`);
  const T1 = Math.max(10, bg * 0.12), T2 = Math.max(T1 + 12, bg * 0.5);
  let cutPx = 0;
  for (let i = 0; i < N; i++) {
    const o = i * 4, d = gx(o);
    let a = 255;
    if (d > T1) a = d >= T2 ? 0 : Math.round(255 * (1 - (d - T1) / (T2 - T1)));
    const cap = (data[o] + data[o + 2]) / 2 + 2;
    if (d > 0 && data[o + 1] > cap) data[o + 1] = Math.round(cap);
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
      const members = []; let s2 = 0, sum = 0; st[s2++] = i; seen[i] = 2;
      while (s2) {
        const k = st[--s2], x = k % W; members.push(k); sum += gx(k * 4);
        for (const q of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, k - W, k + W]) if (q >= 0 && q < N && !seen[q] && data[q * 4 + 3] < 128) { seen[q] = 2; st[s2++] = q; }
      }
      if (sum / members.length < bg * 0.6) for (const k of members) { data[k * 4 + 3] = 255; filled++; }
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
  const min = N * 0.0005;
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
