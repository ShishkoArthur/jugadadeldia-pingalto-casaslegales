// Valve Regional Standings for the pingalto CS2 and esports pages: the saved Markdown tables (global and Americas) read by
// engine/games/vrs.mjs, checked against the quoted model constants and dates, so a changed file or model stops the build.
// The browser swaps in a newer table from the daily vrs feed (client/vrs.js, client/vrsfd.js).
import { parseStandings, joinRegions, clientTables, VRS_RD } from '../../../engine/games/vrs.mjs';

let cache = null;
export function vrs(h) {
  if (cache && cache.P === h.pa) return cache.v;
  const P = h.pa;
  const am = parseStandings(P.raw('vrs-americas'));
  const gl = parseStandings(P.raw('vrs-global'));
  const iso = s => s.replace(/_/g, '-');
  if (am.date !== iso(P.fact('vrs_am_date')) || gl.date !== iso(P.fact('vrs_gl_date'))) throw new Error('vrs: file date does not match the quoted title');
  if (P.fact('vrs_fixed_rd') !== VRS_RD || P.fact('vrs_fit_rd') !== VRS_RD) throw new Error('vrs: RD changed in the Valve model');
  if (P.fact('vrs_q') !== 400 || P.fact('vrs_400')[0] !== 400) throw new Error('vrs: Q constant changed in the Valve model');
  joinRegions(am, gl);
  const v = { am, gl, date: am.date, label: r => (r.masked ? 'Nombre oculto' : r.team) };
  cache = { P, v };
  return v;
}
// Tables sent to the browser (same shape as the vrs feed) plus the date and the copy day the page was built with.
export const vrsClient = h => { const V = vrs(h); return { ...clientTables(V), date: V.date, copied: h.pa.doc('vrs-americas').fetched }; };
