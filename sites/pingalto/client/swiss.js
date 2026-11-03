import { swiss } from '../../../engine/games/series.mjs';
import { swissSvg, swissRecords } from '../../../engine/games/seriesviz.mjs';
import { $, out, num, params, setParams, fmt, fmtPct, fmtInput } from './kit.js';

const f = $('#pa-sw');
if (f) {
  const P = $('#sw-p');
  const run = (push = true) => {
    const v = num(P);
    if (!Number.isFinite(v) || v < 0 || v > 100) { out('say', 'Cargá una chance entre 0 y 100.'); return; }
    const p = v / 100, r = swiss(p), one = swiss(p, { decider: 1 });
    out('adv', fmtPct(r.advance, 1));
    out('say', 'Con la regla de Valve, ' + fmtPct(r.advance, 1) + '; si todos los partidos fueran Bo1, ' + fmtPct(one.advance, 1) + '. ' + (p > 0.5 ? 'Los Bo3 en los partidos decisivos ayudan al que es mejor.' : p < 0.5 ? 'Los Bo3 en los partidos decisivos le juegan en contra al que es peor.' : 'Con 50 % el formato no cambia nada.'));
    out('rec', swissRecords(r, one));
    out('len', 'Partidos que jugás en promedio: ' + fmt(r.matches, 2) + ', de ellos Bo3: ' + fmt(r.bo3, 2) + '. Un partido Bo1 lo ganás con ' + fmtPct(r.pBo1, 1) + ' y un Bo3 con ' + fmtPct(r.pBo3, 1) + '.');
    out('grid', swissSvg(r));
    if (push) setParams({ p: fmtInput(v, 1) });
  };
  const q = params();
  if (q.get('p')) P.value = q.get('p');
  f.addEventListener('input', () => run());
  f.addEventListener('submit', e => e.preventDefault());
  run(false);
}
