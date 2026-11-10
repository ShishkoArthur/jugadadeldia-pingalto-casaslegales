// Official game art of pingalto (owner 2026-11-10): one list, data/sources/pingalto/assets.json. Every hosted file is listed with its
// source URL, date and sha256 (bytes unmodified), nothing unlisted is shipped, each publisher has its notice, and switching a
// publisher off removes all of its files from the build.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artFiles, lolArt } from '../../sites/pingalto/content/art.mjs';
import { ATTRIBUTION } from '../../tools/feeds/pingalto/supercell.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const A = JSON.parse(readFileSync(join(ROOT, 'data/sources/pingalto/assets.json'), 'utf8'));
const P = JSON.parse(readFileSync(join(ROOT, 'data/sources/pingalto/brand-policies.json'), 'utf8'));
const walk = d => existsSync(d) ? readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)).map(x => f + '/' + x) : [f]) : [];

test('every hosted file is listed, unmodified, from the publisher host', () => {
  const listed = new Set();
  for (const s of A.sets) {
    assert.ok(A.publishers[s.publisher], s.id + ': unknown publisher');
    assert.ok(s.source && s.robots, s.id + ': source and robots note');
    if (!s.dir) { assert.ok(s.server && s.list, s.id + ': server art names its list'); continue; }
    assert.ok(s.files.length > 100, s.id + ': files');
    const host = new URL(s.files[0].url).hostname;
    for (const f of s.files) {
      const p = join(ROOT, s.dir, f.file), b = readFileSync(p);
      assert.equal(createHash('sha256').update(b).digest('hex'), f.sha256, f.file);
      assert.equal(b.length, f.bytes, f.file);
      assert.equal(new URL(f.url).hostname, host, f.file + ': one host per set');
      assert.match(f.fetched, /^\d{4}-\d{2}-\d{2}$/);
      listed.add(s.dir + '/' + f.file);
    }
  }
  for (const f of walk(join(ROOT, 'sites/pingalto/static/art'))) assert.ok(listed.has('sites/pingalto/static/art/' + f), 'unlisted art file ' + f);
});

test('publisher notices: Riot Legal Jibber Jabber wording, Supercell attribution', () => {
  const ljj = P.publishers.riot.quotes.find(q => /Legal Jibber Jabber/.test(q.q)).q;
  assert.ok(A.publishers.riot.notice.endsWith(ljj));
  assert.equal(A.publishers.supercell.notice, ATTRIBUTION);
  for (const [k, p] of Object.entries(A.publishers)) assert.equal(typeof p.enabled, 'boolean', k);
});

test('one switch removes all art of a publisher from the build', () => {
  const on = artFiles(A);
  assert.ok(on.length > 100 && on.every(f => f.startsWith('art/')));
  const off = structuredClone(A);
  off.publishers.riot.enabled = false;
  const left = artFiles(off), riotDirs = A.sets.filter(s => s.publisher === 'riot' && s.dir).map(s => s.dir.replace('sites/pingalto/static/', ''));
  assert.ok(!left.some(f => riotDirs.some(d => f.startsWith(d + '/'))));
  if (A.publishers.riot.enabled) assert.ok(lolArt('Ahri'));
});
