// Locks for the pingalto wave 2 engines: nickname styles fold back to plain letters under NFKC, tier list addresses survive a
// round trip and refuse junk, cloud gaming data per hour.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STYLES, style, lengths, frame, FRAMES, HANGUL_FILLER, BRAILLE_BLANK, showInvisible } from '../games/fancy.mjs';
import { ROWS, empty, move, serialize, parse } from '../games/tier.mjs';
import { gbPerHour, hoursFromPlan, gbForPlay } from '../games/stream.mjs';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
test('fancy: every style changes every letter and folds back under NFKC', () => {
  assert.equal(STYLES.length, 13);
  for (const s of STYLES) {
    const out = style(ABC, s.id);
    assert.equal(out.normalize('NFKC'), ABC, s.id);
    assert.equal([...out].filter((c, i) => c === ABC[i]).length, 0, s.id + ' left a plain letter');
    for (const c of out) assert.notEqual(c.codePointAt(0) >= 0xe000 && c.codePointAt(0) <= 0xf8ff, true);
  }
  for (const s of ['negrita', 'doble', 'sans-negrita', 'mono', 'ancha', 'circulos']) assert.equal(style('0123456789', s).normalize('NFKC'), '0123456789', s);
  assert.equal(style('Ñandú 10', 'negrita').normalize('NFKC'), 'Ñandú 10');
  assert.equal(style('A', 'negrita'), String.fromCodePoint(0x1d400));
  assert.deepEqual(lengths(style('Pibe', 'negrita')), { chars: 4, units: 8 });
  assert.deepEqual(lengths(style('Pibe', 'ancha')), { chars: 4, units: 4 });
  assert.equal(frame('x', 0), 'x');
  assert.ok(FRAMES.length >= 8);
  assert.equal(HANGUL_FILLER.codePointAt(0), 0x3164);
  assert.equal(BRAILLE_BLANK.codePointAt(0), 0x2800);
  assert.equal(showInvisible('a' + HANGUL_FILLER + 'b'), 'a[3164]b');
  assert.throws(() => style('a', 'nope'));
});

test('tier: move, share, parse', () => {
  let s = empty(40);
  s = move(s, 3, 0); s = move(s, 35, 0); s = move(s, 7, 2); s = move(s, 3, 1); s = move(s, 12, 0, 0);
  assert.deepEqual(s.rows, [[12, 35], [3], [7], [], [], []]);
  assert.equal(s.pool.length, 36);
  const t = serialize('val-agentes', s);
  assert.equal(t, 'val-agentes~c-z.3.7...');
  assert.deepEqual(parse(t, 40), { set: 'val-agentes', state: s });
  s = move(s, 35, -1);
  assert.ok(s.pool.includes(35));
  const junk = parse('val-agentes~1-1-zz-3.<x>.9', 40);
  assert.equal(junk.set, null);
  const dup = parse('lol~1-1-zzzz-3..1-2', 5);
  assert.deepEqual(dup.state.rows, [[1, 3], [], [2], [], [], []]);
  assert.equal(dup.state.pool.length, 2);
  assert.equal(ROWS.length, 6);
});

test('stream: GB per hour from Mbps', () => {
  assert.equal(gbPerHour(10), 4.5);
  assert.equal(gbPerHour(20), 9);
  assert.equal(hoursFromPlan({ gb: 9, mbps: 10 }), 2);
  assert.ok(Math.abs(gbForPlay({ hoursPerDay: 1, daysPerWeek: 7, mbps: 10 }) - 135) < 1e-9);
  assert.throws(() => gbPerHour(0));
});
