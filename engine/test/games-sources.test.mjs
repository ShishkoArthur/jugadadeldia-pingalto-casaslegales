import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { visibleText, normalize, hasQuote } from '../text.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const textOf = d => {
  const f = path.join(ROOT, d.file);
  if (f.endsWith('.pdf')) return normalize(execFileSync('pdftotext', ['-layout', f, '-'], { encoding: 'utf8' }));
  return visibleText(fs.readFileSync(f, 'utf8'));
};

for (const game of ['generala', 'chinchon', 'escoba']) {
  const file = path.join(ROOT, 'data/sources', game, 'rules.json');
  test(game + ' rule sources: saved copies match their sha256, every quote is verbatim', { skip: !fs.existsSync(file) }, () => {
    const src = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.match(src.checked, /^\d{4}-\d{2}-\d{2}$/);
    const texts = {};
    for (const [slug, d] of Object.entries(src.docs)) {
      assert.match(d.url, /^https:\/\//, slug);
      assert.equal(d.status, 200, slug);
      assert.match(d.fetched, /^\d{4}-\d{2}-\d{2}$/, slug);
      const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, d.file))).digest('hex');
      assert.equal(sha, d.sha256, slug + ' sha256');
      texts[slug] = textOf(d);
    }
    for (const [k, q] of Object.entries(src.quotes)) {
      assert.ok(texts[q.doc], k + ': unknown document ' + q.doc);
      assert.ok(hasQuote(texts[q.doc], src.docs[q.doc].file.endsWith('.pdf'), q.text), k + ': quote not found in ' + q.doc + ': ' + q.text.slice(0, 70));
      assert.ok(q.uses, k + ': says where it is used');
    }
    const firstPdf = Object.keys(src.docs).find(s => src.docs[s].file.endsWith('.pdf'));
    assert.ok(!hasQuote(texts[firstPdf], true, 'El juego se gana con 7777 puntos'), 'a made-up sentence must not pass');
  });
}
