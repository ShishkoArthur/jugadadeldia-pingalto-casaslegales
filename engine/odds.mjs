// Decimal odds: bookmaker margin (overround) and handicap settlement. Pure functions, no data about any operator.
// Margin: the implied probabilities 1/odd of all outcomes of one market add up to more than 1; the excess is what the house
// keeps on a balanced book. Fair odds remove it proportionally (each implied probability divided by the sum).
// Handicap: the line is added to the goals of the team you back; whole and half lines settle as win / push / loss, quarter
// lines (.25, .75) split the stake into two halves on the two nearest half-lines.

export function parseOdd(input) {
  if (typeof input === 'number') return Number.isFinite(input) && input > 1 ? input : null;
  const s = String(input == null ? '' : input).trim().replace(/\s/g, '');
  if (!/^\d{1,4}([.,]\d{1,4})?$/.test(s)) return null;
  const v = Number(s.replace(',', '.'));
  return v > 1 ? v : null;
}

export function margin(odds) {
  if (!Array.isArray(odds) || odds.length < 2) throw new Error('margin: at least two outcomes');
  const o = odds.map(x => { const v = parseOdd(x); if (v === null) throw new Error('margin: bad odd ' + x); return v; });
  const implied = o.map(v => 1 / v);
  const sum = implied.reduce((a, b) => a + b, 0);
  return {
    odds: o,
    implied,
    sum,
    margin: sum - 1,
    payout: 1 / sum,
    fairProb: implied.map(p => p / sum),
    fairOdds: o.map(v => v * sum),
  };
}

const isStep = (x, step) => Math.abs(x / step - Math.round(x / step)) < 1e-9;

// share of the stake that wins, is returned and loses for one line and goal difference (goals of the backed team minus the rival)
export function settleHandicap(line, diff) {
  if (!Number.isFinite(line) || !isStep(line, 0.25)) throw new Error('settleHandicap: line must be a multiple of 0.25');
  if (!Number.isInteger(diff)) throw new Error('settleHandicap: goal difference must be an integer');
  if (isStep(line, 0.5)) {
    const r = diff + line;
    return r > 0 ? { win: 1, push: 0, lose: 0 } : r < 0 ? { win: 0, push: 0, lose: 1 } : { win: 0, push: 1, lose: 0 };
  }
  const a = settleHandicap(line - 0.25, diff), b = settleHandicap(line + 0.25, diff);
  return { win: (a.win + b.win) / 2, push: (a.push + b.push) / 2, lose: (a.lose + b.lose) / 2 };
}

export function handicapLabel(s) {
  if (s.win === 1) return 'win';
  if (s.lose === 1) return 'lose';
  if (s.push === 1) return 'push';
  if (s.win === 0.5) return 'half-win';
  if (s.lose === 0.5) return 'half-lose';
  throw new Error('handicapLabel: unexpected split');
}

// money back for a stake at decimal odd (stake included); exact for the quarter splits
export function handicapReturn(line, diff, odd, stake = 1) {
  const o = parseOdd(odd);
  if (o === null) throw new Error('handicapReturn: bad odd ' + odd);
  const s = settleHandicap(line, diff);
  return stake * (s.win * o + s.push);
}

// Odds formats. Decimal d (stake included), fractional a/b = profit per unit staked (d = 1 + a/b), American: +x = profit on
// 100 staked (d >= 2), -x = stake needed to win 100 (d < 2). Implied probability = 1/d (margin included).
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

export function parseFractional(input) {
  const s = String(input == null ? '' : input).trim().replace(/\s/g, '');
  const m = /^(\d{1,5})\/(\d{1,5})$/.exec(s);
  if (!m) return null;
  const a = Number(m[1]), b = Number(m[2]);
  if (!(a > 0 && b > 0)) return null;
  return 1 + a / b;
}

const MINUS = new RegExp('^' + String.fromCharCode(0x2212));
export function parseAmerican(input) {
  const s = String(input == null ? '' : input).trim().replace(/\s/g, '').replace(MINUS, '-');
  const m = /^([+-]?)(\d{3,6})(?:[.,]\d+)?$/.exec(s);
  if (!m) return null;
  const v = Number(s.replace(',', '.'));
  if (Math.abs(v) < 100) return null;
  return m[1] === '-' ? 1 + 100 / Math.abs(v) : 1 + Math.abs(v) / 100;
}

export function parseAny(input, format) {
  if (format === 'decimal') return parseOdd(input);
  if (format === 'fractional') return parseFractional(input);
  if (format === 'american') return parseAmerican(input);
  throw new Error('parseAny: unknown format ' + format);
}

// best fraction for d - 1 with a denominator up to maxDen (continued fractions); exact when it equals d - 1 to 1e-9
export function toFractional(d, maxDen = 100) {
  const o = parseOdd(d);
  if (o === null) throw new Error('toFractional: bad odd ' + d);
  const x = o - 1;
  let h0 = 0, h1 = 1, k0 = 1, k1 = 0, r = x;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(r);
    const h2 = a * h1 + h0, k2 = a * k1 + k0;
    if (k2 > maxDen) break;
    h0 = h1; h1 = h2; k0 = k1; k1 = k2;
    if (Math.abs(r - a) < 1e-12) break;
    r = 1 / (r - a);
    if (!Number.isFinite(r)) break;
  }
  if (k1 === 0) { h1 = Math.round(x); k1 = 1; }
  const g = gcd(h1, k1) || 1;
  const num = h1 / g, den = k1 / g;
  return { num, den, exact: Math.abs(num / den - x) < 1e-9, text: num + '/' + den };
}

export function toAmerican(d) {
  const o = parseOdd(d);
  if (o === null) throw new Error('toAmerican: bad odd ' + d);
  return o >= 2 ? (o - 1) * 100 : -100 / (o - 1);
}

export function convertOdd(input, format = 'decimal') {
  const d = parseAny(input, format);
  if (d === null) return null;
  return { decimal: d, fractional: toFractional(d), american: toAmerican(d), implied: 1 / d };
}

// Parlay (combinada): each leg is one market with all its odds and the index of the pick. Paid odd = product of the picked
// odds. Without margin each leg would pay picked odd x payout of its market (proportional removal, as in margin()); the
// expected return of 1 staked is the product of the payouts, so the house edge of the combo is 1 - that product and grows
// with every leg. prob = chance that all picks win if the fair probabilities were the true ones (independent legs).
export function parlay(legs) {
  if (!Array.isArray(legs) || !legs.length) throw new Error('parlay: at least one leg');
  let odd = 1, prob = 1, ret = 1;
  const steps = legs.map((leg, i) => {
    const m = margin(leg.odds);
    if (!Number.isInteger(leg.pick) || leg.pick < 0 || leg.pick >= m.odds.length) throw new Error('parlay: bad pick in leg ' + i);
    odd *= m.odds[leg.pick];
    prob *= m.fairProb[leg.pick];
    ret *= m.payout;
    return { legs: i + 1, pickOdd: m.odds[leg.pick], legPayout: m.payout, odd, prob, payout: ret, edge: 1 - ret, ev: odd * prob - 1, oneIn: 1 / prob };
  });
  return { ...steps[steps.length - 1], steps };
}

// Single bet: what a stake at a decimal odd pays if it wins (stake included), the profit, and the implied probability.
export function single(stake, odd) {
  const o = parseOdd(odd);
  if (o === null) throw new Error('single: bad odd ' + odd);
  if (!(Number.isFinite(stake) && stake > 0)) throw new Error('single: bad stake ' + stake);
  return { stake, odd: o, pays: stake * o, profit: stake * (o - 1), implied: 1 / o };
}

// Cash out: a bet of stake at the placed odd is still open and the same pick now has live odds (the whole live market, pick =
// index of the pick). Value at the live odd = stake x placed / live odd: the stake that, bet now at the live odd, would pay the
// same if the pick wins. That live odd is shortened by the margin of the live market, so it overstates what the open bet is worth;
// the fair value removes the margin (stake x placed x fair probability of the pick = expected payout). The site decides what it
// offers; the fair value is the number to compare the offer with.
export function cashOut(stake, placed, live, pick) {
  const p = parseOdd(placed);
  if (p === null) throw new Error('cashOut: bad placed odd ' + placed);
  if (!(Number.isFinite(stake) && stake > 0)) throw new Error('cashOut: bad stake ' + stake);
  const m = margin(live);
  if (!Number.isInteger(pick) || pick < 0 || pick >= m.odds.length) throw new Error('cashOut: bad pick ' + pick);
  const potential = stake * p;
  return { potential, liveOdd: m.odds[pick], atLive: potential / m.odds[pick], fair: potential * m.fairProb[pick], liveMargin: m.margin, fairProb: m.fairProb[pick] };
}
