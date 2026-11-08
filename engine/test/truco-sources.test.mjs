import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { visibleText, normalize, hasQuote } from '../text.mjs';
import { PDFTOTEXT } from '../pdf.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sources/truco/rules.json'), 'utf8'));

const textOf = d => {
  const f = path.join(ROOT, d.file);
  if (f.endsWith('.pdf')) return normalize(execFileSync(PDFTOTEXT, ['-layout', f, '-'], { encoding: 'utf8' }));
  return visibleText(fs.readFileSync(f, 'utf8'));
};

test('truco rule sources: saved copies match their sha256', () => {
  for (const [slug, d] of Object.entries(src.docs)) {
    assert.match(d.url, /^https:\/\//, slug);
    assert.equal(d.status, 200, slug);
    assert.match(d.fetched, /^\d{4}-\d{2}-\d{2}$/, slug);
    const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, d.file))).digest('hex');
    assert.equal(sha, d.sha256, slug + ' sha256');
  }
});

test('truco rule sources: every quote is verbatim in its document', () => {
  const texts = Object.fromEntries(Object.entries(src.docs).map(([k, d]) => [k, textOf(d)]));
  for (const [k, q] of Object.entries(src.quotes)) {
    assert.ok(texts[q.doc], k + ': unknown document ' + q.doc);
    assert.ok(hasQuote(texts[q.doc], src.docs[q.doc].file.endsWith('.pdf'), q.text), k + ': quote not found in ' + q.doc + ': ' + q.text.slice(0, 60));
    assert.ok(q.uses, k + ': says where it is used');
  }
  const gba = texts['gba-2026'];
  assert.ok(!hasQuote(gba, true, 'El TRUCO querido y ganado valdrá tres (3) TANTOS'), 'a changed number must not pass');
});
