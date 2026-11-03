import { $, fmt } from './kit.js';
import { cardHtml, cardName } from './cards.js';
import { envidoPoints, hasFlor, POWER, envidoVsRandom } from '../../../engine/truco/index.mjs';
import { DECK_40 } from '../../../engine/cards/spanish.mjs';

const box = $('[data-mano]');
const out = k => $('[data-o="' + k + '"]', box);
let hand = ['1e', '7o', '3c'];
function show() {
  out('hand').innerHTML = hand.map(c => cardHtml(c, { cls: 'in on' })).join('');
  out('env').textContent = envidoPoints(hand);
  out('flor').textContent = hasFlor(hand) ? '¡tenés flor!' : 'sin flor';
  const top = hand.slice().sort((a, b) => POWER[b] - POWER[a])[0];
  out('top').textContent = cardName(top);
  const mano = $('[data-mano-mano]', box).checked;
  const r = envidoVsRandom(hand, { mano, flor: false });
  out('chance').textContent = 'Tu envido de ' + r.points + ' le gana a ' + fmt(r.win.p * 100, 1) + ' % de las manos posibles del rival' + (mano ? ' (siendo mano, los empates son tuyos).' : ' (sin ser mano, los empates son del rival).');
}
if (box) {
  $('[data-deal]', box).addEventListener('click', () => {
    const d = DECK_40.slice();
    const pick = [];
    const r = crypto.getRandomValues(new Uint32Array(3));
    for (let i = 0; i < 3; i++) pick.push(d.splice(r[i] % d.length, 1)[0]);
    hand = pick;
    show();
  });
  $('[data-mano-mano]', box).addEventListener('change', show);
}
