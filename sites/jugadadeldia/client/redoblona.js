import { $, page, fmt, parseNum, pesos, oneIn, params, setParams, share } from './kit.js';
import { helpLine } from './jg.js';
import { redoblona } from '../../../engine/lottery/quiniela.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';

const form = $('[data-redo]');
const D = page();
const out = k => $('[data-o="' + k + '"]');
const two = v => { const s = String(v).trim(); return /^\d{1,2}$/.test(s) ? +s : NaN; };

function calc() {
  const f = new FormData(form);
  const j = f.get('j'), a = two(f.get('a')), b = two(f.get('b')), s = parseNum(f.get('s'));
  const err = out('err');
  err.hidden = true;
  const blank = () => { out('top').textContent = '-'; out('odds').textContent = '-'; out('ev').textContent = out('ev3').textContent = '-'; out('dist').textContent = ''; };
  helpLine(D.j[j].help);
  if (Number.isNaN(a) || Number.isNaN(b)) { err.hidden = false; err.textContent = 'Los dos números van de 00 a 99.'; blank(); return; }
  if (!(s > 0) || Math.round(s * 100) !== s * 100) { err.hidden = false; err.textContent = 'Escribí cuánto apostás, en pesos.'; blank(); return; }
  let r;
  try { r = redoblona({ rules: D.j[j].id, first: { number: a, places: +f.get('ua') }, second: { number: b, places: +f.get('ub') }, stake: s }); } catch (e) {
    err.hidden = false;
    err.textContent = e.code === 'NOT_REDOBLONA' ? (e.message.includes('both bets') ? 'Si los dos van a la cabeza no es una redoblona: elegí otra ubicación para el segundo.' : 'En la Provincia, si el primero va más lejos que el segundo, se paga como apuesta directa.') : 'Revisá los datos.';
    blank();
    return;
  }
  const outs = r.outcomes;
  out('top').textContent = pesos(toNumber(outs[outs.length - 1].amount));
  out('odds').textContent = oneIn(r.oneIn);
  out('ev').textContent = out('ev3').textContent = pesos(toNumber(r.evPer100));
  const body = out('dist');
  body.textContent = '';
  for (const o of outs.slice().reverse()) {
    const tr = document.createElement('tr');
    const p = toNumber(o.p);
    tr.innerHTML = '<td class="n"></td><td class="n"></td>';
    tr.children[0].textContent = pesos(toNumber(o.amount));
    tr.children[1].textContent = o.amount.n > 0n ? oneIn(1 / p) : fmt(p * 100, 3) + ' %';
    body.append(tr);
  }
  setParams({ j: j === 'lotba' ? null : j, a: String(a).padStart(2, '0'), b: String(b).padStart(2, '0'), ua: f.get('ua'), ub: f.get('ub'), s: String(s).replace('.', ',') });
}
if (form) {
  const p = params();
  if (p.get('j') === 'pba') form.querySelector('input[name=j][value=pba]').checked = true;
  for (const k of ['a', 'b', 's']) if (p.get(k)) form.elements[k].value = p.get(k);
  for (const k of ['ua', 'ub']) if (['1', '5', '10', '20'].includes(p.get(k))) form.elements[k].value = p.get(k);
  form.addEventListener('input', calc);
  form.addEventListener('change', calc);
  form.addEventListener('submit', e => e.preventDefault());
  calc();
  const b = $('[data-share]');
  if (b) b.addEventListener('click', () => share(b, document.title));
}
