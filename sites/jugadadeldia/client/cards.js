const SUIT = { e: 'espadas', b: 'bastos', o: 'oros', c: 'copas' };
const NUM = { 1: 'as', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'sota', 11: 'caballo', 12: 'rey' };
export const cardName = c => (/^J/.test(c) ? 'comodín' : NUM[parseInt(c, 10)] + ' de ' + SUIT[c.slice(-1)]);
const FACE = { 10: 'S', 11: 'C', 12: 'R' };

const PIPS = { 1: [[12, 15, 16]], 2: [[12, 7, 10], [12, 23, 10]], 3: [[12, 5, 9], [12, 15, 9], [12, 25, 9]], 4: [[6.5, 7, 9], [17.5, 7, 9], [6.5, 23, 9], [17.5, 23, 9]],
  5: [[6.5, 6, 8.5], [17.5, 6, 8.5], [12, 15, 8.5], [6.5, 24, 8.5], [17.5, 24, 8.5]], 6: [[6.5, 5, 8.5], [17.5, 5, 8.5], [6.5, 15, 8.5], [17.5, 15, 8.5], [6.5, 25, 8.5], [17.5, 25, 8.5]],
  7: [[5.5, 4.5, 7], [18.5, 4.5, 7], [12, 9.75, 7], [5.5, 15, 7], [18.5, 15, 7], [5.5, 25.5, 7], [18.5, 25.5, 7]],
  8: [[5.5, 4.5, 7], [18.5, 4.5, 7], [12, 9.75, 7], [5.5, 15, 7], [18.5, 15, 7], [12, 20.25, 7], [5.5, 25.5, 7], [18.5, 25.5, 7]],
  9: [[4.5, 4.5, 7], [12, 4.5, 7], [19.5, 4.5, 7], [4.5, 15, 7], [12, 15, 7], [19.5, 15, 7], [4.5, 25.5, 7], [12, 25.5, 7], [19.5, 25.5, 7]] };
const HELD = { 10: [15, 13, 8], 11: [0, 21, 8], 12: [16, 17, 8] };
const useP = (s, [x, y, z]) => '<use href="#p-' + s + '" x="' + x + '" y="' + y + '" width="' + z + '" height="' + z + '"/>';
export const pips = (n, s) => '<svg class="pn" viewBox="0 0 24 30" aria-hidden="true">' + (n >= 10 ? '<use href="#f-' + n + '" width="24" height="30"/>' + useP(s, HELD[n]) : PIPS[n].map(([x, y, z]) => useP(s, [x - z / 2, y - z / 2, z])).join('')) + '</svg>';
export function cardHtml(c, { tag = 'span', attrs = '', cls = '' } = {}) {
  if (/^J/.test(c)) return '<' + tag + ' class="jg-cd jk ' + cls + '" ' + attrs + ' aria-label="comodín"><b>J</b><small>comodín</small></' + tag + '>';
  const n = parseInt(c, 10), s = c.slice(-1);
  return '<' + tag + ' class="jg-cd ' + cls + '" data-s="' + s + '" ' + attrs + ' aria-label="' + cardName(c) + '"><b>' + (FACE[n] || n) + '</b>' + pips(n, s) + '<svg class="p1" aria-hidden="true"><use href="#p-' + s + '"/></svg><small>' + n + '</small></' + tag + '>';
}
export const backHtml = (cls = '') => '<span class="jg-cd back ' + cls + '" aria-hidden="true"></span>';

export function palitos(points, cap) {
  const full = Math.floor(points / 5), rest = points % 5;
  let html = '';
  for (let i = 0; i < full; i++) html += '<i class="jg-pz f5"></i>';
  if (rest) html += '<i class="jg-pz f' + rest + '"></i>';
  const empty = Math.max(0, Math.ceil(cap / 5) - full - (rest ? 1 : 0));
  for (let i = 0; i < empty; i++) html += '<i class="jg-pz f0"></i>';
  return html;
}
export function scoreBlock(points, target) {
  const half = target > 15 ? target / 2 : null;
  if (!half) return '<div class="jg-pzs"><div class="jg-pzr">' + palitos(Math.min(points, target), target) + '</div></div>';
  const malas = Math.min(points, half), buenas = Math.max(0, Math.min(points - half, half));
  return '<div class="jg-pzs"><small>malas</small><div class="jg-pzr">' + palitos(malas, half) + '</div><small>buenas</small><div class="jg-pzr">' + palitos(buenas, half) + '</div></div>';
}
