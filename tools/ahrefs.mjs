// Ahrefs keyword collection (copy of the blackjack.cab sample): node tools/ahrefs.mjs <mode> <country> <phrase|comma-separated phrases> [limit]
// modes: matching (matching-terms), related (related-terms), overview. Output goes to data/keywords/.
// Variables: AH_TERMS=questions (questions only), AH_MAXKD=20 (difficulty filter), AH_TAG=label in the file name.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { envKey, ROOT } from './env.mjs';

const [mode, country, kw, limit = '200'] = process.argv.slice(2);
const ep = { matching: 'matching-terms', related: 'related-terms', overview: 'overview' }[mode];
if (!ep || !country || !kw) { console.error('usage: mode country keywords [limit]'); process.exit(2); }
// AH_SELECT=keyword,volume,difficulty - fewer columns, about half the units per row
const sel = process.env.AH_SELECT ? process.env.AH_SELECT : mode === 'overview'
  ? 'keyword,volume,difficulty,traffic_potential,parent_topic,intents'
  : 'keyword,volume,difficulty,traffic_potential,parent_topic';
const q = new URLSearchParams({ country, keywords: kw, select: sel });
if (mode !== 'overview') { q.set('limit', limit); q.set('order_by', 'volume:desc'); }
if (process.env.AH_TERMS) q.set('terms', process.env.AH_TERMS);
if (process.env.AH_MAXKD) q.set('where', JSON.stringify({ field: 'difficulty', is: ['lte', +process.env.AH_MAXKD] }));
const r = await fetch(`https://api.ahrefs.com/v3/keywords-explorer/${ep}?${q}`, {
  headers: { Authorization: `Bearer ${envKey('AHREFS_API_KEY')}` } });
const j = await r.json();
if (!r.ok) { console.error(r.status, JSON.stringify(j)); process.exit(1); }
const rows = j.keywords || [];
const file = join(ROOT, 'data/keywords', `${mode}${process.env.AH_TAG ? '-' + process.env.AH_TAG : ''}-${country}-${kw.replace(/[^a-z0-9]+/gi, '_').slice(0, 60)}.json`);
writeFileSync(file, JSON.stringify({ fetched: new Date().toISOString(), mode, country, kw, rows }, null, 1));
for (const x of rows) console.log([x.volume, x.difficulty ?? '', x.traffic_potential ?? '', x.keyword, x.parent_topic ?? ''].join('\t'));
console.error(`${rows.length} rows -> ${file}`);
