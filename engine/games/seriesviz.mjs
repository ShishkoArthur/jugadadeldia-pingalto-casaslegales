// SVG pictures for the pingalto series pages, built the same way at build time and in the browser: the curves "chance of the
// series against chance of one map" for Bo1/Bo3/Bo5/Bo7 with a marker, and the Swiss grid of a CS2 Major stage.
import { curve, closedForm, mapChanceFor, FORMATS } from './series.mjs';
import { fmtPct } from './num.mjs';

const DOT = ' ' + String.fromCharCode(183) + ' ';

const r1 = x => Math.round(x * 10) / 10;
const pct = x => String(Math.round(x * 100));

// formats: list of best-of sizes; p: current map chance (0..1) shown as a vertical line with a dot on each curve.
export function curvesSvg(formats, p, { w = 560, h = 300 } = {}) {
  const L = 44, R = 16, T = 14, B = 34, W = w - L - R, H = h - T - B;
  const X = x => r1(L + x * W), Y = y => r1(T + (1 - y) * H);
  let s = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Chance de ganar la serie según la chance de ganar un mapa" class="pa-cv">';
  for (const g of [0, 0.25, 0.5, 0.75, 1]) {
    s += '<line x1="' + L + '" x2="' + (L + W) + '" y1="' + Y(g) + '" y2="' + Y(g) + '" class="pa-cvg"/>';
    s += '<text x="' + (L - 8) + '" y="' + (Y(g) + 4) + '" text-anchor="end">' + pct(g) + '</text>';
    s += '<text x="' + X(g) + '" y="' + (T + H + 22) + '" text-anchor="middle">' + pct(g) + '</text>';
  }
  formats.forEach((n, i) => {
    const pts = curve(n, 60).map(([x, y]) => X(x) + ',' + Y(y)).join(' ');
    s += '<polyline points="' + pts + '" class="pa-cv' + i + '"/>';
  });
  if (p != null) {
    s += '<line x1="' + X(p) + '" x2="' + X(p) + '" y1="' + T + '" y2="' + (T + H) + '" class="pa-cvm"/>';
    formats.forEach((n, i) => { s += '<circle cx="' + X(p) + '" cy="' + Y(closedForm(n, p)) + '" r="5" class="pa-cd' + i + '"/>'; });
  }
  return s + '</svg>';
}

// Swiss grid: nodes [{ w, l, probability, bo3 }] and final records [{ w, l, probability }] from engine/games/series.mjs swiss().
export function swissSvg(res, { wins = 3, losses = 3 } = {}) {
  const cols = wins + losses, cw = 92, ch = 50, w = cols * cw + 10, h = (Math.max(wins, losses) + 1) * ch + 30;
  const at = new Map(res.nodes.map(n => [n.w + ':' + n.l, n]));
  for (const r of res.records) at.set(r.w + ':' + r.l, { ...r, end: true });
  const pos = (wn, ln) => { const c = wn + ln, rows = [];
    for (let a = Math.min(c, wins); a >= 0; a--) { const b = c - a; if (b <= losses && !(a === wins && b === losses)) rows.push(a); }
    return { x: 6 + c * cw, y: 10 + rows.indexOf(wn) * ch + ((Math.max(wins, losses) + 1 - rows.length) * ch) / 2 };
  };
  let s = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Fase suiza: chance de llegar a cada récord" class="pa-sw">';
  for (const n of at.values()) {
    const { x, y } = pos(n.w, n.l);
    const cls = n.end ? (n.w === wins ? 'pa-swa' : 'pa-swe') : n.bo3 ? 'pa-sw3' : 'pa-sw1';
    s += '<g class="' + cls + '"><rect x="' + x + '" y="' + y + '" width="' + (cw - 12) + '" height="' + (ch - 10) + '" rx="12" style="--o:' + r1(0.25 + 0.75 * n.probability) + '"/>' +
      '<text x="' + (x + 10) + '" y="' + (y + 17) + '">' + n.w + '-' + n.l + (n.end ? '' : n.bo3 ? DOT + 'Bo3' : DOT + 'Bo1') + '</text>' +
      '<text x="' + (x + 10) + '" y="' + (y + 33) + '" class="pa-swp">' + fmtPct(n.probability, 1) + '</text></g>';
  }
  return s + '</svg>';
}

// Table of final scores of series() and table of map chances needed for a series chance t, per format.
export function scoreTable(r) {
  return '<table class="pa-tb"><thead><tr><th>Resultado final</th><th class="pa-n">Mapas</th><th>Chance</th></tr></thead><tbody>' +
    r.scores.map(s => '<tr><td>' + (s.a > s.b ? 'Gana A ' : 'Gana B ') + s.a + '-' + s.b + '</td><td class="pa-n">' + s.maps + '</td><td><div class="pa-bar pa-thin" style="--v:' + Math.round(s.probability * 100) + '"><i></i><span>' + fmtPct(s.probability, 1) + '</span></div></td></tr>').join('') + '</tbody></table>';
}
export function invTable(t) {
  return '<table class="pa-tb"><thead><tr><th>Formato</th><th class="pa-n">Chance por mapa</th></tr></thead><tbody>' + FORMATS.map(n => '<tr><td>Bo' + n + '</td><td class="pa-n">' + fmtPct(mapChanceFor(n, t), 1) + '</td></tr>').join('') + '</tbody></table>';
}

export function swissRecords(r, one) {
  return '<table class="pa-tb"><thead><tr><th>Récord final</th><th class="pa-n">Con la regla de Valve</th><th class="pa-n">Si todo fuera Bo1</th></tr></thead><tbody>' +
    r.records.map((x, i) => '<tr><td>' + x.w + '-' + x.l + (x.w > x.l ? ' pasa' : ' afuera') + '</td><td class="pa-n">' + fmtPct(x.probability, 1) + '</td><td class="pa-n">' + fmtPct(one.records[i].probability, 1) + '</td></tr>').join('') + '</tbody></table>';
}
