// Shared bits of the two Supercell feeds (clash.mjs, brawl.mjs): official APIs with keys bound to the server's IPv4 address.
// Not a feed itself (no fetch/validate/compute): the runner skips it.
export const ATTRIBUTION = "This material is unofficial and is not endorsed by Supercell. For more information see Supercell's Fan Content Policy: www.supercell.com/fan-content-policy.";
export const RANKS = [1, 10, 25, 50, 100, 200];
// Supercell times look like 20261103T100000.000Z
export function scTime(s) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\.\d+)?Z$/.exec(String(s || ''));
  if (!m) throw new Error('bad Supercell time ' + JSON.stringify(s));
  return m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + m[6] + 'Z';
}
// Score needed for some ranks of a leaderboard ({ rank, score } sorted by rank); names and tags are not kept.
export function cutoffs(items, field) {
  const list = items.map(x => ({ rank: x.rank, v: x[field] })).filter(x => Number.isInteger(x.rank) && Number.isFinite(x.v)).sort((a, b) => a.rank - b.rank);
  for (let i = 1; i < list.length; i++) if (list[i].v > list[i - 1].v) throw new Error('leaderboard not sorted by ' + field);
  return { n: list.length, at: RANKS.filter(r => r <= list.length).map(r => ({ rank: r, v: list[r - 1].v })) };
}
export const clean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
