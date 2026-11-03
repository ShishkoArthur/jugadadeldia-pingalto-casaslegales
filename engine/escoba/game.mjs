// Escoba de 15 for 2-4 players (or two pairs) as a pure state machine with plain JSON state.
// newMatch(rules, { players, pairs, target, seed }); legalActions(state, seat); apply(state, action).
// Action: { type: 'play', card, take: [table cards] } (take [] leaves the card on the table). The dealer gives three cards
// each, one at a time from his right, and turns four up; when every hand is empty he deals again until the deck is out.
// Taking every card of the table is an escoba. After the last card the table goes to the last side that took, the hand is
// scored (rules.mjs scoreHand) and the deal passes on. At the target the highest side wins; a tie at the top plays on.
import { DECK_40, shuffle } from '../cards/spanish.mjs';
import { createRng, fromState } from '../cards/rng.mjs';
import { validateRules, VALUE, captures, scoreHand } from './rules.mjs';

export const VERSION = 1;

export function newMatch(rules, { players, pairs, target, seed } = {}) {
  const r = validateRules(rules);
  if (!Number.isInteger(players) || players < 2 || players > 4) throw new Error('escoba: players is 2-4');
  if (typeof pairs !== 'boolean') throw new Error('escoba: pairs must be true or false');
  if (pairs && players !== 4) throw new Error('escoba: pairs need four players');
  if (!Number.isInteger(target) || target < 1 || target > 100) throw new Error('escoba: target is required (Juegos Bonaerenses play to 30)');
  if (seed === undefined || seed === null) throw new Error('escoba: a seed is required');
  const rng = createRng(seed), sides = pairs ? 2 : players;
  const s = { v: VERSION, rules: { ...r }, players, pairs, target, seed: String(seed), rng: rng.state(), scores: Array(sides).fill(0), handNo: 0, dealer: rng.int(players), hand: null, lastHand: null, history: [], over: false, winner: null };
  dealHand(s);
  return s;
}

export const sideOf = (s, seat) => (s.pairs ? seat % 2 : seat);
const sum = cards => cards.reduce((t, c) => t + VALUE[c], 0);

function dealRound(s) {
  const h = s.hand;
  for (let k = 0; k < 3; k++) for (let i = 1; i <= s.players; i++) h.hands[(h.dealer + i) % s.players].push(h.stock.pop());
}

function dealHand(s) {
  const rng = fromState(s.rng);
  const stock = shuffle(DECK_40, rng);
  s.rng = rng.state();
  s.handNo++;
  const dealer = s.handNo === 1 ? s.dealer : (s.dealer = (s.dealer + 1) % s.players);
  const h = { no: s.handNo, dealer, stock, table: [], hands: Array.from({ length: s.players }, () => []), piles: Array.from({ length: s.players }, () => []), escobas: Array(s.players).fill(0), lastTaker: null, turn: (dealer + 1) % s.players, log: [], ended: false, result: null };
  s.hand = h;
  dealRound(s);
  for (let k = 0; k < 4; k++) h.table.push(h.stock.pop());
  const t = sum(h.table);
  if (t === 15) take(h, dealer, h.table.slice(), 1, 'muestra');
  else if (t === 30 && twoFifteens(h.table)) {
    if (s.rules.muestra === 'ludoteka') take(h, dealer, h.table.slice(), 2, 'muestra');
    else h.log.push({ seat: dealer, type: 'muestra-doble' });
  }
}

const twoFifteens = t => { for (let m = 1; m < 15; m++) { const a = t.filter((_, i) => m & (1 << i)); if (sum(a) === 15) return true; } return false; };

function take(h, seat, cards, escobas, why) {
  h.table = h.table.filter(c => !cards.includes(c));
  h.piles[seat].push(...cards);
  h.escobas[seat] += escobas;
  h.lastTaker = seat;
  h.log.push({ seat, type: why, cards: cards.slice(), escobas });
}

export function toAct(s) {
  return s.over || s.hand.ended ? null : s.hand.turn;
}

export function legalActions(s, seat) {
  if (s.over || seat !== toAct(s)) return [];
  const h = s.hand, out = [];
  for (const card of h.hands[seat]) {
    const caps = captures(h.table, card);
    for (const t of caps) out.push({ type: 'play', card, take: t });
    if (!caps.length || s.rules.capture === 'optional') out.push({ type: 'play', card, take: [] });
  }
  return out;
}

const keyOf = a => a.card + ':' + a.take.slice().sort().join(',');
export const actionKey = keyOf;

export function apply(s, action) {
  const t = JSON.parse(JSON.stringify(s));
  step(t, action);
  return t;
}

export function step(s, action, opts = { deal: true }) {
  const seat = toAct(s);
  if (seat === null || !action || action.type !== 'play' || !Array.isArray(action.take) || !legalActions(s, seat).some(a => keyOf(a) === keyOf(action)))
    throw new Error('escoba: illegal action ' + JSON.stringify(action) + ' for seat ' + seat);
  const h = s.hand;
  h.hands[seat] = h.hands[seat].filter(c => c !== action.card);
  if (action.take.length) {
    h.table.push(action.card);
    const sweep = h.table.length === action.take.length + 1;
    take(h, seat, [action.card, ...action.take], sweep ? 1 : 0, 'take');
  } else {
    h.table.push(action.card);
    h.log.push({ seat, type: 'drop', card: action.card });
  }
  h.turn = (seat + 1) % s.players;
  if (h.hands.every(x => x.length === 0)) {
    if (h.stock.length) dealRound(s);
    else endHand(s);
  }
  if (h.ended && !s.over && opts.deal) dealHand(s);
}

function endHand(s) {
  const h = s.hand;
  if (h.table.length && h.lastTaker !== null) take(h, h.lastTaker, h.table.slice(), 0, 'rest');
  const sides = s.scores.length, piles = Array.from({ length: sides }, () => []), esc = Array(sides).fill(0);
  for (let i = 0; i < s.players; i++) { piles[sideOf(s, i)].push(...h.piles[i]); esc[sideOf(s, i)] += h.escobas[i]; }
  const res = scoreHand(s.rules, piles, esc);
  h.result = res; h.ended = true;
  res.points.forEach((p, i) => { s.scores[i] += p; });
  s.history.push({ no: h.no, points: res.points.slice(), scores: s.scores.slice(), detail: res.detail });
  s.lastHand = h;
  const top = Math.max(...s.scores);
  if (top >= s.target) {
    const w = s.scores.map((x, i) => (x === top ? i : -1)).filter(i => i >= 0);
    if (w.length === 1) { s.over = true; s.winner = w[0]; }
  }
}

// What one seat may know: its cards, the table, every pile (taken cards are seen), how many cards the others hold.
export function observation(s, seat) {
  const h = s.hand;
  return {
    seat, rules: s.rules, players: s.players, pairs: s.pairs, target: s.target, scores: s.scores.slice(), over: s.over,
    toAct: toAct(s), legal: legalActions(s, seat),
    hand: { no: h.no, dealer: h.dealer, mine: h.hands[seat].slice(), counts: h.hands.map(x => x.length), table: h.table.slice(), stock: h.stock.length, piles: h.piles.map(p => p.slice()), escobas: h.escobas.slice(), lastTaker: h.lastTaker, log: h.log.map(e => ({ ...e })) },
  };
}

export function customHand(rules, opts, { hands, table, stock, dealer, turn }) {
  const s = newMatch(rules, opts);
  const all = [...hands.flat(), ...table, ...stock];
  if (hands.length !== s.players || new Set(all).size !== all.length || all.some(c => !DECK_40.includes(c))) throw new Error('escoba customHand: distinct cards of the 40-card deck');
  s.hand = { ...s.hand, dealer, hands: hands.map(x => x.slice()), table: table.slice(), stock: stock.slice(), piles: Array.from({ length: s.players }, () => []), escobas: Array(s.players).fill(0), lastTaker: null, turn, log: [] };
  return s;
}

export function serialize(s) { return JSON.stringify(s); }
export function deserialize(json) {
  const s = JSON.parse(json);
  if (!s || s.v !== VERSION) throw new Error('escoba: unknown state version');
  validateRules(s.rules);
  fromState(s.rng);
  return s;
}
