import { $, $$, page, fmt, parseNum, pesos, oneIn, params, setParams, share } from './kit.js';
import { helpLine } from './jg.js';
import { directBet } from '../../../engine/lottery/quiniela.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';

const form = $('[data-cuanto]');
const D = page();
const out = k => $('[data-o="' + k + '"]');
const PLACE = { 1: 'a la cabeza', 5: 'a los 5', 10: 'a los 10', 20: 'a los 20' };

function read() {
  const f = new FormData(form);
  return { j: f.get('j'), d: +f.get('d'), u: +f.get('u'), a: parseNum(f.get('a')) };
}
function sync(st) {
  const J = D.j[st.j];
  $$('[data-solo]', form).forEach(l => { const ok = l.dataset.solo === st.j; l.hidden = !ok; if (!ok && l.querySelector('input').checked) { form.querySelector('input[name=d][value="4"]').checked = true; } });
  $('#jg-min').hidden = !J.min;
}
function calc() {
  const st = read();
  sync(st);
  const s2 = read();
  const J = D.j[s2.j];
  const warn = out('warn');
  warn.hidden = true;
  helpLine(J.help);
  if (!(s2.a > 0) || Math.round(s2.a * 100) !== s2.a * 100) { out('pay').textContent = '-'; warn.hidden = false; warn.textContent = 'Escribí cuánto apostás, en pesos (por ejemplo 150 o 150,50).'; return; }
  const r = directBet({ rules: J.id, digits: s2.d, places: s2.u, stake: s2.a });
  const ev = toNumber(r.evPer100), evLow = toNumber(r.evLowPer100);
  out('pay').textContent = pesos(toNumber(r.perHit));
  out('times').textContent = fmt(r.ratio / s2.u, 2) + ' veces lo apostado';
  out('per').textContent = s2.d + (s2.d === 1 ? ' cifra ' : ' cifras ') + PLACE[s2.u];
  out('odds').textContent = oneIn(r.oneIn);
  const evText = r.pUnclear.n > 0n && pesos(evLow) !== pesos(ev) ? pesos(evLow) + ' a ' + pesos(ev) : pesos(ev);
  out('ev').textContent = evText; out('ev2').textContent = pesos(ev);
  out('bar').style.setProperty('--w', ev + '%');
  if (r.pUnclear.n > 0n) { warn.hidden = false; warn.textContent = 'Si tu número se repite, el tope del reglamento de la Provincia puede recortar el premio: por eso el promedio es un rango.'; }
  setParams({ j: s2.j === 'lotba' ? null : s2.j, d: s2.d === 2 ? null : s2.d, u: s2.u === 1 ? null : s2.u, a: s2.a === 100 ? null : String(s2.a).replace('.', ',') });
  $$('.jg-pt tr[data-d]').forEach(tr => tr.classList.toggle('on', +tr.dataset.d === s2.d && +tr.dataset.u === s2.u));
}
if (form) {
  const p = params();
  const set = (name, v) => { const el = form.querySelector('input[name=' + name + '][value="' + v + '"]'); if (el) el.checked = true; };
  if (p.get('j') && D.j[p.get('j')]) set('j', p.get('j'));
  if (p.get('d')) set('d', p.get('d'));
  if (p.get('u')) set('u', p.get('u'));
  if (p.get('a') && parseNum(p.get('a')) > 0) form.elements.a.value = p.get('a');
  form.addEventListener('input', calc);
  form.addEventListener('change', calc);
  form.addEventListener('submit', e => e.preventDefault());
  calc();
  const b = $('[data-share]');
  if (b) b.addEventListener('click', () => share(b, document.title));
}
$$('[data-tab]').forEach(b => b.addEventListener('click', () => {
  $$('[data-tab]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  $$('[data-tabla]').forEach(t => { t.hidden = t.dataset.tabla !== b.dataset.tab; });
}));
