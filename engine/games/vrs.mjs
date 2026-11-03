// Valve Regional Standings for CS2 (pingalto /cs2, /cs2/major): reads the Markdown tables Valve publishes on GitHub
// (ValveSoftware/counter-strike_regional_standings, live/<year>/standings_<region>_<date>.md) and the expected win chance
// of Valve's model for two point values. The model (model/fit.js priorWinExpectation with model/glicko.js, fixed RD 75 as in
// model/ranking.js) gives, for a match between ranks r and ro with the opponent's RD:
//   g = 1 / sqrt(1 + 3 Q^2 RD^2 / pi^2),  Q = ln(10) / 400,  ev = 1 / (1 + 10^(g (r - ro) / -400))
// and with the same RD for both teams the ratio it returns equals ev (tests check it against a port of that function).
// Team names that carry a betting brand are masked (site rule: no betting brands on pingalto). Pure.
export const VRS_RD = 75;
const Q = Math.log(10) / 400;

export function gFactor(rd = VRS_RD) {
  return 1 / Math.sqrt(1 + (3 * Q * Q * rd * rd) / (Math.PI * Math.PI));
}
export function expected(r, ro, rd = VRS_RD) {
  if (!Number.isFinite(r) || !Number.isFinite(ro)) throw new Error('vrs: points must be numbers');
  return 1 / (1 + Math.pow(10, (gFactor(rd) * (r - ro)) / -400));
}
// Point gap that gives a chance x to the stronger team (inverse of expected).
export function gapFor(x, rd = VRS_RD) {
  if (!(x > 0 && x < 1)) throw new Error('vrs: chance must be between 0 and 1');
  return (400 * Math.log10(x / (1 - x))) / gFactor(rd);
}

const BRAND = /bet|casino|stake|parimatch|1win|ggbet|pinnacle|roobet|rollbit|gamdom|csgoempire|thunderpick|rivalry|melbet|mostbet|fonbet|winline|leon\b|\bpari(?:\b|vision)/i;
export const isBrandName = name => BRAND.test(String(name));

// Rows of one standings file: [{ rank, points, team, roster: [nicks], masked }] in Valve's order. Throws on a file that does
// not look like Valve's table, so a changed format stops the build.
export function parseStandings(md) {
  const head = /(?:Regional Standings for (\w+)|Standings) as of (\d{4})_(\d{2})_(\d{2})/.exec(md);
  if (!head) throw new Error('vrs: title line not found');
  const rows = [];
  for (const line of md.split('\n')) {
    const m = /^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.*?)\s*\|\s*\[details\]/.exec(line);
    if (!m) continue;
    const team = m[3];
    rows.push({ rank: Number(m[1]), points: Number(m[2]), team, roster: m[4].split(',').map(s => s.trim()).filter(Boolean), masked: isBrandName(team) });
  }
  if (rows.length < 10) throw new Error('vrs: only ' + rows.length + ' rows');
  rows.forEach((r, i) => { if (r.rank !== i + 1) throw new Error('vrs: rank ' + r.rank + ' at row ' + (i + 1)); if (i && r.points > rows[i - 1].points) throw new Error('vrs: points not sorted at ' + r.rank); });
  return { region: head[1] || 'Global', date: head[2] + '-' + head[3] + '-' + head[4], rows };
}
