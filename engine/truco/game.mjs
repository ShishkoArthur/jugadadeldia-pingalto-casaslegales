// Truco argentino as a pure state machine: newMatch(rules, seed) -> state; legalActions(state, seat); apply(state, action).
// The state is plain JSON (serialize / deserialize). apply() never mutates its input. No DOM, same code in browser and Node.
//
// Seats 0..players-1, team = seat % 2 (so 2 vs 2 can reuse it later). With 2 players seat = team.
// Actions: { type: 'play', card } | 'envido' | 'realEnvido' | 'faltaEnvido' | 'truco' | 'retruco' | 'valeCuatro' | 'quiero' |
//          'noQuiero' | 'mazo' | 'flor' | 'conFlorMeAchico' | 'contraflor' | 'contraflorResto'  (all as { type }).
// Points from envido and flor are scored as soon as they are decided (a match can end in the middle of a hand); truco points
// when the hand ends. After a hand ends the next one is dealt at once; state.lastHand keeps the finished hand for the page.
import { DECK_40, shuffle, deal } from '../cards/spanish.mjs';
import { createRng, fromState } from '../cards/rng.mjs';
import { POWER, envidoPoints, florPoints, hasFlor } from './cards.mjs';
import { validateRules, envidoCanRaise, envidoQuieroValue, envidoNoQuieroValue, faltaValue, TRUCO_CALLS, FLOR_POINTS } from './rules.mjs';

export const VERSION = 1;
const PARDA = -1;
const team = seat => seat % 2;
const other = seat => 1 - seat;

export function newMatch(rules, seed) {
  const r = validateRules(rules);
  if (seed === undefined || seed === null) throw new Error('newMatch: a seed is required');
  const rng = createRng(seed);
  const firstMano = rng.int(r.players);
  const state = { v: VERSION, rules: { ...r }, seed: String(seed), rng: rng.state(), score: [0, 0], handNo: 0, over: false, winner: null, hand: null, lastHand: null, history: [] };
  dealHand(state, firstMano);
  return state;
}

function dealHand(state, mano) {
  const rng = fromState(state.rng);
  const { hands } = deal(shuffle(DECK_40, rng), state.rules.players, 3);
  state.rng = rng.state();
  state.handNo++;
  const seated = Array.from({ length: state.rules.players }, (_, i) => hands[(i - mano + state.rules.players) % state.rules.players]);
  state.hand = freshHand(state.handNo, mano, seated);
}

export function freshHand(no, mano, hands) {
  return {
    no, mano, hands: hands.map(h => h.slice()), left: hands.map(h => h.slice()),
    bazas: [{ cards: hands.map(() => null), lead: mano, winner: null }],
    turn: mano,
    envido: { chain: [], by: [], pending: null, closed: false, result: null },
    flor: { sung: hands.map(() => false), first: null, bet: null, by: null, pending: null, closed: false, result: null },
    truco: { level: 1, holder: null, pending: null },
    actions: [], ended: false, winner: null, how: null, points: [0, 0],
  };
}

// A match whose current hand has the given cards (tests, trainer situations, "quiero o no quiero" puzzles).
export function customHand(rules, seed, hands, { mano, score }) {
  const state = newMatch(rules, seed);
  const all = hands.flat();
  if (hands.length !== state.rules.players || hands.some(x => x.length !== 3) || new Set(all).size !== all.length || !all.every(c => DECK_40.includes(c)))
    throw new Error('customHand: three distinct cards per seat');
  if (![0, 1].includes(mano)) throw new Error('customHand: mano is a seat');
  if (!Array.isArray(score) || score.length !== 2 || score.some(x => !Number.isInteger(x) || x < 0 || x >= state.rules.target)) throw new Error('customHand: bad score');
  state.score = score.slice();
  state.hand = freshHand(1, mano, hands);
  return state;
}

export function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

// The seat that must act now, or null when the match is over.
export function toAct(state) {
  if (state.over) return null;
  const h = state.hand;
  if (h.ended) return null;
  if (h.flor.pending !== null) return h.flor.pending;
  if (h.envido.pending !== null) return h.envido.pending;
  if (h.truco.pending) return other(h.truco.pending.by);
  return h.turn;
}

const noCardYet = (h, seat) => h.bazas.length === 1 && h.bazas[0].cards[seat] === null;
const mustSingFlor = (state, h, seat) => state.rules.flor && !h.flor.sung[seat] && hasFlor(h.hands[seat]) && noCardYet(h, seat) && h.flor.pending !== seat;
const anyFlorSung = h => h.flor.sung.some(Boolean);

function envidoOpen(state, h, seat) {
  return !h.envido.closed && h.envido.chain.length === 0 && h.truco.level === 1 && noCardYet(h, seat) && !anyFlorSung(h);
}

export function legalActions(state, seat) {
  if (state.over || seat !== toAct(state)) return [];
  const h = state.hand;
  const A = t => ({ type: t });
  if (h.flor.pending === seat) {
    if (h.flor.bet === null) return [A('conFlorMeAchico'), A('contraflor'), A('contraflorResto')];
    if (h.flor.bet === 'contraflor') return [A('quiero'), A('noQuiero'), A('contraflorResto')];
    return [A('quiero'), A('noQuiero')];
  }
  if (mustSingFlor(state, h, seat)) return [A('flor')];
  if (h.envido.pending === seat) {
    return [A('quiero'), A('noQuiero'), ...['envido', 'realEnvido', 'faltaEnvido'].filter(k => envidoCanRaise(h.envido.chain, k)).map(A)];
  }
  if (h.truco.pending) {
    const out = [A('quiero'), A('noQuiero')];
    if (h.truco.pending.to < 4) out.push(A(TRUCO_CALLS[h.truco.pending.to + 1]));
    if (envidoOpen(state, h, seat)) out.push(A('envido'), A('realEnvido'), A('faltaEnvido'));
    return out;
  }
  const out = h.left[seat].map(card => ({ type: 'play', card }));
  if (envidoOpen(state, h, seat)) out.push(A('envido'), A('realEnvido'), A('faltaEnvido'));
  if (h.truco.level < 4 && (h.truco.holder === null || h.truco.holder === team(seat))) out.push(A(TRUCO_CALLS[h.truco.level + 1]));
  out.push(A('mazo'));
  return out;
}

const keyOf = a => (a.type === 'play' ? 'play:' + a.card : a.type);
export const actionKey = keyOf;

export function isLegal(state, action) {
  const seat = toAct(state);
  if (seat === null || !action || typeof action.type !== 'string') return false;
  const k = keyOf(action);
  return legalActions(state, seat).some(a => keyOf(a) === k);
}

// Pure transition. Throws on an illegal action.
export function apply(state, action) {
  const s = clone(state);
  step(s, action, { deal: true });
  return s;
}

// In-place transition (for simulations on a private copy). opts.deal = false stops at the end of the hand (no new deal).
export function step(state, action, opts = { deal: true }) {
  if (!isLegal(state, action)) throw new Error('illegal action ' + JSON.stringify(action) + ' for seat ' + toAct(state));
  const seat = toAct(state), h = state.hand;
  h.actions.push({ seat, type: action.type, ...(action.card ? { card: action.card } : {}) });
  const t = action.type;
  if (t === 'play') playCard(state, seat, action.card);
  else if (t === 'flor') singFlor(state, seat);
  else if (t === 'conFlorMeAchico') { h.flor.sung[seat] = true; closeFlor(state, h.flor.first, FLOR_POINTS.achico, 'achico'); }
  else if (t === 'contraflor' || t === 'contraflorResto') {
    h.flor.sung[seat] = true; h.flor.bet = t === 'contraflor' ? 'contraflor' : 'resto'; h.flor.by = seat; h.flor.pending = other(seat);
  } else if (t === 'envido' || t === 'realEnvido' || t === 'faltaEnvido') {
    h.envido.chain.push(t); h.envido.by.push(seat); h.envido.pending = other(seat);
  } else if (t === 'truco' || t === 'retruco' || t === 'valeCuatro') {
    if (h.truco.pending) h.truco.level = h.truco.pending.to;
    h.truco.pending = { to: h.truco.level + 1, by: seat };
    h.truco.holder = null;
  } else if (t === 'quiero' || t === 'noQuiero') answer(state, seat, t === 'quiero');
  else if (t === 'mazo') mazo(state, seat);
  if (h.ended && !state.over && opts.deal) dealHand(state, other(h.mano));
}

function answer(state, seat, yes) {
  const h = state.hand;
  if (h.flor.pending === seat) {
    if (yes) {
      const w = florWinner(h);
      closeFlor(state, w, h.flor.bet === 'contraflor' ? FLOR_POINTS.contraflor : state.rules.target - state.score[team(w)], h.flor.bet, true);
    } else closeFlor(state, h.flor.by, FLOR_POINTS.rejected, h.flor.bet + '-no');
    return;
  }
  if (h.envido.pending === seat) {
    const e = h.envido;
    e.pending = null; e.closed = true;
    if (yes) {
      const p = h.hands.map(envidoPoints);
      const w = p[0] === p[1] ? h.mano : p[0] > p[1] ? 0 : 1;
      const value = envidoQuieroValue(state.rules, e.chain, state.score, team(w));
      e.result = { winner: w, value, points: p, shown: p.map((_, i) => i === w || i === h.mano), accepted: true };
      award(state, team(w), value, 'envido');
    } else {
      const caller = e.by[e.by.length - 1], value = envidoNoQuieroValue(e.chain);
      e.result = { winner: caller, value, points: null, shown: [false, false], accepted: false };
      award(state, team(caller), value, 'envido');
    }
    return;
  }
  const tr = h.truco;
  if (yes) { tr.level = tr.pending.to; tr.holder = team(seat); tr.pending = null; }
  else { const by = tr.pending.by; tr.pending = null; endHand(state, team(by), tr.level, 'noQuiero'); }
}

function florWinner(h) {
  const p = h.hands.map(x => (hasFlor(x) ? florPoints(x) : -1));
  return p[0] === p[1] ? h.mano : p[0] > p[1] ? 0 : 1;
}

function singFlor(state, seat) {
  const h = state.hand;
  h.flor.sung[seat] = true; h.flor.first = seat;
  if (h.envido.pending !== null || h.envido.chain.length) h.envido.result = { cancelled: true };
  h.envido.pending = null; h.envido.closed = true;
  const o = other(seat);
  if (hasFlor(h.hands[o]) && !h.flor.sung[o]) h.flor.pending = o;
  else closeFlor(state, seat, FLOR_POINTS.alone, 'alone');
}

function closeFlor(state, winner, value, how, compared) {
  const h = state.hand;
  h.flor.pending = null; h.flor.closed = true;
  const p = h.hands.map(x => (hasFlor(x) ? florPoints(x) : null));
  h.flor.result = { winner, value, how, points: compared ? p : null };
  award(state, team(winner), value, 'flor');
}

function award(state, tm, pts, why) {
  if (state.over) return;
  state.score[tm] += pts;
  state.hand.points[tm] += pts;
  if (state.score[tm] >= state.rules.target) {
    state.over = true; state.winner = tm;
    finishHand(state, why + '-wins-match');
  }
}

function playCard(state, seat, card) {
  const h = state.hand, b = h.bazas[h.bazas.length - 1];
  h.left[seat] = h.left[seat].filter(c => c !== card);
  b.cards[seat] = card;
  if (b.cards.some(c => c === null)) { h.turn = other(seat); return; }
  const p0 = POWER[b.cards[0]], p1 = POWER[b.cards[1]];
  b.winner = p0 === p1 ? PARDA : p0 > p1 ? 0 : 1;
  const w = handWinner(h.bazas.map(x => x.winner), team(h.mano));
  if (w !== null) { endHand(state, w, h.truco.level, 'bazas'); return; }
  const lead = b.winner === PARDA ? h.mano : b.winner;
  h.bazas.push({ cards: h.hands.map(() => null), lead, winner: null });
  h.turn = lead;
}

// Winner of the bazas, or null if not decided yet. Results are team numbers or -1 (parda).
// Parda rules: first parda -> the next baza decides; all three parda -> the mano; one each and a parda -> the side that won first.
export function handWinner(R, manoTeam) {
  if (R.length < 2) return null;
  const [a, b, c] = R;
  if (a === PARDA) {
    if (b !== PARDA) return b;
    if (R.length < 3) return null;
    return c !== PARDA ? c : manoTeam;
  }
  if (b === a || b === PARDA) return a;
  if (R.length < 3) return null;
  return c === PARDA ? a : c;
}

function mazo(state, seat) {
  const h = state.hand, o = other(seat);
  let pts = h.truco.level;
  const nothingSung = h.envido.chain.length === 0 && !anyFlorSung(h) && h.truco.level === 1 && !h.truco.pending;
  if (state.rules.flor && hasFlor(h.hands[o]) && !h.flor.sung[o]) {
    h.flor.sung[o] = true; h.flor.first = o; h.flor.closed = true;
    h.flor.result = { winner: o, value: FLOR_POINTS.alone, how: 'alone', points: null };
    award(state, team(o), FLOR_POINTS.alone, 'flor');
    if (state.over) return;
  } else if (nothingSung && noCardYet(h, seat)) pts = Math.max(pts, state.rules.mazoNoCardPoints);
  endHand(state, team(o), pts, 'mazo');
}

function endHand(state, winnerTeam, pts, how) {
  const h = state.hand;
  h.winner = winnerTeam; h.how = how;
  award(state, winnerTeam, pts, 'truco');
  if (!state.over) finishHand(state, how);
}

function finishHand(state, how) {
  const h = state.hand;
  if (h.ended) return;
  h.ended = true;
  if (h.how === null) h.how = how;
  state.history.push({ no: h.no, mano: h.mano, points: h.points.slice(), score: state.score.slice(), how: h.how });
  state.lastHand = h;
}

// What one seat may know: the opponent's unplayed cards and the future deck are hidden.
export function observation(state, seat) {
  const h = state.hand, o = other(seat);
  const hidden = {
    ...h,
    hands: h.hands.map((x, i) => (i === seat ? x.slice() : null)),
    left: h.left.map((x, i) => (i === seat ? x.slice() : x.length)),
    envido: { ...h.envido, result: h.envido.result && h.envido.result.points ? { ...h.envido.result, points: h.envido.result.points.map((p, i) => (h.envido.result.shown[i] || i === seat ? p : null)) } : h.envido.result },
  };
  delete hidden.actions;
  return {
    seat, rules: state.rules, score: state.score.slice(), handNo: state.handNo, over: state.over, winner: state.winner,
    toAct: toAct(state), legal: legalActions(state, seat), hand: JSON.parse(JSON.stringify(hidden)),
    actions: h.actions.map(a => ({ ...a })), oppPlayed: h.bazas.map(b => b.cards[o]).filter(Boolean),
  };
}

// A full state for simulation, built from an observation and a guess of the opponent's three dealt cards.
export function rebuild(obs, oppHand) {
  const seat = obs.seat, o = other(seat), h = JSON.parse(JSON.stringify(obs.hand));
  for (const c of obs.oppPlayed) if (!oppHand.includes(c)) throw new Error('rebuild: guess misses a played card ' + c);
  h.hands[o] = oppHand.slice();
  h.left[o] = oppHand.filter(c => !obs.oppPlayed.includes(c));
  if (h.envido.result && h.envido.result.points) h.envido.result.points = h.hands.map(envidoPoints);
  h.actions = obs.actions.map(a => ({ ...a }));
  return { v: VERSION, rules: obs.rules, seed: 'sim', rng: [1, 2, 3, 4], score: obs.score.slice(), handNo: obs.handNo, over: obs.over, winner: obs.winner, hand: h, lastHand: null, history: [] };
}

export function serialize(state) {
  return JSON.stringify(state);
}
export function deserialize(json) {
  const s = JSON.parse(json);
  if (!s || s.v !== VERSION) throw new Error('deserialize: unknown truco state version');
  validateRules(s.rules);
  fromState(s.rng);
  return s;
}
