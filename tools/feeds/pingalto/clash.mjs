// Clash Royale cards and the Argentine Path of Legend leaderboard (cut-offs only) for pingalto.com, daily (docs/FEEDS.md).
// Official API (api.clashroyale.com, key CR_API_KEY bound to the server IPv4). Supercell Fan Content Policy: attribution text on
// every page that shows this data, no official logos, nothing sold. Card art is not copied; players' names and tags are not kept.
import { ATTRIBUTION, cutoffs, clean } from './supercell.mjs';

const API = 'https://api.clashroyale.com/v1';
const RARITY = new Set(['common', 'rare', 'epic', 'legendary', 'champion']);

export default {
  name: 'clash',
  cadence: 'daily',
  maxAgeHours: 72,
  enabled: env => !!env.CR_API_KEY,
  async fetch(ctx) {
    const headers = { Authorization: 'Bearer ' + ctx.env.CR_API_KEY };
    const get = async p => (await ctx.getJson(API + p, { headers })).json;
    const out = { cards: await get('/cards'), notes: [], fetched: new Date().toISOString(), source: { url: API + '/cards' } };
    try {
      const locs = await get('/locations?limit=300');
      out.loc = (locs.items || []).find(l => l.countryCode === 'AR') || null;
      if (out.loc) {
        try { out.pol = await get('/locations/' + out.loc.id + '/pathoflegend/players?limit=200'); }
        catch (e) { out.notes.push('pathoflegend AR: ' + e.message.slice(0, 120)); }
      }
    } catch (e) { out.notes.push('locations: ' + e.message.slice(0, 120)); }
    return out;
  },
  validate(raw) {
    const items = raw.cards && raw.cards.items;
    if (!Array.isArray(items) || items.length < 80) throw new Error('cards: ' + (Array.isArray(items) ? items.length : 'no') + ' items');
    for (const c of [...items, ...(raw.cards.supportItems || [])]) {
      if (!Number.isInteger(c.id) || !c.name) throw new Error('card without id/name');
      if (!RARITY.has(c.rarity)) throw new Error('card ' + c.name + ': unknown rarity ' + JSON.stringify(c.rarity));
    }
    for (const c of items) if (!(Number.isInteger(c.elixirCost) && c.elixirCost >= 0 && c.elixirCost <= 10) && c.elixirCost !== undefined) throw new Error('card ' + c.name + ': elixir ' + c.elixirCost);
  },
  compute(raw, prev) {
    const card = c => ({ id: c.id, n: clean(c.name), e: Number.isInteger(c.elixirCost) ? c.elixirCost : null, r: c.rarity, max: c.maxLevel, evo: c.maxEvolutionLevel > 0 || undefined });
    const cards = raw.cards.items.map(card).sort((a, b) => a.n < b.n ? -1 : 1);
    const known = prev && prev.cards ? new Set(prev.cards.map(c => c.id)) : null;
    const pol = raw.pol && Array.isArray(raw.pol.items) && raw.pol.items.length ? cutoffs(raw.pol.items, 'eloRating') : (prev && prev.ar && prev.ar.pol) || null;
    return {
      cards, support: (raw.cards.supportItems || []).map(card),
      added: known ? cards.filter(c => !known.has(c.id)).map(c => c.id) : (prev && prev.added) || [],
      ar: raw.loc ? { id: raw.loc.id, name: clean(raw.loc.name), pol } : null,
      notes: raw.notes, attribution: ATTRIBUTION,
    };
  },
};
