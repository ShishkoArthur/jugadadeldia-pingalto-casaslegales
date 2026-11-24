// Visit counter for the owner's stats service (data/counter/map.json, docs/DECISIONS.md 2026-11-24): the page code of each site sends
// exactly the path, encoding and field names of its map entry, only on its own production host, never under automation; the three
// sites do not share a path, a field name set or a way of sending.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const MAP = JSON.parse(readFileSync(new URL('../../data/counter/map.json', import.meta.url), 'utf8'));
const FILES = { 'jugadadeldia.com': 'sites/jugadadeldia/client/jg.js', 'pingalto.com': 'sites/pingalto/client/pa.js', 'casaslegales.com': 'sites/casaslegales/client/ui.js' };
const src = d => readFileSync(new URL('../../' + FILES[d], import.meta.url), 'utf8');

test('counter: map entries for the three sites in the Domlink format', () => {
  assert.deepEqual(Object.keys(MAP).filter(k => !k.startsWith('_')).sort(), Object.keys(FILES).sort());
  for (const [d, c] of Object.entries(MAP)) {
    if (d.startsWith('_')) continue;
    assert.match(c.path, /^\/[a-z_-]+$/, d);
    assert.equal(c.method, 'POST', d);
    assert.ok(['json', 'form', 'b64'].includes(c.enc), d);
    assert.deepEqual(Object.keys(c.keys).sort(), ['lang', 'path', 'ref', 'sh', 'sw', 'title', 'tz'], d);
  }
});

test('counter: each page script posts to its own path with its own field names, only on its production host', () => {
  for (const d of Object.keys(FILES)) {
    const s = src(d), c = MAP[d];
    assert.ok(s.includes("'" + c.path + "'"), d + ': path');
    assert.ok(s.includes(d), d + ': host check');
    assert.ok(s.includes('navigator.webdriver'), d + ': automation skipped');
    for (const [f, k] of Object.entries(c.keys)) {
      if (d === 'pingalto.com' && f === 'tz') continue;
      assert.ok(c.enc === 'form' ? s.includes("f.set('" + k + "'") : new RegExp('[{,] ?' + k + '[:,} ]').test(s), d + ': field ' + f + ' as ' + k);
    }
    if (c.enc === 'b64') assert.ok(s.includes('btoa('), d);
    if (c.enc === 'form') assert.ok(s.includes('new URLSearchParams()'), d);
  }
  const paths = Object.keys(FILES).map(d => MAP[d].path), names = Object.keys(FILES).map(d => Object.values(MAP[d].keys).sort().join());
  assert.equal(new Set(paths).size, 3);
  assert.equal(new Set(names).size, 3);
  assert.equal(new Set(Object.keys(FILES).map(d => MAP[d].enc)).size, 3);
});
