// The big events of each game for pingalto.com (docs/FEEDS.md): LoL Worlds and MSI, VCT Champions and Masters, Dota 2 The
// International, RLCS World Championship and Majors, FC Pro World Championship. PandaScore free plan, hourly; a finished event is
// cached 20 h, an event that is on now is asked again every run. For each event: the latest edition (series), its stages
// (tournaments) and every match with teams, country, score and time; the winner when PandaScore has one. Same terms as the agenda
// (attribution "Datos: PandaScore", no betting fields, betting brands in names masked, only what the pages draw is kept).
import { slim } from './agenda.mjs';
import { isBrandName } from '../../../engine/games/vrs.mjs';

const API = 'https://api.pandascore.co';
export const EVENTS = [
  { k: 'worlds', g: 'lol', league: 297, name: 'Worlds' },
  { k: 'msi', g: 'lol', league: 300, name: 'MSI' },
  { k: 'champions', g: 'valorant', league: 4531, name: 'VCT Champions', pick: /^Champions \d{4}$/ },
  { k: 'masters', g: 'valorant', league: 4531, name: 'VCT Masters', pick: /^Masters /, n: 2 },
  { k: 'americas', g: 'valorant', league: 4531, name: 'VCT Américas', pick: /^Americas Stage \d/ },
  { k: 'ti', g: 'dota2', league: 4106, name: 'The International', pick: /^\d{4}$/ },
  { k: 'rlcs-worlds', g: 'rl', league: 4834, name: 'RLCS World Championship' },
  { k: 'rlcs-major', g: 'rl', league: 4694, name: 'RLCS Major', n: 2 },
  { k: 'fc-worlds', g: 'eafc', league: 5271, name: 'FC Pro World Championship' },
];
const GNAME = { lol: 'League of Legends', valorant: 'Valorant', dota2: 'Dota 2', rl: 'Rocket League', eafc: 'EA Sports FC' };
const STATUS = new Set(['not_started', 'running', 'finished', 'postponed', 'canceled']);
const clean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60);
const safe = s => { const c = clean(s); return c && isBrandName(c) ? 'Nombre oculto' : c; };
const DAY = 864e5;
// When PandaScore has no winner on the edition, the winner of the finished grand final of its last stage is the champion.
function finalWinner(ms, last) {
  const f = ms.filter(m => last && m.stage === last.id && /^grand final$/i.test(m.rd) && m.st === 'finished' && m.win >= 0);
  return f.length === 1 ? { n: f[0].teams[f[0].win].n, loc: f[0].teams[f[0].win].loc } : null;
}

export default {
  name: 'torneos',
  cadence: 'hourly',
  maxAgeHours: 6,
  timeoutSec: 420,
  enabled: env => !!env.PANDASCORE_TOKEN,
  async fetch(ctx) {
    const headers = { Authorization: 'Bearer ' + ctx.env.PANDASCORE_TOKEN };
    const get = async (q, ttlHours) => (await ctx.getJson(API + q, { headers, ttlHours })).json;
    const lists = {};
    const out = { events: [], fetched: new Date().toISOString(), source: { url: API + '/leagues' } };
    for (const ev of EVENTS) {
      if (!lists[ev.league]) lists[ev.league] = await get('/leagues/' + ev.league + '/series?sort=-begin_at&page[size]=50', 6);
      const all = lists[ev.league];
      if (!Array.isArray(all)) throw new Error(ev.k + ': series list is not a list');
      const chosen = all.filter(s => s && s.begin_at && (!ev.pick || ev.pick.test(clean(s.full_name)))).slice(0, ev.n || 1);
      const eds = [];
      for (const s of chosen) {
        const done = s.end_at && Date.parse(s.end_at) < +ctx.now - DAY;
        const ttl = done ? 20 : 0;
        let matches = [];
        for (let p = 1; p <= 3; p++) {
          const page = await get('/series/' + s.id + '/matches?sort=begin_at&page[size]=100&page[number]=' + p, ttl);
          matches = matches.concat(page);
          if (page.length < 100) break;
        }
        const stages = await get('/series/' + s.id + '/tournaments?page[size]=50', ttl);
        eds.push({ serie: s, matches, stages });
      }
      out.events.push({ k: ev.k, eds });
    }
    return out;
  },
  validate(raw) {
    if (!Array.isArray(raw.events) || raw.events.length !== EVENTS.length) throw new Error('events missing');
    let n = 0;
    for (const e of raw.events) {
      for (const ed of e.eds) {
        if (!ed.serie || !Number.isInteger(ed.serie.id)) throw new Error(e.k + ': serie without id');
        if (!Array.isArray(ed.matches) || !Array.isArray(ed.stages)) throw new Error(e.k + ': matches or stages not a list');
        for (const m of ed.matches) {
          n++;
          if (!Number.isInteger(m.id) || !STATUS.has(m.status)) throw new Error(e.k + ' match ' + m.id + ': status ' + m.status);
          if ((m.opponents || []).length > 2) throw new Error(e.k + ' match ' + m.id + ': more than two opponents');
          if ('odds' in m || 'bets' in m) throw new Error('betting fields in the answer');
          const b = m.number_of_games;
          if (b != null && !(Number.isInteger(b) && b >= 1 && b <= 9)) throw new Error(e.k + ' match ' + m.id + ': number_of_games ' + b);
        }
      }
    }
    if (!n) throw new Error('no match in any event');
  },
  compute(raw) {
    const events = raw.events.map(e => {
      const ev = EVENTS.find(x => x.k === e.k);
      return {
        k: ev.k, g: ev.g, game: GNAME[ev.g], name: ev.name,
        eds: e.eds.map(({ serie: s, matches, stages }) => {
          const order = stages.slice().sort((a, b) => (a.begin_at || '') < (b.begin_at || '') ? -1 : 1);
          const ms = matches.filter(m => m.status !== 'canceled').map(m => {
            const x = slim(m, { k: ev.g });
            const rd = clean(String(m.name || '').split(':')[0]);
            return { id: x.id, at: x.at, end: x.end, st: x.st, bo: x.bo, type: x.type, teams: x.teams.map(t => ({ n: t.n, a: t.a, loc: t.loc })), score: x.score, win: x.win, rd: rd && !/ vs /i.test(rd) ? rd : '', stage: m.tournament_id, tv: x.tv, ar: x.ar };
          });
          const wo = s.winner_id ? matches.flatMap(m => (m.opponents || []).map(o => o && o.opponent)).find(o => o && o.id === s.winner_id) : null;
          const begin = s.begin_at, end = s.end_at;
          const st = ms.some(m => m.st === 'running') ? 'running' : ms.length && ms.every(m => m.st === 'finished') ? 'finished' : Date.parse(begin) > Date.parse(raw.fetched) ? 'upcoming' : 'running';
          return {
            id: s.id, name: safe(s.full_name), year: s.year || null, begin, end, st,
            winner: wo ? { n: safe(wo.name), loc: wo.location || wo.nationality || undefined } : finalWinner(ms, order[order.length - 1]),
            stages: order.map(t => ({ id: t.id, n: safe(t.name), begin: t.begin_at || null, end: t.end_at || null })),
            matches: ms,
          };
        }),
      };
    });
    return { events, source: 'PandaScore' };
  },
};
