// pingalto.com logo concepts (owner 2026-11-03: own logo and favicon on the site's theme). Drawn by tools/lib/icons.mjs;
// the shipped one is LOGO.pick, the others stay ready to switch (files in static/logo-options/, built by docs/owner/build-logos.mjs).
const holo = (id, k) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" ' + k('g0') + '/><stop offset=".36" ' + k('g1') + '/><stop offset=".68" ' + k('g2') + '/><stop offset="1" ' + k('g3') + '/></linearGradient>';
const gloss = id => '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>';
const tile = (k, id, full) => '<defs>' + holo(id('h'), k) + gloss(id('s')) + '</defs>' + (full
  ? '<rect width="64" height="64" fill="url(#' + id('h') + ')"/>'
  : '<rect x="3" y="3" width="58" height="58" rx="18" fill="url(#' + id('h') + ')"/><rect x="3" y="3" width="58" height="58" rx="18" fill="url(#' + id('s') + ')"/>' +
    '<rect x="3.75" y="3.75" width="56.5" height="56.5" rx="17.25" ' + k('sRim') + ' stroke-width="1.5"/>');
const zoomed = (o, inner) => o.zoom ? '<g transform="translate(32 32) scale(' + o.zoom + ') translate(-32 -32)">' + inner + '</g>' : inner;
const line = (d, k, w) => '<path d="' + d + '" ' + k + ' stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';

const HOLO_L = { g0: '#ffc6e6', g1: '#ddd3ff', g2: '#bdeaff', g3: '#c9f7de', sRim: '#5a3fcf55', sInk: '#1d1830', sPing: '#ad1c6c', fInk: '#1d1830', fPing: '#ad1c6c' };
const HOLO_D = { g0: '#5a2850', g1: '#352f6e', g2: '#17445a', g3: '#1b4a36', sRim: '#ffffff33', sInk: '#f4f0fb', sPing: '#ff9bd1', fInk: '#f4f0fb', fPing: '#ff9bd1' };

const peak = (k, o) => line('M9.5 45h8.5l12.5-24 8 14.5 4-6.5 9 16h3', k('sInk'), o.small ? 5.6 : 4.8) +
  line('M25.6 15.4a7 7 0 0 1 9.8 0', k('sPing'), o.small ? 4.4 : 3.8) + (o.small ? '' : line('M21.2 10.6a13.2 13.2 0 0 1 18.6 0', k('sPing'), 3.4));
const pEcho = (k, o) => line('M20 25v28', k('sP'), o.small ? 8 : 7) + '<circle cx="30.5" cy="31" r="10.5" ' + k('sP') + ' stroke-width="' + (o.small ? 8 : 7) + '"/>' +
  line('M45 20.5a16 16 0 0 1 0 21', k('sEcho'), o.small ? 4.6 : 4) + (o.small ? '' : line('M50.6 15.8a23 23 0 0 1 0 30.4', k('sEcho'), 3.4));
const PX = [[12, 44], [20, 44], [28, 44], [36, 44], [44, 44], [20, 36], [28, 36], [36, 36], [28, 28]];
const pixels = (k, o) => (o.small
  ? '<path d="M28 28h8v8h8v8h8v8H12v-8h8v-8h8z" ' + k('fInk') + '/>'
  : PX.map(([x, y]) => '<rect x="' + (x + 0.5) + '" y="' + (y + 0.5) + '" width="7" height="7" rx="1" ' + k('fInk') + '/>').join('')) +
  '<rect x="28" y="' + (o.small ? 14 : 13) + '" width="8" height="8" rx="1.2" ' + k('fPing') + '/>' +
  (o.small ? '' : '<rect x="17.5" y="15.5" width="4.5" height="4.5" rx="1" ' + k('fPing') + ' opacity=".55"/><rect x="42" y="15.5" width="4.5" height="4.5" rx="1" ' + k('fPing') + ' opacity=".55"/>');

export const LOGO = {
  prefix: 'pal-',
  pick: 'p-eco',
  manifest: { short_name: 'pingalto', theme_color: '#f6f4fb', background_color: '#f6f4fb' },
  concepts: [
    {
      id: 'pico-senal',
      name: 'Pico de señal',
      palette: { light: HOLO_L, dark: HOLO_D },
      draw: (k, id, o) => tile(k, id) + peak(k, o),
      plate: (k, id, o) => tile(k, id, true) + zoomed({ zoom: o.zoom + 0.12 }, peak(k, o)),
    },
    {
      id: 'p-eco',
      name: 'p con eco',
      palette: {
        light: { fTile: '#1d1830', sRim: '#ffffff00', g0: '#ffb3dc', g1: '#cfc2ff', g2: '#9fe3ff', g3: '#b5f5d3', sP: '#ffffff', sEcho: 'url(#pal-pecoh)' },
        dark: { fTile: '#f4f0fb', sRim: '#5a3fcf55', g0: '#d0458f', g1: '#6c53e0', g2: '#1c8fb8', g3: '#1d9a66', sP: '#1d1830', sEcho: 'url(#pal-pecoh)' },
      },
      draw: (k, id, o) => '<defs>' + holo(id('h'), k) + '</defs><rect x="3" y="3" width="58" height="58" rx="18" ' + k('fTile') + '/>' +
        '<rect x="3.75" y="3.75" width="56.5" height="56.5" rx="17.25" ' + k('sRim') + ' stroke-width="1.5"/>' + pEcho(k, o),
      plate: (k, id, o) => '<defs>' + holo(id('h'), k) + '</defs><rect width="64" height="64" ' + k('fTile') + '/>' + zoomed({ zoom: o.zoom + 0.1 }, pEcho(k, o)),
    },
    {
      id: 'pico-pixel',
      name: 'Pico pixel',
      palette: { light: HOLO_L, dark: HOLO_D },
      draw: (k, id, o) => tile(k, id) + pixels(k, o),
      plate: (k, id, o) => tile(k, id, true) + zoomed({ zoom: o.zoom + 0.1 }, pixels(k, o)),
    },
  ],
};
