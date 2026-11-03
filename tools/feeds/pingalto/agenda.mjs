// Esports schedule and results for pingalto.com (docs/FEEDS.md): PandaScore free plan ("Schedules, Results & Context Data"), hourly.
// Terms we follow: shown only on our pages for information, attribution "Datos: PandaScore", no odds or betting fields (the free plan
// has none and we never ask for them), raw answers are not republished: the output keeps only what the pages draw (teams, time,
// status, score, tournament, official stream link). The token is sent from the server only (secrets.env), never to the browser.
// Names with a betting brand (teams, leagues, tournaments, stream channels) are masked, as in the VRS tables (site rule).
// Explicit statuses: not_started, running, finished, postponed (kept, marked), canceled (dropped); anything else stops the run.

import { isBrandName } from '../../../engine/games/vrs.mjs';

const API = 'https://api.pandascore.co';
export const GAMES = [
  { k: 'cs2', ps: 'cs-go', name: 'Counter-Strike 2' },
  { k: 'valorant', ps: 'valorant', name: 'Valorant' },
  { k: 'lol', ps: 'league-of-legends', name: 'League of Legends' },
  { k: 'dota2', ps: 'dota-2', name: 'Dota 2' },
  { k: 'rl', ps: 'rl', name: 'Rocket League' },
  { k: 'eafc', ps: 'fifa', name: 'EA Sports FC' },
];
const STATUS = new Set(['not_started', 'running', 'finished', 'postponed', 'canceled']);
export const LATAM = new Set(['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE']);
const KEEP_TIERS = new Set(['s', 'a', 'b', 'c']);
const DAYS_AHEAD = 10, DAYS_BACK = 3, MAX_UP = 60, MAX_PAST = 30;
const clean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60);
const safe = (s, hidden) => { const c = clean(s); return c && isBrandName(c) ? hidden : c; };

export function slim(m, g) {
  const teams = (m.opponents || []).map(o => o && o.opponent).filter(Boolean).map(t => ({ n: safe(t.name, 'Nombre oculto'), a: isBrandName(t.name) ? undefined : safe(t.acronym, '') || undefined, loc: t.location || t.nationality || undefined, id: t.id }));
  const score = teams.map(t => { const r = (m.results || []).find(x => x.team_id === t.id || x.player_id === t.id); return r ? r.score : 0; });
  const streams = (m.streams_list || []).filter(s => s && s.official && /^https:\/\/(www\.)?(twitch\.tv|youtube\.com|kick\.com)\//.test(s.raw_url || '') && !isBrandName(s.raw_url));
  const st = streams.find(s => s.language === 'es') || streams.find(s => s.main) || streams[0];
  const t = m.tournament || {}, lg = m.league || {}, se = m.serie || {};
  return {
    id: m.id, g: g.k, at: m.begin_at || m.scheduled_at || null, end: m.end_at || null, st: m.status,
    bo: m.number_of_games || null, type: m.match_type || null, resched: !!m.rescheduled || undefined, ff: !!m.forfeit || undefined,
    lg: safe(lg.name, 'Liga (nombre oculto)'), se: safe(se.full_name || se.name, ''), tn: safe(t.name, ''), tier: t.tier || null, reg: t.region || null,
    teams: teams.map(({ id, ...x }) => ({ ...x, i: id })), score, win: m.winner_id ? teams.findIndex(x => x.id === m.winner_id) : -1,
    tv: st ? { url: st.raw_url, lang: st.language || null } : undefined,
    ar: teams.some(x => x.loc === 'AR') || undefined, latam: teams.some(x => LATAM.has(x.loc)) || undefined,
  };
}
const keep = m => KEEP_TIERS.has(m.tier) || m.latam || m.reg === 'SA';

export default {
  name: 'agenda',
  cadence: 'hourly',
  maxAgeHours: 4,
  timeoutSec: 300,
  enabled: env => !!env.PANDASCORE_TOKEN,
  async fetch(ctx) {
    const headers = { Authorization: 'Bearer ' + ctx.env.PANDASCORE_TOKEN };
    const now = ctx.now, iso = d => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const ahead = new Date(+now + DAYS_AHEAD * 864e5), back = new Date(+now - DAYS_BACK * 864e5);
    const out = { games: {}, fetched: new Date().toISOString(), source: { url: API + '/matches' } };
    for (const g of GAMES) {
      const f = 'filter[videogame]=' + g.ps;
      const get = async q => (await ctx.getJson(API + '/matches/' + q, { headers })).json;
      const running = await get('running?' + f + '&page[size]=50');
      let up = [];
      for (let p = 1; p <= 2; p++) {
        const page = await get('upcoming?' + f + '&range[begin_at]=' + iso(now) + ',' + iso(ahead) + '&sort=begin_at&page[size]=100&page[number]=' + p);
        up = up.concat(page);
        if (page.length < 100) break;
      }
      const past = await get('past?' + f + '&range[end_at]=' + iso(back) + ',' + iso(now) + '&sort=-end_at&page[size]=100');
      out.games[g.k] = { running, up, past };
    }
    return out;
  },
  validate(raw) {
    let total = 0;
    for (const g of GAMES) {
      const x = raw.games[g.k];
      if (!x || !Array.isArray(x.running) || !Array.isArray(x.up) || !Array.isArray(x.past)) throw new Error(g.k + ': answer is not a list');
      for (const m of [...x.running, ...x.up, ...x.past]) {
        total++;
        if (!m || !Number.isInteger(m.id)) throw new Error(g.k + ': match without id');
        if (!STATUS.has(m.status)) throw new Error(g.k + ' match ' + m.id + ': unknown status ' + JSON.stringify(m.status));
        if (m.begin_at && Number.isNaN(Date.parse(m.begin_at))) throw new Error(g.k + ' match ' + m.id + ': bad begin_at');
        if ((m.opponents || []).length > 2) throw new Error(g.k + ' match ' + m.id + ': more than two opponents');
        const n = m.number_of_games;
        if (n != null && !(Number.isInteger(n) && n >= 1 && n <= 9)) throw new Error(g.k + ' match ' + m.id + ': number_of_games ' + n);
        if (m.match_type === 'best_of' && n) for (const r of m.results || []) if (!(r.score >= 0 && r.score <= Math.ceil(n / 2))) throw new Error(g.k + ' match ' + m.id + ': score ' + r.score + ' in a Bo' + n);
        if ('odds' in m || 'bets' in m) throw new Error('betting fields in the answer: not shown, check the plan');
      }
    }
    if (!total) throw new Error('no match in any game (plan or token problem?)');
  },
  compute(raw) {
    const matches = [];
    for (const g of GAMES) {
      const x = raw.games[g.k];
      const seen = new Set();
      const add = (list, max) => list.filter(m => m.status !== 'canceled' && !seen.has(m.id)).map(m => slim(m, g)).filter(keep).slice(0, max).forEach(m => { seen.add(m.id); matches.push(m); });
      add(x.running, 30);
      add(x.up, MAX_UP);
      add(x.past.filter(m => m.status === 'finished'), MAX_PAST);
    }
    matches.sort((a, b) => (a.at || '9') < (b.at || '9') ? -1 : 1);
    return { games: GAMES.map(({ k, name }) => ({ k, name })), matches, source: 'PandaScore' };
  },
};
