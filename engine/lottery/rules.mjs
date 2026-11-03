// Rule sets of the Argentine games, one id each. Every constant is c(value, factId): the value is the one quoted in
// data/sources/lottery/*.json (engine/test/lottery-sources.test.mjs fails if they differ or if the fact is missing), so the
// engine stays a pure module while every number has a verbatim source. There is no default rule set: rules(id) throws on an
// unknown id, and games whose regulation was not found (data/sources/lottery/gaps.json) have no entry here.
import { fail } from './exact.mjs';

const c = (v, src) => Object.freeze({ v, src });

const QUINIELA = {
  'lotba-quiniela': {
    name: 'La Quiniela de la Ciudad (LOTBA)',
    places: c(20, 'lotba.quiniela.drawn'),
    pay: { 1: c(7, 'lotba.quiniela.pay-1'), 2: c(70, 'lotba.quiniela.pay-2'), 3: c(600, 'lotba.quiniela.pay-3'), 4: c(3500, 'lotba.quiniela.pay-4') },
    includesStake: c(true, 'lotba.quiniela.includes-stake'),
    ranges: c('range', 'lotba.quiniela.range-any'),
    divide: c('stake / places x ratio', 'lotba.quiniela.range-divide'),
    repeats: c('each repetition pays', 'lotba.quiniela.repeats-count'),
    directCap: null,
    minBet: c(150, 'lotba.quiniela.min-bet'),
    redoblona: {
      style: 'lotba',
      pay: c(70, 'lotba.redoblona.pay'),
      cap: c(1500, 'lotba.redoblona.cap'),
      cap12: c(2500, 'lotba.redoblona.cap-1-2'),
      cap13: c(1800, 'lotba.redoblona.cap-1-3'),
      shiftAtOne: c('second range skips position 1', 'lotba.redoblona.first-at-one'),
      shared: c('first hit in the shared part counts for the first bet, the rest for the second', 'lotba.redoblona.shared-portion'),
      singleInside: c('places minus one', 'lotba.redoblona.single-inside'),
      second: c('first amount / places of the second x ratio x hits', 'lotba.redoblona.second-amount'),
    },
  },
  'pba-quiniela': {
    name: 'Quiniela Múltiple de la Provincia de Buenos Aires (IPLyC)',
    places: c(20, 'pba.quiniela.drawn'),
    pay: { 1: c(7, 'pba.quiniela.pay-1'), 2: c(70, 'pba.quiniela.pay-2'), 3: c(600, 'pba.quiniela.pay-3'), 4: c(3500, 'pba.quiniela.pay-4'), 5: c(10000, 'pba.quiniela.pay-5') },
    includesStake: c(true, 'pba.quiniela.includes-stake'),
    ranges: c([1, 5, 10, 20], 'pba.quiniela.places'),
    divide: c('stake / places', 'pba.quiniela.range-divide'),
    repeats: null,
    directCap: c(2000, 'pba.quiniela.cap'),
    minBet: null,
    redoblona: {
      style: 'pba',
      pay: c(80, 'pba.redoblona.pay'),
      cap: c(2000, 'pba.quiniela.cap'),
      firstBeyond: c('settled as a direct bet', 'pba.redoblona.first-beyond-second'),
      shiftAtOne: c('second range skips position 1', 'pba.redoblona.first-at-one'),
      sameFirst: c('first hit counted once', 'pba.redoblona.same-first'),
      distinctFirst: c('first hits counted every time', 'pba.redoblona.distinct-first'),
      secondAll: c('second hits counted every time', 'pba.redoblona.second-all'),
      sameTwice: c('same number must appear at least twice', 'pba.redoblona.same-number-twice'),
    },
  },
};

// Draw games. pool = numbers in the drum; drawn = balls per draw; pick = numbers on a simple ticket; tiers = hits that win
// in that draw ('most' = the prize goes to the tickets with the most hits among those sold).
const DRAW = {
  'cas-quini6-tradicional': { name: 'Quini 6 Tradicional (Primer Sorteo y La Segunda)', maxNumber: c(45, 'cas.quini6.max'), drawn: c(6, 'cas.quini6.drawn'), pick: c(6, 'cas.quini6.pick'), draws: c(2, 'cas.quini6.tradicional-draws'), tiers: c([6, 5, 4], 'cas.quini6.tiers') },
  'cas-quini6-revancha': { name: 'Quini 6 Revancha', maxNumber: c(45, 'cas.quini6.max'), drawn: c(6, 'cas.revancha.draw'), pick: c(6, 'cas.quini6.pick'), draws: null, tiers: c('all six numbers', 'cas.revancha.six-only') },
  'cas-quini6-siempresale': { name: 'Quini 6 Siempre Sale', maxNumber: c(45, 'cas.quini6.max'), drawn: c(6, 'cas.siempresale.draw'), pick: c(6, 'cas.quini6.pick'), draws: null, tiers: c('most hits win', 'cas.siempresale.rule') },
  'cas-brinco': { name: 'Brinco', maxNumber: null, universe: c(40, 'cas.brinco.universe'), drawn: c(6, 'cas.brinco.draw'), pick: c(6, 'cas.quini6.pick'), draws: null, tiers: c('3 hits get the ticket price', 'cas.brinco.three-price') },
  'lotba-loto-plus-tradicional': { name: 'Loto Plus Tradicional', maxNumber: c(45, 'lotba.loto.universe'), drawn: c(6, 'lotba.loto.draws'), pick: c(6, 'lotba.loto.pick'), draws: null, tiers: c([[6, 37], [5, 15], [4, 3]], 'lotba.loto.tradicional-split') },
  'lotba-loto-plus-match': { name: 'Loto Plus Match', maxNumber: c(45, 'lotba.loto.universe'), drawn: c(6, 'lotba.loto.draws'), pick: c(6, 'lotba.loto.pick'), draws: null, tiers: c([[6, 37], [5, 15], [4, 3]], 'lotba.loto.match-split') },
  'lotba-loto-plus-desquite': { name: 'Loto Plus Desquite', maxNumber: c(45, 'lotba.loto.universe'), drawn: c(6, 'lotba.loto.draws'), pick: c(6, 'lotba.loto.pick'), draws: null, tiers: c([[6, 40]], 'lotba.loto.desquite-split') },
  'lotba-loto-plus-saleosale': { name: 'Loto Plus Sale o Sale', maxNumber: c(45, 'lotba.loto.universe'), drawn: c(6, 'lotba.loto.draws'), pick: c(6, 'lotba.loto.pick'), draws: null, tiers: c('most hits win', 'lotba.loto.saleosale-rule') },
  'pba-telekino': { name: 'Telekino', maxNumber: null, universe: c(25, 'pba.telekino.universe'), drawn: c(15, 'pba.telekino.drawn'), pick: c(15, 'pba.telekino.ticket'), draws: null, tiers: c([[15, 52], [6.5], [14, 2.7], [13, 1.1], [12, 8.8], [11, 23.25], [1.7], [3.95]], 'pba.telekino.split') },
  'pba-rekino': { name: 'Rekino', maxNumber: null, universe: c(25, 'pba.telekino.universe'), drawn: c(15, 'pba.telekino.drawn'), pick: c(15, 'pba.telekino.ticket'), draws: null, tiers: c('15 new balls of 25, most hits win', 'pba.telekino.rekino') },
  'lotba-poceada': { name: 'Quiniela Poceada de la Ciudad', maxNumber: c(99, 'lotba.poceada.max'), drawn: c(20, 'lotba.poceada.distinct'), pick: c(8, 'lotba.poceada.pick'), draws: null, tiers: c([[8, 60], [7, 12], [6, 7], [5, 5.5]], 'lotba.poceada.split') },
};
// Prize tiers that win (hits), read from the cited tables/rules above.
const WIN_HITS = {
  'cas-quini6-tradicional': [6, 5, 4], 'cas-quini6-revancha': [6], 'cas-quini6-siempresale': 'most', 'cas-brinco': [6, 5, 4, 3],
  'lotba-loto-plus-tradicional': [6, 5, 4], 'lotba-loto-plus-match': [6, 5, 4], 'lotba-loto-plus-desquite': [6], 'lotba-loto-plus-saleosale': 'most',
  'pba-telekino': [15, 14, 13, 12, 11], 'pba-rekino': 'most', 'lotba-poceada': [8, 7, 6, 5],
};

// Share of the ticket price that the regulation sends to the prize pool, and the part of the pool paid to players' prize
// categories (agent bonuses and reserve funds excluded). Percentages exactly as quoted.
const POOLS = {
  'cas-quini6-tradicional': { nominal: c(90, 'cas.quini6.nominal'), steps: [c(50, 'cas.quini6.half'), c(40, 'cas.quini6.pool')], perDraw: c(2, 'cas.quini6.tradicional-draws'), prizes: c([[70], [10], [3], [0.7], [16.3]], 'cas.quini6.split'), playerRows: [0, 1, 2] },
  'cas-quini6-revancha': { nominal: c(90, 'cas.revancha.nominal'), steps: [c(60, 'cas.revancha.pool')], prizes: c(80, 'cas.revancha.share') },
  'cas-quini6-siempresale': { nominal: c(90, 'cas.siempresale.nominal'), steps: [c(60, 'cas.siempresale.pool')], prizes: c(60, 'cas.siempresale.share') },
  'cas-brinco': { nominal: c(90, 'cas.brinco.nominal'), steps: [c(47.8, 'cas.brinco.pool')], prizes: c([[75], [10], [3.3], [7.5], [0.75], [3.45]], 'cas.brinco.split'), playerRows: [0, 1, 2, 3] },
  'lotba-loto-plus': { nominal: null, steps: [c(45, 'lotba.loto.fund')], modalities: c([[22], [22], [20], [10], [26]], 'lotba.loto.modality-share'),
    modalityPrizes: [c([[6, 37], [5, 15], [4, 3]], 'lotba.loto.tradicional-split'), c([[6, 37], [5, 15], [4, 3]], 'lotba.loto.match-split'), c([[6, 40]], 'lotba.loto.desquite-split'), c(85, 'lotba.loto.saleosale-split'), c(100, 'lotba.loto.multiplicador-fund')],
    multiplicadorToReserve: true },
  'pba-telekino': { nominal: null, steps: [c(38, 'pba.telekino.fund')], prizes: c([[15, 52], [6.5], [14, 2.7], [13, 1.1], [12, 8.8], [11, 23.25], [1.7], [3.95]], 'pba.telekino.split'), playerRows: [0, 1, 2, 3, 4, 5, 6, 7] },
  'lotba-poceada': { nominal: null, steps: [c(45, 'lotba.poceada.fund')], prizes: c([[8, 60], [7, 12], [6, 7], [5, 5.5]], 'lotba.poceada.split'), playerRows: [0, 1, 2, 3] },
  'pba-quiniela-plus': { nominal: null, steps: [c(60, 'pba.qplus.fund')], prizes: c([[57, 8], [18.51, 7], [9.14, 6], [9.51, 5]], 'pba.qplus.split'), playerRows: [0, 1, 2, 3], pctFirst: true },
  'pba-chance-plus': { nominal: null, steps: [c(60, 'pba.qplus.chance-fund')], prizes: c([[46, 8], [15.55, 7], [13.16, 6], [22.82, 5]], 'pba.qplus.chance-split'), playerRows: [0, 1, 2, 3], pctFirst: true },
};

const TOMBOLINA = {
  'lotba-tombolina': { name: 'Tombolina de la Ciudad', table: c([[3, 3, 50], [4, 4, 140], [4, 3, 7], [5, 5, 700], [5, 4, 20], [5, 3, 2.5], [6, 6, 3500], [6, 5, 70], [6, 4, 7], [6, 3, 1.5], [7, 7, 8000], [7, 6, 500], [7, 5, 25], [7, 4, 2.5], [7, 3, 1]], 'lotba.tombolina.pay'), maxNumber: c(99, 'lotba.tombolina.max'), drawn: c(20, 'lotba.poceada.distinct'), extract: c('20 distinct two-digit endings of the Quiniela de la Ciudad', 'lotba.tombolina.extract'), minBet: c(150, 'lotba.quiniela.min-bet') },
};

const QPLUS = {
  'pba-quiniela-plus': { name: 'Quiniela Plus / Súper Plus / Chance Plus (PBA)', pick: c(8, 'pba.qplus.pick'), distinctPick: c(true, 'pba.qplus.distinct-pick'), places: c(20, 'pba.quiniela.drawn'), points: c('one point per hit on the 20 places of the Nocturna', 'pba.qplus.points'), tiers: [8, 7, 6, 5] },
};

const LOTO_PLUS_EXTRA = {
  'lotba-loto-plus-multiplicador': { plusMax: c(9, 'lotba.loto.plus-universe'), rule: c('6 hits in Tradicional, Match or Desquite and the Plus number', 'lotba.loto.multiplicador-rule'), pay: c(2, 'lotba.loto.multiplicador-pay') },
  'cas-quini6-premio-extra': { rule: c('6 hits among the 18 numbers of Primer Sorteo, La Segunda and Revancha, repeats once, excluding 6 hits in any single draw', 'cas.extra.rule') },
};

const ALL = { quiniela: QUINIELA, draw: DRAW, pool: POOLS, tombolina: TOMBOLINA, qplus: QPLUS, extra: LOTO_PLUS_EXTRA };

export function rules(kind, id) {
  const set = ALL[kind];
  if (!set) fail('UNKNOWN_KIND', 'unknown rule kind ' + JSON.stringify(kind));
  if (typeof id !== 'string' || !Object.hasOwn(set, id)) fail('UNKNOWN_RULES', 'unknown ' + kind + ' rule set ' + JSON.stringify(id) + ' (known: ' + Object.keys(set).join(', ') + ')');
  return set[id];
}
export const ruleIds = kind => Object.keys(ALL[kind] || fail('UNKNOWN_KIND', 'unknown rule kind ' + JSON.stringify(kind)));
export const winHits = id => (Object.hasOwn(WIN_HITS, id) ? WIN_HITS[id] : fail('UNKNOWN_RULES', 'no prize tiers for ' + JSON.stringify(id)));

// Every cited constant of every rule set: [path, { v, src }] - for the source test.
export function citedConstants() {
  const out = [];
  const walk = (x, p) => {
    if (x && typeof x === 'object' && 'src' in x && 'v' in x) out.push([p, x]);
    else if (Array.isArray(x)) x.forEach((y, i) => walk(y, p + '[' + i + ']'));
    else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) walk(y, p + '.' + k);
  };
  walk(ALL, 'rules');
  return out;
}
