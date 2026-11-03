// Seeded Monte Carlo for truco hands: an independent check and a "how often does this hand win at a real table" estimate.
// Exact numbers come from probability.mjs; this one samples opponent hands and plays the bazas with a plain card policy
// (no calls): follow with the lowest card that wins, else the lowest; lead the middle card in the first baza, the highest
// card after that.
import { DECK_40, shuffle, combinations } from '../cards/spanish.mjs';
import { createRng } from '../cards/rng.mjs';
import { POWER } from './cards.mjs';
import { handWinner } from './game.mjs';

function plainCard(mine, oppCard, bazaNo) {
  const s = mine.slice().sort((a, b) => POWER[a] - POWER[b]);
  if (oppCard !== null) return s.find(c => POWER[c] > POWER[oppCard]) ?? s[0];
  if (bazaNo === 0) return s[Math.min(1, s.length - 1)];
  return s[s.length - 1];
}

// Plays one hand of bazas between two known hands (seat 0 and seat 1). Returns the winning seat.
export function playBazasPlain(h0, h1, mano) {
  const left = [h0.slice(), h1.slice()], R = [];
  let lead = mano;
  for (let b = 0; b < 3; b++) {
    const first = lead, second = 1 - lead;
    const c1 = plainCard(left[first], null, b);
    left[first] = left[first].filter(c => c !== c1);
    const c2 = plainCard(left[second], c1, b);
    left[second] = left[second].filter(c => c !== c2);
    const p = [0, 0]; p[first] = POWER[c1]; p[second] = POWER[c2];
    const w = p[0] === p[1] ? -1 : p[0] > p[1] ? 0 : 1;
    R.push(w);
    const hw = handWinner(R, mano);
    if (hw !== null) return hw;
    lead = w === -1 ? mano : w;
  }
  throw new Error('playBazasPlain: no winner after three bazas');
}

// Chance that `hand` wins the bazas against a random hand, both playing the plain policy. Returns { p, se, samples }.
export function handWinMC(hand, { mano, samples, seed }) {
  if (typeof mano !== 'boolean' || !Number.isInteger(samples) || samples < 1 || seed === undefined) throw new Error('handWinMC: mano, samples and seed are required');
  const rest = DECK_40.filter(c => !hand.includes(c));
  if (rest.length !== 37) throw new Error('handWinMC: three distinct cards');
  const rng = createRng(seed);
  let w = 0;
  for (let i = 0; i < samples; i++) {
    const opp = shuffle(rest, rng).slice(0, 3);
    if (playBazasPlain(hand, opp, mano ? 0 : 1) === 0) w++;
  }
  const p = w / samples;
  return { p, se: Math.sqrt((p * (1 - p)) / samples), samples };
}

// The same measure, exact: every one of the C(37,3) = 7770 opponent hands played out with the plain policy.
export function handWinPlainExact(hand, { mano }) {
  if (typeof mano !== 'boolean') throw new Error('handWinPlainExact: mano is required');
  const rest = DECK_40.filter(c => !hand.includes(c));
  if (rest.length !== 37) throw new Error('handWinPlainExact: three distinct cards');
  let w = 0, n = 0;
  combinations(rest, 3, opp => { n++; if (playBazasPlain(hand, opp.slice(), mano ? 0 : 1) === 0) w++; });
  return { win: w, total: n, p: w / n };
}
