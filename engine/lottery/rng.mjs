// Random numbers for the lottery engine. xoshiro128** seeded through splitmix64 (docs/TRAPS.md: never mulberry32 with
// consecutive seeds - the streams overlap). Seeded generators are for Monte Carlo checks and reproducible simulations; the
// dice roller on a page uses cryptoRng(). Every generator: { u32(), next() in [0,1) with 53 bits, int(n) in [0,n) unbiased }.
import { fail, int } from './exact.mjs';

const M64 = (1n << 64n) - 1n;
// splitmix64 (Steele, Lea, Flood): a 64-bit stream used only to fill the xoshiro state.
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
const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0;

export function xoshiro128ss(seed) {
  int(seed, 'seed', 0);
  const sm = splitmix64(seed);
  const w1 = sm(), w2 = sm();
  let a = Number(w1 & 0xffffffffn), b = Number(w1 >> 32n), c = Number(w2 & 0xffffffffn), d = Number(w2 >> 32n);
  if ((a | b | c | d) === 0) a = 1;
  const u32 = () => {
    const r = Math.imul(rotl(Math.imul(b, 5) >>> 0, 7), 9) >>> 0;
    const t = (b << 9) >>> 0;
    c = (c ^ a) >>> 0; d = (d ^ b) >>> 0; b = (b ^ c) >>> 0; a = (a ^ d) >>> 0; c = (c ^ t) >>> 0; d = rotl(d, 11);
    return r;
  };
  return wrap(u32);
}

export function cryptoRng() {
  if (!globalThis.crypto || !globalThis.crypto.getRandomValues) fail('NO_CRYPTO', 'crypto.getRandomValues is not available');
  const buf = new Uint32Array(64); let i = 64;
  return wrap(() => {
    if (i === 64) { globalThis.crypto.getRandomValues(buf); i = 0; }
    return buf[i++];
  });
}

function wrap(u32) {
  return {
    u32,
    next: () => ((u32() >>> 5) * 67108864 + (u32() >>> 6)) / 9007199254740992,
    int(n) {
      if (!(Number.isInteger(n) && n > 0 && n <= 4294967296)) fail('INT_RANGE', 'int(n): n out of range');
      const lim = 4294967296 - (4294967296 % n);
      let x; do x = u32(); while (x >= lim);
      return x % n;
    },
  };
}
