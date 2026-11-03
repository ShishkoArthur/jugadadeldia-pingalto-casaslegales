import { $, $$, page, store, esc } from './kit.js';

const D = page();
const B = D.B;
const KEY = 'jg-burako';
function calcBox(box, onChange) {
  const v = {};
  const get = k => v[k] || 0;
  function total() {
    const c = k => $('[data-c="' + k + '"]', box).checked;
    const mesa = c('mesa');
    $('[data-g="mesa"]', box).hidden = !mesa; $('[data-mesa-h]', box).hidden = !mesa;
    const can = get('pura') * B.pura + get('impura') * B.impura;
    const onT = mesa ? B.tiles.reduce((s, t) => s + get('m-' + t.k) * t.v, 0) : 0;
    const inH = B.tiles.reduce((s, t) => s + get('h-' + t.k) * t.v, 0);
    const cl = c('cierre') ? B.cierre : 0, mu = c('muerto') ? 0 : -B.muerto;
    const sum = can + onT + cl + mu - inH;
    $('[data-o="total"]', box).textContent = sum;
    const parts = [can ? 'canastas ' + can : '', onT ? 'fichas bajadas ' + onT : '', cl ? 'cierre ' + cl : '', mu ? 'muerto ' + mu : '', inH ? 'en la mano −' + inH : ''].filter(Boolean);
    const warn = c('cierre') && (!(get('pura') + get('impura')) || !c('muerto')) ? ' Ojo: para cerrar hace falta una canasta y haber comprado el muerto.' : '';
    $('[data-o="why"]', box).textContent = (parts.length ? parts.join(' · ') + ' = ' + sum + '.' : 'Cargá las canastas y las fichas.') + warn;
    if (onChange) onChange(sum);
    return sum;
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    const k = b.dataset.k; v[k] = Math.max(0, Math.min(99, get(k) + +b.dataset.d));
    $('[data-v="' + k + '"]', box).textContent = v[k];
    total();
  });
  box.addEventListener('change', total);
  return { total, reset() { for (const k of Object.keys(v)) { v[k] = 0; $('[data-v="' + k + '"]', box).textContent = 0; } $$('[data-c]', box).forEach(i => { i.checked = i.dataset.c !== 'cierre'; }); total(); } };
}
const calc = $('[data-burako]');
const C = calc ? calcBox(calc) : null;
if (C) C.total();
const sheet = $('[data-anotbur]');
if (sheet && calc) {
  let S;
  try { S = JSON.parse(store.get(KEY)); } catch (e) { S = null; }
  if (!S || !Array.isArray(S.rows)) S = { goal: B.goal, names: ['Nosotros', 'Ellos'], rows: [] };
  let side = 0;
  const f = $('[data-cfg]', sheet);
  f.elements.goal.value = S.goal; f.elements.a.value = S.names[0]; f.elements.b.value = S.names[1];
  const save = () => store.set(KEY, JSON.stringify(S));
  function render() {
    const t = [0, 0]; S.rows.forEach(r => { t[0] += r[0] || 0; t[1] += r[1] || 0; });
    $('[data-o="sheet"]', sheet).innerHTML = '<thead><tr><th>Mano</th><th>' + esc(S.names[0]) + '</th><th>' + esc(S.names[1]) + '</th></tr></thead><tbody>' + S.rows.map((r, i) => '<tr><td>' + (i + 1) + '</td><td>' + (r[0] ?? '…') + '</td><td>' + (r[1] ?? '…') + '</td></tr>').join('') + '</tbody><tfoot><tr><td>Total</td><td>' + t[0] + '</td><td>' + t[1] + '</td></tr></tfoot>';
    const done = S.rows.length && S.rows[S.rows.length - 1].every(x => x !== null);
    const over = t.map(x => x >= S.goal);
    $('[data-o="lead"]', sheet).textContent = done && over.some(Boolean) ? 'Ganó ' + S.names[over[0] && over[1] ? (t[0] >= t[1] ? 0 : 1) : over[0] ? 0 : 1] + '.' : 'Faltan ' + Math.max(0, S.goal - Math.max(...t)).toLocaleString('es-AR') + ' para la meta de ' + S.goal.toLocaleString('es-AR') + '.';
    $$('[data-side]', calc).forEach(b => { b.textContent = S.names[+b.dataset.side]; b.setAttribute('aria-pressed', +b.dataset.side === side ? 'true' : 'false'); });
  }
  f.addEventListener('input', () => { S.goal = +f.elements.goal.value; S.names = [f.elements.a.value || 'Lado 1', f.elements.b.value || 'Lado 2']; save(); render(); });
  calc.addEventListener('click', e => {
    const s = e.target.closest('[data-side]');
    if (s) { side = +s.dataset.side; render(); }
    if (e.target.closest('[data-put]')) {
      const v = C.total();
      let last = S.rows[S.rows.length - 1];
      if (!last || last[side] !== null) { last = [null, null]; S.rows.push(last); }
      last[side] = v; side = 1 - side; C.reset(); save(); render();
    }
    if (e.target.closest('[data-zero]')) C.reset();
  });
  sheet.addEventListener('click', e => {
    if (e.target.closest('[data-undo]')) {
      const last = S.rows[S.rows.length - 1];
      if (last) { const k = last[1] !== null ? 1 : 0; last[k] = null; if (last.every(x => x === null)) S.rows.pop(); side = k; }
      save(); render();
    }
    if (e.target.closest('[data-reset]')) { S.rows = []; side = 0; save(); render(); }
  });
  render();
}
