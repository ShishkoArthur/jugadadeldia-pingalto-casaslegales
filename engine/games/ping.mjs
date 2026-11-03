// Summary of browser round-trip samples in milliseconds (pingalto /kit/ping). Pure functions.
import { median } from './dpi.mjs';

export function summarize(samples) {
  const xs = (samples || []).filter(x => Number.isFinite(x) && x >= 0);
  if (!xs.length) return null;
  let jit = 0;
  for (let i = 1; i < xs.length; i++) jit += Math.abs(xs[i] - xs[i - 1]);
  return { n: xs.length, median: median(xs), min: Math.min(...xs), max: Math.max(...xs), jitter: xs.length > 1 ? jit / (xs.length - 1) : 0 };
}
// How far a measured value is above the physical floor, as a ratio (2 = twice the floor).
export function overFloor({ measured, floor }) {
  if (!(floor > 0) || !(measured >= 0)) throw new Error('overFloor: positive floor required');
  return measured / floor;
}
