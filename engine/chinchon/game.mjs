// Chinchon for 2-4 players (people and computer) as a pure state machine with plain JSON state.
// newMatch(rules, { players, limit, reenganches, seed }); legalActions(state, seat); apply(state, action).
// A turn: { type: 'draw', from: 'mazo' | 'pozo' }, then { type: 'discard', card } or { type: 'cut', card } (the card goes
// face down and the hand closes). A comodin is never thrown (Juegos Bonaerenses 5.3: "ni descartarse en el Pozo"). Seven cards each, dealt one by one from the mano; the next card is turned up as the pozo.
// After a cut every player shows melds, starting with the cutter and then in turn order, laying loose cards on the melds
// already on the table when rules.layOff allows; each scores the points left (the cutter: all melded = rules.allMelded,
// chinchon with comodin = rules.chinchonWithJoker, chinchon without comodin wins the match).
// When the stock runs out the pozo is shuffled into a new stock (rules.reshuffles times); after that the hand ends and
// everybody scores his own melds with no lay-offs (Juegos Bonaerenses 7.12).
// Over the limit a player is out, or comes back with the highest score of those still in while he has reenganches left
// (Ludoteka). The last player in wins; if every player still in passes the limit in one hand, the lowest wins, a tie goes
// to the cutter and then to the mano (Juegos Bonaerenses 8.5-8.7).
import { createRng, fromState } from '../cards/rng.mjs';
import { shuffle } from '../cards/spanish.mjs';
import { validateRules, deckOf, cardValue, isJoker } from './rules.mjs';
import { meldOf, bestSplit, canCut, bestShow } from './melds.mjs';

export const VERSION = 1;

export function newMatch(rules, { players, limit, reenganches, seed } = {}) {
  const r = validateRules(rules);
  if (!Number.isInteger(players) || players < 2 || players > 4) throw new Error('chinchon: players is 2-4');
  if (!Number.isInteger(limit) || limit < 10 || limit > 1000) throw new Error('chinchon: limit is required (Juegos Bonaerenses play to 101)');
  if (!Number.isInteger(reenganches) || reenganches < 0 || reenganches > 5) throw new Error('chinchon: reenganches is required (0-5)');
  if (players === 2 && reenganches !== 0) throw new Error('chinchon: no reenganches with two players (Ludoteka)');
  if (seed === undefined || seed === null) throw new Error('chinchon: a seed is required');
  const rng = createRng(seed);
  const state = {
    v: VERSION, rules: { ...r }, players, limit, reenganches, seed: String(seed), rng: rng.state(),
    scores: Array(players).fill(0), out: Array(players).fill(false), reLeft: Array(players).fill(reenganches),
    handNo: 0, mano: rng.int(players), hand: null, lastHand: null, history: [], over: false, winner: null, how: null,
  };
  dealHand(state);
  return state;
}

const active = s => [...Array(s.players).keys()].filter(i => !s.out[i]);
const nextActive = (s, seat) => { for (let k = 1; k <= s.players; k++) { const x = (seat + k) % s.players; if (!s.out[x]) return x; } return seat; };

function dealHand(s) {
  const rng = fromState(s.rng);
  const deck = shuffle(deckOf(s.rules), rng);
  s.rng = rng.state();
  s.handNo++;
  const seats = [], hands = Array.from({ length: s.players }, () => []);
  for (let k = 0, x = s.mano; k < active(s).length; k++, x = nextActive(s, x)) seats.push(x);
  let p = 0;
  for (let round = 0; round < 7; round++) for (const x of seats) hands[x].push(deck[p++]);
  s.hand = {
    no: s.handNo, mano: s.mano, hands, stock: deck.slice(p + 1), pozo: [deck[p]], turn: s.mano, phase: 'draw',
    turns: Array(s.players).fill(0), reshufflesLeft: s.rules.reshuffles, log: [], ended: false, result: null,
  };
}

export function toAct(s) {
  return s.over || s.hand.ended ? null : s.hand.turn;
}

export function legalActions(s, seat) {
  if (s.over || seat !== toAct(s)) return [];
  const h = s.hand;
  if (h.phase === 'draw') return [{ type: 'draw', from: 'mazo' }, ...(h.pozo.length ? [{ type: 'draw', from: 'pozo' }] : [])];
  const hand = h.hands[seat], out = hand.filter(c => !isJoker(c)).map(card => ({ type: 'discard', card }));
  if (!(s.rules.noCutFirstRound && h.turns[seat] === 0)) {
    // Removing one card lowers the points left by at most its value, so only cards worth enough can open a cut.
    const all = bestSplit(s.rules, hand).points, room = s.rules.cut === 'sum-at-most-5' ? 5 : 4;
    for (const card of hand) if (!isJoker(card) && cardValue(s.rules, card) >= all - room && canCut(s.rules, hand.filter(c => c !== card)).ok) out.push({ type: 'cut', card });
  }
  return out;
}

const keyOf = a => a.type + ':' + (a.from || a.card);
export const actionKey = keyOf;

export function apply(s, action) {
  const t = JSON.parse(JSON.stringify(s));
  step(t, action);
  return t;
}

export function step(s, action, opts = { deal: true }) {
  const seat = toAct(s);
  if (seat === null || !action || !legalActions(s, seat).some(a => keyOf(a) === keyOf(action))) throw new Error('chinchon: illegal action ' + JSON.stringify(action) + ' for seat ' + seat);
  const h = s.hand;
  if (action.type === 'draw') {
    const card = action.from === 'pozo' ? h.pozo.pop() : h.stock.pop();
    h.hands[seat].push(card);
    h.log.push({ seat, type: 'draw', from: action.from, ...(action.from === 'pozo' ? { card } : {}) });
    h.phase = 'discard';
    return;
  }
  h.hands[seat] = h.hands[seat].filter(c => c !== action.card);
  h.turns[seat]++;
  if (action.type === 'cut') {
    h.log.push({ seat, type: 'cut' });
    h.cutCard = action.card;
    scoreCut(s, seat);
  } else {
    h.pozo.push(action.card);
    h.log.push({ seat, type: 'discard', card: action.card });
    h.turn = nextActive(s, seat);
    h.phase = 'draw';
    if (!h.stock.length) {
      if (h.reshufflesLeft > 0 && h.pozo.length) {
        const rng = fromState(s.rng);
        h.stock = shuffle(h.pozo, rng); h.pozo = []; h.reshufflesLeft--;
        s.rng = rng.state();
        h.log.push({ seat: null, type: 'reshuffle' });
      } else scoreDeckOut(s);
    }
  }
  if (h.ended && !s.over && opts.deal) dealHand(s);
}

function order(s, from) {
  const out = [from];
  for (let x = nextActive(s, from); x !== from; x = nextActive(s, x)) out.push(x);
  return out;
}

function scoreCut(s, cutter) {
  const r = s.rules, h = s.hand, c = canCut(r, h.hands[cutter]);
  const shown = {};
  let pts;
  if (c.chinchon && c.chinchonJokers === 0) {
    h.result = { how: 'chinchon', cutter, shown: { [cutter]: { melds: [h.hands[cutter].slice()], laid: [], left: [], points: 0 } } };
    h.ended = true;
    s.over = true; s.winner = cutter; s.how = 'chinchon';
    s.history.push({ no: h.no, cutter, how: 'chinchon', points: null, scores: s.scores.slice() });
    s.lastHand = h;
    return;
  }
  if (c.points === 0) pts = c.chinchon ? r.chinchonWithJoker : r.allMelded;
  else pts = c.points;
  shown[cutter] = { melds: c.melds, laid: [], left: c.left, points: pts };
  let table = c.melds.map(m => meldOf(r, m));
  const allow = r.layOff === 'always' || c.points > 0;
  for (const x of order(s, cutter).slice(1)) {
    const b = bestShow(r, h.hands[x], table, allow);
    shown[x] = { melds: b.melds, laid: b.laid.map(l => l.card), left: b.left, points: b.points };
    table = [...b.table, ...b.melds.map(m => meldOf(r, m))];
  }
  finishHand(s, { how: c.chinchon ? 'chinchon-comodin' : c.points === 0 ? 'all-melded' : 'cut', cutter, shown });
}

function scoreDeckOut(s) {
  const h = s.hand, shown = {};
  for (const x of active(s)) { const b = bestSplit(s.rules, h.hands[x]); shown[x] = { melds: b.melds, laid: [], left: b.left, points: b.points }; }
  finishHand(s, { how: 'deck-out', cutter: null, shown });
}

function finishHand(s, result) {
  const h = s.hand;
  h.result = result; h.ended = true;
  const pts = Array(s.players).fill(null);
  for (const [x, v] of Object.entries(result.shown)) { pts[x] = v.points; s.scores[x] += v.points; }
  const inHand = active(s);
  const alive = inHand.filter(x => s.scores[x] <= s.limit);
  const events = [];
  if (alive.length === 0) {
    const low = Math.min(...inHand.map(x => s.scores[x]));
    let w = inHand.filter(x => s.scores[x] === low);
    if (w.length > 1 && result.cutter !== null && w.includes(result.cutter)) w = [result.cutter];
    if (w.length > 1) w = w.includes(h.mano) ? [h.mano] : [w[0]];
    s.over = true; s.winner = w[0]; s.how = 'all-over-limit';
  } else {
    const top = Math.max(...alive.map(x => s.scores[x]));
    for (const x of inHand) if (s.scores[x] > s.limit) {
      if (alive.length > 1 && s.reLeft[x] > 0) { s.reLeft[x]--; s.scores[x] = top; events.push({ seat: x, type: 'reenganche', score: top }); }
      else { s.out[x] = true; events.push({ seat: x, type: 'out' }); }
    }
    const still = active(s);
    if (still.length === 1) { s.over = true; s.winner = still[0]; s.how = 'last-in'; }
  }
  s.history.push({ no: h.no, cutter: result.cutter, how: result.how, points: pts, events, scores: s.scores.slice() });
  s.lastHand = h;
  if (!s.over) s.mano = nextActive(s, h.mano);
}

// What one seat may know: its own cards, the pozo, how many cards the others hold, and the public log (cards taken from
// the pozo are seen by all).
export function observation(s, seat) {
  const h = s.hand;
  return {
    seat, rules: s.rules, players: s.players, limit: s.limit, scores: s.scores.slice(), out: s.out.slice(), over: s.over,
    toAct: toAct(s), legal: legalActions(s, seat),
    hand: { no: h.no, mano: h.mano, mine: h.hands[seat].slice(), counts: h.hands.map(x => x.length), pozo: h.pozo.slice(), stock: h.stock.length, phase: h.phase, turns: h.turns.slice(), reshufflesLeft: h.reshufflesLeft, log: h.log.map(e => ({ ...e })) },
  };
}

// A match whose current hand has the given cards (tests, the "can I cut?" tool, trainer puzzles).
export function customHand(rules, { players, limit, reenganches, seed }, hands, { mano, pozo, stock }) {
  const s = newMatch(rules, { players, limit, reenganches, seed });
  const all = [...hands.flat(), ...pozo, ...stock], deck = deckOf(s.rules);
  if (hands.length !== players || hands.some(x => x.length !== 7) || new Set(all).size !== all.length || !all.every(c => deck.includes(c))) throw new Error('chinchon customHand: seven distinct cards per player from the deck');
  s.mano = mano;
  s.hand = { ...s.hand, mano, hands: hands.map(x => x.slice()), pozo: pozo.slice(), stock: stock.slice(), turn: mano, phase: 'draw', turns: Array(players).fill(0), log: [] };
  return s;
}

export const handPoints = (r, cards) => cards.reduce((t, c) => t + cardValue(r, c), 0);

export function serialize(s) { return JSON.stringify(s); }
export function deserialize(json) {
  const s = JSON.parse(json);
  if (!s || s.v !== VERSION) throw new Error('chinchon: unknown state version');
  validateRules(s.rules);
  fromState(s.rng);
  return s;
}
