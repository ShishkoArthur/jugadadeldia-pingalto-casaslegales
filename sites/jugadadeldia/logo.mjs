// jugadadeldia.com logo concepts (owner 2026-11-03: own logo and favicon on the site's theme). Drawn by tools/lib/icons.mjs;
// the shipped one is LOGO.pick, the others stay ready to switch (files in static/logo-options/, built by docs/owner/build-logos.mjs).
const f = n => +n.toFixed(2);
const beads = (n, r, d, k) => Array.from({ length: n }, (_, i) => {
  const a = (i + 0.5) / n * 2 * Math.PI;
  return '<circle cx="' + f(32 + r * Math.cos(a)) + '" cy="' + f(32 + r * Math.sin(a)) + '" r="' + d + '" ' + k + '/>';
}).join('');
const seven = (k, w, d = 'M24.6 25.4h14.8l-9.2 17.4') => '<path d="' + d + '" ' + k + ' stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
const ballGrad = (id, k) => '<radialGradient id="' + id + '" cx=".36" cy=".3" r=".78"><stop offset="0" ' + k('g0') + '/><stop offset=".52" ' + k('g1') + '/><stop offset="1" ' + k('g2') + '/></radialGradient>';
const shine = (k, cx = 20.5, cy = 15.5) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="8.4" ry="4.4" transform="rotate(-30 ' + cx + ' ' + cy + ')" ' + k('fShine') + ' opacity=".62"/>';

const BOLILLA = { g0: '#ffb595', g1: '#ff5a3c', g2: '#a8321a', fDisc: '#ffffff', sNum: '#101820', fShine: '#ffffff', fPlate: '#edf1f6' };
const ORO = { g0: '#fff4b8', g1: '#ffc22e', g2: '#b87600', sRim: '#8a5200', fBead: '#8a5200', sNum: '#5b2a00', fShine: '#ffffff', fPlate: '#edf1f6' };

export const LOGO = {
  prefix: 'jgl-',
  pick: 'siete-de-oro',
  manifest: { short_name: 'Jugada', theme_color: '#edf1f6', background_color: '#edf1f6' },
  concepts: [
    {
      id: 'siete-de-oro',
      name: 'Siete de oro',
      palette: { light: ORO, dark: { ...ORO, fPlate: '#0a111c' } },
      draw: (k, id, o) => '<defs>' + ballGrad(id('b'), k) + '</defs><circle cx="32" cy="32" r="29" fill="url(#' + id('b') + ')"/>' +
        '<circle cx="32" cy="32" r="21.6" ' + k('sRim') + ' stroke-width="' + (o.small ? 2.6 : 1.8) + '" opacity=".75"/>' +
        (o.small ? '' : beads(16, 25.4, 1.25, k('fBead'))) +
        shine(k) + seven(k('sNum'), o.small ? 6.4 : 5.6, 'M24 24.2h16l-9.8 18.6'),
    },
    {
      id: 'bolilla-7',
      name: 'Bolilla 7',
      palette: { light: BOLILLA, dark: { ...BOLILLA, fPlate: '#0a111c' } },
      draw: (k, id, o) => '<defs>' + ballGrad(id('b'), k) + '</defs><circle cx="32" cy="32" r="29" fill="url(#' + id('b') + ')"/>' +
        '<circle cx="32" cy="33" r="' + (o.small ? 17.5 : 16) + '" ' + k('fDisc') + '/>' + shine(k, 19.5, 14.5) + seven(k('sNum'), o.small ? 6.2 : 5.2),
    },
    {
      id: 'j-bolilla',
      name: 'j con bolilla',
      palette: {
        light: { fTile: '#0e1726', sJ: '#ffffff', g0: '#ffb595', g1: '#ff5a3c', g2: '#a8321a', fShine: '#ffffff', fPlate: '#0e1726' },
        dark: { fTile: '#eef3fa', sJ: '#0e1726', g0: '#ffb595', g1: '#ff5a3c', g2: '#a8321a', fShine: '#ffffff', fPlate: '#0e1726' },
      },
      draw: (k, id, o) => '<defs>' + ballGrad(id('b'), k) + '</defs><rect x="3" y="3" width="58" height="58" rx="17" ' + k('fTile') + '/>' +
        '<path d="M36.5 30v14.5c0 6.6-3.8 10-10.5 10" ' + k('sJ') + ' stroke-width="' + (o.small ? 9.5 : 8.5) + '" stroke-linecap="round"/>' +
        '<circle cx="36.5" cy="16.5" r="' + (o.small ? 8.6 : 7.8) + '" fill="url(#' + id('b') + ')"/><ellipse cx="33.6" cy="13.6" rx="3.2" ry="1.8" transform="rotate(-30 33.6 13.6)" ' + k('fShine') + ' opacity=".7"/>',
      plate: (k, id, o) => '<defs>' + ballGrad(id('b'), k) + '</defs><rect width="64" height="64" ' + k('fPlate') + '/>' +
        '<g transform="translate(32 32) scale(' + (o.zoom + 0.1) + ') translate(-32 -32)"><path d="M36.5 30v14.5c0 6.6-3.8 10-10.5 10" ' + k('sJ') + ' stroke-width="8.5" stroke-linecap="round"/>' +
        '<circle cx="36.5" cy="16.5" r="7.8" fill="url(#' + id('b') + ')"/><ellipse cx="33.6" cy="13.6" rx="3.2" ry="1.8" transform="rotate(-30 33.6 13.6)" ' + k('fShine') + ' opacity=".7"/></g>',
    },
  ],
};
