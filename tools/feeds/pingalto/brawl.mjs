// Brawl Stars brawlers, the event rotation and the Argentine trophy leaderboard (cut-offs only) for pingalto.com, hourly for the
// rotation, daily for the rest (cached 20 h) (docs/FEEDS.md). Official API (api.brawlstars.com, key BS_API_KEY bound to the
// server IPv4). Rarity and class are not in the official API: not shown. Players' names and tags are not kept.
import { ATTRIBUTION, cutoffs, clean, scTime } from './supercell.mjs';

const API = 'https://api.brawlstars.com/v1';

export default {
  name: 'brawl',
  cadence: 'hourly',
  maxAgeHours: 6,
  enabled: env => !!env.BS_API_KEY,
  async fetch(ctx) {
    const headers = { Authorization: 'Bearer ' + ctx.env.BS_API_KEY };
    const get = async (p, ttlHours) => (await ctx.getJson(API + p, { headers, ttlHours })).json;
    const out = { brawlers: await get('/brawlers', 20), rotation: await get('/events/rotation'), notes: [], fetched: new Date().toISOString(), source: { url: API + '/brawlers', also: [API + '/events/rotation'] } };
    try { out.rank = await get('/rankings/AR/players?limit=200', 20); } catch (e) { out.notes.push('rankings AR: ' + e.message.slice(0, 120)); }
    return out;
  },
  validate(raw) {
    const items = raw.brawlers && raw.brawlers.items;
    if (!Array.isArray(items) || items.length < 50) throw new Error('brawlers: ' + (Array.isArray(items) ? items.length : 'no') + ' items');
    for (const b of items) if (!Number.isInteger(b.id) || !b.name || !Array.isArray(b.starPowers) || !Array.isArray(b.gadgets)) throw new Error('brawler without id/name/starPowers/gadgets');
    if (!Array.isArray(raw.rotation)) throw new Error('rotation is not a list');
    for (const e of raw.rotation) { scTime(e.startTime); scTime(e.endTime); if (!e.event || !e.event.mode) throw new Error('event without mode'); }
  },
  compute(raw, prev) {
    const brawlers = raw.brawlers.items.map(b => ({ id: b.id, n: clean(b.name), sp: b.starPowers.map(x => clean(x.name)), gd: b.gadgets.map(x => clean(x.name)) })).sort((a, b) => a.id - b.id);
    const events = raw.rotation.map(e => ({ start: scTime(e.startTime), end: scTime(e.endTime), slot: e.slotId, mode: clean(e.event.mode), map: clean(e.event.map) || null, mod: (e.event.modifiers || []).map(clean) })).sort((a, b) => a.slot - b.slot);
    const rank = raw.rank && Array.isArray(raw.rank.items) && raw.rank.items.length ? cutoffs(raw.rank.items, 'trophies') : (prev && prev.ar) || null;
    return { brawlers, newest: brawlers.reduce((a, b) => b.id > a.id ? b : a).id, events, ar: rank, notes: raw.notes, attribution: ATTRIBUTION };
  },
};
