import { $, $$, fmt } from './kit.js';
import { cardHtml } from './cards.js';
import { hasFlor, florPoints, envidoPoints, oppFlorChance } from '../../../engine/truco/index.mjs';
import { DECK_40, combinations } from '../../../engine/cards/spanish.mjs';

const pick = $('[data-flor]');
const res = $('[data-o="pts"]') && $('[data-o="pts"]').closest('section');
const out = k => $('[data-o="' + k + '"]', res);
let sel = [], mano = true;
function show() {
  $$('[data-picker] [data-card]', pick).forEach(el => el.classList.toggle('sel', sel.includes(el.dataset.card)));
  out('hand').innerHTML = sel.map(c => cardHtml(c)).join('');
  if (sel.length < 3) { out('pts').textContent = '-'; out('lbl').textContent = 'Flor'; out('vs').textContent = 'Faltan ' + (3 - sel.length) + (3 - sel.length === 1 ? ' carta.' : ' cartas.'); return; }
  const of = oppFlorChance(sel);
  if (!hasFlor(sel)) {
    out('lbl').textContent = 'Sin flor · envido'; out('pts').textContent = envidoPoints(sel);
    out('vs').textContent = 'No es flor: las tres no son del mismo palo. Con esta mano, el rival tiene flor ' + fmt(of.p * 100, 2) + ' % de las veces.';
    return;
  }
  const mine = florPoints(sel), rest = DECK_40.filter(c => !sel.includes(c));
  let fl = 0, win = 0, total = 0;
  combinations(rest, 3, h => { total++; if (hasFlor(h)) { fl++; const p = florPoints(h); if (p < mine || (p === mine && mano)) win++; } });
  out('lbl').textContent = 'Flor'; out('pts').textContent = mine;
  out('vs').textContent = 'El rival tiene flor ' + fmt(100 * fl / total, 2) + ' % de las veces (' + fl + ' de ' + total + ' manos). Si la tiene, tu flor le gana ' + fmt(100 * win / fl, 1) + ' % de las veces: eso pesa si te cantan contraflor.';
}
if (pick && res) {
  pick.addEventListener('click', e => {
    const c = e.target.closest('[data-card]');
    if (!c) return;
    const k = c.dataset.card;
    sel = sel.includes(k) ? sel.filter(x => x !== k) : sel.length < 3 ? [...sel, k] : sel;
    show();
  });
  pick.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.card) { e.preventDefault(); e.target.click(); } });
  res.addEventListener('click', e => { const b = e.target.closest('[data-mano]'); if (!b) return; mano = b.dataset.mano === '1'; $$('[data-mano]', res).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); show(); });
  show();
}
