// What the best Brawl Stars players of Argentina play, for pingalto.com (docs/FEEDS.md), daily. Official API (key bound to the
// server IPv4): the Argentine trophy leaderboard, then the last battles of each of its top players (battlelog, up to 25 each).
// Counted: the brawler each top player took into trophy and ranked battles, by mode and by map, and the wins in 3 vs 3 modes.
// Only counts are kept: no names, no tags, no opponents.
import { ATTRIBUTION, clean, scTime } from './supercell.mjs';

const API = 'https://api.brawlstars.com/v1';
const PLAYERS = 100;
const TYPES = new Set(['ranked', 'soloRanked']);
const enc = tag => encodeURIComponent(String(tag));

export default {
  name: 'brawlmeta',
  cadence: 'daily',
  maxAgeHours: 72,
  timeoutSec: 420,
  enabled: env => !!env.BS_API_KEY,
  async fetch(ctx) {
    const headers = { Authorization: 'Bearer ' + ctx.env.BS_API_KEY };
    const get = async (p, ttlHours) => (await ctx.getJson(API + p, { headers, ttlHours })).json;
    const rank = (await get('/rankings/AR/players?limit=' + PLAYERS, 20)).items || [];
    const logs = [], errors = [];
    for (const p of rank) {
      try { logs.push({ tag: p.tag, items: (await get('/players/' + enc(p.tag) + '/battlelog', 20)).items || [] }); }
      catch (e) { errors.push(String(e.message).slice(0, 80)); }
    }
    return { players: rank.length, logs, errors, fetched: new Date().toISOString(), source: { url: API + '/rankings/AR/players' } };
  },
  validate(raw) {
    if (raw.players < 50) throw new Error('only ' + raw.players + ' players in the Argentine leaderboard');
    if (raw.logs.length < raw.players / 2) throw new Error('battlelogs: ' + raw.logs.length + ' of ' + raw.players + ' (' + raw.errors.length + ' errors)');
    for (const l of raw.logs) for (const b of l.items) { if (!b.battle || !b.event) throw new Error('battle without event'); scTime(b.battleTime); }
  },
  compute(raw) {
    const by = {}, modes = {}, maps = {};
    let battles = 0, from = null, to = null;
    const add = (o, k, id, win) => { const x = (o[k] = o[k] || {}); const y = (x[id] = x[id] || [0, 0, 0]); y[0]++; if (win === true) y[1]++; if (win !== null) y[2]++; };
    for (const l of raw.logs) {
      for (const b of l.items) {
        const B = b.battle;
        if (!TYPES.has(B.type)) continue;
        const all = [...(B.teams || []).flat(), ...(B.players || [])];
        const me = all.find(p => p && p.tag === l.tag);
        if (!me || !me.brawler || !Number.isInteger(me.brawler.id)) continue;
        const win = B.result === 'victory' ? true : B.result === 'defeat' ? false : null;
        const id = me.brawler.id, mode = clean(b.event.mode || B.mode), map = clean(b.event.map);
        battles++;
        const t = scTime(b.battleTime);
        if (!from || t < from) from = t;
        if (!to || t > to) to = t;
        const x = (by[id] = by[id] || { n: clean(me.brawler.name), u: 0, w: 0, d: 0 });
        x.u++; if (win === true) x.w++; if (win !== null) x.d++;
        if (mode) add(modes, mode, id, win);
        if (map) add(maps, map + '|' + mode, id, win);
      }
    }
    const top = (o, min) => Object.entries(o).map(([k, ids]) => {
      const list = Object.entries(ids).map(([id, [u, w, d]]) => ({ id: +id, u, w, d })).sort((a, b) => b.u - a.u || a.id - b.id);
      return { k, n: list.reduce((t, x) => t + x.u, 0), top: list.slice(0, 10) };
    }).filter(x => x.n >= min).sort((a, b) => b.n - a.n);
    return {
      players: raw.logs.length, battles, from, to,
      brawlers: Object.entries(by).map(([id, x]) => ({ id: +id, ...x })).sort((a, b) => b.u - a.u || a.id - b.id),
      modes: top(modes, 20), maps: top(maps, 15).map(m => { const [map, mode] = m.k.split('|'); return { map, mode, n: m.n, top: m.top }; }),
      attribution: ATTRIBUTION,
    };
  },
};
