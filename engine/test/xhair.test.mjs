// CS2 crosshair codes (engine/games/xhair.mjs) against the test codes of akiver/csgo-sharecode (MIT, commit 139b9e2,
// data/sources/pingalto/_docs/akiver-index.test.ts.txt): the first two were exported by CS2 1.41.8.8.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decode, encode, isCode, convars, DICT, CHARS, BYTES, PREFIX, DEFAULTS } from '../games/xhair.mjs';

const base = { style: 2, followRecoil: false, centerDotEnabled: true, tStyleEnabled: false, outlineMode: 0, red: 255, green: 0, blue: 0, alpha: 255, outlineRed: 0, outlineGreen: 0, outlineBlue: 0, outlineAlpha: 255, gap: 0, length: 5, thickness: 1, dynamicSpreadLimit: 181, splitDistance: 3, innerSplitAlpha: 1, outerSplitAlpha: 0.35, splitSizeRatio: 0, screenHeight: 768, scopeDotScale: 1, scopeDotUseCrosshairColor: false };
const V = [
  ['CSvbPubOq37zTGqtsPTP5QTrp5CB4xFXiKRLfzJsm49ZRe', base],
  ['CSoYQNXCQtL5b44fPZKwPPZZCUpsywopyvJW3koh75uFih', { ...base, scopeDotUseCrosshairColor: true }],
  ['CSHt3ObzKS3ikGJLRBVrKjPUrhOCikyke53na8cJFtNZKa', { ...base, scopeDotScale: 0.55, scopeDotUseCrosshairColor: true }],
  ['CSAB6Oby2JUDOrBRy4jRcsR6JOQdhbszKF9GuKQGhKVwAc', { style: 9, followRecoil: true, centerDotEnabled: false, tStyleEnabled: true, outlineMode: 2, red: 10, green: 20, blue: 30, alpha: 200, outlineRed: 40, outlineGreen: 50, outlineBlue: 60, outlineAlpha: 128, gap: -7, length: 255, thickness: 12, dynamicSpreadLimit: 64, splitDistance: 127, innerSplitAlpha: 0.29, outerSplitAlpha: 0.97, splitSizeRatio: 0.63, screenHeight: 1440, scopeDotScale: 2, scopeDotUseCrosshairColor: true }],
];

test('xhair: the library test codes decode and encode back exactly', () => {
  for (const [code, x] of V) {
    assert.deepEqual(decode(code), x, code);
    assert.equal(encode(x), code);
  }
});

test('xhair: the vectors are the ones in the saved library tests', () => {
  const t = readFileSync(new URL('../../data/sources/pingalto/_docs/akiver-index.test.ts.txt', import.meta.url), 'utf8');
  for (const [code] of V) assert.ok(t.includes("shareCode: '" + code + "'"), code);
});

test('xhair: shape, checksum, limits', () => {
  assert.equal(DICT.length, 57);
  assert.equal(PREFIX + 'x'.repeat(CHARS), 'CS' + 'x'.repeat(44));
  assert.equal(BYTES, 32);
  const c = encode(DEFAULTS);
  assert.ok(isCode(c) && c.length === 46);
  assert.deepEqual(decode(c), DEFAULTS);
  assert.equal(decode(c.slice(0, -1) + (c.at(-1) === 'A' ? 'B' : 'A')), null);
  assert.equal(decode('CSGO-ABCDE-ABCDE-ABCDE-ABCDE-ABCDE'), null);
  assert.equal(decode('hola'), null);
  const big = decode(encode({ gap: 99999, length: -4, thickness: 50, alpha: 300, outerSplitAlpha: 0, scopeDotScale: 9 }));
  assert.equal(big.gap, 3840); assert.equal(big.length, 0); assert.equal(big.thickness, 32); assert.equal(big.alpha, 255);
  assert.equal(big.outerSplitAlpha, 0.3); assert.equal(big.scopeDotScale, 2);
  for (let i = 0; i < 300; i++) {
    const x = { ...DEFAULTS, style: i % 10, gap: (i * 37) % 200 - 100, length: i % 256, thickness: i % 33, red: (i * 7) % 256, outlineMode: i % 3, innerSplitAlpha: (i % 101) / 100, screenHeight: 240 + i * 3 };
    assert.deepEqual(decode(encode(x)), x);
  }
  assert.match(convars(base), /^cl_crosshairstyle "2"\ncl_crosshair_recoil "0"/);
  assert.match(convars(base), /cl_crosshair_dynamic_splitalpha_outermod "0.35"/);
});
