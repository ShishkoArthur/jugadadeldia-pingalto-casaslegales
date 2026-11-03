import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitmix64, createRng, fromState, seedState, seedToBigInt } from '../cards/rng.mjs';
import { DECK_40, shuffle, deal, parseCard, cardName, combinations, binom, isCard } from '../cards/spanish.mjs';

test('splitmix64 reference vector (seed 0)', () => {
  const sm = splitmix64(0n);
  assert.equal(sm(), 0xe220a8397b1dcdafn);
  assert.equal(sm(), 0x6e789e6aa1b965f4n);
  assert.equal(sm(), 0x06c45d188009454fn);
});

test('xoshiro128** follows the reference recurrence (state 1,2,3,4)', () => {
  const r = fromState([1, 2, 3, 4]);
  assert.equal(r.u32(), 11520);
  assert.equal(r.u32(), 0);
  assert.equal(r.u32(), 5927040);
  assert.equal(r.u32(), 70819200);
  assert.equal(r.u32(), 2031721883);
});

test('rng: same seed same stream, state round trip, seeds must be explicit', () => {
  const a = createRng(42), b = createRng(42), c = createRng(43);
  const xa = Array.from({ length: 8 }, () => a.u32());
  assert.deepEqual(xa, Array.from({ length: 8 }, () => b.u32()));
  assert.notDeepEqual(xa, Array.from({ length: 8 }, () => c.u32()));
  const r = createRng('partida-1'); r.u32();
  const copy = fromState(r.state());
  assert.equal(copy.u32(), r.u32());
  assert.equal(seedToBigInt('a'), 0xaf63dc4c8601ec8cn);
  assert.throws(() => createRng(-1));
  assert.throws(() => createRng(1.5));
  assert.throws(() => createRng(''));
  assert.throws(() => createRng(undefined));
  assert.throws(() => fromState([0, 0, 0, 0]));
  assert.equal(seedState(0).length, 4);
});

test('rng.int is uniform enough and in range', () => {
  const r = createRng(7), n = 40, N = 200000, cnt = new Array(n).fill(0);
  for (let i = 0; i < N; i++) { const x = r.int(n); assert.ok(x >= 0 && x < n); cnt[x]++; }
  const e = N / n, chi = cnt.reduce((t, c) => t + (c - e) ** 2 / e, 0);
  assert.ok(chi < 80, 'chi-square ' + chi);
  const f = r.float();
  assert.ok(f >= 0 && f < 1);
  assert.throws(() => r.int(0));
});

test('Spanish 40-card deck: no 8 and 9, ten per suit', () => {
  assert.equal(DECK_40.length, 40);
  assert.equal(new Set(DECK_40).size, 40);
  assert.ok(!DECK_40.some(c => /^[89]/.test(c)));
  for (const s of 'eboc') assert.equal(DECK_40.filter(c => c.endsWith(s)).length, 10);
  assert.deepEqual(parseCard('12c'), { n: 12, s: 'c' });
  assert.equal(cardName('1e'), 'as de espadas');
  assert.equal(cardName('7o'), 'siete de oros');
  assert.ok(!isCard('8e'));
  assert.throws(() => parseCard('9o'));
});

test('shuffle is a permutation, deterministic per seed; every position fair', () => {
  const s1 = shuffle(DECK_40, createRng(1)), s2 = shuffle(DECK_40, createRng(1));
  assert.deepEqual(s1, s2);
  assert.deepEqual(s1.slice().sort(), DECK_40.slice().sort());
  const r = createRng(99), N = 40000, top = {};
  for (let i = 0; i < N; i++) { const c = shuffle(DECK_40, r)[0]; top[c] = (top[c] || 0) + 1; }
  const e = N / 40, chi = DECK_40.reduce((t, c) => t + ((top[c] || 0) - e) ** 2 / e, 0);
  assert.ok(chi < 80, 'chi-square ' + chi);
});

test('deal: one card at a time from the first seat', () => {
  const { hands, rest } = deal(DECK_40, 2, 3);
  assert.deepEqual(hands[0], [DECK_40[0], DECK_40[2], DECK_40[4]]);
  assert.deepEqual(hands[1], [DECK_40[1], DECK_40[3], DECK_40[5]]);
  assert.equal(rest.length, 34);
  assert.throws(() => deal(DECK_40, 14, 3));
});

test('combinations and binom', () => {
  let n = 0;
  combinations(DECK_40, 3, () => n++);
  assert.equal(n, 9880);
  assert.equal(binom(40, 3), 9880);
  assert.equal(binom(37, 3), 7770);
  assert.equal(binom(10, 3), 120);
});
