// Address check against the official lists (casaslegales.com /verificador, server and browser). Pure functions, no network.
// entries: [{ host, jur, brand }] taken from the verified registries. Three answers:
//   listed  - the address is a listed address, or a subdomain of one (m.betano.bet.ar under betano.bet.ar)
//   similar - same name with another ending (betsson.com), a parent of a listed address (bplay.bet.ar), or a name one or two
//             letters away from a listed one (betsso.bet.ar)
//   none    - nothing of the above in the lists we checked (which is not the same as "illegal")
import { hostKey } from './registry.mjs';

const SUFFIXES = ['bet.ar', 'com.ar', 'net.ar', 'org.ar', 'gob.ar', 'gov.ar', 'co.uk', 'com.br', 'com.co', 'com.mx', 'com.pe', 'com.uy'];
// split a host into its subdomain part, its name (the label right before the ending) and the ending
export function anatomy(input) {
  const host = hostKey(input);
  if (!host || !host.includes('.')) return null;
  const parts = host.split('.');
  const suf2 = parts.slice(-2).join('.');
  const n = SUFFIXES.includes(suf2) && parts.length > 2 ? 2 : 1;
  const ending = parts.slice(-n).join('.');
  const name = parts[parts.length - n - 1] || '';
  const sub = parts.slice(0, parts.length - n - 1).join('.');
  return { host, sub, name, ending, betAr: ending === 'bet.ar' };
}
export function distance(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
export function checkHost(input, entries) {
  const a = anatomy(input);
  if (!a) return { state: 'empty', host: hostKey(input) };
  const exact = entries.filter(e => e.host === a.host);
  if (exact.length) return { state: 'listed', how: 'exact', host: a.host, anatomy: a, matches: exact };
  const under = entries.filter(e => a.host.endsWith('.' + e.host));
  if (under.length) return { state: 'listed', how: 'subdomain', host: a.host, anatomy: a, matches: under };
  const near = [];
  for (const e of entries) {
    const b = anatomy(e.host);
    if (e.host.endsWith('.' + a.host)) near.push({ ...e, why: 'parent' });
    else if (b.name === a.name) near.push({ ...e, why: 'name' });
    else if (a.name.length >= 5 && b.name.length >= 5 && distance(a.name, b.name) <= 2) near.push({ ...e, why: 'typo' });
    else if (b.name.length >= 6 && a.name.includes(b.name)) near.push({ ...e, why: 'contains' });
  }
  if (near.length) return { state: 'similar', host: a.host, anatomy: a, matches: near };
  return { state: 'none', host: a.host, anatomy: a, matches: [] };
}
// Self-exclusion terms as written by the regulators ("2 años", "dos (2) años", "seis (6) meses", "entre un mínimo de tres meses y
// un máximo de cinco años", "irrevocable por un año") -> months; null when the text has no duration.
const WORDS = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, doce: 12 };
export function termMonths(text) {
  if (!text) return null;
  const re = /(\d+|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce)\s*(?:\(\s*(?:\d+|un|uno)\s*\)\s*)?(a[nñ]os?|mes(?:es)?)\b/gi;
  const found = [];
  for (const m of String(text).matchAll(re)) {
    const k = m[1].toLowerCase();
    const v = /^\d+$/.test(k) ? +k : WORDS[k];
    found.push(/^a/i.test(m[2]) ? v * 12 : v);
  }
  if (!found.length) return null;
  return { min: Math.min(...found), max: Math.max(...found) };
}
