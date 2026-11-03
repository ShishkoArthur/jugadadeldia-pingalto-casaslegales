// Draw games: Quini 6 (Tradicional, La Segunda, Revancha, Siempre Sale, Premio Extra), Brinco, Loto Plus (Tradicional,
// Match, Desquite, Sale o Sale, Multiplicador), Telekino / Rekino, Poceada de la Ciudad, Tombolina, Quiniela Plus.
// Exact odds (fractions), the share of each ticket that the regulation sends to prizes, fixed-odds returns. Pure module.
import { fail, int, frac, ZERO, ONE, add, sub, mul, div, sum, pow, pct, dec, pesos, oneIn, binom, hypergeom } from './exact.mjs';
import { rules, winHits } from './rules.mjs';

const poolSize = g => (g.universe ? g.universe.v : g.maxNumber.v + 1);

// Odds of every number of hits for one simple ticket in one draw: hypergeometric C(drawn,k)C(pool-drawn,pick-k)/C(pool,pick).
export function odds(gameId) {
  const g = rules('draw', gameId);
  const pool = poolSize(g), drawn = g.drawn.v, pick = g.pick.v, wins = winHits(gameId);
  const total = binom(pool, pick);
  const rows = [];
  for (let k = Math.min(pick, drawn); k >= 0; k--) {
    const ways = binom(drawn, k) * binom(pool - drawn, pick - k);
    if (ways === 0n) continue;
    const p = frac(ways, total);
    rows.push({ hits: k, ways, p, oneIn: oneIn(p), prize: Array.isArray(wins) ? wins.includes(k) : null });
  }
  const pAny = Array.isArray(wins) ? sum(rows.filter(r => r.prize).map(r => r.p)) : null;
  const draws = g.draws ? g.draws.v : 1;
  const pAnyTicket = pAny && draws > 1 ? sub(ONE, pow(sub(ONE, pAny), draws)) : pAny;
  return { game: gameId, name: g.name, pool, drawn, pick, draws, combinations: total, rows, pAnyPrize: pAny, oneInAnyPrize: pAny ? oneIn(pAny) : null,
    pAnyPrizeTicket: pAnyTicket, oneInAnyPrizeTicket: pAnyTicket ? oneIn(pAnyTicket) : null,
    mostHitsWin: wins === 'most', sources: [g.drawn.src, g.pick.src, (g.universe || g.maxNumber).src, g.tiers.src].concat(g.draws ? [g.draws.src] : []) };
}

// Multiple ticket (k numbers marked, k > pick): number of simple tickets it holds = C(k, pick).
export function simpleTickets(gameId, marked) {
  const g = rules('draw', gameId);
  int(marked, 'marked', g.pick.v, poolSize(g));
  return binom(marked, g.pick.v);
}

// P(at least one jackpot) for a multiple ticket of `marked` numbers in one draw: C(marked, drawn) jackpots among C(pool, drawn)
// equally likely draws (only when pick == drawn, as in Quini 6, Brinco, Loto Plus).
export function multipleJackpot(gameId, marked) {
  const g = rules('draw', gameId);
  if (g.pick.v !== g.drawn.v) fail('BAD_OPTION', 'multipleJackpot needs pick == drawn');
  int(marked, 'marked', g.pick.v, poolSize(g));
  return frac(binom(marked, g.drawn.v), binom(poolSize(g), g.drawn.v));
}

// Quini 6 Premio Extra (article 30): six hits inside the union of the 18 numbers of Primer Sorteo, La Segunda and Revancha,
// excluding tickets with six hits in any single draw. Exact via the distribution of the union size of three independent
// 6-of-46 draws: P(ticket inside union) = E[C(U,6)] / C(46,6).
export function quini6PremioExtra() {
  rules('extra', 'cas-quini6-premio-extra');
  const g = rules('draw', 'cas-quini6-tradicional'), r = rules('draw', 'cas-quini6-revancha');
  const N = poolSize(g), k = g.drawn.v;
  if (poolSize(r) !== N || r.drawn.v !== k) fail('INTERNAL', 'Revancha and Tradicional must share the drum');
  let dist = new Map([[k, ONE]]);
  for (let draw = 2; draw <= 3; draw++) {
    const next = new Map();
    for (const [u, p] of dist) for (let overlap = 0; overlap <= k; overlap++) {
      const q = hypergeom(N, u, k, overlap);
      if (q.n === 0n) continue;
      const nu = u + k - overlap;
      next.set(nu, add(next.get(nu) || ZERO, mul(p, q)));
    }
    dist = next;
  }
  const C = binom(N, k);
  const inside = sum([...dist].map(([u, p]) => mul(p, frac(binom(u, k), C))));
  const single = frac(1n, C);
  const anySix = sub(ONE, pow(sub(ONE, single), 3));
  const p = sub(inside, anySix);
  return { pUnion: inside, pSixInADraw: anySix, p, oneIn: oneIn(p), unionSize: [...dist].sort((x, y) => x[0] - y[0]).map(([u, q]) => ({ size: u, p: q })),
    sources: [rules('extra', 'cas-quini6-premio-extra').rule.src, g.drawn.src, r.drawn.src] };
}

// Loto Plus Multiplicador: six hits in Tradicional, Match or Desquite (three independent 6-of-46 draws) and the Plus number.
export function lotoPlusMultiplicador() {
  const x = rules('extra', 'lotba-loto-plus-multiplicador');
  const draws = ['lotba-loto-plus-tradicional', 'lotba-loto-plus-match', 'lotba-loto-plus-desquite'].map(id => rules('draw', id));
  const single = frac(1n, binom(poolSize(draws[0]), draws[0].drawn.v));
  const anySix = sub(ONE, pow(sub(ONE, single), draws.length));
  const pPlus = frac(1n, BigInt(x.plusMax.v + 1));
  const p = mul(anySix, pPlus);
  return { pSixInAModality: anySix, pPlus, p, oneIn: oneIn(p), extraTimes: x.pay.v, sources: [x.rule.src, x.plusMax.src, x.pay.src] };
}

// Share of each $ of ticket price that the regulation sends to prizes: pool (everything the pool takes) and toPlayers (the
// prize categories paid to tickets; agent bonuses and reserve funds left out). Returns exact fractions of the price.
export function prizeShare(id) {
  const P = rules('pool', id);
  let base = P.nominal ? pct(P.nominal.v) : ONE;
  for (const s of P.steps) base = mul(base, pct(s.v));
  // Quini 6 Tradicional: each half of the nominal revenue feeds one of the two draws (Primer Sorteo, La Segunda).
  if (P.perDraw) base = mul(base, frac(BigInt(P.perDraw.v)));
  const srcs = [P.nominal, ...P.steps, P.perDraw || null].filter(Boolean).map(x => x.src);
  if (P.modalities) {
    const shares = P.modalities.v.map(r => pct(r[0]));
    const toPlayers = sum(shares.map((sh, i) => {
      const m = P.modalityPrizes[i].v;
      const inPool = Array.isArray(m) ? sum(m.map(r => pct(r[r.length - 1]))) : (i === 4 && P.multiplicadorToReserve ? ZERO : pct(m));
      return mul(sh, inPool);
    }));
    return { id, pool: base, toPlayers: mul(base, toPlayers), per100: mul(mul(base, toPlayers), frac(100n)), sources: srcs.concat([P.modalities.src], P.modalityPrizes.map(x => x.src)) };
  }
  let toPlayers;
  if (Array.isArray(P.prizes.v)) toPlayers = sum(P.playerRows.map(i => { const row = P.prizes.v[i]; return pct(P.pctFirst ? row[0] : row[row.length - 1]); }));
  else toPlayers = pct(P.prizes.v);
  return { id, pool: base, toPlayers: mul(base, toPlayers), per100: mul(mul(base, toPlayers), frac(100n)), sources: srcs.concat([P.prizes.src]) };
}

// Tombolina (fixed odds): play n numbers (3-7) of 00-99 against 20 distinct numbers; payout table in times the stake.
export function tombolina({ rules: id, numbers, stake } = {}) {
  const T = rules('tombolina', id);
  const pool = T.maxNumber.v + 1, drawn = T.drawn.v;
  const rowsFor = T.table.v.filter(r => r[0] === numbers);
  if (!rowsFor.length) fail('BAD_OPTION', 'tombolina: the table has no row for ' + numbers + ' numbers');
  const st = pesos(stake, 'stake');
  const rows = [];
  for (let k = numbers; k >= 0; k--) {
    const p = hypergeom(pool, drawn, numbers, k);
    const r = rowsFor.find(x => x[1] === k);
    rows.push({ hits: k, p, oneIn: p.n ? oneIn(p) : null, times: r ? r[2] : 0, payout: r ? mul(st, dec(r[2])) : ZERO });
  }
  const ev = sum(rows.map(r => mul(r.p, r.payout)));
  const pWin = sum(rows.filter(r => r.times > 0).map(r => r.p));
  return { rules: id, numbers, stake: st, rows, ev, evPer100: mul(div(ev, st), frac(100n)), pWin, oneIn: oneIn(pWin), sources: [T.table.src, T.maxNumber.src, T.drawn.src] };
}

// Quiniela Plus / Súper Plus / Chance Plus (PBA): 8 different numbers 00-99 against the 2-digit groups of the 20 places of the
// Nocturna. Places are independent and may repeat (pba.quiniela.balls-back), so the hits are the number of the 8 numbers that
// appear at least once among 20 independent uniform draws: P(exactly j) = C(8,j) sum_i (-1)^i C(j,i) (100-8+j-i)^20 / 100^20.
// A number that appears twice is read as one hit (the top category is 8 hits with 8 numbers) - see docs/ENGINE-LOTTERY.md.
export function quinielaPlusOdds(id) {
  const Q = rules('qplus', id);
  const m = Q.pick.v, n = Q.places.v, V = 100n;
  const rows = [];
  for (let j = m; j >= 0; j--) {
    let s = 0n;
    for (let i = 0; i <= j; i++) s += (i % 2 ? -1n : 1n) * binom(j, i) * (V - BigInt(m - j) - BigInt(i)) ** BigInt(n);
    const p = frac(binom(m, j) * s, V ** BigInt(n));
    rows.push({ hits: j, p, oneIn: p.n ? oneIn(p) : null, prize: Q.tiers.includes(j) });
  }
  const t = sum(rows.map(r => r.p));
  if (t.n !== t.d) fail('INTERNAL', 'Quiniela Plus distribution does not sum to 1');
  const pAny = sum(rows.filter(r => r.prize).map(r => r.p));
  return { rules: id, rows, pAnyPrize: pAny, oneInAnyPrize: oneIn(pAny), sources: [Q.pick.src, Q.places.src, Q.points.src] };
}
