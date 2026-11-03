import { $, $$, page, store, fmt } from './kit.js';
import { solver, validateRules } from '../../../engine/generala/index.mjs';

const D = page();
const root = $('[data-anotgen]');
const help = $('[data-ayuda]');
const KEY = 'jg-generala-planilla';
let S = null;
const blank = (n, rk, doble, dv) => ({ n, rk, doble, dv, names: Array.from({ length: n }, (_, i) => 'Jugador ' + (i + 1)), sheets: Array.from({ length: n }, () => ({})), log: [] });
function rules() {
  const base = D.rules[S.rk];
  const dv = parseInt(S.dv, 10);
  return validateRules({ ...base, doble: S.doble && dv > 0 ? dv : null });
}
const boxes = () => (rules().doble === null ? D.boxes : [...D.boxes, 'doble']);
function options(box) {
  const r = rules();
  if (/^[1-6]$/.test(box)) return Array.from({ length: 6 }, (_, k) => k * +box);
  if (box === 'generala') return [0, r.generala];
  if (box === 'doble') return [0, r.doble];
  return [0, r[box], r[box] + r.servidaBonus];
}
function save() { store.set(KEY, JSON.stringify(S)); }
function total(i) { return Object.values(S.sheets[i]).reduce((a, b) => a + (b || 0), 0); }
function render() {
  const f = root;
  f.querySelector('[name=n]').value = S.n; f.querySelector('[name=g]').value = S.rk; f.querySelector('[name=doble]').checked = S.doble; f.querySelector('[name=dv]').value = S.dv || '';
  $('[data-doblev]', f).hidden = !S.doble;
  const B = boxes();
  let html = '<thead><tr><th>Casillero</th>' + S.names.map((nm, i) => '<th><input class="jg-tn" data-nm="' + i + '" value="' + nm.replace(/"/g, '&quot;') + '" aria-label="Nombre del jugador ' + (i + 1) + '"></th>').join('') + '</tr></thead><tbody>';
  for (const b of B) {
    html += '<tr><td>' + D.names[b] + '</td>' + S.names.map((_, i) => {
      const v = S.sheets[i][b];
      if (v !== undefined && v !== null) return '<td><button type="button" data-cell="' + i + ':' + b + '">' + (v === 0 ? '✕' : v) + '</button></td>';
      return '<td><select class="jg-se" data-pick="' + i + ':' + b + '" aria-label="' + D.names[b] + ', ' + S.names[i] + '"><option value="">-</option>' + options(b).map(o => '<option value="' + o + '">' + (o === 0 ? 'tachar' : o) + '</option>').join('') + '</select></td>';
    }).join('') + '</tr>';
  }
  html += '<tr class="tot"><td>Total</td>' + S.names.map((_, i) => '<td>' + total(i) + '</td>').join('') + '</tr></tbody>';
  $('[data-o="sheet"]', f).innerHTML = html;
  const who = $('[data-o="who"]', help);
  const keep = who.value;
  who.innerHTML = S.names.map((nm, i) => '<option value="' + i + '">' + nm.replace(/</g, '&lt;') + '</option>').join('');
  if (keep && +keep < S.n) who.value = keep;
  tips();
}
let dice = [1, 2, 3, 4, 6];
function tips() {
  $$('[data-i]', help).forEach((b, k) => { b.textContent = dice[k]; b.setAttribute('aria-label', 'Dado ' + (k + 1) + ': ' + dice[k]); });
  const t = +$('[name=t]', help).value, p = +$('[data-o="who"]', help).value || 0;
  const B = boxes();
  const sheet = Object.fromEntries(B.map(b => [b, S.sheets[p][b] === undefined ? null : S.sheets[p][b]]));
  const ol = $('[data-o="tips"]', help);
  if (B.every(b => sheet[b] !== null)) { ol.innerHTML = '<li>La planilla de este jugador está completa.</li>'; return; }
  const opts = solver(rules(), 'game').options(sheet, dice.slice().sort((a, b) => a - b), t).slice(0, 4);
  const best = opts[0].ev;
  ol.innerHTML = opts.map(o => '<li><span>' + (o.type === 'score' ? 'Anotá ' + (o.points || 'tachá') + ' en ' + D.names[o.box] : o.keep.length ? 'Guardá ' + o.keep.join(' ') + ' y tirá' : 'Tirá los cinco') + '</span><b>' + (o.ev === best ? 'la mejor' : '−' + fmt(best - o.ev, 2)) + '</b></li>').join('');
}
if (root) {
  try { S = JSON.parse(store.get(KEY) || 'null'); } catch (e) { S = null; }
  if (!S || !D.rules[S.rk]) S = blank(2, 'ruibal', false, '');
  render();
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.pick) { const [i, b] = t.dataset.pick.split(':'); if (t.value === '') return; S.sheets[i][b] = +t.value; S.log.push(t.dataset.pick); save(); render(); return; }
    if (t.name === 'n') { const n = +t.value; while (S.names.length < n) { S.names.push('Jugador ' + (S.names.length + 1)); S.sheets.push({}); } S.names.length = n; S.sheets.length = n; S.n = n; }
    if (t.name === 'g') S.rk = t.value;
    if (t.name === 'doble') S.doble = t.checked;
    if (t.name === 'dv') S.dv = t.value.replace(/\D/g, '');
    save(); render();
  });
  root.addEventListener('input', e => { if (e.target.dataset.nm !== undefined) { S.names[+e.target.dataset.nm] = e.target.value.slice(0, 18) || 'Jugador'; save(); } });
  root.addEventListener('click', e => {
    const c = e.target.closest('[data-cell]');
    if (c && confirm('¿Borrar este casillero?')) { const [i, b] = c.dataset.cell.split(':'); delete S.sheets[i][b]; save(); render(); }
    if (e.target.closest('[data-undo]')) { const k = S.log.pop(); if (k) { const [i, b] = k.split(':'); delete S.sheets[i][b]; save(); render(); } }
    if (e.target.closest('[data-reset]') && confirm('¿Planilla nueva?')) { S = blank(S.n, S.rk, S.doble, S.dv); S.names = S.names.map((_, i) => 'Jugador ' + (i + 1)); save(); render(); }
  });
  help.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; const k = +b.dataset.i - 1; dice[k] = dice[k] % 6 + 1; tips(); });
  help.addEventListener('change', tips);
}
