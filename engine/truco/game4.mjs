// Truco argentino 2 vs 2 (players: 4) as a pure state machine. Same action set and JSON state style as game.mjs (1 vs 1),
// which dispatches here when rules.players is 4, so pages and bots call newMatch / legalActions / apply / observation as usual.
// Sources and quotes: data/sources/truco/rules.json (keys "4p-*").
//
// Seats 0..3 in playing order (counter-clockwise at the table), partners face each other: team = seat % 2.
// The mano is the first to play; the next hand's mano is the next seat. The pie of a team is its last player in the hand.
// - Bazas: the highest card wins; equal highest cards of the same team win for that team, of both teams make a parda.
//   The winner of a baza leads the next one; after a parda the mano leads (the next seat still in the hand if he left).
// - Envido: each player may sing before playing his first card while no truco was accepted; answers and raises come from
//   the other team (rules.responder: its pie, or its next player after the caller). Querido: from the mano on, a player
//   shows his points only when they beat the best shown by the other team ("son buenas" otherwise); ties go to the one
//   nearer the mano. The team of the best player scores.
// - Truco: as 1 vs 1; the answer comes from the other team (rules.responder). Raises only by the team that said quiero.
// - Mazo: a player leaves the hand alone and his partner plays on; when both partners left, the other team scores the truco
//   value (rules.mazoNoCardPoints when the team left before playing any card and nothing was sung).
// - Senas: signals to the partner from the cited list. They are out of turn (signal(), not apply()), only true ones are
//   allowed (the engine knows the cards), and only the partner sees them in observation(). Bots never signal.
import { DECK_40, shuffle, deal } from '../cards/spanish.mjs';
import { createRng, fromState } from '../cards/rng.mjs';
import { POWER, envidoPoints } from './cards.mjs';
import { validateRules, envidoCanRaise, envidoQuieroValue, envidoNoQuieroValue, TRUCO_CALLS, handWinner } from './rules.mjs';

const N = 4;
const PARDA = -1;
const team = seat => seat % 2;
const partner = seat => (seat + 2) % N;
const posOf = (h, seat) => (seat - h.mano + N) % N;
const ENVIDO = ['envido', 'realEnvido', 'faltaEnvido'];

export function newMatch4(rules, seed) {
  const r = validateRules(rules);
  if (r.players !== 4) throw new Error('newMatch4: players must be 4');
  if (seed === undefined || seed === null) throw new Error('newMatch: a seed is required');
  const rng = createRng(seed);
  const firstMano = rng.int(N);
  const state = { v: 1, rules: { ...r }, seed: String(seed), rng: rng.state(), score: [0, 0], handNo: 0, over: false, winner: null, hand: null, lastHand: null, history: [] };
  dealHand(state, firstMano);
  return state;
}

function dealHand(state, mano) {
  const rng = fromState(state.rng);
  const { hands } = deal(shuffle(DECK_40, rng), N, 3);
  state.rng = rng.state();
  state.handNo++;
  state.hand = freshHand4(state.handNo, mano, Array.from({ length: N }, (_, i) => hands[(i - mano + N) % N]));
}

export function freshHand4(no, mano, hands) {
  return {
    no, mano, hands: hands.map(h => h.slice()), left: hands.map(h => h.slice()), folded: [false, false, false, false],
    bazas: [{ cards: [null, null, null, null], lead: mano, winner: null, by: null }],
    turn: mano,
    envido: { chain: [], by: [], pending: null, closed: false, result: null },
    truco: { level: 1, holder: null, pending: null },
    senas: [], actions: [], ended: false, winner: null, how: null, points: [0, 0],
  };
}

export function customHand4(rules, seed, hands, { mano, score }) {
  const state = newMatch4(rules, seed);
  const all = hands.flat();
  if (hands.length !== N || hands.some(x => x.length !== 3) || new Set(all).size !== all.length || !all.every(c => DECK_40.includes(c)))
    throw new Error('customHand: three distinct cards per seat');
  if (![0, 1, 2, 3].includes(mano)) throw new Error('customHand: mano is a seat');
  if (!Array.isArray(score) || score.length !== 2 || score.some(x => !Number.isInteger(x) || x < 0 || x >= state.rules.target)) throw new Error('customHand: bad score');
  state.score = score.slice();
  state.hand = freshHand4(1, mano, hands);
  return state;
}

// The pie of a team (its later seat in this hand), or the partner if the pie left the hand.
export function pieOf(h, tm) {
  const seats = [tm, tm + 2].filter(s => !h.folded[s]).sort((a, b) => posOf(h, b) - posOf(h, a));
  return seats.length ? seats[0] : null;
}

function responderFor(state, h, caller) {
  const tm = 1 - team(caller);
  if (state.rules.responder === 'pie') return pieOf(h, tm);
  for (let k = 1; k < N; k++) { const s = (caller + k) % N; if (team(s) === tm && !h.folded[s]) return s; }
  return null;
}

export function toAct4(state) {
  if (state.over) return null;
  const h = state.hand;
  if (h.ended) return null;
  if (h.envido.pending !== null) return h.envido.pending;
  if (h.truco.pending) return h.truco.pending.responder;
  return h.turn;
}

function envidoOpen(h, seat) {
  return !h.envido.closed && h.envido.chain.length === 0 && h.truco.level === 1 && !h.folded[seat] && h.bazas.length === 1 && h.bazas[0].cards[seat] === null;
}

export function legalActions4(state, seat) {
  if (state.over || seat !== toAct4(state)) return [];
  const h = state.hand, A = t => ({ type: t });
  if (h.envido.pending === seat) return [A('quiero'), A('noQuiero'), ...ENVIDO.filter(k => envidoCanRaise(h.envido.chain, k)).map(A)];
  if (h.truco.pending) {
    const out = [A('quiero'), A('noQuiero')];
    if (h.truco.pending.to < 4) out.push(A(TRUCO_CALLS[h.truco.pending.to + 1]));
    if (envidoOpen(h, seat)) out.push(...ENVIDO.map(A));
    return out;
  }
  const out = h.left[seat].map(card => ({ type: 'play', card }));
  if (envidoOpen(h, seat)) out.push(...ENVIDO.map(A));
  if (h.truco.level < 4 && (h.truco.holder === null || h.truco.holder === team(seat))) out.push(A(TRUCO_CALLS[h.truco.level + 1]));
  out.push(A('mazo'));
  return out;
}

const keyOf = a => (a.type === 'play' ? 'play:' + a.card : a.type);
function isLegal4(state, action) {
  const seat = toAct4(state);
  if (seat === null || !action || typeof action.type !== 'string') return false;
  const k = keyOf(action);
  return legalActions4(state, seat).some(a => keyOf(a) === k);
}

export function step4(state, action, opts = { deal: true }) {
  if (!isLegal4(state, action)) throw new Error('illegal action ' + JSON.stringify(action) + ' for seat ' + toAct4(state));
  const seat = toAct4(state), h = state.hand, t = action.type;
  h.actions.push({ seat, type: t, ...(action.card ? { card: action.card } : {}) });
  if (t === 'play') playCard(state, seat, action.card);
  else if (ENVIDO.includes(t)) { h.envido.chain.push(t); h.envido.by.push(seat); h.envido.pending = responderFor(state, h, seat); }
  else if (t === 'truco' || t === 'retruco' || t === 'valeCuatro') {
    if (h.truco.pending) h.truco.level = h.truco.pending.to;
    h.truco.pending = { to: h.truco.level + 1, by: seat, responder: responderFor(state, h, seat) };
    h.truco.holder = null;
  } else if (t === 'quiero' || t === 'noQuiero') answer(state, seat, t === 'quiero');
  else if (t === 'mazo') mazo(state, seat);
  if (h.ended && !state.over && opts.deal) dealHand(state, (h.mano + 1) % N);
}

// Envido when it is querido: who shows his points, in order from the mano, and who wins.
export function singEnvido(h) {
  const points = h.hands.map((x, i) => (h.folded[i] ? null : envidoPoints(x)));
  const shown = [false, false, false, false];
  let best = null;
  for (let k = 0; k < N; k++) {
    const s = (h.mano + k) % N;
    if (points[s] === null) continue;
    if (best === null || (team(s) !== team(best) && points[s] > points[best])) { best = s; shown[s] = true; }
  }
  return { winner: best, points, shown };
}

function answer(state, seat, yes) {
  const h = state.hand;
  if (h.envido.pending === seat) {
    const e = h.envido;
    e.pending = null; e.closed = true;
    if (yes) {
      const r = singEnvido(h);
      const value = envidoQuieroValue(state.rules, e.chain, state.score, team(r.winner));
      e.result = { winner: r.winner, value, points: r.points, shown: r.shown, accepted: true };
      award(state, team(r.winner), value, 'envido');
    } else {
      const caller = e.by[e.by.length - 1], value = envidoNoQuieroValue(e.chain);
      e.result = { winner: caller, value, points: null, shown: [false, false, false, false], accepted: false };
      award(state, team(caller), value, 'envido');
    }
    return;
  }
  const tr = h.truco;
  if (yes) { tr.level = tr.pending.to; tr.holder = team(seat); tr.pending = null; }
  else { const by = tr.pending.by; tr.pending = null; endHand(state, team(by), tr.level, 'noQuiero'); }
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

function nextToPlay(h, from) {
  const b = h.bazas[h.bazas.length - 1];
  for (let k = 1; k <= N; k++) { const s = (from + k) % N; if (!h.folded[s] && b.cards[s] === null) return s; }
  return null;
}
const firstActiveFrom = (h, s) => { for (let k = 0; k < N; k++) { const x = (s + k) % N; if (!h.folded[x]) return x; } return null; };

// Result of one baza: { winner: team or -1, by: seat that leads next or null }.
export function bazaResult(cards, lead) {
  let max = -1;
  for (const c of cards) if (c !== null && POWER[c] > max) max = POWER[c];
  const top = [];
  for (let k = 0; k < N; k++) { const s = (lead + k) % N; if (cards[s] !== null && POWER[cards[s]] === max) top.push(s); }
  const teams = new Set(top.map(team));
  return teams.size === 2 ? { winner: PARDA, by: null } : { winner: team(top[0]), by: top[0] };
}

function advance(state, from) {
  const h = state.hand, next = nextToPlay(h, from);
  if (next !== null) { h.turn = next; return; }
  const b = h.bazas[h.bazas.length - 1], r = bazaResult(b.cards, b.lead);
  b.winner = r.winner; b.by = r.by;
  const w = handWinner(h.bazas.map(x => x.winner), team(h.mano));
  if (w !== null) { endHand(state, w, h.truco.level, 'bazas'); return; }
  const lead = firstActiveFrom(h, r.winner === PARDA ? h.mano : r.by);
  h.bazas.push({ cards: [null, null, null, null], lead, winner: null, by: null });
  h.turn = lead;
}

function playCard(state, seat, card) {
  const h = state.hand;
  h.left[seat] = h.left[seat].filter(c => c !== card);
  h.bazas[h.bazas.length - 1].cards[seat] = card;
  advance(state, seat);
}

function mazo(state, seat) {
  const h = state.hand, p = partner(seat);
  h.folded[seat] = true;
  if (h.folded[p]) {
    let pts = h.truco.level;
    const nothingSung = h.envido.chain.length === 0 && h.truco.level === 1 && !h.truco.pending;
    const teamNoCard = h.bazas.length === 1 && h.bazas[0].cards[seat] === null && h.bazas[0].cards[p] === null;
    if (nothingSung && teamNoCard) pts = Math.max(pts, state.rules.mazoNoCardPoints);
    endHand(state, 1 - team(seat), pts, 'mazo');
    return;
  }
  advance(state, seat);
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

// What one seat may know: other hands hidden, envido points only where shown, senas only of its own team.
export function observation4(state, seat) {
  const h = state.hand, er = h.envido.result;
  const hidden = {
    ...h,
    hands: h.hands.map((x, i) => (i === seat ? x.slice() : null)),
    left: h.left.map((x, i) => (i === seat ? x.slice() : x.length)),
    envido: { ...h.envido, result: er && er.points ? { ...er, points: er.points.map((p, i) => (er.shown[i] || i === seat ? p : null)) } : er },
    senas: h.senas.filter(x => team(x.seat) === team(seat)),
  };
  delete hidden.actions;
  return {
    seat, rules: state.rules, score: state.score.slice(), handNo: state.handNo, over: state.over, winner: state.winner,
    toAct: toAct4(state), legal: legalActions4(state, seat), hand: JSON.parse(JSON.stringify(hidden)),
    actions: h.actions.map(a => ({ ...a })),
  };
}

// ---------- senas (juegosdesalon section 16, quote "4p-senas") ----------
// 'malas' (no card that beats a two or better left) and 'envido' (27 or more with the envido still open) are our reading of
// "malas cartas" and "buenas cartas para envido"; the card signs need that card (or rank) still in the hand.
export const SENAS = Object.freeze(['1e', '1b', '7e', '7o', 'tres', 'dos', 'anchoFalso', 'malas', 'envido']);
export function senaHolds(cards, sign, envOpen = true) {
  switch (sign) {
    case '1e': case '1b': case '7e': case '7o': return cards.includes(sign);
    case 'tres': return cards.some(c => c.startsWith('3'));
    case 'dos': return cards.some(c => c.startsWith('2'));
    case 'anchoFalso': return cards.includes('1o') || cards.includes('1c');
    case 'malas': return cards.length > 0 && cards.every(c => POWER[c] < 9);
    case 'envido': return envOpen && cards.length === 3 && envidoPoints(cards) >= 27;
    default: return false;
  }
}
export function legalSignals(state, seat) {
  if (state.rules.players !== 4 || state.over || ![0, 1, 2, 3].includes(seat)) return [];
  const h = state.hand;
  if (h.ended || h.folded[seat]) return [];
  const envOpen = !h.envido.closed && h.envido.chain.length === 0 && h.truco.level === 1;
  const cards = h.left[seat];
  return SENAS.filter(x => !h.senas.some(z => z.seat === seat && z.sign === x) && senaHolds(x === 'envido' ? h.hands[seat] : cards, x, envOpen));
}
export function signal(state, seat, sign) {
  if (!legalSignals(state, seat).includes(sign)) throw new Error('signal: ' + sign + ' is not a true, unused sena for seat ' + seat);
  const s = JSON.parse(JSON.stringify(state));
  s.hand.senas.push({ seat, sign });
  return s;
}
