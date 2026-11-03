// Spanish deck of 40 cards (baraja espanola without 8 and 9), as used in truco, escoba and chinchon-de-40.
// A card is a short string: number + suit letter, e.g. '1e' (as de espadas), '7o' (siete de oros), '12c' (rey de copas).
// Suits: e espadas, b bastos, o oros, c copas. Numbers: 1-7, 10 (sota), 11 (caballo), 12 (rey).
export const SUITS = Object.freeze(['e', 'b', 'o', 'c']);
export const SUIT_NAMES = Object.freeze({ e: 'espadas', b: 'bastos', o: 'oros', c: 'copas' });
export const NUMBERS_40 = Object.freeze([1, 2, 3, 4, 5, 6, 7, 10, 11, 12]);
export const NUMBER_NAMES = Object.freeze({ 1: 'as', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 10: 'sota', 11: 'caballo', 12: 'rey' });

export const DECK_40 = Object.freeze(SUITS.flatMap(s => NUMBERS_40.map(n => n + s)));
const IN_DECK = new Set(DECK_40);

export function isCard(c) {
  return typeof c === 'string' && IN_DECK.has(c);
}
export function parseCard(c) {
  if (!isCard(c)) throw new Error('not a card of the 40-card deck: ' + c);
  return { n: +c.slice(0, -1), s: c.slice(-1) };
}
export const numberOf = c => parseCard(c).n;
export const suitOf = c => parseCard(c).s;
export function cardName(c) {
  const { n, s } = parseCard(c);
  return NUMBER_NAMES[n] + ' de ' + SUIT_NAMES[s];
}

// Fisher-Yates with an engine generator (engine/cards/rng.mjs). Returns a new array.
export function shuffle(cards, rng) {
  const a = cards.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Deal one card at a time, starting with the first seat in `order`, `count` cards each. Returns { hands, rest }.
export function deal(deck, players, count) {
  if (!Number.isInteger(players) || players < 1 || !Number.isInteger(count) || count < 1) throw new Error('deal: players and count are positive integers');
  if (players * count > deck.length) throw new Error('deal: not enough cards');
  const hands = Array.from({ length: players }, () => []);
  for (let k = 0; k < count; k++) for (let p = 0; p < players; p++) hands[p].push(deck[k * players + p]);
  return { hands, rest: deck.slice(players * count) };
}

// All k-subsets of an array, in lexicographic index order (used for exact enumeration of hands).
export function combinations(arr, k, fn) {
  const n = arr.length, idx = Array.from({ length: k }, (_, i) => i), pick = new Array(k);
  if (k > n) return;
  for (;;) {
    for (let i = 0; i < k; i++) pick[i] = arr[idx[i]];
    fn(pick);
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) return;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
}

export function binom(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}
