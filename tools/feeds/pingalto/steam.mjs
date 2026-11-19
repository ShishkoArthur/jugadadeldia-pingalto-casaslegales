// Steam store price and name of the paid games pingalto shows (docs/FEEDS.md), daily, no key: the public appdetails answer of
// the Steam store for Argentina (cc=ar, l=spanish), the same address the saved copy of the page came from. Today one game: EA
// Sports FC (/eafc; the app id changes with each yearly edition, a new edition is a new row in APPS and a new saved copy).
// Kept: name, the short name the page uses (engine/games/steamname.mjs), price in cents with currency and discount, release date.
import { gameName } from '../../../engine/games/steamname.mjs';
import { robotsGate } from './art-copy.mjs';

const STORE = 'https://store.steampowered.com';
export const APPS = [{ id: 4080220, k: 'fc' }];
const url = id => STORE + '/api/appdetails?appids=' + id + '&cc=ar&l=spanish';
const CUR = new Set(['USD', 'ARS']);

export default {
  name: 'steam',
  cadence: 'daily',
  maxAgeHours: 72,
  timeoutSec: 90,
  async fetch(ctx) {
    await robotsGate(ctx, [url(APPS[0].id)]);
    const apps = [];
    for (const a of APPS) apps.push({ ...a, body: (await ctx.getJson(url(a.id), { ttlHours: 6 })).json });
    return { apps, fetched: new Date().toISOString(), source: { url: url(APPS[0].id) } };
  },
  validate(raw) {
    for (const a of raw.apps) {
      const r = a.body && a.body[String(a.id)];
      if (!r || r.success !== true || !r.data) throw new Error('Steam ' + a.id + ': appdetails without data');
      const d = r.data;
      if (d.steam_appid !== a.id || d.type !== 'game' || typeof d.name !== 'string' || !d.name.trim()) throw new Error('Steam ' + a.id + ': not the game we know');
      gameName(d.name);
      if (!d.is_free) {
        const p = d.price_overview;
        if (!p || !CUR.has(p.currency) || !Number.isInteger(p.final) || p.final <= 0 || !Number.isInteger(p.initial) || p.initial < p.final) throw new Error('Steam ' + a.id + ': price missing or not in USD/ARS');
        if (!Number.isInteger(p.discount_percent) || p.discount_percent < 0 || p.discount_percent > 95) throw new Error('Steam ' + a.id + ': discount ' + p.discount_percent);
      }
    }
  },
  compute(raw) {
    const apps = {};
    for (const a of raw.apps) {
      const d = a.body[String(a.id)].data, p = d.price_overview;
      apps[a.k] = { id: a.id, name: d.name, short: gameName(d.name), free: !!d.is_free, price: d.is_free ? null : { cur: p.currency, cents: p.final, initial: p.initial, off: p.discount_percent }, date: d.release_date && d.release_date.date || null };
    }
    return { apps, checked: raw.fetched, source: 'Steam' };
  },
};
