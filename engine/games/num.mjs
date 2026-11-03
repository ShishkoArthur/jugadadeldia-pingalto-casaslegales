// es-AR numbers for pingalto: decimal comma and a dot for thousands ("1.234,5"), the same output in Node (build) and every
// browser (no Intl grouping rules, which differ between engines for four-digit numbers). parseNum reads what people type:
// "1,25" and "1.25" are both 1.25; "1.234" is 1234 in a whole-number field and 1.234 in a decimal one; "1.234,5" is 1234.5.
function group(int) {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function render(n, digits, keepZeros, name) {
  if (!Number.isFinite(n)) throw new Error(name + ': not a number ' + n);
  if (!Number.isInteger(digits) || digits < 0 || digits > 12) throw new Error(name + ': digits required');
  let t = Math.abs(n).toFixed(digits);
  if (!keepZeros && t.includes('.')) t = t.replace(/0+$/, '').replace(/\.$/, '');
  const [i, f] = t.split('.');
  const zero = !/[1-9]/.test(t);
  return (n < 0 && !zero ? '-' : '') + group(i) + (f ? ',' + f : '');
}
// Up to `digits` decimals, trailing zeros dropped: fmt(1234.5, 2) -> "1.234,5".
export function fmt(n, digits) {
  return render(n, digits, false, 'fmt');
}
// Exactly `digits` decimals: fmtFixed(2, 2) -> "2,00".
export function fmtFixed(n, digits) {
  return render(n, digits, true, 'fmtFixed');
}
// Percent from a 0..1 share: "55 %".
export function fmtPct(x, digits) {
  return fmt(x * 100, digits) + '\u00a0%';
}
// Value for an input field: as fmt, without thousands dots so the visitor can edit it ("1600", "0,393").
export function fmtInput(n, digits) {
  return fmt(n, digits).replace(/\./g, '');
}
// Number typed by a visitor; NaN when it is not one. whole = true for fields that only take whole numbers (DPI, points).
export function parseNum(input, { whole = false } = {}) {
  let s = String(input == null ? '' : input).replace(/[\s\u00a0\u202f']/g, '');
  if (!s) return NaN;
  let sign = '';
  if (/^[-+\u2212]/.test(s)) { sign = s[0] === '+' ? '' : '-'; s = s.slice(1); }
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return NaN;
  const dots = (s.match(/\./g) || []).length, commas = (s.match(/,/g) || []).length;
  let int = s, frac = '';
  const thousands = x => /^\d{1,3}(\.\d{3})*$/.test(x) || /^\d+$/.test(x);
  if (dots && commas) {
    const dec = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
    const sep = dec === ',' ? '.' : ',';
    if ((s.match(dec === ',' ? /,/g : /\./g) || []).length !== 1) return NaN;
    [int, frac] = s.split(dec);
    if (!new RegExp('^\\d{1,3}(\\' + sep + '\\d{3})*$').test(int)) return NaN;
    int = int.split(sep).join('');
  } else if (commas) {
    if (commas > 1) return NaN;
    [int, frac] = s.split(',');
  } else if (dots) {
    if (dots > 1 || whole) { if (!thousands(s)) return NaN; int = s.replace(/\./g, ''); }
    else [int, frac] = s.split('.');
  }
  if (int === '') int = '0';
  if (!/^\d+$/.test(int) || (frac !== '' && !/^\d+$/.test(frac))) return NaN;
  const v = Number(sign + int + (frac ? '.' + frac : ''));
  return Number.isFinite(v) ? v : NaN;
}
