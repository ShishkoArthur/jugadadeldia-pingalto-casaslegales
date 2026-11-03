// pingalto brand policies (data/sources/pingalto/brand-policies.json): every quote verbatim in its saved copy, sha256 of every copy,
// and the site uses no publisher logo the policy file does not mark as allowed and used.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { visibleText, normalize } from '../text.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const P = JSON.parse(readFileSync(join(ROOT, 'data/sources/pingalto/brand-policies.json'), 'utf8'));

test('brand policy copies match their sha256 and hold every quote', () => {
  const text = {};
  for (const [slug, d] of Object.entries(P.docs)) {
    const raw = readFileSync(join(ROOT, d.file));
    assert.equal(createHash('sha256').update(raw).digest('hex'), d.sha256, slug + ': sha256');
    text[slug] = normalize(visibleText(raw.toString('utf8')));
  }
  let n = 0;
  for (const [pub, p] of Object.entries(P.publishers)) for (const { doc, q } of p.quotes) {
    assert.ok(text[doc], pub + ': unknown doc ' + doc);
    assert.ok(text[doc].includes(normalize(q)), pub + ': quote not in ' + doc + ': ' + q.slice(0, 60));
    n++;
  }
  assert.ok(n >= 15);
});

test('no publisher logo file is shipped unless the policy marks it used', () => {
  const dir = join(ROOT, 'sites/pingalto/static');
  const used = Object.entries(P.publishers).filter(([, p]) => p.used === true).flatMap(([, p]) => p.games);
  const logos = existsSync(join(dir, 'logos')) ? readdirSync(join(dir, 'logos')) : [];
  for (const f of logos) assert.ok(used.some(g => f.startsWith(g + '.') || f.startsWith(g + '-')), 'logo without permission: ' + f);
});
