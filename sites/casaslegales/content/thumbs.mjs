// Card thumbnails of /operadores: the top of one of our own screenshots per brand (never someone else's image), so a card shows
// what the brand's public site looks like. Made by `node sites/casaslegales/content/thumbs.mjs` (sharp) into
// static/shots/thumb-<brand>.webp, always THUMB.w x THUMB.h; a brand without a file simply has no thumbnail.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadOperators, loadShots } from '../../../tools/lib/opsources.mjs';
import { loadReviews } from '../../../tools/lib/revsources.mjs';
import { ROOT } from '../../../tools/env.mjs';
import { reviewShotName } from './reviews.mjs';
import { OPS } from './operators.mjs';

const DIR = path.join(ROOT, 'sites/casaslegales/static/shots');
export const THUMB = { w: 720, h: 405 };
export const thumbName = brand => 'thumb-' + brand + '.webp';
const VIEWS = ['home', 'sportsbook', 'casino', 'match-markets', 'payments', 'rg'];
const KINDS = ['sports', 'home', 'parked', 'footer', 'rg', 'pay'];
const rank = (list, x) => (list.includes(x) ? list.indexOf(x) : list.length);
// a screenshot narrower than the thumbnail would be blown up: those go last, and alone they give no thumbnail
const small = s => (s.width && s.width < THUMB.w ? 100 : 0);

// the screenshot a thumbnail is cut from: a review shot taken in Argentina first (home page first), else an operator shot that loaded
// (its sports page before its home page, whose top is often a promotional banner)
// brands whose only usable screenshots open with a promotional banner showing people: no thumbnail (the site shows no people)
const SKIP = new Set(['betwarrior']);
export function thumbSource(brand) {
  if (SKIP.has(brand)) return null;
  const r = loadReviews()[brand];
  const rs = ((r && r.shots) || []).filter(s => fs.existsSync(path.join(DIR, reviewShotName(brand, s.view)))).sort((a, b) => small(a) + rank(VIEWS, a.view) - small(b) - rank(VIEWS, b.view));
  if (rs.length && !small(rs[0])) return { file: reviewShotName(brand, rs[0].view), date: rs[0].date };
  const S = loadShots();
  const ls = ((loadOperators().brands[brand] || {}).shots || []).map(id => S[id]).filter(s => s && (s.ok || s.kind === 'parked') && s.kind !== 'block' && fs.existsSync(path.join(DIR, s.id + '.webp'))).sort((a, b) => small(a) + rank(KINDS, a.kind) - small(b) - rank(KINDS, b.kind));
  return ls.length && !small(ls[0]) ? { file: ls[0].id + '.webp', date: ls[0].date } : null;
}
export const hasThumb = brand => fs.existsSync(path.join(DIR, thumbName(brand)));
export const thumbFiles = () => OPS.map(o => o.brand).filter(hasThumb).map(b => 'shots/' + thumbName(b));

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const { default: sharp } = await import('sharp');
  for (const o of OPS) {
    const src = thumbSource(o.brand), out = path.join(DIR, thumbName(o.brand));
    if (!src) { if (fs.existsSync(out)) fs.rmSync(out); console.log(o.brand + ': no own screenshot, no thumbnail'); continue; }
    await sharp(path.join(DIR, src.file)).resize({ width: THUMB.w, height: THUMB.h, fit: 'cover', position: 'top' }).webp({ quality: 74 }).toFile(out);
    console.log(o.brand + ': ' + src.file + ' -> ' + thumbName(o.brand) + ' (' + fs.statSync(out).size + ' B)');
  }
}
