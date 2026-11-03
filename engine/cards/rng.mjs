// Seeded generator for card games: xoshiro128** whose four state words come from splitmix64 (docs/TRAPS.md: never mulberry32
// with consecutive seeds). Pure, no DOM, same stream in the browser and in Node. The state is four uint32 numbers, so a game
// state that carries it stays plain JSON (serialize, restore, continue the same deal sequence).

const M64 = (1n << 64n) - 1n;

// splitmix64 (Steele, Lea, Flood 2014; reference constants of Vigna's splitmix64.c). Returns BigInt outputs.
export function splitmix64(seed) {
  let s = BigInt.asUintN(64, BigInt(seed));
  return () => {
    s = (s + 0x9e3779b97f4a7c15n) & M64;
    let z = s;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & M64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & M64;
    return z ^ (z >> 31n);
  };
}

// A seed is a non-negative safe integer or a string (FNV-1a 64 of its UTF-8 bytes). Anything else is an error.
export function seedToBigInt(seed) {
  if (typeof seed === 'number') {
    if (!Number.isSafeInteger(seed) || seed < 0) throw new Error('seed: a non-negative safe integer or a string');
    return BigInt(seed);
  }
  if (typeof seed === 'string' && seed.length) {
    let h = 0xcbf29ce484222325n;
    for (const b of new TextEncoder().encode(seed)) h = ((h ^ BigInt(b)) * 0x100000001b3n) & M64;
    return h;
  }
  throw new Error('seed: a non-negative safe integer or a non-empty string');
}

export function seedState(seed) {
  const sm = splitmix64(seedToBigInt(seed));
  const a = sm(), b = sm();
  const s = [Number(a & 0xffffffffn), Number(a >> 32n), Number(b & 0xffffffffn), Number(b >> 32n)];
  if ((s[0] | s[1] | s[2] | s[3]) === 0) s[0] = 1;
  return s;
}

const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0;

// Generator from a seed or from saved state words: { u32(), float() in [0,1), int(n) in [0,n), state() }.
export function createRng(seed) {
  return fromState(seedState(seed));
}
export function fromState(words) {
  if (!Array.isArray(words) || words.length !== 4 || !words.every(w => Number.isInteger(w) && w >= 0 && w <= 0xffffffff))
    throw new Error('rng state: four uint32 words');
  if ((words[0] | words[1] | words[2] | words[3]) === 0) throw new Error('rng state: all zero');
  let [a, b, c, d] = words;
  const u32 = () => {
    const r = Math.imul(rotl(Math.imul(b, 5) >>> 0, 7), 9) >>> 0;
    const t = (b << 9) >>> 0;
    c = (c ^ a) >>> 0; d = (d ^ b) >>> 0; b = (b ^ c) >>> 0; a = (a ^ d) >>> 0; c = (c ^ t) >>> 0; d = rotl(d, 11);
    return r;
  };
  return {
    u32,
    float: () => u32() / 4294967296,
    int(n) {
      if (!(Number.isInteger(n) && n > 0 && n <= 4294967296)) throw new Error('int(n): n out of range');
      const lim = 4294967296 - (4294967296 % n);
      let x; do x = u32(); while (x >= lim);
      return x % n;
    },
    state: () => [a, b, c, d],
  };
}
