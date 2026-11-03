import { simulate, RECORDS } from '../../../engine/games/swisssim.mjs';
import { expected } from '../../../engine/games/vrs.mjs';
import { $, data, fmtPct, parseNum, esc } from './kit.js';

const D = data();
const f = $('#pa-ss');
if (f && D) {
  const src = $('#ss-src'), box = $('#ss-teams'), res = $('[data-o="ss"]'), note = $('[data-o="ssn"]');
  const preset = k => k === 'eq' ? D.top.map((t, i) => [t[0], 1500, t[2]]) : D.top.map(t => [t[0], t[1], t[2]]);
  const read = () => box.value.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const m = l.match(/^(.*?)[\s,;]+(-?[\d.,]+)\s*$/); return m ? [m[1].trim(), parseNum(m[2]), 0] : [l, NaN, 0]; });
  const write = list => { box.value = list.map(t => t[0] + ', ' + Math.round(t[1])).join('\n'); };
  const am = new Set(D.top.filter(t => t[2]).map(t => t[0]));
  const run = () => {
    const list = read();
    if (list.length !== 16 || list.some(t => !Number.isFinite(t[1]))) { note.textContent = 'Hacen falta 16 líneas con «equipo, puntos» (hay ' + list.length + ').'; return; }
    note.textContent = '';
    const r = simulate(list.map(t => t[1]), (a, b) => expected(a, b), { runs: 10000 });
    const rows = list.map((t, i) => ({ seed: i + 1, n: t[0], pts: t[1], ...r[i] }));
    res.innerHTML = '<table class="pa-tb pa-ssr"><thead><tr><th class="pa-n">Siembra</th><th>Equipo</th><th class="pa-n">3-0</th><th class="pa-n">Pasa</th><th class="pa-n">0-3</th><th>Récords</th></tr></thead><tbody>' + rows.map(x => '<tr' + (am.has(x.n) ? ' class="pa-am"' : '') + '><td class="pa-n">' + x.seed + '</td><td><b>' + esc(x.n) + '</b>' + (am.has(x.n) ? ' <span class="pa-tag pa-of">Américas</span>' : '') + '</td><td class="pa-n">' + fmtPct(x.rec['3-0'], 1) + '</td><td class="pa-n"><b>' + fmtPct(x.advance, 1) + '</b></td><td class="pa-n">' + fmtPct(x.rec['0-3'], 1) + '</td><td><span class="pa-ssb">' + RECORDS.map((k, j) => '<i class="pa-ss' + j + '" style="--v:' + (x.rec[k] * 100).toFixed(2) + '" title="' + k + ' ' + fmtPct(x.rec[k], 1) + '"></i>').join('') + '</span></td></tr>').join('') + '</tbody></table>';
  };
  src.addEventListener('change', () => { if (src.value !== 'own') write(preset(src.value)); run(); });
  let t;
  box.addEventListener('input', () => { src.value = 'own'; clearTimeout(t); t = setTimeout(run, 400); });
  f.addEventListener('submit', e => { e.preventDefault(); run(); });
  if (read().length !== 16) write(preset(src.value === 'eq' ? 'eq' : 'vrs'));
  run();
}
