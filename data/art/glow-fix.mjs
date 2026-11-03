// Glow clean-up after the green cut (data/art/cut.mjs): a soft light effect drawn over the chroma green (the orb of /valorant, the
// cube of /brawl) keeps a half-transparent grey-blue ring once the green is removed. Inside a circle around the glow, pixels that
// are grey or grey-blue (green above red and blue above green, unlike skin, pink hair or a purple or pink prop) take the glow colour and a lighter alpha, so the ring reads as light, not as dirt.
// Run on the raw cut-out (data/art/<site>/cut/raw/<id>.webp), then build-scenes again.
// node data/art/glow-fix.mjs <raw.webp> <cx> <cy> <r> <hex colour>   (cx, cy, r in fractions of the image width and height)
import sharp from 'sharp';

export async function glowFix(file, { cx, cy, r, color }) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const [tr, tg, tb] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
  const X = cx * W, Y = cy * H, R = r * W;
  let n = 0;
  for (let y = Math.max(0, Math.floor(Y - R)); y < Math.min(H, Math.ceil(Y + R)); y++) for (let x = Math.max(0, Math.floor(X - R)); x < Math.min(W, Math.ceil(X + R)); x++) {
    if ((x - X) ** 2 + (y - Y) ** 2 > R * R) continue;
    const o = (y * W + x) * 4, a = data[o + 3];
    if (!a) continue;
    const [pr, pg, pb] = [data[o], data[o + 1], data[o + 2]];
    const grey = Math.max(pr, pg, pb) - Math.min(pr, pg, pb) < 70 && pg >= pr - 15 && pb >= pg - 10 && Math.max(pr, pg, pb) < 225;
    if (!grey) continue;
    data[o] = tr; data[o + 1] = tg; data[o + 2] = tb; data[o + 3] = Math.round(a * 0.45);
    n++;
  }
  const buf = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).webp({ lossless: true }).toBuffer();
  await sharp(buf).toFile(file);
  return n;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [file, cx, cy, r, color] = process.argv.slice(2);
  console.log(file + ': ' + await glowFix(file, { cx: +cx, cy: +cy, r: +r, color }) + ' px recoloured');
}
