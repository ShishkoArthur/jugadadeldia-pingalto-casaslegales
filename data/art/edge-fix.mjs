// Edge clean-up after tools/key-green.mjs: green-screen spill survives as an olive fringe on light hair
// (pink hair + green mix has g < r, so despill does not touch it). Pixels within `band` px of the
// transparent area take the mean colour of nearby interior pixels; alpha is choked over `choke` px.
// node data/art/edge-fix.mjs <in.webp> <out.webp> [band=6] [choke=2]
import sharp from 'sharp';

export async function edgeFix(inp, out, band = 6, choke = 2) {
  const { data, info } = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H, INF = 1e9;
  const dist = new Float32Array(N);
  for (let i = 0; i < N; i++) dist[i] = data[i * 4 + 3] < 128 ? 0 : INF;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; let d = dist[i];
    if (x > 0) d = Math.min(d, dist[i - 1] + 1);
    if (y > 0) d = Math.min(d, dist[i - W] + 1);
    if (x > 0 && y > 0) d = Math.min(d, dist[i - W - 1] + 1.414);
    if (x < W - 1 && y > 0) d = Math.min(d, dist[i - W + 1] + 1.414);
    if (x === 0 || x === W - 1 || y === 0 || y === H - 1) d = Math.min(d, 1);
    dist[i] = d;
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x; let d = dist[i];
    if (x < W - 1) d = Math.min(d, dist[i + 1] + 1);
    if (y < H - 1) d = Math.min(d, dist[i + W] + 1);
    if (x < W - 1 && y < H - 1) d = Math.min(d, dist[i + W + 1] + 1.414);
    if (x > 0 && y < H - 1) d = Math.min(d, dist[i + W - 1] + 1.414);
    dist[i] = d;
  }
  const src = Buffer.from(data), R = band + 3;
  let fixed = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, d = dist[i];
    if (d > band || data[i * 4 + 3] === 0) continue;
    let r = 0, g = 0, b = 0, w = 0;
    for (let yy = Math.max(0, y - R); yy <= Math.min(H - 1, y + R); yy++) for (let xx = Math.max(0, x - R); xx <= Math.min(W - 1, x + R); xx++) {
      const k = yy * W + xx;
      if (dist[k] <= band) continue;
      r += src[k * 4]; g += src[k * 4 + 1]; b += src[k * 4 + 2]; w++;
    }
    const o = i * 4;
    if (w) {
      const t = Math.min(1, 1 - (d - 1) / band);
      data[o] = Math.round(src[o] * (1 - t) + (r / w) * t);
      data[o + 1] = Math.round(src[o + 1] * (1 - t) + (g / w) * t);
      data[o + 2] = Math.round(src[o + 2] * (1 - t) + (b / w) * t);
      fixed++;
    }
    if (d > 0 && d <= choke) data[o + 3] = Math.round(data[o + 3] * Math.max(0, (d - 0.5) / choke));
  }
  const res = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 86, alphaQuality: 90 }).toFile(out);
  return { width: res.width, height: res.height, fixed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [inp, out, band, choke] = process.argv.slice(2);
  if (!inp || !out) { console.error('usage: edge-fix.mjs in.webp out.webp [band] [choke]'); process.exit(2); }
  const r = await edgeFix(inp, out, +(band || 6), +(choke || 2));
  console.log(`${out}: ${r.width}x${r.height}, edge pixels recoloured ${r.fixed}`);
}
