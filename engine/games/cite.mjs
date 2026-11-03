// Checks of quoted facts (pingalto sources): each fact names a saved document, a verbatim quote and a value; the value (or its
// `token`, or every item of a list value) must be written inside the quote, and the quote must be inside the document text.
// Pure: the caller gives textOf(slug) -> normalized visible text of the saved document.
import { normalize } from '../text.mjs';

export function tokensOf(f) {
  if (f.token !== undefined) return [String(f.token)];
  if (Array.isArray(f.value)) return f.value.map(String);
  return [String(f.value)];
}
export function checkFacts(src, textOf) {
  const errs = [];
  for (const [id, f] of Object.entries(src.facts || {})) {
    if (!src.docs[f.doc]) { errs.push(id + ': unknown document ' + f.doc); continue; }
    const q = normalize(String(f.quote || ''));
    if (!q) { errs.push(id + ': empty quote'); continue; }
    const t = textOf(f.doc);
    if (t == null) { errs.push(id + ': document ' + f.doc + ' not readable'); continue; }
    if (!t.includes(q)) errs.push(id + ': quote not found verbatim in ' + f.doc + ': "' + q.slice(0, 60) + '"');
    for (const k of tokensOf(f)) if (!q.includes(k)) errs.push(id + ': value "' + k + '" is not written inside its quote');
  }
  return errs;
}
