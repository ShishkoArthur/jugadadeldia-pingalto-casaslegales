// Site logo and icons from sites/<site>/logo.mjs. A site logo module exports LOGO = { prefix, pick, manifest, concepts }; every
// concept draws one 64x64 mark with class-based colors (class = prefix + key; key "f..." is a fill, "s..." a stroke, "g..." a
// gradient stop colour), so one drawing serves the header (follows the page theme switch), favicon.svg (follows
// prefers-color-scheme), the standalone light/dark files and the PNG icons. Switching the shipped concept = changing LOGO.pick.
// concept = { id, name, palette: { light, dark }, draw(k, id, o), plate?(k, id, o) }:
//   k(key) -> class attribute, id(name) -> unique id; o.small = simplified geometry for 16-32 px;
//   plate = full-bleed square drawing for app icons (o.zoom scales the glyph); without it the mark is centered on palette fPlate.
const PROP = { f: 'fill', s: 'stroke', g: 'stop-color' };

export function concept(L, cid = L.pick) {
  const c = L.concepts.find(x => x.id === cid);
  if (!c) throw new Error('logo: no concept ' + cid);
  return c;
}

const rules = (L, pal, pre = '') => Object.entries(pal).map(([n, v]) => {
  if (!PROP[n[0]]) throw new Error('logo: palette key ' + n + ' must start with f, s or g');
  return pre + '.' + L.prefix + n + '{' + PROP[n[0]] + ':' + v + '}';
}).join('');

function style(L, c, mode) {
  const { light } = c.palette;
  const dark = Object.fromEntries(Object.entries(c.palette.dark).filter(([n, v]) => light[n] !== v));
  if (mode === 'light' || mode === 'dark') return rules(L, c.palette[mode]);
  if (!Object.keys(dark).length) return rules(L, light);
  if (mode === 'auto') return rules(L, light) + '@media (prefers-color-scheme:dark){' + rules(L, dark) + '}';
  if (mode === 'page') return rules(L, light) + '@media (prefers-color-scheme:dark){' + rules(L, dark, ':root:not([data-theme=light]) ') + '}' + rules(L, dark, ':root[data-theme=dark] ');
  throw new Error('logo: unknown mode ' + mode);
}

// mode: light | dark | auto (favicon) | page (inline header); kind: mark | app (180/192/512 icons) | mask (maskable, 80% safe zone)
export function logoSvg(L, cid, { mode = 'light', kind = 'mark', small = false, attrs = '' } = {}) {
  const c = concept(L, cid);
  const k = key => 'class="' + L.prefix + key + '"';
  const id = n => L.prefix + c.id.replace(/[^a-z0-9]/g, '') + n;
  let body;
  if (kind === 'mark') body = c.draw(k, id, { small });
  else {
    const zoom = kind === 'mask' ? 0.66 : 0.8;
    body = c.plate ? c.plate(k, id, { small, zoom })
      : '<rect width="64" height="64" ' + k('fPlate') + '/><g transform="translate(32 32) scale(' + zoom + ') translate(-32 -32)">' + c.draw(k, id, { small }) + '</g>';
  }
  const ns = mode === 'page' ? '' : ' xmlns="http://www.w3.org/2000/svg"';
  return '<svg' + ns + ' viewBox="0 0 64 64"' + attrs + ' style="fill:none;stroke:none"><style>' + style(L, c, mode) + '</style>' + body + '</svg>';
}

// all files for dist/: favicon.svg, favicon.ico (16/32/48 PNGs), apple-touch-icon.png, icon-192.png, icon-512.png,
// icon-maskable-512.png, site.webmanifest
export async function iconFiles(L, SITE) {
  const sharp = (await import('sharp')).default;
  const png = async (svg, size) => sharp(Buffer.from(svg), { density: Math.max(72, Math.ceil(72 * size / 64) * 2) }).resize(size, size).png().toBuffer();
  const out = {};
  out['favicon.svg'] = logoSvg(L, L.pick, { mode: 'auto', small: true });
  const sizes = [16, 32, 48];
  const pngs = [];
  for (const s of sizes) pngs.push(await png(logoSvg(L, L.pick, { small: s < 48 }), s));
  const head = Buffer.alloc(6 + 16 * sizes.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  let off = head.length;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(pngs[i].length, e + 8); head.writeUInt32LE(off, e + 12);
    off += pngs[i].length;
  });
  out['favicon.ico'] = Buffer.concat([head, ...pngs]);
  const app = logoSvg(L, L.pick, { kind: 'app' });
  out['apple-touch-icon.png'] = await sharp(await png(app, 180)).flatten({ background: L.manifest.background_color }).png().toBuffer();
  out['icon-192.png'] = await png(app, 192);
  out['icon-512.png'] = await png(app, 512);
  out['icon-maskable-512.png'] = await png(logoSvg(L, L.pick, { kind: 'mask' }), 512);
  out['site.webmanifest'] = JSON.stringify({
    name: SITE.name, short_name: L.manifest.short_name || SITE.name, lang: SITE.htmlLang, start_url: '/', scope: '/', display: 'browser',
    theme_color: L.manifest.theme_color, background_color: L.manifest.background_color,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  });
  return out;
}

export const iconLinks = () => '<link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" href="/favicon.svg" type="image/svg+xml">' +
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">';
