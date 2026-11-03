// Argentine players and teams in esports for pingalto.com (docs/FEEDS.md): PandaScore free plan, daily. Players whose nationality
// is AR and who have a current team, and teams whose country is AR, with the game. Only the in-game nick, the team, its country
// and the game are kept: no real names, birthdays or photos. Betting brands in team names are masked (site rule).
import { isBrandName } from '../../../engine/games/vrs.mjs';

const API = 'https://api.pandascore.co';
// PandaScore game slugs -> name shown; games outside this list are counted under "Otros".
export const PS_GAMES = { 'cs-go': 'Counter-Strike 2', valorant: 'Valorant', 'league-of-legends': 'League of Legends', 'dota-2': 'Dota 2', rl: 'Rocket League', fifa: 'EA Sports FC', mlbb: 'Mobile Legends', ow: 'Overwatch 2', 'r6-siege': 'Rainbow Six Siege', pubg: 'PUBG', 'cod-mw': 'Call of Duty', 'kings-of-glory': 'Honor of Kings', 'starcraft-2': 'StarCraft II' };
const clean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
const safe = s => { const c = clean(s); return c && isBrandName(c) ? 'Nombre oculto' : c; };
const MAX_PAGES = 12;

export default {
  name: 'argentinos',
  cadence: 'daily',
  maxAgeHours: 72,
  timeoutSec: 300,
  enabled: env => !!env.PANDASCORE_TOKEN,
  async fetch(ctx) {
    const headers = { Authorization: 'Bearer ' + ctx.env.PANDASCORE_TOKEN };
    const all = async q => {
      let out = [];
      for (let p = 1; p <= MAX_PAGES; p++) {
        const page = (await ctx.getJson(API + q + '&page[size]=100&page[number]=' + p, { headers })).json;
        if (!Array.isArray(page)) throw new Error(q + ': not a list');
        out = out.concat(page);
        if (page.length < 100) return out;
      }
      throw new Error(q + ': more than ' + MAX_PAGES + ' pages');
    };
    return { players: await all('/players?filter[nationality]=AR&sort=name'), teams: await all('/teams?filter[location]=AR&sort=name'), fetched: new Date().toISOString(), source: { url: API + '/players' } };
  },
  validate(raw) {
    if (raw.players.length < 50) throw new Error('only ' + raw.players.length + ' Argentine players');
    for (const p of raw.players) if (!Number.isInteger(p.id) || !p.name || p.nationality !== 'AR') throw new Error('player ' + p.id + ': bad row');
    for (const t of raw.teams) if (!Number.isInteger(t.id) || !t.name || t.location !== 'AR') throw new Error('team ' + t.id + ': bad row');
  },
  compute(raw) {
    const gk = v => (v && v.slug) || '';
    const players = raw.players.filter(p => p.active !== false && p.current_team && p.current_videogame).map(p => ({
      n: clean(p.name), g: gk(p.current_videogame), t: safe(p.current_team.name), ti: p.current_team.id, tl: p.current_team.location || null,
    })).sort((a, b) => a.n.localeCompare(b.n, 'es', { sensitivity: 'base' }));
    const teams = raw.teams.filter(t => t.current_videogame).map(t => ({
      n: safe(t.name), i: t.id, g: gk(t.current_videogame), ar: (t.players || []).filter(p => p.nationality === 'AR' && p.active !== false).length, all: (t.players || []).filter(p => p.active !== false).length,
    }));
    const games = {};
    for (const p of players) games[p.g] = PS_GAMES[p.g] || 'Otros';
    for (const t of teams) games[t.g] = PS_GAMES[t.g] || 'Otros';
    return { players, teams: teams.filter(t => t.all > 0), games, total: raw.players.length, source: 'PandaScore' };
  },
};
