// Brawl Stars brawlers, the event rotation and the Argentine trophy leaderboard (cut-offs only) for pingalto.com, hourly for the
// rotation, daily for the rest (cached 20 h) (docs/FEEDS.md). Official API (api.brawlstars.com, key BS_API_KEY bound to the
// server IPv4). Rarity and class are not in the official API: not shown. Players' names and tags are not kept. Pictures
// (portraits, maps of the rotation and of the Argentine battles, mode icons) are copied by brawl-art.mjs; the list of every
// copied file with its source and date is the extra document brawl-art.json.
import { ATTRIBUTION, cutoffs, clean, scTime } from './supercell.mjs';
import { syncBrawlArt, modeId, MODE_IDS, BRAWL_DIR, BRAWL_FILE_RE } from './brawl-art.mjs';
import { readFeed } from '../lib.mjs';
import { join } from 'node:path';

const API = 'https://api.brawlstars.com/v1';
const mapId = e => Number.isInteger(e.event && e.event.id) && e.event.id >= 15000000 && e.event.id < 16000000 ? e.event.id : null;

export default {
  name: 'brawl',
  cadence: 'hourly',
  maxAgeHours: 6,
  timeoutSec: 400,
  enabled: env => !!env.BS_API_KEY,
  async fetch(ctx) {
    const headers = { Authorization: 'Bearer ' + ctx.env.BS_API_KEY };
    const get = async (p, ttlHours) => (await ctx.getJson(API + p, { headers, ttlHours })).json;
    const out = { brawlers: await get('/brawlers', 20), rotation: await get('/events/rotation'), notes: [], fetched: new Date().toISOString(), source: { url: API + '/brawlers', also: [API + '/events/rotation'] } };
    try { out.rank = await get('/rankings/AR/players?limit=200', 20); } catch (e) { out.notes.push('rankings AR: ' + e.message.slice(0, 120)); }
    const items = out.brawlers && Array.isArray(out.brawlers.items) ? out.brawlers.items : [];
    const rot = Array.isArray(out.rotation) ? out.rotation : [];
    const meta = readFeed(join(ctx.outDir, 'brawlmeta.json'));
    const metaMaps = meta && Array.isArray(meta.data.maps) ? meta.data.maps : [];
    const modes = [...rot.map(e => modeId(e.event && e.event.mode, e.event && e.event.modeId)), ...metaMaps.map(m => modeId(m.mode)), ...(meta ? (meta.data.modes || []).map(m => modeId(m.k)) : [])];
    const prev = readFeed(join(ctx.outDir, BRAWL_DIR + '.json'));
    out.art = await syncBrawlArt(ctx, { brawlers: items.map(b => b.id), maps: [...rot.map(mapId), ...metaMaps.map(m => m.id)], modes }, { switch: ctx.artSwitch, prev: prev && prev.data.files, prune: items.length >= 50 });
    out.notes.push(...out.art.notes.slice(0, 20));
    return out;
  },
  validate(raw) {
    const items = raw.brawlers && raw.brawlers.items;
    if (!Array.isArray(items) || items.length < 50) throw new Error('brawlers: ' + (Array.isArray(items) ? items.length : 'no') + ' items');
    for (const b of items) if (!Number.isInteger(b.id) || !b.name || !Array.isArray(b.starPowers) || !Array.isArray(b.gadgets)) throw new Error('brawler without id/name/starPowers/gadgets');
    if (!Array.isArray(raw.rotation)) throw new Error('rotation is not a list');
    for (const e of raw.rotation) { scTime(e.startTime); scTime(e.endTime); if (!e.event || !e.event.mode) throw new Error('event without mode'); }
    if (raw.art === undefined) return;
    if (!raw.art || typeof raw.art.b !== 'object' || !Array.isArray(raw.art.list)) throw new Error('art: no result');
    for (const k of ['b', 'm', 'g']) for (const v of Object.values(raw.art[k] || {})) if (!BRAWL_FILE_RE.test(v)) throw new Error('art: bad file name ' + v);
  },
  compute(raw, prev) {
    const A = raw.art || { on: false, b: {}, m: {}, g: {}, list: [] }, pic = (k, id) => A[k][id] ? BRAWL_DIR + '/' + A[k][id] : undefined;
    const brawlers = raw.brawlers.items.map(b => ({ id: b.id, n: clean(b.name), sp: b.starPowers.map(x => clean(x.name)), gd: b.gadgets.map(x => clean(x.name)), img: pic('b', b.id) })).sort((a, b) => a.id - b.id);
    const events = raw.rotation.map(e => {
      const mid = mapId(e), gid = modeId(e.event.mode, e.event.modeId);
      return { start: scTime(e.startTime), end: scTime(e.endTime), slot: e.slotId, mode: clean(e.event.mode), map: clean(e.event.map) || null, mod: (e.event.modifiers || []).map(clean), id: mid || undefined, mi: mid ? pic('m', mid) : undefined, gi: gid ? pic('g', gid) : undefined };
    }).sort((a, b) => a.slot - b.slot);
    const rank = raw.rank && Array.isArray(raw.rank.items) && raw.rank.items.length ? cutoffs(raw.rank.items, 'trophies') : (prev && prev.ar) || null;
    const files = { [BRAWL_DIR]: { publisher: 'Supercell', source: 'https://cdn.brawlify.com (fan CDN of the original game art, owner 2026-11-10), by the ids of ' + API, on: A.on, files: A.list, attribution: ATTRIBUTION } };
    const maps = {}, modes = {};
    for (const [id, f] of Object.entries(A.m)) maps[id] = BRAWL_DIR + '/' + f;
    const names = { ...MODE_IDS, ...Object.fromEntries(raw.rotation.map(e => [clean(e.event.mode), modeId(e.event.mode, e.event.modeId)])) };
    for (const [name, id] of Object.entries(names)) if (id && A.g[id]) modes[name] = BRAWL_DIR + '/' + A.g[id];
    return { __files: files, brawlers, newest: brawlers.reduce((a, b) => b.id > a.id ? b : a).id, events, ar: rank, art: { on: A.on, maps, modes }, notes: raw.notes, attribution: ATTRIBUTION };
  },
};
