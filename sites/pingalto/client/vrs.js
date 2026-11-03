import { expected } from '../../../engine/games/vrs.mjs';
import { mapChanceFor } from '../../../engine/games/series.mjs';
import { $, $$, data, out, params, setParams, fmt, fmtPct, fmtInput, esc } from './kit.js';

const D = data();
const box = $('#pa-vr');
if (D && box) {
  const byRank = new Map(D.gl.map(r => [r[0], r]));
  const amRows = D.am.map(([rank, g]) => { const r = byRank.get(g); return [rank, r[1], r[2], r[3], g]; });
  let region = 'am', all = false;
  const q = $('#vr-q'), more = $('[data-o="more"]');
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const row = r => {
    const am = region === 'gl' && r[4] === 1;
    const name = r[2] ? '<b>' + esc(r[2]) + '</b>' : '<span class="pa-x">Nombre oculto: lleva una marca de apuestas</span>';
    return '<tr' + (am ? ' class="pa-am"' : '') + '><td class="pa-n">' + r[0] + '</td><td>' + name + (am ? ' <span class="pa-tag pa-of">Américas</span>' : '') + '<small class="pa-ro">' + esc(r[3]) + '</small></td><td class="pa-n">' + fmt(r[1], 0) + '</td><td class="pa-n">' + (region === 'am' ? r[4] : '') + '</td></tr>';
  };
  const draw = () => {
    const src = region === 'am' ? amRows : D.gl;
    const t = norm(q.value.trim());
    const hit = t ? src.filter(r => norm(r[2] + ' ' + r[3]).includes(t)) : src;
    const show = all || t ? hit : hit.slice(0, D.show);
    out('vt', '<table class="pa-tb pa-vt"><thead><tr><th class="pa-n">#</th><th>Equipo y jugadores</th><th class="pa-n">Puntos</th><th class="pa-n">' + (region === 'am' ? 'Mundo' : '') + '</th></tr></thead><tbody>' + (show.length ? show.map(row).join('') : '<tr><td colspan="4">Ningún equipo con ese nombre o jugador.</td></tr>') + '</tbody></table>');
    out('vn', fmt(show.length, 0) + ' de ' + fmt(src.length, 0));
    more.textContent = all ? 'Ver los primeros ' + D.show : 'Ver los ' + fmt(src.length, 0);
    more.hidden = !!t;
    $$('[data-rg]', box).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rg === region)));
  };
  $$('[data-rg]', box).forEach(b => b.addEventListener('click', () => { region = b.dataset.rg; draw(); }));
  more.addEventListener('click', () => { all = !all; draw(); });
  q.addEventListener('input', draw);
  const A = $('#vd-a'), B = $('#vd-b');
  const duel = (push = true) => {
    const a = byRank.get(Number(A.value)), b = byRank.get(Number(B.value));
    if (!a || !b) return;
    const x = expected(a[1], b[1]), pm = mapChanceFor(3, x);
    out('dx', fmtPct(x, 1));
    const bar = $('[data-o="dbar"]'); bar.style.setProperty('--v', String(Math.round(x * 100))); bar.querySelector('span').textContent = 'B: ' + fmtPct(1 - x, 1);
    const gap = a[1] - b[1];
    out('dsay', a[0] === b[0] ? 'Elegiste el mismo equipo dos veces: 50 % por definición.' : esc(a[2]) + (gap >= 0 ? ' le saca ' + fmt(gap, 0) + ' puntos a ' : ' tiene ' + fmt(-gap, 0) + ' puntos menos que ') + esc(b[2]) + '. Si el partido fuera un Bo3, equivale a ganar cada mapa con ' + fmtPct(pm, 1) + '.');
    $('[data-o="dlink"]').href = '/esports/series?bo=3&p=' + fmtInput(pm * 100, 1);
    if (push) setParams({ a: a[0], b: b[0] });
  };
  const p = params();
  for (const [el, k] of [[A, 'a'], [B, 'b']]) if (p.get(k) && [...el.options].some(o => o.value === p.get(k))) el.value = p.get(k);
  A.addEventListener('change', () => duel());
  B.addEventListener('change', () => duel());
  duel(false);
  draw();
}
