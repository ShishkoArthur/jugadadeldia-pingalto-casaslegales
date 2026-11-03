// Head size of a cut-out figure, used to give every scene (standing, seated, kneeling) the same scale.
// Colour rules for skin and face fail on these hair colours (light pink, brown highlights), so the head is marked by eye:
// headSheet() draws the top of each trimmed cut-out with a pixel ruler; the reviewer reads the top of the hair and the chin
// and writes them to data/art/<site>/heads.json { id: { top, chin } } (pixels of the trimmed raw cut-out, data/art/<site>/cut/raw/).
// head = chin - top. The base image is marked the same way under the id "base".
// node data/art/head.mjs <out.jpg> <cut.webp> [...]
import sharp from 'sharp';

const ROWS = +(process.env.HEAD_ROWS || 600), K = +(process.env.HEAD_K || 0.75), HALF = +(process.env.HEAD_HALF || 300);

async function tile(file, label) {
  const m = await sharp(file).metadata();
  const h = Math.min(m.height, ROWS);
  const { data, info } = await sharp(file).extract({ left: 0, top: 0, width: m.width, height: Math.min(m.height, 300) }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let sx = 0, n = 0;
  for (let i = 0; i < info.width * info.height; i++) if (data[i * 4 + 3] > 200) { sx += i % info.width; n++; }
  const cx = n ? Math.round(sx / n) : m.width >> 1;
  const left = Math.max(0, Math.min(m.width - 1, cx - HALF)), width = Math.min(m.width - left, HALF * 2);
  const img = await sharp(file).extract({ left, top: 0, width, height: h }).flatten({ background: '#9a9a9a' }).resize({ width: Math.round(width * K), height: Math.round(h * K) }).png().toBuffer();
  const TW = Math.round(HALF * 2 * K) + 60, TH = Math.round(ROWS * K) + 30;
  let marks = '';
  for (let y = 0; y <= h; y += 10) {
    const yy = Math.round(y * K), major = y % 50 === 0;
    marks += `<rect x="${major ? 0 : 40}" y="${yy}" width="${major ? TW : 20}" height="1" fill="${major ? '#ff00ff' : '#000'}" opacity="${major ? 0.55 : 1}"/>`;
    if (major) marks += `<text x="2" y="${yy - 2}" font-family="DejaVu Sans" font-size="11" fill="#000">${y}</text>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}">${marks}<text x="4" y="${TH - 8}" font-family="DejaVu Sans" font-size="13" fill="#000">${label}</text></svg>`;
  return sharp({ create: { width: TW, height: TH, channels: 3, background: '#ffffff' } })
    .composite([{ input: img, left: 60, top: 0 }, { input: Buffer.from(svg), left: 0, top: 0 }]).png().toBuffer();
}

export async function headSheet(items, out, cols = 4) {
  const tiles = [];
  for (const it of items) tiles.push(await tile(it.file, it.label));
  const m = await sharp(tiles[0]).metadata();
  const rows = Math.ceil(tiles.length / cols);
  await sharp({ create: { width: m.width * Math.min(cols, tiles.length), height: m.height * rows, channels: 3, background: '#ffffff' } })
    .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * m.width, top: Math.floor(i / cols) * m.height }))).jpeg({ quality: 80 }).toFile(out);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [out, ...files] = process.argv.slice(2);
  await headSheet(files.map(f => ({ file: f, label: f.split('/').pop().replace(/\.webp$/, '') })), out);
}
