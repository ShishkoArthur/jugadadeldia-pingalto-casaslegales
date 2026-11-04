// Build-time access to the review facts (data/sources/reviews/<brand>.json), verified first (tools/lib/revsources.mjs): a quote
// not found verbatim, a changed copy or a copy older than REVIEW_MAX_AGE (180) days stops the build. Lists and odds that a page shows beyond the
// quote are checked here against the same saved copy (every item, every odd), so nothing on a review is typed by hand.
import fs from 'node:fs';
import path from 'node:path';
import { checkReviews, loadReviews, docText, REVIEW_MAX_AGE } from '../../../tools/lib/revsources.mjs';
import { ROOT } from '../../../tools/env.mjs';
import { normalize } from '../../../engine/text.mjs';
import { daysBetween } from '../../../engine/format.mjs';

const SHOT_DIR = 'sites/casaslegales/static/shots';
export const reviewShotName = (brand, view) => 'review-' + brand + '-' + view + '.webp';
let cache = null;
export function revData(today) {
  if (cache && cache.today === today) return cache.all;
  const errs = checkReviews({ today });
  if (errs.length) throw new Error('review facts are not verified:\n' + errs.join('\n') + '\n(node tools/verify-reviews.mjs)');
  cache = { today, all: loadReviews() };
  return cache.all;
}
export const hasReview = (today, brand) => !!revData(today)[brand] && (revData(today)[brand].facts || []).length > 0;

export function review(today, brand) {
  const r = revData(today)[brand];
  if (!r) return null;
  const texts = {};
  const text = slug => texts[slug] || (texts[slug] = docText(fs.readFileSync(path.join(ROOT, r.docs[slug].file))).parts.join(' '));
  const all = field => (r.facts || []).filter(f => f.field === field);
  const one = field => all(field)[0] || null;
  const pre = prefix => (r.facts || []).filter(f => f.field.startsWith(prefix + '.'));
  // an item shown as text (a payment method, a sport, a provider) must be in the copy the fact cites
  const inDoc = (f, items) => {
    const t = normalize(text(f.doc)).toLowerCase();
    for (const it of items) if (!t.includes(normalize(String(it)).toLowerCase())) throw new Error('review ' + brand + ' ' + f.field + ': "' + it + '" is not in the copy ' + f.doc);
    return items;
  };
  const found = (f, items) => { const t = normalize(text(f.doc)).toLowerCase(); return items.every(it => t.includes(normalize(String(it)).toLowerCase())); };
  // decimal odds as the page prints them (7.80 or 7,80)
  const oddsInDoc = (f, odds) => {
    const t = text(f.doc);
    for (const o of odds) { const a = o.toFixed(2); if (!t.includes(a) && !t.includes(a.replace('.', ','))) throw new Error('review ' + brand + ' ' + f.field + ': odd ' + a + ' is not in the copy ' + f.doc); }
    return odds;
  };
  const oddsFound = (f, odds) => { const t = text(f.doc); return odds.every(o => typeof o === 'number' && (t.includes(o.toFixed(2)) || t.includes(o.toFixed(2).replace('.', ',')))); };
  const shots = (r.shots || []).map(s => ({ ...s, brand, name: reviewShotName(brand, s.view) })).filter(s => fs.existsSync(path.join(ROOT, SHOT_DIR, s.name)));
  for (const s of shots) { const a = daysBetween(s.date, today); if (a < 0 || a > (r.maxAgeDays || REVIEW_MAX_AGE)) throw new Error('review ' + brand + ': shot ' + s.view + ' taken ' + s.date + ' (max ' + (r.maxAgeDays || REVIEW_MAX_AGE) + ' days)'); }
  return { r, brand, one, all, pre, inDoc, found, oddsInDoc, oddsFound, shots, doc: slug => r.docs[slug] };
}
export function reviewShotFiles() {
  const out = [];
  for (const [brand, r] of Object.entries(loadReviews())) for (const s of r.shots || []) {
    const n = reviewShotName(brand, s.view);
    if (fs.existsSync(path.join(ROOT, SHOT_DIR, n))) out.push('shots/' + n);
  }
  return out;
}
