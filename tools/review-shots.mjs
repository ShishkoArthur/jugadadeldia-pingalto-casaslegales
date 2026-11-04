#!/usr/bin/env node
// Review screenshots of casaslegales.com: node tools/review-shots.mjs [brand...]
// For every shot listed in data/sources/reviews/<brand>.json ("shots": view, file, url, date, sha256), checks the sha256 of the
// PNG taken in the owner's browser (data/shots/<brand>/review-*.png, not in git) and writes the webp that ships:
// sites/casaslegales/static/shots/review-<brand>-<view>.webp (committed). The build only uses webps that exist (content/reviews.mjs).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './env.mjs';
import { loadReviews } from './lib/revsources.mjs';

const sharp = (await import('sharp')).default;
const OUT = path.join(ROOT, 'sites/casaslegales/static/shots');
import { reviewShotName } from '../sites/casaslegales/content/reviews.mjs';
const only = process.argv.slice(2);
let n = 0, bad = 0;
for (const [brand, r] of Object.entries(loadReviews())) {
  if (only.length && !only.includes(brand)) continue;
  for (const s of r.shots || []) {
    const src = path.join(ROOT, s.file || '');
    const out = path.join(OUT, reviewShotName(brand, s.view));
    if (!s.file || !fs.existsSync(src)) { if (!fs.existsSync(out)) { console.log('  BAD ' + brand + ' ' + s.view + ': no PNG ' + s.file); bad++; } continue; }
    const buf = fs.readFileSync(src);
    if (s.sha256 && crypto.createHash('sha256').update(buf).digest('hex') !== s.sha256) { console.log('  BAD ' + brand + ' ' + s.view + ': sha256 of the PNG differs'); bad++; continue; }
    const m = await sharp(buf).metadata();
    const webp = await sharp(buf).resize({ width: Math.min(m.width, 1280), withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
    fs.writeFileSync(out, webp);
    n++;
  }
}
console.log('review-shots: ' + n + ' webp written' + (bad ? ', ' + bad + ' problems' : ''));
process.exit(bad ? 1 : 0);
