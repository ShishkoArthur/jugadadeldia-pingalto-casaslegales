import { $, $$, page } from './kit.js';
import { cardHtml, cardName } from './cards.js';
import { captures, scoreHand, VALUE, validateRules } from '../../../engine/escoba/rules.mjs';
import { DECK_40 } from '../../../engine/cards/spanish.mjs';

const D = page();
const box = $('[data-busca]'), cnt = $('[data-cuenta]');
let mode = 't', table = [], mine = null;
const out = (k, el) => $('[data-o="' + k + '"]', el);
function busca() {
  $$('[data-picker] [data-card]', box).forEach(el => { el.classList.toggle('tb', table.includes(el.dataset.card)); el.classList.toggle('mi', el.dataset.card === mine); });
  const res = $('[data-o="n"]').closest('section');
  if (!mine) { out('n', res).textContent = '-'; out('list', res).innerHTML = '<p class="jg-note">Cargá las cartas de la mesa y después tu carta.</p>'; return; }
  const list = captures(table, mine);
  out('n', res).textContent = list.length;
  const sum = table.reduce((s, c) => s + VALUE[c], 0) + VALUE[mine];
  out('list', res).innerHTML = (list.length ? list.map(l => '<div class="jg-meld"><div' + (l.length === table.length ? '' : ' class="lo"') + '><small>' + (l.length === table.length ? '¡Escoba!' : 'Levantás') + '</small><div class="jg-hand xs">' + [mine, ...l].map(c => cardHtml(c)).join('') + '</div></div></div>').join('') :
    '<p class="jg-hon">Con ' + cardName(mine) + ' (' + VALUE[mine] + ') no llegás a 15 con nada de la mesa: tenés que dejarla.</p>') +
    '<p class="jg-note">Mesa más tu carta: ' + sum + ' puntos. ' + (sum === 15 ? 'Suman justo 15: escoba.' : '') + '</p>';
}
function cuenta() {
  const sel = new Set($$('[data-mine] .sel', cnt).map(el => el.dataset.card));
  const piles = [DECK_40.filter(c => sel.has(c)), DECK_40.filter(c => !sel.has(c))];
  const e = [0, 1].map(i => Math.max(0, parseInt($('input[name=e' + i + ']', cnt).value, 10) || 0));
  const r = validateRules({ ...D.rules[$('select[name=r]', cnt).value] });
  const s = scoreHand(r, piles, e);
  out('p0', cnt).textContent = s.points[0]; out('p1', cnt).textContent = s.points[1];
  const W = { escoba: 'escoba', sieteDeOros: 'siete de oros', cartas: 'cartas', oros: 'oros', setenta: 'setenta', sietes: 'sietes' };
  out('detail', cnt).innerHTML = '<li>Vos: ' + piles[0].length + ' cartas</li>' + s.detail.map(d => '<li>' + (d.side === 0 ? 'Vos' : 'Rival') + ': ' + W[d.why] + '</li>').join('');
}
if (box) {
  box.addEventListener('click', e => {
    const m = e.target.closest('[data-mode]');
    if (m) { mode = m.dataset.mode; $$('[data-mode]', box).forEach(x => x.setAttribute('aria-pressed', x === m ? 'true' : 'false')); return; }
    if (e.target.closest('[data-clear]')) { table = []; mine = null; busca(); return; }
    const c = e.target.closest('[data-card]');
    if (!c) return;
    const k = c.dataset.card;
    if (mode === 'm') { mine = mine === k ? null : k; table = table.filter(x => x !== k); }
    else { if (k === mine) mine = null; table = table.includes(k) ? table.filter(x => x !== k) : table.length < 10 ? [...table, k] : table; }
    busca();
  });
  box.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.card) { e.preventDefault(); e.target.click(); } });
  busca();
}
if (cnt) {
  cnt.addEventListener('click', e => { const c = e.target.closest('[data-card]'); if (c) { c.classList.toggle('sel'); cuenta(); } });
  cnt.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.card) { e.preventDefault(); e.target.click(); } });
  cnt.addEventListener('input', cuenta); cnt.addEventListener('change', cuenta);
  cuenta();
}
