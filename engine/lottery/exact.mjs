// Exact arithmetic for the lottery engine: input checks with no silent defaults, BigInt binomials, reduced fractions, the
// hypergeometric law. Pure module (no DOM, no file system): runs in the browser and in Node. Patterns from
// /home/dev/kenomath/engine (comb.mjs, check.mjs). Floats appear only in toNumber()/oneIn() for display.

export class EngineError extends Error {
  constructor(code, message) { super(message); this.name = 'EngineError'; this.code = code; }
}
export const fail = (code, msg) => { throw new EngineError(code, msg); };

const show = v => (typeof v === 'string' ? JSON.stringify(v) : String(v));
export function num(v, name) {
  if (v === undefined || v === null) fail('MISSING', name + ' is required (no default)');
  if (typeof v !== 'number' || !Number.isFinite(v)) fail('NOT_A_NUMBER', name + ' must be a finite number (got ' + show(v) + ')');
  return v;
}
export function int(v, name, min, max) {
  num(v, name);
  if (!Number.isInteger(v)) fail('NOT_INTEGER', name + ' must be a whole number (got ' + v + ')');
  if (min !== undefined && v < min) fail('INT_RANGE', name + ' must be at least ' + min + ' (got ' + v + ')');
  if (max !== undefined && v > max) fail('INT_RANGE', name + ' must be at most ' + max + ' (got ' + v + ')');
  return v;
}
export function required(obj, key, where) {
  if (obj === null || typeof obj !== 'object') fail('MISSING', where + ': options object is required');
  if (!(key in obj) || obj[key] === undefined) fail('MISSING', where + ': option "' + key + '" is required (no default)');
  return obj[key];
}

// ---------- binomials ----------
const binomCache = new Map();
export function binom(n, k) {
  int(n, 'n', 0); int(k, 'k');
  if (k < 0 || k > n) return 0n;
  k = Math.min(k, n - k);
  const key = n * 4096 + k;
  if (n < 4096 && binomCache.has(key)) return binomCache.get(key);
  let r = 1n;
  for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i);
  if (n < 4096) binomCache.set(key, r);
  return r;
}

// ---------- fractions { n, d } of BigInt, reduced, d > 0 ----------
const babs = x => (x < 0n ? -x : x);
function gcd(a, b) { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; }
const big = (v, name) => (typeof v === 'bigint' ? v : BigInt(int(v, name)));
export function frac(n, d = 1n) {
  n = big(n, 'numerator'); d = big(d, 'denominator');
  if (d === 0n) fail('DIV_ZERO', 'fraction with zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return Object.freeze({ n: n / g, d: d / g });
}
export const ZERO = frac(0n), ONE = frac(1n);
export const add = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => frac(a.n * b.n, a.d * b.d);
export const div = (a, b) => { if (b.n === 0n) fail('DIV_ZERO', 'division by zero'); return frac(a.n * b.d, a.d * b.n); };
export const eq = (a, b) => a.n === b.n && a.d === b.d;
export const cmp = (a, b) => { const x = a.n * b.d - b.n * a.d; return x < 0n ? -1 : x > 0n ? 1 : 0; };
export const sum = list => list.reduce(add, ZERO);
export const pow = (a, e) => { int(e, 'exponent', 0); return frac(a.n ** BigInt(e), a.d ** BigInt(e)); };
// A decimal written in a source ("9.14", 23.25, 47.8) as an exact fraction (never through binary floating point).
export function dec(v) {
  const s = typeof v === 'number' ? String(v) : v;
  if (!/^-?\d+(\.\d+)?$/.test(s)) fail('NOT_A_NUMBER', 'not a plain decimal: ' + show(v));
  const [i, f = ''] = s.split('.');
  return frac(BigInt(i + f), 10n ** BigInt(f.length));
}
export const pct = v => div(dec(v), frac(100n));
// Money: a peso amount with at most two decimals (no floats inside the engine).
export function pesos(v, name) {
  num(v, name);
  if (!(v > 0)) fail('NOT_POSITIVE', name + ' must be greater than 0 (got ' + v + ')');
  const cents = Math.round(v * 100);
  if (Math.abs(cents - v * 100) > 1e-6) fail('MONEY_PRECISION', name + ' must have at most two decimals (got ' + v + ')');
  return frac(BigInt(cents), 100n);
}

export function toNumber(q) {
  if (q.n === 0n) return 0;
  const neg = q.n < 0n, n = babs(q.n), d = q.d;
  const s = 64 - (n.toString(2).length - d.toString(2).length);
  const scaled = s >= 0 ? (n << BigInt(s)) / d : n / (d << BigInt(-s));
  const v = Number(scaled) * 2 ** -s;
  return neg ? -v : v;
}
// "1 in N" as lotteries publish odds: d/n.
export function oneIn(q) {
  if (q.n <= 0n) fail('PROB_ZERO', 'probability is zero - there are no "1 in N" odds');
  return toNumber(frac(q.d, q.n));
}

// P(exactly k marked among `draw` items taken without replacement from `pool`, `marked` of them marked).
export function hypergeom(pool, marked, draw, k) {
  int(pool, 'pool', 1); int(marked, 'marked', 0); int(draw, 'draw', 0); int(k, 'k', 0);
  if (marked > pool || draw > pool) fail('RANGE', 'marked and draw cannot exceed pool');
  return frac(binom(marked, k) * binom(pool - marked, draw - k), binom(pool, draw));
}
// P(exactly k successes in n independent trials with probability p) - p is a fraction.
export function binomialPmf(n, p, k) {
  int(n, 'n', 0); int(k, 'k', 0);
  if (k > n) return ZERO;
  return frac(binom(n, k) * p.n ** BigInt(k) * (p.d - p.n) ** BigInt(n - k), p.d ** BigInt(n));
}
