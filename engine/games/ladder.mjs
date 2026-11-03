// Ranked ladder progress (pingalto /valorant/rangos, /lol/rangos): exact distribution of the number of games needed to reach a
// target level, for a player who wins each game with probability p and gains `win` / loses `loss` points on average.
// Rules come from the publisher's pages (data/sources/pingalto/sources.json) and are passed in; nothing has a default.
//   top        points needed to go up one level (Valorant 100 CR, LoL 100 LP)
//   carry      true: points over `top` move to the next level; minAfterUp: the floor after going up (Valorant 10)
//   demote     null: you never drop below 0 points;
//              { to }: points stop at 0, a loss AT 0 drops one level to `to` points (Valorant: 70, the lowest it allows);
//              { carry: true }: a loss bigger than your points drops one level and keeps the rest (LoL: 5 PL - 20 PL = 85 PL)
//   tier       null or { every, to }: every `every` levels (counted from level 0 of the ladder) a drop crosses a tier and lands
//              on `to` points instead (LoL: 25, 50 or 75 PL by skill; the caller passes the lowest)
//   Drops never go below the level you start from.
// The model is a Markov chain over (level, points); win/loss are whole points. Pure function, no randomness.
const int = (n, v, lo = 0) => { if (!Number.isInteger(v) || v < lo) throw new Error('ladder: ' + n + ' must be an integer >= ' + lo + ', got ' + v); return v; };

export function progress({ from, pts, to, top, win, loss, p, carry, minAfterUp, demote, tier, maxGames }) {
  int('from', from); int('to', to, 1); int('top', top, 1); int('pts', pts); int('win', win, 1); int('loss', loss); int('maxGames', maxGames, 1); int('minAfterUp', minAfterUp);
  if (typeof carry !== 'boolean') throw new Error('ladder: carry must be true or false');
  if (demote === undefined || tier === undefined) throw new Error('ladder: demote and tier must be given (null for none)');
  if (demote !== null && !(demote.carry === true || Number.isInteger(demote.to))) throw new Error('ladder: demote must be null, { to } or { carry: true }');
  if (tier !== null) { int('tier.every', tier.every, 1); int('tier.to', tier.to); }
  if (!(p >= 0 && p <= 1)) throw new Error('ladder: p must be in 0..1');
  if (to <= from) throw new Error('ladder: target level must be above the current level');
  if (pts >= top) throw new Error('ladder: points must be below ' + top);
  const K = to - from, S = K * top;
  const idx = (k, x) => k * top + x;
  let cur = new Float64Array(S), nxt = new Float64Array(S);
  cur[idx(0, pts)] = 1;
  const cdf = [];
  let reached = 0;
  for (let g = 1; g <= maxGames; g++) {
    nxt.fill(0);
    for (let k = 0; k < K; k++) for (let x = 0; x < top; x++) {
      const m = cur[idx(k, x)];
      if (!m) continue;
      const w = x + win;
      if (w >= top) {
        if (k + 1 === K) reached += m * p;
        else nxt[idx(k + 1, Math.min(top - 1, Math.max(minAfterUp, carry ? w - top : 0)))] += m * p;
      } else nxt[idx(k, w)] += m * p;
      const l = x - loss, q = m * (1 - p);
      if (l >= 0) nxt[idx(k, l)] += q;
      else if (demote === null || k === 0 || (!demote.carry && x > 0)) nxt[idx(k, 0)] += q;
      else if (tier && (from + k) % tier.every === 0) nxt[idx(k - 1, Math.min(top - 1, tier.to))] += q;
      else nxt[idx(k - 1, demote.carry ? Math.max(0, top + l) : Math.min(top - 1, demote.to))] += q;
    }
    [cur, nxt] = [nxt, cur];
    cdf.push(reached);
  }
  const q = t => { const i = cdf.findIndex(c => c >= t); return i < 0 ? null : i + 1; };
  let mean = null;
  if (cdf[cdf.length - 1] > 0.999) { mean = 1; for (let i = 0; i < cdf.length; i++) mean += 1 - cdf[i]; }
  return { cdf, p50: q(0.5), p90: q(0.9), mean, within: n => (n >= 1 && n <= cdf.length ? cdf[n - 1] : null), drift: p * win - (1 - p) * loss };
}
