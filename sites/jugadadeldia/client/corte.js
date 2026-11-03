import { $, $$, page } from './kit.js';
import { cardHtml } from './cards.js';
import { canCut, bestSplit } from '../../../engine/chinchon/melds.mjs';
import { validateRules, cardValue } from '../../../engine/chinchon/rules.mjs';

const D = page();
const box = $('[data-corte]');
const res = $('[data-o="pts"]') && $('[data-o="pts"]').closest('section');
const out = k => $('[data-o="' + k + '"]', res);
let hand = [];
const R = () => validateRules({ ...D.rules[$('select[name=r]', box).value] });
const group = (cards, label, lo) => '<div' + (lo ? ' class="lo"' : '') + '><small>' + label + '</small><div class="jg-hand xs">' + cards.map(c => cardHtml(c)).join('') + '</div></div>';
function show() {
  const name = $('select[name=r]', box).value, deck = new Set(D.decks[name]);
  hand = hand.filter(c => deck.has(c));
  $$('[data-picker] [data-card]', box).forEach(el => { el.hidden = !deck.has(el.dataset.card); el.classList.toggle('sel', hand.includes(el.dataset.card)); });
  out('hand').innerHTML = hand.map(c => cardHtml(c)).join('');
  if (hand.length !== 7) { out('verdict').textContent = 'Elegí 7 cartas'; out('pts').textContent = hand.length + '/7'; out('melds').innerHTML = ''; out('why').textContent = ''; return; }
  const r = R(), c = canCut(r, hand), b = bestSplit(r, hand);
  out('pts').textContent = c.points;
  out('verdict').textContent = b.chinchon ? '¡Chinchón!' : c.ok ? 'Podés cortar' : 'Todavía no';
  out('melds').innerHTML = c.melds.map((m, i) => group(m, 'Juego ' + (i + 1))).join('') + (c.left.length ? group(c.left, 'Sueltas', true) : '');
  const loose = c.left.map(x => cardValue(r, x)).join(' + ');
  out('why').textContent = b.chinchon ? 'Siete cartas en escalera del mismo palo' + (b.chinchonJokers ? ', con comodín: en el bonaerense se anota ' + r.chinchonWithJoker + '.' : ': ganás el partido.') :
    c.left.length === 0 ? 'Todo en juegos: cortás y anotás ' + r.allMelded + '.' :
    'Te quedan sueltas: ' + loose + ' = ' + c.points + ' puntos. ' + (r.cut === 'sum-at-most-5' ? 'Para cortar tienen que sumar 5 o menos.' : 'Para cortar te puede quedar una sola carta de 4 o menos.') + (b.points < c.points ? ' Si no cortás, la mejor forma de armarla deja ' + b.points + '.' : '');
}
if (box && res) {
  box.addEventListener('click', e => {
    if (e.target.closest('[data-clear]')) { hand = []; show(); return; }
    const c = e.target.closest('[data-card]');
    if (!c) return;
    const k = c.dataset.card;
    hand = hand.includes(k) ? hand.filter(x => x !== k) : hand.length < 7 ? [...hand, k] : hand;
    show();
  });
  box.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.card) { e.preventDefault(); e.target.click(); } });
  box.addEventListener('change', show);
  show();
}
