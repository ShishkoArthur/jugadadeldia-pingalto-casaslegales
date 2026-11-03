// pingalto sources (data/sources/pingalto): every quote verbatim in its saved copy, every value inside its quote, sha256 and
// freshness; a changed quote or an old copy must stop the build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { load, SOURCES_FILE } from '../../sites/pingalto/content/src.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const today = JSON.parse(readFileSync(join(ROOT, SOURCES_FILE), 'utf8')).checked;

test('pingalto sources verify', () => {
  const s = load({ today });
  assert.ok(Object.keys(s.src.facts).length > 20);
  assert.equal(s.fact('yaw_valorant'), 0.07);
  assert.equal(s.capitals.length, 23);
  assert.equal(s.pop('eze').desc, 'Buenos Aires (Argentina)');
});

test('pingalto sources: corruptions are caught', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'pa-src-'));
  try {
    mkdirSync(join(tmp, 'data/sources'), { recursive: true });
    cpSync(join(ROOT, 'data/sources/pingalto'), join(tmp, 'data/sources/pingalto'), { recursive: true });
    const f = join(tmp, SOURCES_FILE), orig = readFileSync(f, 'utf8');
    const j = JSON.parse(orig);
    j.facts.yaw_valorant.value = 0.7;
    writeFileSync(f, JSON.stringify(j));
    assert.throws(() => load({ today, root: tmp }), /yaw_valorant: value/);
    const k = JSON.parse(orig);
    k.facts.val_ranks.quote += ' x';
    writeFileSync(f, JSON.stringify(k));
    assert.throws(() => load({ today, root: tmp }), /val_ranks: quote not found/);
    writeFileSync(f, orig);
    assert.throws(() => load({ today: '2099-01-01', root: tmp }), /days ago/);
    const doc = join(tmp, JSON.parse(orig).docs.frt.file);
    writeFileSync(doc, readFileSync(doc, 'utf8') + ' ');
    assert.throws(() => load({ today, root: tmp }), /frt: sha256 mismatch/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
