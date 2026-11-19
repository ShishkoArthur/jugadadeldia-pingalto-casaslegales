import { $, data, out, esc, fmt } from './kit.js';
import { vrsNewer, dates } from './vrsfd.js';
import { num } from './live.js';

const D = data(), el = $('#vr8');
if (D && el) {
  vrsNewer(el, D.date).then(doc => {
    if (!doc) return;
    const V = doc.data;
    out('am8', V.am.slice(0, 8).map((g, i) => { const r = V.gl[g - 1] || [0, '']; return '<tr><td class="pa-n">' + (i + 1) + '</td><td>' + esc(r[1] || 'Nombre oculto') + '</td><td class="pa-n">' + fmt(r[0], 0) + '</td><td class="pa-n">' + g + '</td></tr>'; }).join(''));
    dates(doc, D, [[num(D.n), num(V.am.length)]]);
  });
}
