// Site search engine shared by the three sites (build: tools/lib/search.mjs writes the index; browser: each site's own client UI).
// Pure functions, no DOM, no network. Matching ignores case and accents ("tucuman" = "Tucumán"), takes word prefixes ("pag" ->
// "paga") and forgives one typo in words of 4+ letters (two in 8+). Index format (one file per site and language):
//   { v: 1, p: [ { u: path, t: H1, n: title, d: description, k: key terms, x: 1 if allowed on help pages, s: [[anchor, heading, text], ...] } ] }

export function fold(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
export const words = s => { const f = fold(s); return f ? f.split(' ') : []; };

// Damerau-Levenshtein distance, stopped early above max
export function dist(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length;
  let pp = null, p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const c = [i];
    let low = i;
    for (let j = 1; j <= n; j++) {
      let v = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, pp[j - 2] + 1);
      c.push(v);
      if (v < low) low = v;
    }
    if (low > max) return max + 1;
    pp = p; p = c;
  }
  return p[n];
}

// how well one query token matches one word of the text: 1 exact, 0.85 prefix, 0.6 typo, 0 none
export function tokenMatch(q, w) {
  if (w === q) return 1;
  if (q.length >= 2 && w.startsWith(q)) return 0.85;
  if (q.length < 4) return 0;
  const max = q.length >= 8 ? 2 : 1;
  if (dist(q, w, max) <= max) return 0.6;
  if (q.length >= 5 && w.length > q.length && dist(q, w.slice(0, q.length), 1) <= 1) return 0.5;
  return 0;
}
// prepare a loaded index for fast queries: every distinct word once (a query token is compared with the vocabulary, not with
// every occurrence), fields as lists of word numbers
export function prepare(index) {
  const vocab = new Map(), list = [];
  const ids = s => words(s).map(w => { let i = vocab.get(w); if (i === undefined) { i = list.length; vocab.set(w, i); list.push(w); } return i; });
  const entries = (index.p || []).map((p, i) => ({
    i, p,
    f: { t: ids(p.t), n: ids(p.n), u: ids(p.u.replace(/[/-]+/g, ' ')), d: ids(p.d), k: ids(p.k) },
    s: (p.s || []).map(([a, h, x]) => ({ a, h, x, hw: ids(h), xw: ids(x) })),
  }));
  return { entries, words: list };
}

const W = { t: 8, n: 6, u: 5, k: 4, d: 2.5 };
const SH = 5, SX = 1.5;
const STOP = new Set(['de', 'la', 'el', 'los', 'las', 'en', 'y', 'a', 'del', 'que', 'se', 'un', 'una', 'al', 'con', 'por', 'para', 'es', 'lo', 'mi', 'tu', 'the', 'of', 'in', 'and', 'to', 'for', 'is', 'how', 'what']);
const best = (m, ids) => { let b = 0; for (const i of ids) if (m[i] > b) b = m[i]; return b; };

// results: [{ u, t, d, x, sec: { a, h, x } | null, score, hits: [query tokens matched] }], best first
export function query(prepared, q, { limit = 12, allow = null } = {}) {
  let toks = words(q);
  const content = toks.filter(t => !STOP.has(t));
  if (content.length) toks = content;
  toks = [...new Set(toks)].slice(0, 8);
  if (!toks.length) return [];
  const M = toks.map(t => { const m = new Float32Array(prepared.words.length); prepared.words.forEach((w, i) => { m[i] = tokenMatch(t, w); }); return m; });
  const out = [];
  for (const e of prepared.entries) {
    if (allow && !allow(e.p)) continue;
    let page = 0, matched = 0, own = 0;
    const secScore = e.s.map(() => 0), secHead = e.s.map(() => 0);
    for (const m of M) {
      const f = Object.keys(W).map(k => best(m, e.f[k]) * W[k]).sort((a, b) => b - a);
      let stop = 0;
      e.s.forEach((s, j) => {
        const h = best(m, s.hw) * SH, x = best(m, s.xw) * SX, v = Math.max(h, x);
        secScore[j] += v; if (h) secHead[j] += h;
        if (v > stop) stop = v;
      });
      const v = Math.max(f[0] + 0.3 * f[1], stop * 0.8);
      if (v > 0) { matched++; page += v; }
      own += Math.max(best(m, e.f.t) * W.t, best(m, e.f.n) * W.n, best(m, e.f.u) * W.u);
    }
    if (!matched) continue;
    const need = toks.length <= 2 ? toks.length : Math.ceil(toks.length * 0.6);
    if (matched < need) continue;
    let sec = null, sb = 0;
    secScore.forEach((v, j) => { if (secHead[j] > 0 && v > sb) { sb = v; sec = j; } });
    if (sec !== null && own >= sb) sec = null;
    out.push({ u: e.p.u, t: e.p.t, d: e.p.d, x: e.p.x, sec: sec === null ? null : { a: e.s[sec].a, h: e.s[sec].h, x: e.s[sec].x }, score: page * (matched / toks.length) + (sec !== null ? sb * 0.15 : 0) - e.i * 0.0005, hits: toks });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

// split a text into [plain, marked, plain, ...] parts for the words that match the query (for a <mark> highlight without innerHTML)
export function marks(text, toks) {
  const parts = [];
  const re = /[\p{L}\p{N}]+/gu;
  let last = 0, m;
  while ((m = re.exec(text))) {
    const w = fold(m[0]);
    if (toks.some(t => tokenMatch(t, w) >= 0.6)) {
      if (m.index > last) parts.push([text.slice(last, m.index), 0]);
      parts.push([m[0], 1]);
      last = m.index + m[0].length;
    }
  }
  if (last < text.length) parts.push([text.slice(last), 0]);
  return parts;
}
