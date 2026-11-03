// Tokens for titles and copy. Loads and verifies every pingalto source once per build (content/src.mjs) and keeps it on h.pa
// for the pages; an unverified or stale source stops the build here.
import { load } from './src.mjs';
import { fmtDate, fmtInt } from '../../../engine/format.mjs';

export function facts(h) {
  h.pa = load({ today: h.today });
  const s = h.pa.src;
  return {
    doc_total: fmtInt(Object.keys(s.docs).length),
    fact_total: fmtInt(Object.keys(s.facts).length),
    checked: fmtDate(s.checked),
    max_age: fmtInt(s.maxAgeDays),
  };
}
