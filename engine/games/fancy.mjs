// Nickname styler for /ff/nombres: Latin letters and digits mapped to the styled alphabets of Unicode (Mathematical
// Alphanumeric Symbols 1D400..1D7FF, Enclosed Alphanumerics 2460..24FF, Halfwidth and Fullwidth Forms FF00..FFEF). Each styled
// character folds back to its plain letter under NFKC, which the tests check for every style. Letters a style has no form for
// (ñ, letters with an accent) stay as they are. Pure: the build and the browser run the same code.
const A = 65, a = 97;
// [id, label, capital A, small a, digit 0 or null, exceptions {plain letter: code point}]
const MATH = [
  ['negrita', 'Negrita', 0x1d400, 0x1d41a, 0x1d7ce, {}],
  ['cursiva', 'Cursiva', 0x1d434, 0x1d44e, null, { h: 0x210e }],
  ['negrita-cursiva', 'Negrita cursiva', 0x1d468, 0x1d482, null, {}],
  ['caligrafia', 'Caligrafía', 0x1d49c, 0x1d4b6, null, { B: 0x212c, E: 0x2130, F: 0x2131, H: 0x210b, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211b, e: 0x212f, g: 0x210a, o: 0x2134 }],
  ['caligrafia-negrita', 'Caligrafía negrita', 0x1d4d0, 0x1d4ea, null, {}],
  ['gotica', 'Gótica', 0x1d504, 0x1d51e, null, { C: 0x212d, H: 0x210c, I: 0x2111, R: 0x211c, Z: 0x2128 }],
  ['gotica-negrita', 'Gótica negrita', 0x1d56c, 0x1d586, null, {}],
  ['doble', 'Doble trazo', 0x1d538, 0x1d552, 0x1d7d8, { C: 0x2102, H: 0x210d, N: 0x2115, P: 0x2119, Q: 0x211a, R: 0x211d, Z: 0x2124 }],
  ['sans-negrita', 'Sans negrita', 0x1d5d4, 0x1d5ee, 0x1d7ec, {}],
  ['sans-cursiva', 'Sans cursiva', 0x1d608, 0x1d622, null, {}],
  ['mono', 'Máquina de escribir', 0x1d670, 0x1d68a, 0x1d7f6, {}],
  ['ancha', 'Ancha', 0xff21, 0xff41, 0xff10, {}],
];
export const STYLES = [...MATH.map(([id, label]) => ({ id, label })), { id: 'circulos', label: 'En círculos' }];

function mapChar(ch, st) {
  const c = ch.codePointAt(0);
  if (st === 'circulos') {
    if (c >= A && c < A + 26) return String.fromCodePoint(0x24b6 + c - A);
    if (c >= a && c < a + 26) return String.fromCodePoint(0x24d0 + c - a);
    if (c === 48) return String.fromCodePoint(0x24ea);
    if (c > 48 && c <= 57) return String.fromCodePoint(0x2460 + c - 49);
    return ch;
  }
  const m = MATH.find(x => x[0] === st);
  if (!m) throw new Error('fancy: unknown style ' + st);
  const [, , cap, small, dig, ex] = m;
  if (ex[ch]) return String.fromCodePoint(ex[ch]);
  if (c >= A && c < A + 26) return String.fromCodePoint(cap + c - A);
  if (c >= a && c < a + 26) return String.fromCodePoint(small + c - a);
  if (dig && c >= 48 && c <= 57) return String.fromCodePoint(dig + c - 48);
  return ch;
}
export function style(text, st) {
  return [...String(text)].map(ch => mapChar(ch, st)).join('');
}
// Frames around the nickname: [left, right], written with code points so the source stays plain ASCII.
const cp = (...xs) => String.fromCodePoint(...xs);
export const FRAMES = [
  ['', ''], [cp(0x2605) + ' ', ' ' + cp(0x2605)], [cp(0xa9c1), cp(0xa9c2)], [cp(0x300e), cp(0x300f)], [cp(0x3010), cp(0x3011)],
  ['x', 'x'], [cp(0x5f61), ''], [cp(0x2022) + ' ', ' ' + cp(0x2022)], [cp(0x2694) + ' ', ''], [cp(0x26a1), cp(0x26a1)],
];
export function frame(text, i) {
  const f = FRAMES[i] || FRAMES[0];
  return f[0] + text + f[1];
}
// Lengths the visitor can compare with the game's own counter: characters as people see them (code points) and UTF-16 units
// (what many programs count; a styled letter from 1D400..1D7FF takes two).
export function lengths(text) {
  const s = String(text);
  return { chars: [...s].length, units: s.length };
}
// Invisible characters offered on /ff/espacio-invisible.
export const HANGUL_FILLER = cp(0x3164);
export const BRAILLE_BLANK = cp(0x2800);
export function showInvisible(text) {
  return [...String(text)].map(ch => (ch === HANGUL_FILLER || ch === BRAILLE_BLANK ? '[' + ch.codePointAt(0).toString(16).toUpperCase() + ']' : ch)).join('');
}
