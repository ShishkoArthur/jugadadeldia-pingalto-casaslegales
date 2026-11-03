// casaslegales.com logo concepts (owner 2026-11-03: own logo and favicon on the site's theme). Drawn by tools/lib/icons.mjs;
// the shipped one is LOGO.pick, the others stay ready to switch (files in static/logo-options/, built by docs/owner/build-logos.mjs).
const C = Math.cos(Math.PI / 6);
const iso = (x, y, z) => [(x - y) * C, (x + y) / 2 - z];
const f = n => +n.toFixed(2);

// isometric drawing: faces as [classKey, points] in model units, fitted into the 64 box with the given margin
function fit(faces, lines, margin) {
  const pts = [...faces.flatMap(([, p]) => p), ...lines.flatMap(([, p]) => p)].map(p => iso(...p));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = (64 - 2 * margin) / Math.max(x1 - x0, y1 - y0);
  const ox = 32 - (x0 + x1) / 2 * s, oy = 32 - (y0 + y1) / 2 * s;
  const P = p => { const [x, y] = iso(...p); return f(ox + x * s) + ' ' + f(oy + y * s); };
  return (k, w) => faces.map(([c, p]) => '<path d="M' + p.map(P).join('L') + 'z" ' + k(c) + '/>').join('') +
    lines.map(([c, p]) => '<path d="M' + p.map(P).join('L') + '" ' + k(c) + ' stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>').join('');
}

const A = 1.45, B = 1.05, H = 0.66, R = 0.5;
const HOUSE = fit([
  ['fWall', [[0, B, 0], [A, B, 0], [A, B, H], [0, B, H]]],
  ['fGable', [[A, 0, 0], [A, B, 0], [A, B, H], [A, B / 2, H + R], [A, 0, H]]],
  ['fRoof', [[0, B / 2, H + R], [A, B / 2, H + R], [A, B, H], [0, B, H]]],
], [['sChk', [[A, 0.82, 0.44], [A, 0.6, 0.22], [A, 0.2, 0.68]]]], 4);

const T = 0.17, U = 0.2, I = 0.15;
const SEAL = fit([
  ['fBaseL', [[0, 1, 0], [1, 1, 0], [1, 1, T], [0, 1, T]]],
  ['fBaseR', [[1, 0, 0], [1, 1, 0], [1, 1, T], [1, 0, T]]],
  ['fBaseT', [[0, 0, T], [1, 0, T], [1, 1, T], [0, 1, T]]],
  ['fWall', [[I, 1 - I, T], [1 - I, 1 - I, T], [1 - I, 1 - I, T + U], [I, 1 - I, T + U]]],
  ['fGable', [[1 - I, I, T], [1 - I, 1 - I, T], [1 - I, 1 - I, T + U], [1 - I, I, T + U]]],
  ['fRoof', [[I, I, T + U], [1 - I, I, T + U], [1 - I, 1 - I, T + U], [I, 1 - I, T + U]]],
], [['sChk', [[0.27, 0.58, T + U], [0.47, 0.69, T + U], [0.5, 0.13, T + U]]]], 4);

const L = { fWall: '#4b7a5d', fGable: '#e4f9a6', fRoof: '#c7ee5c', sChk: '#10241c', fBaseL: '#4a8c7d', fBaseR: '#93dac8', fBaseT: '#c4efe4', fHouse: '#2f5a43', sMark: '#c7ee5c', fPlate: '#e9efe6' };
const D = { fWall: '#4f7a33', fGable: '#dcf78f', fRoof: '#b9e64e', sChk: '#07120e', fBaseL: '#2c6c5f', fBaseR: '#5fc2ad', fBaseT: '#8fdccb', fHouse: '#b9e64e', sMark: '#07120e', fPlate: '#07120e' };

export const LOGO = {
  prefix: 'cl-',
  pick: 'sello-relieve',
  manifest: { short_name: 'casaslegales', theme_color: '#e9efe6', background_color: '#e9efe6' },
  concepts: [
    { id: 'casa-iso', name: 'Casa en relieve', palette: { light: L, dark: D }, draw: (k, id, o) => HOUSE(k, o.small ? 4.2 : 3.4) },
    { id: 'sello-relieve', name: 'Sello en relieve', palette: { light: L, dark: D }, draw: (k, id, o) => SEAL(k, o.small ? 4.6 : 3.8) },
    {
      id: 'casa-check', name: 'Casa-check plana', palette: { light: L, dark: D },
      draw: (k, id, o) => '<path d="M29.4 6.9a4 4 0 0 1 5.2 0l21.6 18.4a4 4 0 0 1 1.4 3V53a5 5 0 0 1-5 5H11.4a5 5 0 0 1-5-5V28.3a4 4 0 0 1 1.4-3z" ' + k('fHouse') + '/>' +
        '<path d="M19.5 38.5l8.5 8.5 16.5-17" ' + k('sMark') + ' stroke-width="' + (o.small ? 8 : 6.6) + '" stroke-linecap="round" stroke-linejoin="round"/>',
    },
  ],
};
