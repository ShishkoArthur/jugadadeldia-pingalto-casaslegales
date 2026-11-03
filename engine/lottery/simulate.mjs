// "A year of playing": the same bet `plays` times. Input is the exact outcome list of one play (from quiniela.mjs / games.mjs:
// [{ amount: fraction of pesos, p: fraction }]) and the stake. Exact: expected net and its standard deviation; the
// distribution of the year's total is a convolution over float probabilities (states with probability below `floor` are
// dropped and their mass reported as `lost`); an independent Monte Carlo with xoshiro128** is in yearMonteCarlo().
import { fail, int, num, required, frac, sub, mul, sum, toNumber } from './exact.mjs';
import { xoshiro128ss } from './rng.mjs';

function prepare(outcomes, stake) {
  if (!Array.isArray(outcomes) || !outcomes.length) fail('MISSING', 'outcomes are required');
  const t = sum(outcomes.map(o => o.p));
  if (t.n !== t.d) fail('PROB_SUM', 'outcome probabilities must sum to 1');
  // a common unit so every payout is an integer number of units
  const g = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  let L = stake.d;
  for (const o of outcomes) L = (L / g(L, o.amount.d)) * o.amount.d;
  const toUnits = q => (q.n * L) / q.d;
  return { L, items: outcomes.map(o => ({ u: toUnits(o.amount), p: toNumber(o.p), pf: o.p, amount: o.amount })), stakeU: toUnits(stake) };
}

export function yearExact(opts) {
  const outcomes = required(opts, 'outcomes', 'yearExact'), stake = required(opts, 'stake', 'yearExact');
  const plays = int(required(opts, 'plays', 'yearExact'), 'plays', 1, 5000);
  const floor = num(required(opts, 'floor', 'yearExact'), 'floor');
  const { L, items, stakeU } = prepare(outcomes, stake);
  const mean1 = sum(outcomes.map(o => mul(o.p, o.amount)));
  const second = sum(outcomes.map(o => mul(o.p, mul(o.amount, o.amount))));
  const var1 = sub(second, mul(mean1, mean1));
  const meanNet = mul(frac(BigInt(plays)), sub(mean1, stake));
  let dist = new Map([[0n, 1]]), lost = 0;
  for (let i = 0; i < plays; i++) {
    const next = new Map();
    for (const [tot, p] of dist) for (const it of items) {
      const q = p * it.p;
      if (q < floor) { lost += q; continue; }
      const k = tot + it.u;
      next.set(k, (next.get(k) || 0) + q);
    }
    dist = next;
  }
  const spent = stakeU * BigInt(plays);
  const rows = [...dist].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([u, p]) => ({ net: toNumber(frac(u - spent, L)), p }));
  const pAhead = rows.filter(r => r.net > 0).reduce((s, r) => s + r.p, 0);
  const pEven = rows.filter(r => r.net === 0).reduce((s, r) => s + r.p, 0);
  const quantile = q => { let c = 0; for (const r of rows) { c += r.p; if (c >= q) return r.net; } return rows[rows.length - 1].net; };
  return { plays, spent: toNumber(frac(spent, L)), meanNet, sdNet: Math.sqrt(toNumber(var1) * plays), pAhead, pEven, lost,
    median: quantile(0.5), p10: quantile(0.1), p90: quantile(0.9), rows };
}

// Monte Carlo of `years` independent years (seeded): the share of years ahead and the mean net, for cross-checking yearExact.
export function yearMonteCarlo(opts) {
  const outcomes = required(opts, 'outcomes', 'yearMonteCarlo'), stake = required(opts, 'stake', 'yearMonteCarlo');
  const plays = int(required(opts, 'plays', 'yearMonteCarlo'), 'plays', 1, 5000);
  const years = int(required(opts, 'years', 'yearMonteCarlo'), 'years', 1, 1e6);
  const rng = xoshiro128ss(int(required(opts, 'seed', 'yearMonteCarlo'), 'seed', 0));
  const { L, items, stakeU } = prepare(outcomes, stake);
  const cum = []; let c = 0;
  for (const it of items) { c += it.p; cum.push(c); }
  const spent = stakeU * BigInt(plays);
  let ahead = 0, sumNet = 0;
  const nets = [];
  for (let y = 0; y < years; y++) {
    let tot = 0n;
    for (let i = 0; i < plays; i++) {
      const x = rng.next();
      let j = 0; while (j < cum.length - 1 && x >= cum[j]) j++;
      tot += items[j].u;
    }
    const net = toNumber(frac(tot - spent, L));
    if (net > 0) ahead++;
    sumNet += net; nets.push(net);
  }
  nets.sort((a, b) => a - b);
  return { years, pAhead: ahead / years, meanNet: sumNet / years, median: nets[Math.floor(years / 2)], nets };
}

