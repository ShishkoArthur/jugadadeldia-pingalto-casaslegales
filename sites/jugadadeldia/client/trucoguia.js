import { $, $$ } from './kit.js';
import { cardHtml } from './cards.js';
import { POWER, LADDER, ENVIDO_VALUE, envidoBreakdown } from '../../../engine/truco/index.mjs';
import { DECK_40 } from '../../../engine/cards/spanish.mjs';

const SUIT = { e: 'espadas', b: 'bastos', o: 'oros', c: 'copas' };
const NUM = { 1: 'as', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 10: 'sota', 11: 'caballo', 12: 'rey' };
const nm = c => { const n = parseInt(c, 10), s = c.slice(-1); return (n === 1 && (s === 'e' || s === 'b') ? 'ancho' : NUM[n]) + ' de ' + SUIT[s]; };
const el = c => (parseInt(c, 10) === 10 ? 'la ' : 'el ') + nm(c);
const al = c => (parseInt(c, 10) === 10 ? 'a la ' : 'al ') + nm(c);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const step = c => LADDER.length + 1 - POWER[c];
const fill = box => { const d = $('[data-pick]', box); if (d && !d.children.length) d.innerHTML = DECK_40.map(c => cardHtml(c, { attrs: 'data-card="' + c + '" tabindex="0"' })).join(''); };
const keyTap = box => box.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-card]')) { e.preventDefault(); e.target.click(); } });

for (const box of $$('[data-duelo]')) {
  fill(box);
  const out = k => $('[data-o="' + k + '"]', box);
  let pair = [], next = 0;
  const show = () => {
    out('a').innerHTML = pair[0] ? cardHtml(pair[0]) : '';
    out('b').innerHTML = pair[1] ? cardHtml(pair[1]) : '';
    $$('[data-pick] [data-card]', box).forEach(x => x.classList.toggle('sel', pair.includes(x.dataset.card)));
    if (pair.length < 2 || !pair[0] || !pair[1]) { out('r').textContent = 'Ahora tocá la carta ' + (next + 1) + '.'; return; }
    const [a, b] = pair, d = Math.sign(POWER[a] - POWER[b]);
    out('r').innerHTML = '';
    const t = document.createElement('b');
    if (!d) { t.textContent = 'Parda. '; out('r').append(t, cap(el(a)) + ' y ' + el(b) + ' están en el mismo escalón (' + step(a) + '.º): empatan.'); return; }
    const [W, L] = d > 0 ? [a, b] : [b, a];
    t.textContent = 'Gana la carta ' + (d > 0 ? 1 : 2) + '. ';
    out('r').append(t, cap(el(W)) + ' (escalón ' + step(W) + ') le gana ' + al(L) + ' (escalón ' + step(L) + ').');
  };
  box.addEventListener('click', e => {
    const c = e.target.closest('[data-pick] [data-card]');
    if (!c) return;
    if (next === 1 && pair[0] === c.dataset.card) return;
    if (next === 0) pair = [c.dataset.card];
    else pair[1] = c.dataset.card;
    next = 1 - next;
    show();
  });
  keyTap(box);
}

for (const box of $$('[data-armar]')) {
  const out = k => $('[data-o="' + k + '"]', box);
  fill(box);
  let sel = ($('[data-pick]', box).dataset.start || '').split(' ').filter(Boolean);
  const cv = (c, on) => '<span class="jg-cv' + (on ? ' on' : '') + '">' + cardHtml(c) + '<i>' + ENVIDO_VALUE[c] + '</i></span>';
  const show = () => {
    $$('[data-pick] [data-card]', box).forEach(x => x.classList.toggle('sel', sel.includes(x.dataset.card)));
    if (sel.length < 3) {
      out('hand').innerHTML = sel.map(c => cv(c, false)).join('');
      out('pts').textContent = '-';
      out('f').textContent = 3 - sel.length === 1 ? 'Falta una carta.' : 'Faltan ' + (3 - sel.length) + ' cartas.';
      return;
    }
    const b = envidoBreakdown(sel);
    out('hand').innerHTML = sel.map(c => cv(c, b.cards.includes(c))).join('');
    out('pts').textContent = b.total;
    out('f').textContent = b.kind === 'single' ? 'Tres palos distintos: vale la más alta, ' + b.values[0] + '.'
      : (b.kind === 'three' ? 'Las tres del mismo palo: se suman las dos más altas, ' : 'Dos del mismo palo: ') + b.values[0] + ' + ' + b.values[1] + ' + 20 = ' + b.total + '.';
  };
  box.addEventListener('click', e => {
    const c = e.target.closest('[data-pick] [data-card]');
    if (!c) return;
    const k = c.dataset.card;
    if (sel.includes(k)) sel = sel.filter(x => x !== k); else sel = sel.length < 3 ? [...sel, k] : [sel[1], sel[2], k];
    show();
  });
  keyTap(box);
  show();
}

const FIG = { S: 10, C: 11, R: 12 };
$$('.jg-suits .jg-mcs').forEach(row => {
  const cards = [...row.querySelectorAll('.jg-mc')].map(m => (FIG[m.textContent] || m.textContent) + m.dataset.s);
  row.className = 'jg-suitc';
  row.innerHTML = cards.map(c => cardHtml(c, { attrs: 'role="img"' })).join('');
});
