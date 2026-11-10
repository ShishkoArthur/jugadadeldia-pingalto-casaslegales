// Clash Royale card art for pingalto.com (owner 2026-11-10: official game images from the publisher's own source, with the
// publisher's notice). Helper of clash.mjs, not a feed. The /v1/cards answer of the official API names iconUrls.medium and,
// for cards with an evolution, iconUrls.evolutionMedium, all on api-assets.clashroyale.com. Each image is copied once by
// art-copy.mjs into <out>/clash-art/<id>[-evo]-<10 hex of sha1(url)>.webp: a light tile 210 px wide (the 300 px originals are
// about 180 KB; phones waited seconds for the grid); without cwebp in the feed image the PNG is kept as received. A new or
// changed URL gives a new file; files no longer named by the API are removed. Switch: assets.json publishers.supercell.enabled.
import { createHash } from 'node:crypto';
import { copyArt, artSwitch as sw, robotsAllow, isPng } from './art-copy.mjs';

export { robotsAllow, isPng };
export const ART_DIR = 'clash-art';
export const ART_HOST = 'api-assets.clashroyale.com';
export const ART_MAX = 260;
export const ART_W = 210;
const KINDS = [['medium', ''], ['evolutionMedium', '-evo']];
const PATH_RE = /^(\/[\w-]{1,40}){1,3}\/[\w-]{8,100}\.png$/;
export const FILE_RE = /^\d{6,10}(-evo)?-[0-9a-f]{10}\.(png|webp)$/;

export const artSwitch = file => sw(['supercell'], file);
export function artUrl(u) {
  let x; try { x = new URL(u); } catch { return null; }
  return x.protocol === 'https:' && x.hostname === ART_HOST && !x.search && !x.hash && PATH_RE.test(x.pathname) ? x.href : null;
}
export const artFile = (id, suffix, url) => id + suffix + '-' + createHash('sha1').update(url).digest('hex').slice(0, 10);

// -> { on, files: { <card id>: { img?, evo? } }, list: [{ file, url, card, fetched }], got, notes, webp }
export async function syncArt(ctx, items, o = {}) {
  const want = [], notes = [];
  for (const c of items) for (const [k, suffix] of KINDS) {
    const raw = c.iconUrls && c.iconUrls[k];
    if (!raw) continue;
    const url = artUrl(raw);
    if (!url) { notes.push('card ' + c.id + ': unexpected ' + k + ' url ' + String(raw).slice(0, 90)); continue; }
    want.push({ key: c.id + (suffix ? ':evo' : ':img'), url, base: artFile(c.id, suffix, url) });
  }
  const r = await copyArt(ctx, want, { dir: ART_DIR, sw: o.switch || artSwitch(), prev: o.prev && o.prev.files, max: o.max || ART_MAX, webp: ART_W, convert: o.convert, fileRe: FILE_RE, prune: items.length >= 80 });
  const files = {};
  for (const [key, f] of Object.entries(r.files)) { const [id, kind] = key.split(':'); (files[id] = files[id] || {})[kind] = f; }
  return { on: r.on, files, list: r.list.map(x => ({ file: x.file, url: x.url, card: Number(x.key.split(':')[0]), fetched: x.fetched })), got: r.got, notes: [...notes, ...r.notes], webp: r.webp };
}
