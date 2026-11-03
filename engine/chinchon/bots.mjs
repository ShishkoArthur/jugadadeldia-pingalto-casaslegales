// Computer players for chinchon. A bot sees only observation(state, seat) and always returns one of obs.legal.
//   facil    takes the pozo card when it lowers its points, else the stock; throws its highest loose card; cuts when it can.
//   normal   exact best melds of the eight cards: weighs the points left now and the average best points after the next
//            draw over eight sampled unseen cards; takes the pozo only when that beats the average stock card; cuts when
//            it can.
//   dificil  looks one draw ahead: for every card it could throw, the exact average of its best points after the next
//            draw over all unseen cards; avoids throwing cards the next player took from the pozo before (same number or
//            suit neighbours); waits one more turn for all melded (-10) when that is likely and its points are not low.
import { createRng } from '../cards/rng.mjs';
import { deckOf, isJoker, numOf, suitOf, rankOf, cardValue } from './rules.mjs';
import { bestSplit, canCut } from './melds.mjs';
import { step, toAct, observation } from './game.mjs';

export const LEVELS = Object.freeze(['facil', 'normal', 'dificil']);

export function createBot(level, seed) {
  if (!LEVELS.includes(level)) throw new Error('chinchon createBot: level is one of ' + LEVELS.join(', '));
  if (seed === undefined || seed === null) throw new Error('chinchon createBot: a seed is required');
  const rng = createRng(seed);
  const choose = obs => {
    const L = obs.legal;
    if (!L || !L.length) throw new Error('chinchon bot: nothing to do');
    const a = level === 'facil' ? easy(obs, rng) : smart(obs, rng, level === 'dificil');
    return (a && L.find(x => x.type === a.type && (x.card || x.from) === (a.card || a.from))) || L[0];
  };
  return { level, choose };
}

const pts = (r, hand) => bestSplit(r, hand).points;
const without = (hand, c) => { const i = hand.indexOf(c); return hand.slice(0, i).concat(hand.slice(i + 1)); };
// Best seven of eight: the discard that leaves the fewest points.
function bestDiscard(r, hand8) {
  let best = null;
  for (const c of new Set(hand8)) { const p = pts(r, without(hand8, c)); if (!best || p < best.p || (p === best.p && cardValue(r, c) > cardValue(r, best.c))) best = { c, p }; }
  return best;
}

function easy(obs, rng) {
  const r = obs.rules, h = obs.hand, L = obs.legal;
  if (h.phase === 'draw') {
    const top = h.pozo[h.pozo.length - 1];
    if (top && bestDiscard(r, [...h.mine, top]).p < pts(r, h.mine)) return { type: 'draw', from: 'pozo' };
    return { type: 'draw', from: 'mazo' };
  }
  const cut = L.find(a => a.type === 'cut');
  if (cut) return cut;
  const s = bestSplit(r, h.mine), loose = s.left.length ? s.left : h.mine;
  const hi = Math.max(...loose.map(c => cardValue(r, c)));
  const cands = loose.filter(c => cardValue(r, c) === hi);
  return { type: 'discard', card: cands[rng.int(cands.length)] };
}

// How close a loose card is to a meld with the rest of the hand (a pair of one number, or two suited cards one or two apart).
function potential(r, hand, c) {
  if (isJoker(c)) return 10;
  let p = 0;
  for (const x of hand) {
    if (x === c || isJoker(x)) continue;
    if (numOf(x) === numOf(c)) p += 2;
    else if (suitOf(x) === suitOf(c)) { const d = Math.abs(rankOf(r, x) - rankOf(r, c)); if (d === 1) p += 2; else if (d === 2) p += 1; }
  }
  return p;
}

function unseenCards(obs) {
  const h = obs.hand, seen = new Set([...h.mine, ...h.pozo]);
  for (const e of h.log) if (e.type === 'draw' && e.from === 'pozo') seen.add(e.card);
  return deckOf(obs.rules).filter(c => !seen.has(c));
}

// Cards the next player showed interest in (taken from the pozo this hand).
function nextWants(obs) {
  const n = obs.players;
  let nx = (obs.seat + 1) % n;
  while (obs.out[nx]) nx = (nx + 1) % n;
  return obs.hand.log.filter(e => e.seat === nx && e.type === 'draw' && e.from === 'pozo').map(e => e.card);
}

function smart(obs, rng, deep) {
  const r = obs.rules, h = obs.hand, L = obs.legal;
  if (h.phase === 'draw') {
    const top = h.pozo[h.pozo.length - 1];
    if (!top || !L.some(a => a.from === 'pozo')) return { type: 'draw', from: 'mazo' };
    const withTop = bestDiscard(r, [...h.mine, top]).p;
    const unseen = unseenCards(obs);
    let avg = 0;
    for (const u of unseen) avg += bestDiscard(r, [...h.mine, u]).p;
    avg /= unseen.length || 1;
    return withTop < avg - (deep ? 0.5 : 0) ? { type: 'draw', from: 'pozo' } : { type: 'draw', from: 'mazo' };
  }
  const cuts = L.filter(a => a.type === 'cut');
  if (cuts.length) {
    let best = null;
    for (const a of cuts) { const c = canCut(r, without(h.mine, a.card)); const v = c.points === 0 ? -100 : c.points; if (!best || v < best.v) best = { a, v, p: c.points }; }
    if (!deep || best.p === 0 || best.p <= 1 || h.stock < 6 || nearOut(obs)) return best.a;
    if (allMeldedChance(obs, best.a.card) < 0.25) return best.a;
  }
  const hand = h.mine, wants = deep ? nextWants(obs) : [];
  const unseen = unseenCards(obs);
  const look = deep ? unseen : sampleOf(unseen, 8, rng);
  let best = null;
  for (const c of new Set(hand)) {
    const rest = without(hand, c);
    let v = pts(r, rest);
    if (look.length) {
      let s = 0;
      for (const u of look) s += bestDiscard(r, [...rest, u]).p;
      v = 0.5 * v + 0.5 * (s / look.length);
    }
    if (deep) {
      if (wants.some(w => !isJoker(w) && !isJoker(c) && (numOf(w) === numOf(c) || (suitOf(w) === suitOf(c) && Math.abs(rankOf(r, w) - rankOf(r, c)) <= 1)))) v += 3;
    }
    if (isJoker(c)) v += 50;
    const tie = -potential(r, rest, c) * 0.01 - cardValue(r, c) * 0.001;
    if (!best || v + tie < best.v) best = { c, v: v + tie };
  }
  return { type: 'discard', card: best.c };
}

function sampleOf(arr, k, rng) {
  const a = arr.slice(), out = [];
  for (let i = 0; i < k && a.length; i++) out.push(a.splice(rng.int(a.length), 1)[0]);
  return out;
}

const nearOut = obs => obs.scores.some((x, i) => i !== obs.seat && !obs.out[i] && x >= obs.limit - 15);
function allMeldedChance(obs, cutCard) {
  const r = obs.rules, rest = without(obs.hand.mine, cutCard), unseen = unseenCards(obs);
  let k = 0;
  for (const u of unseen) if (bestDiscard(r, [...rest, u]).p === 0) k++;
  return k / (unseen.length || 1);
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
