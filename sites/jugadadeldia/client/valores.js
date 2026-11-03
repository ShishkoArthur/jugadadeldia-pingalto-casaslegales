import { $, $$ } from './kit.js';
import { cardHtml, cardName } from './cards.js';
import { POWER } from '../../../engine/truco/index.mjs';
import { DECK_40 } from '../../../engine/cards/spanish.mjs';

const pick = $('.jg-pick');
const out = k => $('[data-o="' + k + '"]', pick);
function show(c) {
  const p = POWER[c];
  const beats = DECK_40.filter(x => POWER[x] < p).length, ties = DECK_40.filter(x => x !== c && POWER[x] === p).length, loses = DECK_40.filter(x => POWER[x] > p).length;
  const n = cardName(c);
  out('name').textContent = n.charAt(0).toUpperCase() + n.slice(1);
  out('card').innerHTML = cardHtml(c);
  out('text').textContent = 'Mata a ' + beats + (beats === 1 ? ' carta' : ' cartas') + (ties ? ', empata con ' + ties : '') + (loses ? ' y pierde contra ' + loses + '.' : '. Ninguna le gana.');
  $$('.jg-ladder [data-card]').forEach(el => el.classList.toggle('sel', el.dataset.card === c));
}
document.addEventListener('click', e => { const c = e.target.closest('.jg-ladder [data-card]'); if (c) show(c.dataset.card); });
document.addEventListener('keydown', e => { const c = e.target.closest && e.target.closest('.jg-ladder [data-card]'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(c.dataset.card); } });
const pr = $('[data-print]');
if (pr) pr.addEventListener('click', () => print());

let streak = 0, pair = null;
function round() {
  const r = crypto.getRandomValues(new Uint32Array(2));
  let a = DECK_40[r[0] % 40], b = DECK_40[r[1] % 40];
  while (POWER[a] === POWER[b]) b = DECK_40[(DECK_40.indexOf(b) + 7) % 40];
  pair = [a, b];
  out('qa').innerHTML = pair.map(c => cardHtml(c, { tag: 'button', attrs: 'type="button" data-q="' + c + '"' })).join('');
}
const quiz = $('[data-quiz]');
if (quiz) {
  round();
  quiz.addEventListener('click', e => {
    const b = e.target.closest('[data-q]');
    if (!b || !pair) return;
    const win = POWER[pair[0]] > POWER[pair[1]] ? pair[0] : pair[1];
    const ok = b.dataset.q === win;
    streak = ok ? streak + 1 : 0;
    out('streak').textContent = streak;
    out('qr').className = 'jg-res ' + (ok ? 'jg-ok' : 'jg-no');
    out('qr').textContent = ok ? '¡Bien! ' + cardName(win) + ' gana.' : 'No: gana ' + cardName(win) + '.';
    setTimeout(round, 700);
  });
}
