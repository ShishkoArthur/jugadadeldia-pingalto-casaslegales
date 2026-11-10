// Brawl Stars art for pingalto.com. The official Brawl Stars API names no images, so (owner 2026-11-10: "official ones or
// whatever is better") the pictures come from cdn.brawlify.com, a fan CDN that mirrors the original game art under the
// official ids (robots.txt: "Disallow:" for everyone; its API answers 403 to us and is never used). Helper of brawl.mjs, not a
// feed. Portraits by brawler id, maps by the map id of the official rotation and of the Argentine battles (brawlmeta), mode
// icons by mode id. Copied once into <out>/brawl-art/ by art-copy.mjs (maps as light WebP when cwebp is there). Switch:
// assets.json publishers.supercell and publishers.brawlify, both must be on.
import { readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { copyArt, artSwitch as sw } from './art-copy.mjs';

export const BRAWL_DIR = 'brawl-art';
export const CDN = 'https://cdn.brawlify.com';
export const BRAWL_FILE_RE = /^[bmg]\d{8}\.(png|webp)$/;
// mode name of the official API -> Supercell mode id, only for icons we matched by eye (the API may also send event.modeId)
export const MODE_IDS = { gemGrab: 48000000, heist: 48000002, bounty: 48000003, brawlBall: 48000005, soloShowdown: 48000006, duoShowdown: 48000009,
  hotZone: 48000017, knockout: 48000020, basketBrawl: 48000022, volleyBrawl: 48000023, duels: 48000024, wipeout: 48000025,
  wipeout5V5: 48000031, brawlBall5V5: 48000032, gemGrab5V5: 48000033, knockout5V5: 48000035 };
const inRange = (x, lo) => Number.isInteger(x) && x >= lo && x < lo + 1e6;
export const modeId = (name, id) => inRange(id, 48000000) ? id : MODE_IDS[name] || null;

export const brawlSwitch = file => sw(['supercell', 'brawlify'], file);

// brawlers: ids; maps: map ids; modes: mode ids -> { on, b: { id: file }, m: { id: file }, g: { id: file }, list, got, notes }
export async function syncBrawlArt(ctx, { brawlers = [], maps = [], modes = [] }, o = {}) {
  const want = [];
  const add = (k, id, path, lo) => { if (inRange(id, lo) && !want.some(w => w.key === k + id)) want.push({ key: k + id, url: CDN + path + id + '.png', base: k + id }); };
  for (const id of brawlers) add('b', id, '/brawlers/borderless/', 16000000);
  for (const id of maps) add('m', id, '/maps/regular/', 15000000);
  for (const id of modes) add('g', id, '/game-modes/regular/', 48000000);
  const sw0 = o.switch || brawlSwitch();
  const maps1 = want.filter(w => w.key[0] === 'm'), rest = want.filter(w => w.key[0] !== 'm');
  const common = { sw: sw0, prev: o.prev, max: o.max || 200, convert: o.convert, prune: false };
  const a = await copyArt(ctx, rest, { ...common, dir: BRAWL_DIR, fileRe: /^[bg]\d{8}\.png$/ });
  const b = await copyArt(ctx, maps1, { ...common, dir: BRAWL_DIR, fileRe: /^m\d{8}\.(png|webp)$/, webp: 220 });
  const out = { on: a.on && b.on, b: {}, m: {}, g: {}, list: [...a.list, ...b.list], got: a.got + b.got, notes: [...new Set([...a.notes, ...b.notes])] };
  for (const [k, f] of Object.entries({ ...a.files, ...b.files })) out[k[0]][k.slice(1)] = f;
  if (o.prune && out.on) {
    const keep = new Set(out.list.map(x => x.file));
    const dir = join(ctx.outDir, BRAWL_DIR);
    if (existsSync(dir)) for (const f of readdirSync(dir)) if (BRAWL_FILE_RE.test(f) && !keep.has(f)) unlinkSync(join(dir, f));
  }
  return out;
}
