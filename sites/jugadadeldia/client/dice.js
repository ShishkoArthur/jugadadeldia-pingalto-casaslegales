const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
export function dieHtml(v, { kept = false, roll = false, i = 0, tag = 'button', sides = 6 } = {}) {
  const inner = sides === 6 && PIPS[v] ? '<span class="jg-pips">' + Array.from({ length: 9 }, (_, k) => (PIPS[v].includes(k) ? '<i></i>' : '<span></span>')).join('') + '</span>' : String(v);
  return '<' + tag + (tag === 'button' ? ' type="button"' : '') + ' class="jg-die' + (kept ? ' kept' : '') + (roll ? ' roll' : '') + '" data-i="' + i + '" aria-label="Dado ' + (i + 1) + ': ' + v + (kept ? ', guardado' : '') + '">' + inner + '</' + tag + '>';
}
export const cryptoInt = n => { const lim = Math.floor(4294967296 / n) * n, b = new Uint32Array(1); for (;;) { crypto.getRandomValues(b); if (b[0] < lim) return b[0] % n; } };
