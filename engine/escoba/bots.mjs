// Computer players for escoba de 15. A bot sees only observation(state, seat) and always returns one of obs.legal.
//   facil    takes when it can (a random way), else leaves a random card.
//   normal   values each play by what it takes for the hand's points (escobas, cards, oros, sevens and the setenta scale,
//            the siete de oros) minus the chance that the next player sweeps the table it leaves (exact count of the
//            unseen cards that would make 15 with it).
//   dificil  looks one play ahead: for every play, the next player's best answer (by the normal values) averaged over
//            hands sampled from the exact unseen cards (partners' answers count for the bot's side), plus half the
//            normal sweep risk.
import { createRng } from '../cards/rng.mjs';
import { DECK_40 } from '../cards/spanish.mjs';
import { VALUE, captures } from './rules.mjs';
import { step, toAct, observation } from './game.mjs';

export const LEVELS = Object.freeze(['facil', 'normal', 'dificil']);

export function createBot(level, seed) {
  if (!LEVELS.includes(level)) throw new Error('escoba createBot: level is one of ' + LEVELS.join(', '));
  if (seed === undefined || seed === null) throw new Error('escoba createBot: a seed is required');
  const rng = createRng(seed);
  const choose = obs => {
    const L = obs.legal;
    if (!L || !L.length) throw new Error('escoba bot: nothing to do');
    if (L.length === 1) return L[0];
    if (level === 'facil') { const t = L.filter(a => a.take.length); return (t.length ? t : L)[rng.int((t.length ? t : L).length)]; }
    return level === 'normal' ? best(L, a => value(obs.rules, a, obs.hand.table) - risk(obs, a)) : lookahead(obs, rng);
  };
  return { level, choose };
}

const best = (L, f) => { let b = null, bv = -Infinity; for (const a of L) { const v = f(a); if (v > bv + 1e-12) { bv = v; b = a; } } return b; };
const sum = cards => cards.reduce((t, c) => t + VALUE[c], 0);

// What a set of taken cards is worth towards the hand's points (rough shares of one point each).
function cardWorth(r, c) {
  let v = 0.045;
  if (c.endsWith('o')) v += 0.06;
  if (c === '7o') v += 0.7;
  const n = +c.slice(0, -1);
  if (r.scoring === 'gba') v += n === 7 ? 0.14 : n === 6 ? 0.08 : n === 1 ? 0.05 : 0;
  else if (n === 7) v += 0.18;
  return v;
}
export function value(r, a, table) {
  if (!a.take.length) return -cardWorth(r, a.card) * 0.5 - (a.card === '7o' ? 0.3 : 0);
  const sweep = a.take.length === table.length;
  return (sweep ? 1 : 0) + cardWorth(r, a.card) + a.take.reduce((t, c) => t + cardWorth(r, c), 0);
}

function unseen(obs) {
  const h = obs.hand, seen = new Set([...h.mine, ...h.table, ...h.piles.flat()]);
  return DECK_40.filter(c => !seen.has(c));
}
const tableAfter = (table, a) => (a.take.length ? table.filter(c => !a.take.includes(c)) : [...table, a.card]);

// Chance that the next player can sweep the table this play leaves (at least one card of the missing value among his).
function risk(obs, a) {
  const left = tableAfter(obs.hand.table, a), s = sum(left), need = 15 - s;
  const next = (obs.seat + 1) % obs.players;
  if (obs.pairs && next % 2 === obs.seat % 2) return 0;
  const k = obs.hand.counts[next];
  if (need < 1 || need > 10 || k <= 0) return 0;
  const U = unseen(obs), good = U.filter(c => VALUE[c] === need).length, n = U.length;
  let pNone = 1;
  for (let i = 0; i < k; i++) pNone *= Math.max(0, (n - good - i) / (n - i));
  return (1 - pNone) * 1.05;
}

function lookahead(obs, rng) {
  const r = obs.rules, h = obs.hand, next = (obs.seat + 1) % obs.players;
  const friend = obs.pairs && next % 2 === obs.seat % 2;
  const k = h.counts[next];
  const U = unseen(obs), samples = [];
  if (k > 0) for (let i = 0; i < 40; i++) {
    const pool = U.slice(), hand = [];
    for (let j = 0; j < Math.min(k, pool.length); j++) hand.push(pool.splice(rng.int(pool.length), 1)[0]);
    samples.push(hand);
  }
  return best(obs.legal, a => {
    const mine = value(r, a, h.table);
    if (!samples.length) return mine;
    const t2 = tableAfter(h.table, a);
    let reply = 0;
    for (const hand of samples) {
      let bv = -Infinity;
      for (const c of hand) {
        const caps = captures(t2, c);
        if (caps.length) for (const t of caps) bv = Math.max(bv, value(r, { card: c, take: t }, t2));
        if (!caps.length || r.capture === 'optional') bv = Math.max(bv, value(r, { card: c, take: [] }, t2));
      }
      reply += bv;
    }
    reply /= samples.length;
    return mine + (friend ? 0.5 : -1) * reply - 0.5 * risk(obs, a);
  });
}

// Play a whole match between bots. Returns the final state.
export function playMatch(state, bots, { maxActions }) {
  if (!Number.isInteger(maxActions)) throw new Error('playMatch: maxActions is required');
  let n = 0;
  while (!state.over) {
    const seat = toAct(state);
    step(state, bots[seat].choose(observation(state, seat)));
    if (++n > maxActions) throw new Error('playMatch: too many actions');
  }
  return state;
}
