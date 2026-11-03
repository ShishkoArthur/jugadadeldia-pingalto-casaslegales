// Valve Regional Standings for the pingalto CS2 and esports pages: the saved Markdown tables (global and Americas) read by
// engine/games/vrs.mjs, checked against the quoted model constants and dates, so a changed file or model stops the build.
import { parseStandings, VRS_RD } from '../../../engine/games/vrs.mjs';

let cache = null;
export function vrs(h) {
  if (cache && cache.P === h.pa) return cache.v;
  const P = h.pa;
  const am = parseStandings(P.raw('vrs-americas'));
  const gl = parseStandings(P.raw('vrs-global'));
  const iso = s => s.replace(/_/g, '-');
  if (am.date !== iso(P.fact('vrs_am_date')) || gl.date !== iso(P.fact('vrs_gl_date'))) throw new Error('vrs: file date does not match the quoted title');
  if (am.region !== 'Americas') throw new Error('vrs: Americas file has region ' + am.region);
  if (P.fact('vrs_fixed_rd') !== VRS_RD || P.fact('vrs_fit_rd') !== VRS_RD) throw new Error('vrs: RD changed in the Valve model');
  if (P.fact('vrs_q') !== 400 || P.fact('vrs_400')[0] !== 400) throw new Error('vrs: Q constant changed in the Valve model');
  const key = r => r.team + '|' + r.roster.join(',');
  const amKeys = new Set(am.rows.map(key));
  for (const r of gl.rows) r.americas = amKeys.has(key(r));
  const inGlobal = gl.rows.filter(r => r.americas).length;
  if (inGlobal !== am.rows.length) throw new Error('vrs: ' + am.rows.length + ' Americas rows but ' + inGlobal + ' found in the global list');
  for (const r of am.rows) r.global = gl.rows.find(g => key(g) === key(r)).rank;
  const v = { am, gl, date: am.date, label: r => (r.masked ? 'Nombre oculto' : r.team) };
  cache = { P, v };
  return v;
}
// Rows sent to the browser: rank, points, name (masked names replaced), roster, region flag.
export const rowsForClient = (rows, withRegion) => rows.map(r => [r.rank, r.points, r.masked ? '' : r.team, r.roster.join(', '), withRegion ? (r.americas ? 1 : 0) : r.global]);
