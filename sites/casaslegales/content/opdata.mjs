// Build-time access to the operator facts (data/sources/operators/operators.json) and screenshots (data/shots/shots.json).
// The facts are verified here (tools/lib/opsources.mjs) before any page uses them: a quote not found verbatim, a changed
// copy or a copy older than its limit stops the build.
import { checkOperators, loadOperators, loadShots } from '../../../tools/lib/opsources.mjs';
import { hostKey } from '../../../engine/registry.mjs';

let cache = null;
export function opData(today) {
  if (cache && cache.today === today) return cache;
  const errs = checkOperators({ today });
  if (errs.length) throw new Error('operator facts are not verified:\n' + errs.join('\n') + '\n(node tools/verify-operators.mjs)');
  const data = loadOperators(), shots = loadShots();
  cache = { today, data, shots };
  return cache;
}
export const quotesOf = (D, brand, topic) => Object.entries(D.data.quotes).filter(([, q]) => q.brand === brand && (!topic || q.topic === topic || q.topic.startsWith(topic + '-'))).map(([id, q]) => ({ id, ...q }));
export const quoteById = (D, id) => { const q = D.data.quotes[id]; if (!q) throw new Error('no operator quote ' + id); return { id, ...q }; };
export const docOf = (D, slug) => { const d = D.data.docs[slug]; if (!d) throw new Error('no operator document ' + slug); return { slug, ...d, host: hostKey(d.url), path: new URL(d.url).pathname.replace(/\/$/, '') || '/' }; };
export const shotsOf = (D, brand) => (D.data.brands[brand] || { shots: [] }).shots.map(id => D.shots[id]);
export const visitsOf = D => brand => Object.values(D.shots).filter(s => s.brand === brand);
export const SHOT_FILES = () => {
  const d = loadOperators();
  return [...new Set(Object.values(d.brands).flatMap(b => b.shots || []))].map(id => 'shots/' + id + '.webp');
};
