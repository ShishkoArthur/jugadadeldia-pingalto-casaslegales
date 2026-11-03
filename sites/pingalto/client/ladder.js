import { progress } from '../../../engine/games/ladder.mjs';
import { $, data, out, num, params, setParams, share, fmt, fmtPct, fmtInput, parseNum, esc } from './kit.js';

const D = data();
const f = $('#pa-lf');
if (D && f) {
  const el = { from: $('#lf-from'), to: $('#lf-to'), pts: $('#lf-pts'), p: $('#lf-p'), n: $('#lf-n'), w: $('#lf-w'), l: $('#lf-l') };
  const q = params();
  for (const k of Object.keys(el)) { const v = parseNum(q.get(k), { whole: true }); if (q.has(k) && Number.isFinite(v)) el[k].value = el[k].tagName === 'SELECT' ? String(v) : fmtInput(v, 0); }
  let timer = 0;
  const run = () => {
    const from = num(el.from), to = num(el.to), pts = num(el.pts), p = num(el.p) / 100, n = num(el.n), w = num(el.w), l = num(el.l);
    const ok = Number.isInteger(from) && Number.isInteger(to) && to > from && Number.isInteger(pts) && pts >= 0 && pts < D.top && p > 0 && p < 1 && Number.isInteger(n) && n >= 1 && n <= 1500 && Number.isInteger(w) && w >= 1 && Number.isInteger(l) && l >= 0;
    out('target', esc(D.steps[to] || '-'));
    if (!ok) { out('p50', '-'); out('say', 'Revisá los datos: el objetivo tiene que estar arriba de tu rango, los ' + D.unit + ' y las partidas son números enteros, y el % de victorias va de 1 a 99.'); return; }
    const r = progress({ from, pts, to, top: D.top, win: w, loss: l, p, carry: D.carry, minAfterUp: D.minAfterUp, demote: D.demote, tier: D.tier, maxGames: 1500 });
    out('p50', r.p50 ? fmt(r.p50, 0) : '-');
    const within = r.within(n);
    out('say', r.p50
      ? 'Con ' + fmtPct(p, 0) + ' de victorias llegás en <b>' + fmt(n, 0) + '</b> partidas el <b>' + fmtPct(within, 0) + '</b> de las veces.' + (r.p90 ? ' En 9 de cada 10 casos, antes de la partida ' + fmt(r.p90, 0) + '.' : '')
      : 'Con esos números, en 1.500 partidas llegás solo el ' + fmtPct(r.within(1500), 1) + ' de las veces: en promedio perdés más ' + D.unit + ' de los que ganás.');
    const len = Math.min(1500, Math.max(n, r.p90 || n) + 10);
    const bars = [];
    for (let i = 0; i < 60; i++) { const g = Math.max(1, Math.round(((i + 1) / 60) * len)); bars.push('<i style="height:' + (r.cdf[g - 1] * 100).toFixed(1) + '%"' + (g <= n ? ' class="pa-m"' : '') + '></i>'); }
    out('chart', bars.join(''));
    out('axis', fmt(len, 0) + ' partidas');
    out('drift', 'Promedio por partida: ' + (r.drift >= 0 ? '+' : '') + fmt(r.drift, 1) + ' ' + D.unit);
    out('mean', 'Media: ' + (r.mean ? fmt(r.mean, 1) : '-') + ' partidas');
    out('copied', '');
    setParams({ from, pts, to, p: num(el.p), n, w, l });
  };
  const later = () => { clearTimeout(timer); timer = setTimeout(run, 120); };
  f.addEventListener('input', later);
  f.addEventListener('change', later);
  f.addEventListener('submit', e => e.preventDefault());
  share();
  run();
}
