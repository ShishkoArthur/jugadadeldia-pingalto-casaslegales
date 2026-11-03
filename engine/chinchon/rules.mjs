// Chinchon rule sets and cards. Every field is required: a missing or unknown value is an error, never a silent default
// (PLAYBOOK §5). Sources and quotes: data/sources/chinchon/rules.json (Juegos Bonaerenses 2026 "Chin-Chon", Ludoteka).
//
//   deck             40 (1-7, sota, caballo, rey) or 48 (1-12): the Spanish deck without or with eights and nines.
//   jokers           0 or 2 comodines added to the deck (Juegos Bonaerenses: 48 + 2 = 50 cards).
//   jokerValue       points of a comodin left in the hand (Juegos Bonaerenses: 20); null without jokers.
//   jokersPerMeld    null without jokers; 1 (Juegos Bonaerenses: one comodin per juego) or 'two-real' (Ludoteka: every
//                    meld keeps at least two cards that are not comodines).
//   figureValues     'number' (a card counts its number: sota 10, caballo 11, rey 12; Juegos Bonaerenses) or 'ten' (sota,
//                    caballo and rey count 10; Ludoteka).
//   cut              'sum-at-most-5' (the cards left out of melds add up to 5 or less; Juegos Bonaerenses) or
//                    'one-card-at-most-4' (at most one card left out and worth 4 or less; Ludoteka).
//   noCutFirstRound  true: nobody may cut in his first turn of the hand (Ludoteka); false: no such rule (Juegos Bonaerenses).
//   allMelded        points of a cut with every card in melds (both: -10).
//   chinchonWithJoker points of a seven-card escalera with a comodin (Juegos Bonaerenses: -10); null without jokers.
//                    A chinchon without comodin wins the match at once (both sources).
//   layOff           'always' (after a cut the others lay cards on the melds on the table; Juegos Bonaerenses) or
//                    'if-cutter-has-leftover' (only when the cutter kept a card out of melds; Ludoteka).
//   reshuffles       how many times the discards become the stock again: 1 (Juegos Bonaerenses: at the second
//                    exhaustion the hand ends) or 3 (Ludoteka: the hand closes when the stock runs out a fourth time).
// Match options (newMatch): players 2-4, limit (Juegos Bonaerenses: 101) and reenganches (Ludoteka; 0 with two players).
export const KEYS = Object.freeze(['deck', 'jokers', 'jokerValue', 'jokersPerMeld', 'figureValues', 'cut', 'noCutFirstRound', 'allMelded', 'chinchonWithJoker', 'layOff', 'reshuffles']);

export function validateRules(r) {
  if (!r || typeof r !== 'object') throw new Error('chinchon: a rule set object is required (see engine/chinchon/rules.mjs)');
  for (const k of KEYS) if (!(k in r)) throw new Error('chinchon rules: missing "' + k + '"');
  for (const k of Object.keys(r)) if (!KEYS.includes(k) && k !== 'name') throw new Error('chinchon rules: unknown key "' + k + '"');
  if (![40, 48].includes(r.deck)) throw new Error('chinchon rules: deck must be 40 or 48');
  if (![0, 2].includes(r.jokers)) throw new Error('chinchon rules: jokers must be 0 or 2');
  if (r.jokers === 0) {
    if (r.jokerValue !== null || r.jokersPerMeld !== null || r.chinchonWithJoker !== null) throw new Error('chinchon rules: without jokers, jokerValue, jokersPerMeld and chinchonWithJoker are null');
  } else {
    if (!Number.isInteger(r.jokerValue) || r.jokerValue < 0 || r.jokerValue > 100) throw new Error('chinchon rules: jokerValue must be a whole number 0-100');
    if (r.jokersPerMeld !== 1 && r.jokersPerMeld !== 'two-real') throw new Error('chinchon rules: jokersPerMeld must be 1 or "two-real"');
    if (!Number.isInteger(r.chinchonWithJoker)) throw new Error('chinchon rules: chinchonWithJoker must be a whole number');
  }
  if (!['number', 'ten'].includes(r.figureValues)) throw new Error('chinchon rules: figureValues must be "number" or "ten"');
  if (!['sum-at-most-5', 'one-card-at-most-4'].includes(r.cut)) throw new Error('chinchon rules: cut must be "sum-at-most-5" or "one-card-at-most-4"');
  if (typeof r.noCutFirstRound !== 'boolean') throw new Error('chinchon rules: noCutFirstRound must be true or false');
  if (!Number.isInteger(r.allMelded)) throw new Error('chinchon rules: allMelded must be a whole number');
  if (!['always', 'if-cutter-has-leftover'].includes(r.layOff)) throw new Error('chinchon rules: layOff must be "always" or "if-cutter-has-leftover"');
  if (![1, 3].includes(r.reshuffles)) throw new Error('chinchon rules: reshuffles must be 1 or 3');
  if (r.name !== undefined && (typeof r.name !== 'string' || !/^[a-z0-9-]+$/.test(r.name))) throw new Error('chinchon rules: bad name');
  return Object.freeze({ ...r });
}

export const RULESETS = Object.freeze({
  'bonaerense-50': Object.freeze({ name: 'bonaerense-50', deck: 48, jokers: 2, jokerValue: 20, jokersPerMeld: 1, figureValues: 'number', cut: 'sum-at-most-5', noCutFirstRound: false, allMelded: -10, chinchonWithJoker: -10, layOff: 'always', reshuffles: 1 }),
  'ludoteka-40': Object.freeze({ name: 'ludoteka-40', deck: 40, jokers: 0, jokerValue: null, jokersPerMeld: null, figureValues: 'ten', cut: 'one-card-at-most-4', noCutFirstRound: true, allMelded: -10, chinchonWithJoker: null, layOff: 'if-cutter-has-leftover', reshuffles: 3 }),
  'ludoteka-48': Object.freeze({ name: 'ludoteka-48', deck: 48, jokers: 0, jokerValue: null, jokersPerMeld: null, figureValues: 'ten', cut: 'one-card-at-most-4', noCutFirstRound: true, allMelded: -10, chinchonWithJoker: null, layOff: 'if-cutter-has-leftover', reshuffles: 3 }),
});

// ---------- cards ----------
// A card is number + suit ('1e', '9o', '12c'); a comodin is 'J1' or 'J2'. Suits e espadas, b bastos, o oros, c copas.
export const SUITS = Object.freeze(['e', 'b', 'o', 'c']);
export const NUMBERS = Object.freeze({ 40: Object.freeze([1, 2, 3, 4, 5, 6, 7, 10, 11, 12]), 48: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) });
export const JOKERS = Object.freeze(['J1', 'J2']);
export const isJoker = c => c === 'J1' || c === 'J2';
export function deckOf(r) {
  return [...SUITS.flatMap(s => NUMBERS[r.deck].map(n => n + s)), ...JOKERS.slice(0, r.jokers)];
}
export const numOf = c => +c.slice(0, -1);
export const suitOf = c => c.slice(-1);
export function cardValue(r, c) {
  if (isJoker(c)) return r.jokerValue;
  const n = numOf(c);
  return r.figureValues === 'ten' && n >= 10 ? 10 : n;
}
// Position of a number in the escalera order of the deck (in the 40-card deck the sota follows the seven).
export const rankOf = (r, c) => NUMBERS[r.deck].indexOf(numOf(c));
