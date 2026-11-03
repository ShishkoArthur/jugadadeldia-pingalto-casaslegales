import { series, FORMATS } from '../../../engine/games/series.mjs';
import { curvesSvg, scoreTable, invTable } from '../../../engine/games/seriesviz.mjs';
import { $, $$, out, num, params, setParams, share, fmt, fmtPct, fmtInput } from './kit.js';

const f = $('#pa-sf');
if (f) {
  let bo = 3;
  const P = $('#sr-p'), each = $('#sr-each'), box = $('#sr-maps'), A = $('#sr-a'), B = $('#sr-b'), T = $('#sr-t');
  const mapIn = $$('input', box);
  const btns = $$('[data-bo]', f);
  const pct = el => { const v = num(el); return Number.isFinite(v) && v >= 0 && v <= 100 ? v / 100 : NaN; };
  const fillScore = (sel, w) => { const keep = Math.min(Number(sel.value) || 0, w - 1); sel.innerHTML = Array.from({ length: w }, (_, i) => '<option value="' + i + '">' + i + '</option>').join(''); sel.value = String(keep); };
  const run = (push = true) => {
    const w = (bo + 1) / 2;
    btns.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.bo) === bo)));
    if (A.options.length !== w) { fillScore(A, w); fillScore(B, w); }
    box.hidden = !each.checked;
    mapIn.forEach((el, i) => { el.closest('.pa-f').hidden = i >= bo; });
    const p = pct(P);
    const list = each.checked ? mapIn.slice(0, bo).map(pct) : null;
    if (!Number.isFinite(p) || (list && list.some(x => !Number.isFinite(x)))) { out('say', 'Cargá chances entre 0 y 100.'); return; }
    const a = Number(A.value), b = Number(B.value);
    const r = series(bo, list || p, { a, b });
    out('pa', fmtPct(r.pA, 1));
    const bar = $('[data-o="bar"]'); bar.style.setProperty('--v', String(Math.round(r.pA * 100))); bar.querySelector('span').textContent = 'B: ' + fmtPct(r.pB, 1);
    const from = a || b ? 'Desde ' + a + '-' + b + ', ' : '';
    const say = from + (list ? 'con una chance por mapa, ' : 'con ' + fmtPct(p, 1) + ' por mapa, ') + 'un Bo' + bo + ' le da al equipo A ' + fmtPct(r.pA, 1) + '.';
    out('say', say[0].toUpperCase() + say.slice(1));
    out('tbl', scoreTable(r));
    out('len', 'Mapas que se juegan en promedio: ' + fmt(r.expectedMaps, 2) + ' de ' + bo + (bo > 1 ? '. Chance de que haya mapa ' + bo + ': ' + fmtPct(r.played[bo - 1], 1) + '.' : '.'));
    out('curve', curvesSvg(FORMATS, list ? null : p));
    if (push) setParams({ bo, p: fmtInput(p * 100, 1), a: a || '', b: b || '', m: list ? list.map(x => fmtInput(x * 100, 1)).join('~') : '' });
  };
  const inv = () => { const t = pct(T); if (Number.isFinite(t)) out('inv', invTable(t)); };
  const q = params();
  if (FORMATS.includes(Number(q.get('bo')))) bo = Number(q.get('bo'));
  if (q.get('p')) P.value = q.get('p');
  if (q.get('m')) { each.checked = true; q.get('m').split('~').forEach((v, i) => { if (mapIn[i]) mapIn[i].value = v; }); }
  fillScore(A, (bo + 1) / 2); fillScore(B, (bo + 1) / 2);
  if (q.get('a')) A.value = q.get('a');
  if (q.get('b')) B.value = q.get('b');
  btns.forEach(b => b.addEventListener('click', () => { bo = Number(b.dataset.bo); run(); }));
  each.addEventListener('change', () => { if (each.checked) mapIn.forEach(el => { el.value = P.value; }); });
  f.addEventListener('input', () => run());
  f.addEventListener('change', () => run());
  f.addEventListener('submit', e => e.preventDefault());
  if (T) T.addEventListener('input', inv);
  share();
  run(false);
}
