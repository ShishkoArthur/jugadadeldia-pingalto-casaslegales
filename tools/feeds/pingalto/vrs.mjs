// Valve Regional Standings of CS2 for pingalto.com /cs2, /esports and /esports/sistema-suizo (docs/FEEDS.md), daily. Valve
// publishes a new table about once a month in its GitHub repository ValveSoftware/counter-strike_regional_standings
// (live/<year>/standings_global_<date>.md and standings_americas_<date>.md). One GitHub API request without a key (the folder
// listing of the year; the API allows 60 an hour per address, we use one a day), then the two newest files of the same date from
// raw.githubusercontent.com. Read with engine/games/vrs.mjs, the same parser and checks the build uses; team names with a betting
// brand are masked. Kept: the compact tables the pages draw (points, team, roster, Americas flag, world rank) and the file links.
import { parseStandings, joinRegions, clientTables } from '../../../engine/games/vrs.mjs';
import { robotsGate } from './art-copy.mjs';

const REPO = 'ValveSoftware/counter-strike_regional_standings';
const API = 'https://api.github.com/repos/' + REPO + '/contents/live/';
const RAW = 'https://raw.githubusercontent.com/' + REPO + '/';
const FILE = /^standings_(global|americas)_(\d{4})_(\d{2})_(\d{2})\.md$/;
const GH = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };

// Newest date with both a global and an Americas file in one folder listing: { date, global, americas } (entries of the listing).
export function newestPair(list) {
  if (!Array.isArray(list)) throw new Error('GitHub: folder listing is not a list');
  const by = {};
  for (const x of list) {
    const m = x && x.type === 'file' ? FILE.exec(x.name) : null;
    if (!m) continue;
    const d = m[2] + '-' + m[3] + '-' + m[4];
    (by[d] = by[d] || {})[m[1]] = x;
  }
  const date = Object.keys(by).filter(d => by[d].global && by[d].americas).sort().pop();
  return date ? { date, global: by[date].global, americas: by[date].americas } : null;
}

export default {
  name: 'vrs',
  cadence: 'daily',
  maxAgeHours: 72,
  timeoutSec: 120,
  async fetch(ctx) {
    await robotsGate(ctx, [API, RAW]);
    const year = Number(ctx.today().slice(0, 4));
    let pair = null;
    for (const y of [year, year - 1]) {
      let list;
      try { list = (await ctx.getJson(API + y, { headers: GH, ttlHours: 20 })).json; } catch (e) { if (e.status === 404) continue; throw e; }
      pair = newestPair(list);
      if (pair) break;
    }
    if (!pair) throw new Error('GitHub: no standings file in live/' + year + ' or live/' + (year - 1));
    const text = async x => {
      if (!String(x.download_url).startsWith(RAW)) throw new Error('GitHub: unexpected download address for ' + x.name);
      return (await ctx.getText(x.download_url, { ttlHours: 20, accept: 'text/plain' })).text;
    };
    return { date: pair.date, global: await text(pair.global), americas: await text(pair.americas), links: { global: pair.global.html_url, americas: pair.americas.html_url }, fetched: new Date().toISOString(), source: { url: API + year } };
  },
  validate(raw) {
    const gl = parseStandings(raw.global), am = parseStandings(raw.americas);
    if (gl.date !== raw.date || am.date !== raw.date) throw new Error('vrs: file titles say ' + gl.date + ' / ' + am.date + ', names say ' + raw.date);
    joinRegions(am, gl);
    for (const u of Object.values(raw.links)) if (!/^https:\/\/github\.com\/ValveSoftware\/counter-strike_regional_standings\/blob\//.test(String(u))) throw new Error('GitHub: unexpected file link ' + u);
  },
  compute(raw, prev) {
    const V = joinRegions(parseStandings(raw.americas), parseStandings(raw.global));
    if (prev && prev.date && raw.date < prev.date) throw new Error('vrs: newest table ' + raw.date + ' is older than the last one we had (' + prev.date + ')');
    return { date: V.date, ...clientTables(V), links: raw.links, source: 'Valve (ValveSoftware/counter-strike_regional_standings)' };
  },
};
