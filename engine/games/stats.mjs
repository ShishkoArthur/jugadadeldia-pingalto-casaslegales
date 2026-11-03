// Small statistics for pingalto meta pages: the Wilson score interval of a win rate (95 % by default), which stays inside 0..1
// and is honest with few games: with 3 wins in 4 games it says "somewhere between 30 % and 95 %", not "75 %". Pure.
export function wilson(wins, n, z = 1.959963984540054) {
  if (!Number.isInteger(n) || n < 0 || !Number.isInteger(wins) || wins < 0 || wins > n) throw new Error('wilson: bad counts ' + wins + '/' + n);
  if (!n) return [0, 1];
  const p = wins / n, z2 = z * z, d = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}
// Share of values in a list that are strictly below x (0..1).
export const below = (list, x) => list.length ? list.filter(v => v < x).length / list.length : 0;
