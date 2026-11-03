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
