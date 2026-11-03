import { $, page, store, esc } from './kit.js';

const D = page();
const box = $('[data-anotchin]');
const KEY = 'jg-chinchon';
const out = k => $('[data-o="' + k + '"]', box);
let S = null;
const fresh = (n, lim, re) => ({ n, lim, re, names: Array.from({ length: n }, (_, i) => 'Jugador ' + (i + 1)), rows: [], back: Array(n).fill(0) });
function load() { try { const v = JSON.parse(store.get(KEY)); if (v && Array.isArray(v.rows)) return v; } catch (e) { return null; } return null; }
const save = () => store.set(KEY, JSON.stringify(S));
function totals() {
  const t = Array(S.n).fill(0), out_ = Array(S.n).fill(false), back = Array(S.n).fill(0);
  for (const r of S.rows) {
    r.forEach((v, i) => { if (!out_[i]) t[i] += v; });
    const alive = () => t.map((x, i) => (!out_[i] && x <= S.lim ? i : -1)).filter(i => i >= 0);
    for (let i = 0; i < S.n; i++) if (!out_[i] && t[i] > S.lim) {
      const a = alive();
      if (S.re && S.n > 2 && a.length >= 2) { t[i] = Math.max(...a.map(j => t[j])); back[i]++; } else out_[i] = true;
    }
  }
  return { t, out: out_, back };
}
function render() {
  const { t, out: o, back } = totals();
  const head = '<thead><tr><th>Mano</th>' + S.names.map((nm, i) => '<th><input data-name="' + i + '" value="' + esc(nm) + '" maxlength="14" aria-label="Nombre ' + (i + 1) + '"></th>').join('') + '</tr></thead>';
  const body = '<tbody>' + S.rows.map((r, k) => '<tr><td>' + (k + 1) + '</td>' + r.map(v => '<td>' + v + '</td>').join('') + '</tr>').join('') +
    '<tr><td>Nueva</td>' + S.names.map((_, i) => '<td>' + (o[i] ? '—' : '<input data-in="' + i + '" inputmode="numeric" maxlength="4" aria-label="Puntos de ' + esc(S.names[i]) + '">') + '</td>').join('') + '</tr></tbody>';
  const foot = '<tfoot><tr><td>Total</td>' + t.map((v, i) => '<td' + (o[i] ? ' style="text-decoration:line-through;opacity:.5"' : '') + '>' + v + (back[i] ? ' <small>(' + back[i] + ' reeng.)</small>' : '') + '</td>').join('') + '</tr></tfoot>';
  out('sheet').innerHTML = head + body + foot;
  const alive = o.map((x, i) => (x ? -1 : i)).filter(i => i >= 0);
  out('state').textContent = alive.length === 1 && S.rows.length ? 'Ganó ' + S.names[alive[0]] + '.' : alive.length === 0 && S.rows.length ? 'Todos pasaron de ' + S.lim + ': gana el que tiene menos.' : 'Límite: ' + S.lim + '. ' + (S.re ? 'Con reenganche.' : 'Sin reenganche.');
}
function setup(force) {
  const f = $('[data-cfg]', box);
  const n = +f.elements.n.value, lim = Math.max(10, Math.min(999, parseInt(f.elements.lim.value, 10) || D.limit)), re = f.elements.re.checked;
  if (force || !S || S.n !== n) S = fresh(n, lim, re); else { S.lim = lim; S.re = re; }
  save(); render();
}
if (box) {
  S = load();
  const f = $('[data-cfg]', box);
  if (S) { f.elements.n.value = S.n; f.elements.lim.value = S.lim; f.elements.re.checked = S.re; render(); } else setup(true);
  f.addEventListener('change', () => setup(false));
  box.addEventListener('input', e => { if (e.target.dataset.name !== undefined) { S.names[+e.target.dataset.name] = e.target.value; save(); } });
  box.addEventListener('click', e => {
    if (e.target.closest('[data-add]')) {
      const { out: o } = totals();
      const row = S.names.map((_, i) => { const el = $('[data-in="' + i + '"]', box); return o[i] || !el ? 0 : parseInt(el.value, 10) || 0; });
      S.rows.push(row); save(); render();
    }
    if (e.target.closest('[data-undo]')) { S.rows.pop(); save(); render(); }
    if (e.target.closest('[data-reset]')) { const names = S.names; setup(true); S.names = S.names.map((x, i) => names[i] || x); save(); render(); }
  });
}
