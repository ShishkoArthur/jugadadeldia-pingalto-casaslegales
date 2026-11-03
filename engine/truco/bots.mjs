// Computer opponents for truco 1 vs 1 (2 vs 2 observations go to bots4.mjs with the same levels). A bot sees only observation(state, seat) (engine/truco/game.mjs): its own cards, the
// table, what was sung and shown. It always returns one of obs.legal, so it can never make an illegal move.
// Levels:
//   facil    legal moves at random with simple rules of thumb (sings envido with good points, accepts by coin and hand).
//   normal   envido by the exact chance of winning it given its cards and what it has seen; truco calls and answers by the
//            chance of winning the bazas (exact enumeration of the opponent's possible hands, both sides playing with open
//            cards); plays the lowest card that wins, and leads with the card that keeps the best chance.
//   dificil  like normal for envido, plus Monte Carlo over the unknown cards (determinization from the exact remaining deck,
//            only hands consistent with what was shown) to value truco calls and answers, and bluffs at a set frequency.
// Every bot is deterministic for a given seed and the same sequence of observations.
import { createRng } from '../cards/rng.mjs';
import { DECK_40, combinations } from '../cards/spanish.mjs';
import { POWER, envidoPoints, florPoints, hasFlor } from './cards.mjs';
import { step, toAct, observation } from './game.mjs';
import { envidoNoQuieroValue, faltaValue, TRUCO_CALLS } from './rules.mjs';
import { solveBazas } from './probability.mjs';
import { choose4 } from './bots4.mjs';

export const LEVELS = Object.freeze(['facil', 'normal', 'dificil']);
const DEFAULTS = Object.freeze({
  facil: { bluff: 0 },
  normal: { bluff: 0 },
  dificil: { bluff: 0.1, samples: 400 },
});

export function createBot(level, seed) {
  if (!LEVELS.includes(level)) throw new Error('createBot: level is one of ' + LEVELS.join(', '));
  if (seed === undefined || seed === null) throw new Error('createBot: a seed is required');
  const rng = createRng(seed), cfg = DEFAULTS[level];
  const choose = obs => {
    const L = obs.legal;
    if (!L || !L.length) throw new Error('bot: nothing to do for seat ' + obs.seat);
    if (L.length === 1) return L[0];
    const a = obs.rules.players === 4 ? choose4(obs, rng, level) : level === 'facil' ? easy(obs, rng) : level === 'normal' ? normal(obs, rng, cfg) : hard(obs, rng, cfg);
    return (a && L.find(x => x.type === a.type && x.card === a.card)) || L[0];
  };
  return { level, choose, act: state => choose(observation(state, toAct(state))) };
}

// ---------- knowledge from an observation ----------

const other = s => 1 - s;
export function oppHandsConsistent(obs) {
  const me = obs.seat, o = other(me), h = obs.hand, my = h.hands[me];
  const played = obs.oppPlayed;
  const unseen = DECK_40.filter(c => !my.includes(c) && !played.includes(c));
  const oppActed = obs.actions.some(a => a.seat === o);
  const er = h.envido.result, fr = h.flor.result;
  const myEnv = envidoPoints(my);
  const ok = full => {
    if (obs.rules.flor) {
      if (h.flor.sung[o] && !hasFlor(full)) return false;
      if (!h.flor.sung[o] && oppActed && hasFlor(full)) return false;
    }
    if (er && er.accepted && er.points) {
      if (er.points[o] !== null && er.points[o] !== undefined) { if (envFast(full) !== er.points[o]) return false; }
      else if (envFast(full) > myEnv) return false;
    }
    if (fr && fr.points && fr.points[o] !== null && hasFlor(full) && florPoints(full) !== fr.points[o]) return false;
    return true;
  };
  const out = [];
  combinations(unseen, 3 - played.length, pick => { const full = [...played, ...pick]; if (ok(full)) out.push(full); });
  if (out.length) return out;
  combinations(unseen, 3 - played.length, pick => out.push([...played, ...pick]));
  return out;
}

// Exact chance that my envido beats the opponent's, over the consistent hands (ties to the mano).
function pEnvido(obs, opps) {
  const me = obs.seat, mine = envidoPoints(obs.hand.hands[me]), mano = obs.hand.mano === me;
  let w = 0;
  for (const h of opps) { const e = envFast(h); if (e < mine || (e === mine && mano)) w++; }
  return w / opps.length;
}
function pFlor(obs, opps) {
  const me = obs.seat, mine = florPoints(obs.hand.hands[me]), mano = obs.hand.mano === me;
  let w = 0, n = 0;
  for (const h of opps) { if (!hasFlor(h)) continue; n++; const e = florPoints(h); if (e < mine || (e === mine && mano)) w++; }
  return n ? w / n : 1;
}

// A multiset of up to three powers as one number: base-4 digit per power level.
const POW_KEY = Object.freeze(Array.from({ length: 15 }, (_, p) => (p ? 4 ** (p - 1) : 0)));
const IDX = Object.fromEntries(DECK_40.map((c, i) => [c, i]));
const ENV_CACHE = new Int8Array(64000).fill(-1);
function envFast(h) {
  const k = IDX[h[0]] * 1600 + IDX[h[1]] * 40 + IDX[h[2]];
  let v = ENV_CACHE[k];
  if (v < 0) v = ENV_CACHE[k] = envidoPoints(h);
  return v;
}

// Position of the bazas from one seat's view, for solveBazas.
function position(obs) {
  const h = obs.hand, R = [], bz = h.bazas;
  for (const b of bz) if (b.winner !== null) R.push(b.winner);
  const cur = bz[bz.length - 1];
  return { R, lead: cur.lead, table: cur.cards.map(c => (c ? POWER[c] : null)), mano: h.mano };
}

const GROUPS = new WeakMap();
function groupsOf(obs, opps) {
  let g = GROUPS.get(opps);
  if (g) return g;
  const played = new Set(obs.oppPlayed), m = new Map();
  for (const hand of opps) {
    let k = 0;
    for (const c of hand) if (!played.has(c)) k += POW_KEY[POWER[c]];
    m.set(k, (m.get(k) || 0) + 1);
  }
  g = [...m].map(([k, cnt]) => {
    const left = [];
    for (let p = 1, x = k; p <= 14; p++, x = Math.floor(x / 4)) for (let r = x % 4; r > 0; r--) left.push(p);
    return [left, cnt];
  });
  GROUPS.set(opps, g);
  return g;
}

// Chance to win the bazas (open-card play by both) after an optional card of mine, over the consistent opponent hands.
// Hands with the same powers are solved once.
function pBazas(obs, opps, myCard) {
  const me = obs.seat, o = other(me), h = obs.hand, pos = position(obs);
  let myLeft = h.left[me].map(c => POWER[c]);
  let { R, lead, table } = pos;
  if (myCard) {
    myLeft = h.left[me].filter(c => c !== myCard).map(c => POWER[c]);
    table = table.slice(); table[me] = POWER[myCard];
    if (table[0] !== null && table[1] !== null) {
      const bw = table[0] === table[1] ? -1 : table[0] > table[1] ? 0 : 1;
      R = [...R, bw]; lead = bw === -1 ? pos.mano : bw; table = [null, null];
    }
  }
  let w = 0, n = 0;
  for (const [oppLeft, cnt] of groupsOf(obs, opps)) {
    const left = []; left[me] = myLeft; left[o] = oppLeft;
    if (solveBazas(left, R, lead, table, pos.mano) === me) w += cnt;
    n += cnt;
  }
  return n ? w / n : 0;
}

// Chance of one card beating a random other card (used by the opponent model).
const WIN_RATE = Object.fromEntries(DECK_40.map(c => [c, DECK_40.filter(x => x !== c && POWER[x] < POWER[c]).length / 39]));
const has = (L, t) => L.find(a => a.type === t);
const accepts = (p, accV, rejV) => p * accV - (1 - p) * accV >= -rejV;

function envidoGain(obs, chain, winnerSeat) {
  if (chain.includes('faltaEnvido')) return faltaValue(obs.rules, obs.score, winnerSeat);
  return chain.reduce((t, k) => t + (k === 'envido' ? 2 : 3), 0);
}

// ---------- facil ----------

function easy(obs, rng) {
  const L = obs.legal, h = obs.hand, me = obs.seat, my = h.hands[me];
  const pick = arr => arr[rng.int(arr.length)];
  if (h.flor.pending === me) return rng.float() < 0.5 ? (has(L, 'conFlorMeAchico') || has(L, 'quiero')) : pick(L);
  const e = envidoPoints(my);
  if (h.envido.pending === me) {
    if (e >= 31 && rng.float() < 0.3 && has(L, 'realEnvido')) return has(L, 'realEnvido');
    return e >= 27 || rng.float() < 0.25 ? has(L, 'quiero') : has(L, 'noQuiero');
  }
  const top = Math.max(...my.map(c => POWER[c]));
  if (h.truco.pending && toActIsMe(obs)) {
    if (has(L, 'envido') && e >= 28 && rng.float() < 0.5) return has(L, 'envido');
    return rng.float() < 0.45 + (top >= 11 ? 0.3 : 0) ? has(L, 'quiero') : has(L, 'noQuiero');
  }
  if (has(L, 'envido') && e >= 28 && rng.float() < 0.6) return has(L, 'envido');
  const call = L.find(a => a.type === 'truco' || a.type === 'retruco' || a.type === 'valeCuatro');
  if (call && rng.float() < 0.08) return call;
  return pick(L.filter(a => a.type === 'play'));
}
const toActIsMe = obs => obs.toAct === obs.seat;

// ---------- normal ----------

function normal(obs, rng, cfg) {
  const L = obs.legal, h = obs.hand, me = obs.seat;
  const opps = oppHandsConsistent(obs);
  if (h.flor.pending === me) return florAnswer(obs, L, pFlor(obs, opps));
  if (h.envido.pending === me) return envidoAnswer(obs, L, pEnvido(obs, opps), rng, cfg);
  if (has(L, 'envido')) {
    const call = envidoCall(obs, L, pEnvido(obs, opps), rng, cfg);
    if (call) return call;
  }
  if (h.truco.pending) {
    const q = pBazas(obs, opps, null), to = h.truco.pending.to, cur = h.truco.level;
    const raise = to < 4 && has(L, TRUCO_CALLS[to + 1]);
    if (raise && q >= 0.8) return raise;
    return accepts(q, to, cur) ? has(L, 'quiero') : has(L, 'noQuiero');
  }
  const call = L.find(a => a.type === 'truco' || a.type === 'retruco' || a.type === 'valeCuatro');
  if (call && pBazas(obs, opps, null) >= 0.72) return call;
  return chooseCard(obs, opps);
}

function florAnswer(obs, L, p) {
  if (obs.hand.flor.bet === null) {
    if (p >= 0.85 && has(L, 'contraflorResto')) return has(L, 'contraflorResto');
    if (p >= 0.55) return has(L, 'contraflor');
    return has(L, 'conFlorMeAchico');
  }
  if (obs.hand.flor.bet === 'contraflor' && p >= 0.85 && has(L, 'contraflorResto')) return has(L, 'contraflorResto');
  if (obs.hand.flor.bet === 'contraflor') return accepts(p, 6, 4) ? has(L, 'quiero') : has(L, 'noQuiero');
  return p >= 0.5 ? has(L, 'quiero') : has(L, 'noQuiero');
}

function envidoAnswer(obs, L, p, rng, cfg) {
  const chain = obs.hand.envido.chain, me = obs.seat;
  const rejV = envidoNoQuieroValue(chain);
  const gain = envidoGain(obs, chain, me), loss = envidoGain(obs, chain, other(me));
  if (p >= 0.93 && has(L, 'faltaEnvido') && obs.score[other(me)] >= obs.score[me]) return has(L, 'faltaEnvido');
  if (p >= 0.8 && has(L, 'realEnvido')) return has(L, 'realEnvido');
  if (p >= 0.88 && has(L, 'envido')) return has(L, 'envido');
  const yes = p * gain - (1 - p) * loss >= -rejV;
  if (!yes && cfg.bluff && rng.float() < cfg.bluff / 2 && has(L, 'realEnvido')) return has(L, 'realEnvido');
  return yes ? has(L, 'quiero') : has(L, 'noQuiero');
}

function envidoCall(obs, L, p, rng, cfg) {
  const me = obs.seat, behind = obs.score[other(me)] - obs.score[me];
  if (p >= 0.9 && behind >= obs.rules.target / 3 && has(L, 'faltaEnvido')) return has(L, 'faltaEnvido');
  if (p >= 0.8) return has(L, 'realEnvido');
  if (p >= 0.6) return has(L, 'envido');
  if (cfg.bluff && rng.float() < cfg.bluff) return has(L, 'envido');
  return null;
}

function chooseCard(obs, opps) {
  const me = obs.seat, h = obs.hand, cur = h.bazas[h.bazas.length - 1], oppCard = cur.cards[other(me)];
  const mine = h.left[me].slice().sort((a, b) => POWER[a] - POWER[b]);
  const playOf = c => ({ type: 'play', card: c });
  if (oppCard) {
    const beat = mine.find(c => POWER[c] > POWER[oppCard]);
    const tie = mine.find(c => POWER[c] === POWER[oppCard]);
    const firstWon = h.bazas.length > 1 && h.bazas[0].winner === me;
    if (tie && firstWon) return playOf(tie);
    if (beat) return playOf(beat);
    return playOf(mine[0]);
  }
  let best = mine[0], bp = -1;
  for (const c of mine) { const p = pBazas(obs, opps, c); if (p > bp + 1e-9) { bp = p; best = c; } }
  return playOf(best);
}

// ---------- dificil ----------

// How likely each consistent opponent hand is, given what the opponent did (sang envido or kept quiet with envido open,
// called or accepted truco). A soft model of a sensible player; it only reweights, never excludes a hand.
const ENV_P = (() => {
  const t = new Array(34).fill(0);
  let total = 0;
  combinations(DECK_40, 3, x => { total++; t[envidoPoints(x)]++; });
  const out = []; let acc = 0;
  for (let e = 0; e <= 33; e++) { out[e] = (acc + t[e] / 2) / total; acc += t[e]; }
  return out;
})();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const strength = hand => quickFromRates(hand.map(c => WIN_RATE[c]).sort((a, b) => b - a));
const quickFromRates = ([a, b, c]) => a * b + a * c + b * c - 2 * a * b * c;

export function oppWeights(obs, opps) {
  const o = other(obs.seat), acts = obs.actions;
  let envCalls = 0, quietWithEnvido = false, trucoCalls = 0, trucoAccepts = 0, sung = false, trucoAccepted = false;
  for (let i = 0; i < acts.length; i++) {
    const a = acts[i], prev = acts[i - 1];
    if (['envido', 'realEnvido', 'faltaEnvido', 'flor'].includes(a.type)) sung = true;
    if (a.seat !== o) { if (a.type === 'quiero' && prev && TRUCO_TYPES.has(prev.type)) trucoAccepted = true; continue; }
    if (['envido', 'realEnvido', 'faltaEnvido'].includes(a.type)) envCalls++;
    else if (TRUCO_TYPES.has(a.type)) trucoCalls++;
    else if (a.type === 'quiero' && prev && TRUCO_TYPES.has(prev.type)) { trucoAccepts++; trucoAccepted = true; }
    else if (a.type === 'play' && !sung && !trucoAccepted && !acts.slice(0, i).some(x => x.seat === o && x.type === 'play')) quietWithEnvido = true;
  }
  return opps.map(hand => {
    const pe = ENV_P[envFast(hand)], st = strength(hand);
    let w = 1;
    for (let k = 0; k < envCalls; k++) w *= clamp(2.5 * (pe - 0.35), 0.1, 1);
    if (quietWithEnvido) w *= clamp(1 - 2 * (pe - 0.55), 0.3, 1);
    for (let k = 0; k < trucoCalls; k++) w *= clamp(1.6 * st - 0.4, 0.08, 1);
    for (let k = 0; k < trucoAccepts; k++) w *= clamp(1.4 * st - 0.1, 0.15, 1);
    return w;
  });
}
const TRUCO_TYPES = new Set(['truco', 'retruco', 'valeCuatro']);

function weightedSample(opps, weights, k, rng) {
  const cum = []; let acc = 0;
  for (const w of weights) { acc += w; cum.push(acc); }
  const out = [];
  for (let i = 0; i < k; i++) {
    const x = rng.float() * acc;
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] > x) hi = m; else lo = m + 1; }
    out.push(opps[lo]);
  }
  return out;
}

function hard(obs, rng, cfg) {
  const L = obs.legal, h = obs.hand, me = obs.seat, o = other(me), target = obs.rules.target;
  const all = oppHandsConsistent(obs);
  const opps = weightedSample(all, oppWeights(obs, all), cfg.samples, rng);
  if (h.flor.pending === me) return florAnswer(obs, L, pFlor(obs, all));
  if (h.envido.pending === me) return envidoAnswer(obs, L, pEnvido(obs, opps), rng, cfg);
  if (has(L, 'envido')) {
    const call = envidoCall(obs, L, pEnvido(obs, opps), rng, cfg);
    if (call) return call;
  }
  const q = pBazas(obs, opps, null);
  if (h.truco.pending) {
    const to = h.truco.pending.to, cur = h.truco.level, raise = to < 4 && has(L, TRUCO_CALLS[to + 1]);
    if (raise && (q >= 0.78 || (q >= 0.4 && q < 0.6 && rng.float() < cfg.bluff))) return raise;
    if (obs.score[o] + cur >= target) return has(L, 'quiero');
    return accepts(q, to, cur) ? has(L, 'quiero') : has(L, 'noQuiero');
  }
  const call = L.find(a => TRUCO_TYPES.has(a.type));
  if (call && (q >= 0.68 || (q >= 0.3 && q < 0.6 && rng.float() < cfg.bluff))) return call;
  return chooseCard(obs, opps);
}

// Play a whole match between two bots (tests, "ver una partida" demo). Returns the final state.
export function playMatch(newState, bots, { maxActions }) {
  if (!Number.isInteger(maxActions)) throw new Error('playMatch: maxActions is required');
  const s = newState;
  let n = 0;
  while (!s.over) {
    const seat = toAct(s), a = bots[seat].choose(observation(s, seat));
    step(s, a);
    if (++n > maxActions) throw new Error('playMatch: too many actions');
  }
  return s;
}
