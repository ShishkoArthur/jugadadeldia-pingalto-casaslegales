import { $, $$, fmt } from './kit.js';
import { cardHtml, cardName } from './cards.js';
import { envidoPoints, envidoVsRandom, ENVIDO_VALUE, oppEnvidoAtLeast } from '../../../engine/truco/index.mjs';

const box = $('[data-envido]');
const res = $('[data-o="pts"]') && $('[data-o="pts"]').closest('section');
const out = k => $('[data-o="' + k + '"]', res);
let sel = [], mano = true;
function why(h) {
  const by = {};
  for (const c of h) (by[c.slice(-1)] = by[c.slice(-1)] || []).push(c);
  const same = Object.values(by).find(x => x.length >= 2);
  if (!same) { const top = h.slice().sort((a, b) => ENVIDO_VALUE[b] - ENVIDO_VALUE[a])[0]; return 'No tenés dos del mismo palo: vale tu carta más alta para el envido, ' + cardName(top) + ' (' + ENVIDO_VALUE[top] + ').'; }
  const two = same.slice().sort((a, b) => ENVIDO_VALUE[b] - ENVIDO_VALUE[a]).slice(0, 2);
  return two.map(c => cardName(c) + ' (' + ENVIDO_VALUE[c] + ')').join(' + ') + ' + 20 por ser del mismo palo.';
}
function show() {
  $$('[data-picker] [data-card]').forEach(el => el.classList.toggle('sel', sel.includes(el.dataset.card)));
  out('hand').innerHTML = sel.map(c => cardHtml(c)).join('');
  if (sel.length < 3) { out('pts').textContent = '-'; out('why').textContent = 'Faltan ' + (3 - sel.length) + (3 - sel.length === 1 ? ' carta.' : ' cartas.'); return; }
  const p = envidoPoints(sel);
  out('pts').textContent = p;
  out('why').textContent = why(sel);
  const r = envidoVsRandom(sel, { mano, flor: false });
  const more = oppEnvidoAtLeast(sel, p + 1);
  out('vs').innerHTML = '';
  out('vs').append('Contra una mano al azar ganás el envido ' + fmt(r.win.p * 100, 1) + ' % de las veces. El rival tiene más que vos en ' + fmt(more.p * 100, 1) + ' % de las manos.');
}
if (box) {
  box.addEventListener('click', e => {
    const c = e.target.closest('[data-card]');
    if (!c) return;
    const k = c.dataset.card;
    if (sel.includes(k)) sel = sel.filter(x => x !== k); else if (sel.length < 3) sel.push(k); else sel = [sel[1], sel[2], k];
    show();
  });
  box.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-card]')) { e.preventDefault(); e.target.click(); } });
  $$('[data-mano]').forEach(b => b.addEventListener('click', () => { mano = b.dataset.mano === '1'; $$('[data-mano]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); show(); }));
  sel = ['6o', '7o', '12c'];
  show();
}
