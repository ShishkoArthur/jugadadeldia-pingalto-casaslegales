import { cm360, convertSens, edpi, degPerCm } from '../../../engine/games/sens.mjs';
import { $, data, out, num, params, setParams, share, fmt, fmtInput, parseNum } from './kit.js';

const D = data();
const f = $('#pa-sf');
if (D && f) {
  const G = Object.fromEntries(D.games.map(g => [g.id, g]));
  const el = { de: $('#sf-from'), a: $('#sf-to'), s: $('#sf-s'), dpi: $('#sf-d'), dpi2: $('#sf-d2') };
  const q = params();
  if (G[q.get('de')]) el.de.value = q.get('de');
  if (G[q.get('a')]) el.a.value = q.get('a');
  for (const k of ['s', 'dpi', 'dpi2']) { const v = parseNum(q.get(k), { whole: k !== 's' }); if (q.has(k) && v > 0) el[k].value = fmtInput(v, 4); }
  const run = () => {
    const from = G[el.de.value], to = G[el.a.value];
    const s = num(el.s), d1 = num(el.dpi), d2 = num(el.dpi2) > 0 ? num(el.dpi2) : d1;
    out('to', to.name);
    if (!(s > 0) || !(d1 > 0)) { out('sens', '-'); out('say', 'Poné tu sensibilidad y tu DPI (números mayores que cero).'); return; }
    const t = convertSens({ sens: s, dpi: d1, yaw: from.yaw, toDpi: d2, toYaw: to.yaw });
    const cm = cm360({ dpi: d1, sens: s, yaw: from.yaw });
    out('sens', fmt(t, t < 1 ? 3 : 2));
    out('say', 'Con esa sensibilidad, un giro completo de 360° te pide <b>' + fmt(cm, 1) + ' cm</b> de mouse en ' + (from.id === to.id ? 'el juego' : 'los dos juegos') + '.');
    const bar = out('bar', ''); if (bar) { bar.style.setProperty('--v', Math.min(100, cm).toFixed(1)); bar.innerHTML = '<i></i><span>' + fmt(cm, 1) + ' cm / 360°' + (cm > 100 ? ' (más de 100)' : '') + '</span>'; }
    out('e1', 'eDPI ' + from.short + ': ' + fmt(edpi({ dpi: d1, sens: s }), 0));
    out('e2', 'eDPI ' + to.short + ': ' + fmt(edpi({ dpi: d2, sens: t }), 0));
    out('deg', fmt(degPerCm({ dpi: d1, sens: s, yaw: from.yaw }), 1) + '° por cm');
    out('copied', '');
    setParams({ de: from.id, a: to.id, s, dpi: d1, dpi2: d2 });
  };
  f.addEventListener('input', run);
  f.addEventListener('change', run);
  f.addEventListener('submit', e => e.preventDefault());
  share();
  run();
}
