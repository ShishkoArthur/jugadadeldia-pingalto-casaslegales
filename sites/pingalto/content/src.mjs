// Sources of every number on pingalto (data/sources/pingalto/sources.json): saved documents with sha256 and date, verbatim
// quotes, values that must be written inside their quote. load() refuses a changed or stale document and an unquoted value,
// so the build stops before a page can show an unverified number. JSON documents (Wikidata, Valve SDR) are read directly.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { visibleText, normalize } from '../../../engine/text.mjs';
import { checkFacts } from '../../../engine/games/cite.mjs';
import { parsePoint } from '../../../engine/games/geo.mjs';
import { daysBetween } from '../../../engine/format.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
export const SOURCES_FILE = 'data/sources/pingalto/sources.json';

export function load({ today, root = ROOT } = {}) {
  const src = JSON.parse(readFileSync(join(root, SOURCES_FILE), 'utf8'));
  const errs = [];
  const raw = {};
  for (const [slug, d] of Object.entries(src.docs)) {
    const f = join(root, d.file || '');
    if (!d.file || !existsSync(f)) { errs.push(slug + ': saved document missing'); continue; }
    const buf = readFileSync(f);
    if (createHash('sha256').update(buf).digest('hex') !== d.sha256) errs.push(slug + ': sha256 mismatch');
    if (d.status !== 200) errs.push(slug + ': status ' + d.status);
    if (!/^https:\/\//.test(d.url)) errs.push(slug + ': url must be https');
    if (today) { const age = daysBetween(d.fetched, today); if (age < 0 || age > src.maxAgeDays) errs.push(slug + ': copied ' + d.fetched + ', ' + age + ' days ago (max ' + src.maxAgeDays + ')'); }
    raw[slug] = buf.toString('utf8');
  }
  const text = {};
  const textOf = slug => {
    if (raw[slug] == null) return null;
    if (!text[slug]) text[slug] = src.docs[slug].type === 'html' ? visibleText(raw[slug]) : normalize(raw[slug]);
    return text[slug];
  };
  errs.push(...checkFacts(src, textOf));
  if (errs.length) throw new Error('pingalto sources:\n  ' + errs.join('\n  '));
  const json = slug => JSON.parse(raw[slug]);
  const fact = id => { const f = src.facts[id]; if (!f) throw new Error('no fact ' + id); return f.value; };
  const capitals = json('wd-capitals').results.bindings.map(b => ({ id: b.prov.value.split('/').pop(), prov: b.provLabel.value.replace(/^Provincia de /, ''), city: b.capLabel.value, ...parsePoint(b.coord.value) }));
  const cityRows = json('wd-cities').results.bindings.map(b => ({ id: b.item.value.split('/').pop(), name: b.itemLabel.value, ...parsePoint(b.coord.value) }));
  const city = q => cityRows.find(c => c.id === q) || (() => { throw new Error('no city ' + q); })();
  const sdr = json('valve-sdr');
  const pop = code => { const p = sdr.pops[code]; if (!p || !p.geo) throw new Error('no Valve point ' + code); return { code, desc: p.desc, lon: p.geo[0], lat: p.geo[1] }; };
  const typical = (a, b) => { const r = sdr.typical_pings.find(x => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a)); if (!r) throw new Error('no typical ping ' + a + '-' + b); return r[2]; };
  return { src, fact, json, raw: slug => { if (raw[slug] == null) throw new Error('no document ' + slug); return raw[slug]; }, doc: slug => ({ slug, ...src.docs[slug] }), capitals, city, pop, typical, sdrRevision: sdr.revision };
}
