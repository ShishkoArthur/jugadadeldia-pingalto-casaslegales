// Truco card values. Sources: data/sources/truco/rules.json (quotes "hierarchy", "envido-count", "flor-count").
import { DECK_40, parseCard } from '../cards/spanish.mjs';

// Power for the bazas, 14 (as de espadas) down to 1 (the fours). Equal power = parda.
// 1e > 1b > 7e > 7o > 3 > 2 > 1o,1c > 12 > 11 > 10 > 7c,7b > 6 > 5 > 4.
export const POWER = Object.freeze(Object.fromEntries(DECK_40.map(c => [c, powerOf(c)])));
function powerOf(c) {
  const { n } = parseCard(c);
  if (c === '1e') return 14;
  if (c === '1b') return 13;
  if (c === '7e') return 12;
  if (c === '7o') return 11;
  return { 3: 10, 2: 9, 1: 8, 12: 7, 11: 6, 10: 5, 7: 4, 6: 3, 5: 2, 4: 1 }[n];
}

// The 14 levels from the top, each with its cards (for the "valores" ladder).
export const LADDER = Object.freeze(Array.from({ length: 14 }, (_, i) => 14 - i).map(p => Object.freeze(DECK_40.filter(c => POWER[c] === p))));

// Envido value of one card: its number, figures (10, 11, 12) count 0.
export const ENVIDO_VALUE = Object.freeze(Object.fromEntries(DECK_40.map(c => { const n = parseCard(c).n; return [c, n >= 10 ? 0 : n]; })));
const SUIT = Object.freeze(Object.fromEntries(DECK_40.map(c => [c, c.slice(-1)])));

export function compareCards(a, b) {
  return Math.sign(POWER[a] - POWER[b]);
}

export function hasFlor(hand) {
  return hand.length === 3 && SUIT[hand[0]] === SUIT[hand[1]] && SUIT[hand[1]] === SUIT[hand[2]];
}

// Envido points of a 3-card hand: two cards of one suit = 20 + their values; otherwise the highest single value.
// Three of one suit (only reachable when flor is not played): 20 + the two highest values.
export function envidoPoints(hand) {
  if (hand.length !== 3) throw new Error('envidoPoints: three cards');
  let best = 0;
  for (let i = 0; i < 3; i++) {
    const v = ENVIDO_VALUE[hand[i]];
    if (v === undefined) throw new Error('envidoPoints: not a card ' + hand[i]);
    if (v > best) best = v;
    for (let j = i + 1; j < 3; j++) if (SUIT[hand[i]] === SUIT[hand[j]]) best = Math.max(best, 20 + v + ENVIDO_VALUE[hand[j]]);
  }
  return best;
}

// Flor points: 20 + the three values (figures 0). Only for a hand with flor.
export function florPoints(hand) {
  if (!hasFlor(hand)) throw new Error('florPoints: the hand has no flor');
  return 20 + ENVIDO_VALUE[hand[0]] + ENVIDO_VALUE[hand[1]] + ENVIDO_VALUE[hand[2]];
}

// How the envido of a hand is made, for the worked examples: kind 'pair' (two of one suit: 20 + both), 'three' (three of one suit
// when flor is not played: 20 + the two highest) or 'single' (no two of one suit: the highest value). cards are the counted cards,
// values their envido values; total always equals envidoPoints(hand).
export function envidoBreakdown(hand) {
  const total = envidoPoints(hand);
  const v = c => ENVIDO_VALUE[c];
  if (new Set(hand.map(c => SUIT[c])).size === 1) {
    const two = hand.slice().sort((a, b) => v(b) - v(a)).slice(0, 2);
    return { kind: 'three', cards: two, values: two.map(v), total };
  }
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    if (SUIT[hand[i]] === SUIT[hand[j]]) return { kind: 'pair', cards: [hand[i], hand[j]], values: [v(hand[i]), v(hand[j])], total };
  }
  const top = hand.slice().sort((a, b) => v(b) - v(a))[0];
  return { kind: 'single', cards: [top], values: [v(top)], total };
}
