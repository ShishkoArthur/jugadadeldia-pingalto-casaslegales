// Quiniela: direct bets (1-5 digits, a la cabeza or a los N) and redoblona, by jurisdiction rule set (engine/lottery/rules.mjs).
// Exact: payouts and probabilities are fractions; nothing is defaulted, every option is required.
//
// Draw model (the only modelling assumption, written in docs/ENGINE-LOTTERY.md): each of the 20 places of the extract is an
// independent number whose last k digits are uniform over 10^k values. PBA writes the mechanism (four or five digit globes,
// balls put back after every extraction - facts pba.quiniela.four-globes, pba.quiniela.balls-back); LOTBA says only that
// twenty numbers 0000-9999 are drawn and that repetitions pay (lotba.quiniela.drawn, lotba.quiniela.repeats-count). The
// expected return of a direct bet does not depend on this assumption (linearity); the spread of outcomes does.
import { fail, int, required, frac, ZERO, add, mul, div, sum, cmp, pesos, oneIn, binom, binomialPmf } from './exact.mjs';
import { rules } from './rules.mjs';

const P2 = frac(1n, 100n);

// Places a bet covers: LOTBA "desde/hasta" any range inside 1..20; PBA "el primero y hasta el quinto, décimo y vigésimo".
function placesOf(R, places, where) {
  const total = R.places.v;
  if (R.ranges.v === 'range') {
    let from, to;
    if (typeof places === 'number') { from = 1; to = places; }
    else if (places && typeof places === 'object') { from = places.from; to = places.to; }
    else fail('MISSING', where + ': places is required (a number N for 1..N or { from, to })');
    int(from, where + ' places.from', 1, total); int(to, where + ' places.to', 1, total);
    if (to < from) fail('RANGE', where + ': places.to must not be below places.from');
    return { from, to };
  }
  int(places, where + ' places', 1, total);
  if (!R.ranges.v.includes(places)) fail('BAD_OPTION', where + ': this jurisdiction takes places ' + R.ranges.v.join(', ') + ' (got ' + places + ')');
  return { from: 1, to: places };
}
const count = r => r.to - r.from + 1;

// Direct bet. opts: { rules: 'lotba-quiniela' | 'pba-quiniela', digits: 1..5, places, stake: pesos }.
export function directBet(opts) {
  const R = rules('quiniela', required(opts, 'rules', 'directBet'));
  const digits = int(required(opts, 'digits', 'directBet'), 'digits', 1);
  if (!R.pay[digits]) fail('BAD_OPTION', 'directBet: ' + R.name + ' pays ' + Object.keys(R.pay).join(', ') + ' digits (got ' + digits + ')');
  const range = placesOf(R, required(opts, 'places', 'directBet'), 'directBet');
  const stake = pesos(required(opts, 'stake', 'directBet'), 'stake');
  const n = count(range), ratio = R.pay[digits].v;
  const p = frac(1n, 10n ** BigInt(digits));
  const perHit = div(mul(stake, frac(ratio)), frac(n));
  // PBA article 20: winnings accumulated by repetition up to 2000 times the stake per place. The article does not say how a
  // repeated 3-5 digit hit is cut when a single hit already exceeds that limit, so those outcomes are reported as a range.
  const capAmount = R.directCap ? mul(div(stake, frac(n)), frac(R.directCap.v)) : null;
  const outcomes = [];
  let evHigh = ZERO, evLow = ZERO, pUnclear = ZERO;
  for (let h = 0; h <= n; h++) {
    const ph = binomialPmf(n, p, h);
    const full = mul(perHit, frac(h));
    let low = full, unclear = false;
    if (capAmount && h >= 2 && cmp(full, capAmount) > 0) { unclear = true; low = cmp(perHit, capAmount) > 0 ? perHit : capAmount; pUnclear = add(pUnclear, ph); }
    outcomes.push({ hits: h, p: ph, payout: full, payoutLow: low, unclear });
    evHigh = add(evHigh, mul(ph, full)); evLow = add(evLow, mul(ph, low));
  }
  const pWin = sub1(binomialPmf(n, p, 0));
  return {
    rules: opts.rules, digits, places: range, stake, ratio, perHit, pPerPlace: p, pWin, oneIn: oneIn(pWin), outcomes,
    ev: evHigh, evLow, pUnclear, evPer100: mul(div(evHigh, stake), frac(100n)), evLowPer100: mul(div(evLow, stake), frac(100n)),
    sources: [R.pay[digits].src, R.places.src, R.divide.src, R.includesStake.src].concat(R.directCap ? [R.directCap.src] : []),
  };
}
const sub1 = q => frac(q.d - q.n, q.d);

// Redoblona: two 2-digit numbers, first in range r1, second in range r2, one extract. opts: { rules, first: { number,
// places }, second: { number, places }, stake }. Returns the exact payout distribution.
export function redoblona(opts) {
  const R = rules('quiniela', required(opts, 'rules', 'redoblona'));
  const RB = R.redoblona;
  const f = required(opts, 'first', 'redoblona'), s = required(opts, 'second', 'redoblona');
  const a = int(required(f, 'number', 'redoblona first'), 'first.number', 0, 99), b = int(required(s, 'number', 'redoblona second'), 'second.number', 0, 99);
  const r1 = placesOf(R, required(f, 'places', 'redoblona first'), 'redoblona first');
  let r2 = placesOf(R, required(s, 'places', 'redoblona second'), 'redoblona second');
  const stake = pesos(required(opts, 'stake', 'redoblona'), 'stake');
  const total = R.places.v;
  if (RB.style === 'pba' && r1.to > r2.to) fail('NOT_REDOBLONA', 'the first bet reaches a later place than the second: PBA settles it as a direct bet (' + RB.firstBeyond.src + ')');
  if (r1.from === 1 && r1.to === 1 && r2.from === 1 && r2.to === 1) fail('NOT_REDOBLONA', 'both bets at place 1: not a redoblona');
  // first bet only at place 1 and second "up to" a range containing 1: the second skips place 1 and extends one place.
  if (r1.from === 1 && r1.to === 1 && r2.from === 1) r2 = { from: 2, to: Math.min(r2.to + 1, total) };
  const n1 = count(r1);
  const in1 = i => i >= r1.from && i <= r1.to, in2 = i => i >= r2.from && i <= r2.to;
  // LOTBA article 11: first bet at a single place p (not 1) inside the second range - divide by places minus one; the place p
  // is the shared portion, where the first hit counts for the first bet.
  let d2 = count(r2);
  if (RB.style === 'lotba' && n1 === 1 && in2(r1.from)) d2 -= 1;
  let u1 = 0, sh = 0, u2 = 0;
  for (let i = 1; i <= total; i++) { const x = in1(i), y = in2(i); if (x && y) sh++; else if (x) u1++; else if (y) u2++; }
  if (RB.style === 'pba' && sh > 0 && u1 > 0) fail('RANGE', 'PBA ranges start at place 1: unexpected partial overlap');
  const ratio = frac(RB.pay.v);
  const pay = (A, B) => {
    if (A === 0 || B === 0) return ZERO;
    const raw = mul(mul(mul(stake, div(mul(ratio, frac(A)), frac(n1))), ratio), div(frac(B), frac(d2)));
    let cap;
    if (RB.style === 'lotba') cap = mul(stake, frac(n1 === 1 && d2 === 2 ? RB.cap12.v : n1 === 1 && d2 === 3 ? RB.cap13.v : RB.cap.v));
    else cap = mul(div(stake, frac(n1)), frac(RB.cap.v));
    return cmp(raw, cap) > 0 ? cap : raw;
  };
  const dist = new Map();
  const put = (amount, p) => { const k = amount.n + '/' + amount.d; const o = dist.get(k); dist.set(k, o ? { amount, p: add(o.p, p) } : { amount, p }); };
  const bin = (n, k) => binomialPmf(n, P2, k);
  if (a !== b) {
    // shared places: a (1/100), b (1/100) or neither (98/100), multinomial
    for (let x1 = 0; x1 <= u1; x1++) for (let y2 = 0; y2 <= u2; y2++) for (let sa = 0; sa <= sh; sa++) for (let sb = 0; sa + sb <= sh; sb++) {
      const pShared = frac(binom(sh, sa) * binom(sh - sa, sb) * 98n ** BigInt(sh - sa - sb), 100n ** BigInt(sh));
      put(pay(x1 + sa, y2 + sb), mul(mul(bin(u1, x1), bin(u2, y2)), pShared));
    }
  } else {
    for (let z1 = 0; z1 <= u1; z1++) for (let zs = 0; zs <= sh; zs++) for (let z2 = 0; z2 <= u2; z2++) {
      let A, B;
      if (RB.style === 'lotba') { A = z1 + (zs > 0 ? 1 : 0); B = z2 + Math.max(zs - 1, 0); }
      else { A = z1 + zs > 0 ? 1 : 0; B = sh > 0 ? (zs > 0 ? zs - 1 + z2 : 0) : z2; }
      put(pay(A, B), mul(mul(bin(u1, z1), bin(sh, zs)), bin(u2, z2)));
    }
  }
  const outcomes = [...dist.values()].sort((x, y) => cmp(x.amount, y.amount));
  const total1 = sum(outcomes.map(o => o.p));
  if (total1.n !== total1.d) fail('INTERNAL', 'redoblona distribution does not sum to 1');
  const ev = sum(outcomes.map(o => mul(o.amount, o.p)));
  const pWin = sum(outcomes.filter(o => o.amount.n > 0n).map(o => o.p));
  return {
    rules: opts.rules, first: { number: a, places: r1 }, second: { number: b, places: r2, divisor: d2 }, stake, outcomes, ev, pWin, oneIn: oneIn(pWin),
    evPer100: mul(div(ev, stake), frac(100n)),
    sources: Object.values(RB).filter(x => x && x.src).map(x => x.src).concat([R.places.src]),
  };
}

// Every direct bet of a rule set at once (the "cuánto paga" table): digits x places.
export function payTable({ rules: id, stake } = {}) {
  const R = rules('quiniela', id);
  const placeList = R.ranges.v === 'range' ? [1, 5, 10, 20] : R.ranges.v;
  return Object.keys(R.pay).map(Number).flatMap(digits => placeList.map(places => {
    const r = directBet({ rules: id, digits, places, stake });
    return { digits, places, perHit: r.perHit, oneIn: r.oneIn, evPer100: r.evPer100, unclear: r.pUnclear.n > 0n };
  }));
}


// ---------- settling a real extract (the "controlá tu jugada" tools and an independent check of the exact maths) ----------
function checkExtract(extract, R) {
  if (!Array.isArray(extract) || extract.length !== R.places.v || extract.some(x => !Number.isInteger(x) || x < 0 || x > 99999)) fail('BAD_EXTRACT', 'extract must be ' + R.places.v + ' whole numbers 0-99999 in place order');
}
// Direct bet against an extract (array of the 20 numbers, place 1 first): payout in pesos as a fraction.
export function settleDirect(opts) {
  const R = rules('quiniela', required(opts, 'rules', 'settleDirect'));
  const digits = int(required(opts, 'digits', 'settleDirect'), 'digits', 1);
  if (!R.pay[digits]) fail('BAD_OPTION', 'settleDirect: ' + digits + ' digits not paid by ' + R.name);
  const number = int(required(opts, 'number', 'settleDirect'), 'number', 0, 10 ** digits - 1);
  const range = placesOf(R, required(opts, 'places', 'settleDirect'), 'settleDirect');
  const stake = pesos(required(opts, 'stake', 'settleDirect'), 'stake');
  const extract = required(opts, 'extract', 'settleDirect'); checkExtract(extract, R);
  const mod = 10 ** digits;
  let hits = 0;
  for (let i = range.from; i <= range.to; i++) if (extract[i - 1] % mod === number) hits++;
  return { hits, payout: mul(div(mul(stake, frac(R.pay[digits].v)), frac(count(range))), frac(hits)) };
}

// Redoblona against an extract, place by place, exactly as the articles read (LOTBA 10-11, 19; PBA 17, 18, 20).
export function settleRedoblona(opts) {
  const R = rules('quiniela', required(opts, 'rules', 'settleRedoblona'));
  const RB = R.redoblona, total = R.places.v;
  const f = required(opts, 'first', 'settleRedoblona'), s = required(opts, 'second', 'settleRedoblona');
  const a = int(required(f, 'number', 'first'), 'first.number', 0, 99), b = int(required(s, 'number', 'second'), 'second.number', 0, 99);
  const r1 = placesOf(R, required(f, 'places', 'first'), 'first');
  let r2 = placesOf(R, required(s, 'places', 'second'), 'second');
  const stake = pesos(required(opts, 'stake', 'settleRedoblona'), 'stake');
  const extract = required(opts, 'extract', 'settleRedoblona'); checkExtract(extract, R);
  if (RB.style === 'pba' && r1.to > r2.to) fail('NOT_REDOBLONA', 'settled as a direct bet (' + RB.firstBeyond.src + ')');
  if (r1.from === 1 && r1.to === 1 && r2.from === 1 && r2.to === 1) fail('NOT_REDOBLONA', 'both bets at place 1: not a redoblona');
  if (r1.from === 1 && r1.to === 1 && r2.from === 1) r2 = { from: 2, to: Math.min(r2.to + 1, total) };
  const n1 = count(r1);
  const in1 = i => i >= r1.from && i <= r1.to, in2 = i => i >= r2.from && i <= r2.to;
  let d2 = count(r2);
  if (RB.style === 'lotba' && n1 === 1 && in2(r1.from)) d2 -= 1;
  const two = i => extract[i - 1] % 100;
  let A = 0, B = 0;
  if (a !== b) {
    for (let i = 1; i <= total; i++) { if (in1(i) && two(i) === a) A++; if (in2(i) && two(i) === b) B++; }
  } else if (RB.style === 'lotba') {
    let sharedSeen = false;
    for (let i = 1; i <= total; i++) {
      if (two(i) !== a) continue;
      if (in1(i) && in2(i)) { if (!sharedSeen) { A++; sharedSeen = true; } else B++; }
      else if (in1(i)) A++;
      else if (in2(i)) B++;
    }
  } else {
    let firstAt = 0;
    for (let i = r1.from; i <= r1.to; i++) if (two(i) === a) { firstAt = i; break; }
    if (firstAt) { A = 1; for (let i = 1; i <= total; i++) if (i !== firstAt && in2(i) && two(i) === b) B++; }
  }
  if (!A || !B) return { A, B, payout: ZERO };
  const ratio = frac(RB.pay.v);
  const raw = mul(mul(div(mul(mul(stake, ratio), frac(A)), frac(n1)), ratio), div(frac(B), frac(d2)));
  const cap = RB.style === 'lotba' ? mul(stake, frac(n1 === 1 && d2 === 2 ? RB.cap12.v : n1 === 1 && d2 === 3 ? RB.cap13.v : RB.cap.v)) : mul(div(stake, frac(n1)), frac(RB.cap.v));
  return { A, B, payout: cmp(raw, cap) > 0 ? cap : raw };
}
