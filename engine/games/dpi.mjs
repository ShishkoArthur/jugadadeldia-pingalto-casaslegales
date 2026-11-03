// Real mouse DPI from a known physical distance (pingalto /kit/dpi): counts reported by the mouse while it travels `mm`
// millimetres. One inch is exactly 25.4 mm. Pure functions.
export const MM_PER_INCH = 25.4;

export function dpiFromCounts({ counts, mm }) {
  if (!Number.isFinite(counts) || counts === 0) throw new Error('dpi: counts must be a non-zero number');
  if (!Number.isFinite(mm) || mm <= 0) throw new Error('dpi: mm must be positive');
  return Math.abs(counts) / (mm / MM_PER_INCH);
}
export function median(xs) {
  if (!Array.isArray(xs) || !xs.length || xs.some(x => !Number.isFinite(x))) throw new Error('median: need finite numbers');
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
// Relative difference between the measured and the declared DPI (0.05 = 5 % more than declared).
export function deviation({ measured, declared }) {
  if (!(declared > 0) || !(measured > 0)) throw new Error('deviation: positive numbers only');
  return measured / declared - 1;
}
