// Fortnite tracker of pingalto.com (/fortnite/tracker): the rules shared by the server proxy (tools/fnapi/), the page and the browser.
// Data: fortnite-api.com /v2/stats/br/v2 (unofficial, not endorsed by Epic Games). The proxy answers only the fields listed here.
// No imports: the proxy container gets this one file.

export const FN = { perIpPerMin: 10, globalPerMin: 60, cacheMin: 10, nameMin: 3, nameMax: 16, timeoutMs: 8000 };
export const PLATFORMS = ['all', 'keyboardMouse', 'gamepad', 'touch'];
export const WINDOWS = ['lifetime', 'season'];
export const MODES = ['overall', 'solo', 'duo', 'squad'];
export const PLACES = { solo: [10, 25], duo: [5, 12], squad: [3, 6] };
const NUMS = ['matches', 'wins', 'winRate', 'kills', 'deaths', 'kd', 'killsPerMatch', 'minutesPlayed', 'top3', 'top5', 'top6', 'top10', 'top12', 'top25'];

// Epic display names: 3 to 16 characters; letters (any alphabet), digits, space, dot, dash, underscore. Spaces are trimmed and
// collapsed; anything else is refused before a request leaves the server.
const NAME_OK = /^[\p{L}\p{M}\p{N}._\- ]+$/u;
export function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  const n = [...s].length;
  if (n < FN.nameMin || n > FN.nameMax || !NAME_OK.test(s)) return null;
  return s;
}

function mode(m) {
  if (!m || typeof m !== 'object') return null;
  const o = {};
  for (const k of NUMS) if (Number.isFinite(m[k])) o[k] = m[k];
  if (!Number.isFinite(o.matches)) return null;
  if (typeof m.lastModified === 'string' && /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(m.lastModified)) o.last = m.lastModified;
  return o;
}

// The upstream "data" object -> only what the page shows, for every input type (one upstream call serves all four).
export function shapeStats(d) {
  if (!d || !d.account || typeof d.account.name !== 'string' || !d.stats) return null;
  const bp = d.battlePass && Number.isFinite(d.battlePass.level) ? { level: d.battlePass.level, progress: Number.isFinite(d.battlePass.progress) ? d.battlePass.progress : 0 } : null;
  const platforms = {};
  for (const p of PLATFORMS) {
    const s = d.stats[p];
    platforms[p] = s ? Object.fromEntries(MODES.map(k => [k, mode(s[k])])) : null;
  }
  return { name: d.account.name.slice(0, 32), bp, platforms };
}

// How many more eliminations a player needs for a K/D target: without being eliminated again, and at the current pace
// (killsPerMatch per match, one elimination taken per match: the worst case, a match without a win).
export function kdPlan({ kills, deaths, killsPerMatch, target }) {
  if (!(target > 0) || !(kills >= 0) || !(deaths >= 0)) return null;
  const need = Math.max(0, Math.ceil(target * deaths - kills));
  let matches = 0;
  if (need > 0) matches = killsPerMatch > target ? Math.ceil((target * deaths - kills) / (killsPerMatch - target)) : Infinity;
  return { need, matches };
}

// "1 of every N matches", rounded to one decimal place when below 10 (the page prints it).
export const everyN = (wins, matches) => (wins > 0 && matches > 0 ? matches / wins : Infinity);
