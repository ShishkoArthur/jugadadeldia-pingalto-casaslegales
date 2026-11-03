// What the best Clash Royale players of Argentina have in their deck, for pingalto.com (docs/FEEDS.md), daily. The official
// Argentine player leaderboards answer empty (seasonal), the Argentine clan leaderboard does not: we take the top clans of
// Argentina, the members with most trophies among them and the deck each one has selected now (official API, key bound to the
// server IPv4). Only counts are kept: which cards and which full decks, how many players; no names, no tags.
import { ATTRIBUTION } from './supercell.mjs';

const API = 'https://api.clashroyale.com/v1';
const AR = 57000017, CLANS = 10, PLAYERS = 100;
const enc = tag => encodeURIComponent(String(tag));

export default {
  name: 'clashmeta',
  cadence: 'daily',
  maxAgeHours: 72,
  timeoutSec: 420,
  enabled: env => !!env.CR_API_KEY,
  async fetch(ctx) {
    const headers = { Authorization: 'Bearer ' + ctx.env.CR_API_KEY };
    const get = async (p, ttlHours) => (await ctx.getJson(API + p, { headers, ttlHours })).json;
    const clans = (await get('/locations/' + AR + '/rankings/clans?limit=' + CLANS, 20)).items || [];
    const members = [];
    for (const c of clans) {
      const m = await get('/clans/' + enc(c.tag) + '/members', 20);
      for (const x of m.items || []) members.push({ tag: x.tag, trophies: x.trophies, clan: c.rank });
    }
    const seen = new Set();
    const top = members.filter(x => Number.isFinite(x.trophies) && !seen.has(x.tag) && seen.add(x.tag)).sort((a, b) => b.trophies - a.trophies).slice(0, PLAYERS);
    const decks = [], errors = [];
    for (const p of top) {
      try {
        const pl = await get('/players/' + enc(p.tag), 20);
        decks.push({ cards: (pl.currentDeck || []).map(c => ({ id: c.id, evo: c.evolutionLevel > 0 })), trophies: pl.trophies, legend: pl.currentPathOfLegendSeasonResult && pl.currentPathOfLegendSeasonResult.leagueNumber });
      } catch (e) { errors.push(String(e.message).slice(0, 80)); }
    }
    return { clans: clans.length, members: members.length, top: top.length, decks, errors, fetched: new Date().toISOString(), source: { url: API + '/locations/' + AR + '/rankings/clans' } };
  },
  validate(raw) {
    if (raw.clans < 3) throw new Error('only ' + raw.clans + ' Argentine clans in the leaderboard');
    if (raw.decks.length < 40) throw new Error('only ' + raw.decks.length + ' decks (' + raw.errors.length + ' errors)');
    for (const d of raw.decks) for (const c of d.cards) if (!Number.isInteger(c.id)) throw new Error('card without id');
  },
  compute(raw) {
    const full = raw.decks.filter(d => d.cards.length === 8);
    const use = {}, evo = {}, same = {};
    for (const d of full) {
      for (const c of d.cards) { use[c.id] = (use[c.id] || 0) + 1; if (c.evo) evo[c.id] = (evo[c.id] || 0) + 1; }
      const k = d.cards.map(c => c.id).sort((a, b) => a - b).join('.');
      same[k] = (same[k] || 0) + 1;
    }
    const trophies = full.map(d => d.trophies).filter(Number.isFinite).sort((a, b) => a - b);
    return {
      n: full.length, clans: raw.clans,
      cards: Object.entries(use).map(([id, n]) => ({ id: +id, n, evo: evo[id] || 0 })).sort((a, b) => b.n - a.n || a.id - b.id),
      decks: Object.entries(same).filter(([, n]) => n >= 2).map(([k, n]) => ({ ids: k.split('.').map(Number), n })).sort((a, b) => b.n - a.n).slice(0, 10),
      all: full.map(d => d.cards.map(c => c.id)),
      trophies: trophies.length ? { min: trophies[0], med: trophies[Math.floor(trophies.length / 2)], max: trophies[trophies.length - 1] } : null,
      attribution: ATTRIBUTION,
    };
  },
};
