// Our Elo ranking of Dota 2 teams for pingalto.com /dota2 (docs/FEEDS.md), daily. Valve publishes no Dota 2 team ranking and
// OpenDota closes its API to AI agents in robots.txt, so the rating is our own: plain Elo over every finished Dota 2 series of
// the last DAYS days that PandaScore lists (free plan, attribution "Datos: PandaScore"), engine/games/elo.mjs, with a backtest of
// the last TEST days. Kept: team name (betting brands masked), acronym, country, rating, series won and lost, form of the last 30
// days. Forfeits and series without two teams or a winner are left out.
import { isBrandName } from '../../../engine/games/vrs.mjs';
import { eloRun, ELO } from '../../../engine/games/elo.mjs';

const API = 'https://api.pandascore.co';
const DAYS = 180, TEST = 60, FORM = 30, MIN_SERIES = 8, ACTIVE_DAYS = 60, TOP = 80, MAX_PAGES = 30;
const SA = new Set(['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'PE', 'PY', 'UY', 'VE']);
const clean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
const iso = d => d.toISOString().replace(/\.\d{3}Z$/, 'Z');

export default {
  name: 'dotaelo',
  cadence: 'daily',
  maxAgeHours: 72,
  timeoutSec: 300,
  enabled: env => !!env.PANDASCORE_TOKEN,
  async fetch(ctx) {
    const headers = { Authorization: 'Bearer ' + ctx.env.PANDASCORE_TOKEN };
    const from = new Date(+ctx.now - DAYS * 864e5);
    let all = [];
    for (let p = 1; p <= MAX_PAGES; p++) {
      const page = (await ctx.getJson(API + '/dota2/matches/past?range[end_at]=' + iso(from) + ',' + iso(ctx.now) + '&sort=-end_at&page[size]=100&page[number]=' + p, { headers })).json;
      if (!Array.isArray(page)) throw new Error('page ' + p + ' is not a list');
      all = all.concat(page);
      if (page.length < 100) break;
    }
    return { matches: all, from: iso(from), to: iso(ctx.now), fetched: new Date().toISOString(), source: { url: API + '/dota2/matches/past' } };
  },
  validate(raw) {
    if (raw.matches.length < 200) throw new Error('only ' + raw.matches.length + ' Dota 2 matches in ' + DAYS + ' days');
    for (const m of raw.matches) if (!Number.isInteger(m.id)) throw new Error('match without id');
  },
  compute(raw) {
    const info = new Map();
    const series = [];
    for (const m of raw.matches) {
      const o = (m.opponents || []).map(x => x && x.opponent).filter(Boolean);
      if (m.status !== 'finished' || m.forfeit || o.length !== 2 || !m.winner_id || !m.end_at) continue;
      const w = o.findIndex(t => t.id === m.winner_id);
      if (w < 0) continue;
      for (const t of o) info.set(t.id, { n: isBrandName(t.name) ? 'Nombre oculto' : clean(t.name), a: isBrandName(t.name) ? undefined : clean(t.acronym) || undefined, loc: t.location || undefined });
      series.push({ t: m.end_at, a: o[0].id, b: o[1].id, w });
    }
    const now = Date.parse(raw.to);
    const testFrom = new Date(now - TEST * 864e5).toISOString(), formFrom = new Date(now - FORM * 864e5).toISOString(), active = new Date(now - ACTIVE_DAYS * 864e5).toISOString();
    const { teams, test } = eloRun(series, { testFrom });
    const form = new Map();
    for (const s of series) if (s.t >= formFrom) for (const [id, won] of [[s.a, s.w === 0], [s.b, s.w === 1]]) { const f = form.get(id) || [0, 0]; f[won ? 0 : 1]++; form.set(id, f); }
    const rows = [...teams].filter(([, T]) => T.n >= MIN_SERIES && T.last >= active).map(([id, T]) => ({ ...info.get(id), r: Math.round(T.r), w: T.w, l: T.l, f: form.get(id) || [0, 0], sa: SA.has(info.get(id).loc) || undefined }))
      .sort((a, b) => b.r - a.r);
    return {
      rows: rows.slice(0, TOP).map((x, i) => ({ ...x, rank: i + 1 })), sa: rows.map((x, i) => ({ ...x, rank: i + 1 })).filter(x => x.sa && x.rank > TOP).slice(0, 20),
      series: series.length, from: raw.from, to: raw.to, test: { ...test, days: TEST }, params: { ...ELO, days: DAYS, minSeries: MIN_SERIES, activeDays: ACTIVE_DAYS }, source: 'PandaScore',
    };
  },
};
