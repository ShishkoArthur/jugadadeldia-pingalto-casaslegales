import { $, $$, store, wait, frame, sound, soundToggle, esc } from './kit.js';
import { cardHtml, backHtml, cardName, scoreBlock } from './cards.js';
import { RULESETS, newMatch, apply, toAct, observation, createBot, serialize, deserialize, envidoPoints, hasFlor, buenasAt } from '../../../engine/truco/index.mjs';

const root = $('[data-truco]');
const KEY = 'jg-truco-v1';
const LABEL = {
  envido: 'Envido', realEnvido: 'Real envido', faltaEnvido: 'Falta envido', truco: 'Truco', retruco: 'Retruco', valeCuatro: 'Vale cuatro',
  quiero: 'Quiero', noQuiero: 'No quiero', mazo: 'Me voy al mazo', flor: 'Flor', conFlorMeAchico: 'Con flor me achico', contraflor: 'Contraflor', contraflorResto: 'Contraflor al resto',
};
const SAY = {
  envido: '¡Envido!', realEnvido: '¡Real envido!', faltaEnvido: '¡Falta envido!', truco: '¡Truco!', retruco: '¡Quiero retruco!', valeCuatro: '¡Quiero vale cuatro!',
  quiero: '¡Quiero!', noQuiero: 'No quiero.', mazo: 'Me voy al mazo.', flor: '¡Flor!', conFlorMeAchico: 'Con flor me achico.', contraflor: '¡Contraflor!', contraflorResto: '¡Contraflor al resto!',
};
const HOW = { bazas: 'por las bazas', noQuiero: 'porque no quisieron', mazo: 'por irse al mazo' };
const LEVEL_NAME = { facil: 'fácil', normal: 'normal', dificil: 'difícil' };
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];

let S = null, cfg = null, bot = null, busy = false, pause = null, said = '';

function fresh(rules, level) {
  cfg = { rules, level, botSeed: seed() };
  S = newMatch(RULESETS[rules], seed());
  bot = createBot(level, cfg.botSeed);
  said = '';
  save();
}
function save() { try { store.set(KEY, JSON.stringify({ cfg, s: serialize(S) })); } catch (e) { return; } }
function load() {
  const raw = store.get(KEY);
  if (!raw) return false;
  try {
    const x = JSON.parse(raw);
    if (!RULESETS[x.cfg.rules]) return false;
    cfg = x.cfg; S = deserialize(x.s); bot = createBot(cfg.level, cfg.botSeed + S.history.length * 7919 + S.hand.actions.length);
    return !S.over;
  } catch (e) { return false; }
}

const callLabel = (a, h) => {
  if (['retruco', 'valeCuatro'].includes(a.type) && h.truco.pending) return 'Quiero ' + LABEL[a.type].toLowerCase();
  if (a.type === 'truco') return '¡Truco!';
  return LABEL[a.type];
};

function render(view) {
  const obs = observation(S, 0);
  const h = view || obs.hand;
  const R = S.rules;
  const mine = view ? [] : obs.hand.left[0];
  const oppLeft = view ? 0 : obs.hand.left[1];
  const myTurn = !view && obs.toAct === 0 && !busy;
  const plays = myTurn ? obs.legal.filter(a => a.type === 'play').map(a => a.card) : [];
  const calls = myTurn ? obs.legal.filter(a => a.type !== 'play') : [];
  $('[data-t="opp"]', root).innerHTML = Array.from({ length: oppLeft }, () => backHtml()).join('') || '<span class="jg-mu">sin cartas</span>';
  $('[data-t="bazas"]', root).innerHTML = [0, 1, 2].map(i => h.bazas[i] || { cards: [null, null], winner: null }).map((b, i) => {
    const w = b.winner === null ? '' : b.winner === -1 ? 'parda' : b.winner === 0 ? 'tuya' : 'de la compu';
    return '<div class="jg-baza' + (b.winner === 0 ? ' gan' : b.winner === 1 ? ' per' : '') + '"><small>Baza ' + (i + 1) + (w ? ' · ' + w : '') + '</small>' +
      (b.cards[1] ? cardHtml(b.cards[1], { cls: 'in' }) : '<span class="jg-cd hole"></span>') + (b.cards[0] ? cardHtml(b.cards[0], { cls: 'in' }) : '<span class="jg-cd hole"></span>') + '</div>';
  }).join('');
  $('[data-t="mine"]', root).innerHTML = (view ? view.hands[0].filter(c => !h.bazas.some(b => b.cards[0] === c)) : mine).map(c =>
    cardHtml(c, { tag: 'button', attrs: 'type="button" data-card="' + c + '"' + (plays.includes(c) ? '' : ' disabled'), cls: plays.includes(c) ? 'can' : '' })).join('');
  const env = envidoPoints(S.hand.hands[0]);
  $('[data-t="info"]', root).textContent = view ? '' : 'Tu envido: ' + env + (R.flor && hasFlor(S.hand.hands[0]) ? ' · tenés flor' : '') + ' · ' + (obs.hand.mano === 0 ? 'sos mano' : 'la compu es mano');
  $('[data-t="calls"]', root).innerHTML = calls.map(a => '<button type="button" class="jg-b s' + (['quiero', 'truco', 'flor'].includes(a.type) ? ' p' : '') + '" data-call="' + a.type + '">' + esc(callLabel(a, obs.hand)) + '</button>').join('');
  $('[data-t="turn"]', root).textContent = S.over ? '' : view ? '' : busy || obs.toAct === 1 ? 'Juega la compu…' : obs.hand.truco.pending || obs.hand.envido.pending === 0 || obs.hand.flor.pending === 0 ? 'Te toca responder' : 'Te toca';
  const bub = $('[data-t="say"]', root);
  bub.textContent = said; bub.hidden = !said;
  const target = R.target;
  for (const [i, k] of [[0, 'us'], [1, 'them']]) {
    $('[data-t="' + k + '"]', root).innerHTML = '<b>' + S.score[i] + '</b>' + scoreBlock(S.score[i], target);
  }
  $('[data-t="goal"]', root).textContent = 'A ' + target + (buenasAt(R) ? ' · malas y buenas' : '') + (R.flor ? ' · con flor' : ' · sin flor') + ' · compu ' + LEVEL_NAME[cfg.level];
  const lvl = $('[name=nivel]', root), rules = $('[name=reglas]', root);
  if (lvl) lvl.value = cfg.level;
  if (rules) rules.value = cfg.rules;
}

function describeHand(hand) {
  const out = [];
  const e = hand.envido.result;
  if (e && !e.cancelled) {
    if (e.accepted) out.push('Envido: ' + (e.winner === 0 ? 'ganaste' : 'ganó la compu') + ' con ' + e.points[e.winner] + ' (vos ' + e.points[0] + ', compu ' + e.points[1] + '), ' + e.value + (e.value === 1 ? ' punto.' : ' puntos.'));
    else out.push('Envido no querido: ' + e.value + (e.value === 1 ? ' punto ' : ' puntos ') + (e.winner === 0 ? 'para vos.' : 'para la compu.'));
  }
  const f = hand.flor.result;
  if (f) out.push('Flor: ' + f.value + ' para ' + (f.winner === 0 ? 'vos.' : 'la compu.'));
  if (hand.winner !== null && hand.winner !== undefined) {
    out.push((hand.winner === 0 ? 'Ganaste la mano ' : 'La compu ganó la mano ') + (HOW[hand.how] || '') + '.');
  }
  out.push('Puntos de la mano: vos ' + hand.points[0] + ', compu ' + hand.points[1] + '.');
  out.push('Cartas de la compu: ' + hand.hands[1].map(cardName).join(', ') + '.');
  return out;
}

async function showEnd(prevHandNo) {
  const last = S.lastHand && S.lastHand.no === prevHandNo ? S.lastHand : null;
  if (!last) return;
  busy = true;
  render(last);
  const box = $('[data-t="end"]', root);
  const lines = describeHand(last);
  box.innerHTML = '<p class="jg-endt">' + (S.over ? (S.winner === 0 ? '¡Ganaste el partido!' : 'Ganó la compu') + ' · ' + S.score[0] + ' a ' + S.score[1] : 'Fin de la mano') + '</p><ul>' + lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' +
    (S.over ? '<button type="button" class="jg-b p" data-new>Otro partido</button>' + historyHtml() : '<button type="button" class="jg-b p" data-next>Repartir</button>');
  box.hidden = false;
  sound.play(S.over ? (S.winner === 0 ? 'win' : 'lose') : last.winner === 0 ? 'win' : 'card');
  await new Promise(r => { pause = r; });
  pause = null;
  box.hidden = true;
  busy = false;
}
function historyHtml() {
  return '<details class="jg-src"><summary>Mano por mano</summary><ol>' + S.history.map(x => '<li>Mano ' + x.no + ': vos +' + x.points[0] + ', compu +' + x.points[1] + ' (' + x.score[0] + ' a ' + x.score[1] + ')</li>').join('') + '</ol></details>';
}

async function act(action) {
  const before = S.hand.no;
  S = apply(S, action);
  if (action.type === 'play') sound.play('card'); else sound.play('call');
  save();
  if (S.hand.no !== before || S.over) { said = ''; await showEnd(before); }
  render();
  await botLoop();
}
async function botLoop() {
  while (!S.over && toAct(S) === 1) {
    busy = true; render();
    await wait(650 + Math.random() * 400);
    const a = bot.choose(observation(S, 1));
    const before = S.hand.no;
    S = apply(S, a);
    said = a.type === 'play' ? '' : SAY[a.type] || '';
    sound.play(a.type === 'play' ? 'card' : 'call');
    save();
    busy = false;
    if (S.hand.no !== before || S.over) { await showEnd(before); said = ''; }
    render();
    frame(() => $$('.jg-cd.in', root).forEach(el => el.classList.add('on')));
  }
  busy = false;
  render();
  frame(() => $$('.jg-cd.in', root).forEach(el => el.classList.add('on')));
}

if (root) {
  if (!load()) fresh('clasico-30-sin-flor', 'normal');
  soundToggle($('[data-sound]', root));
  render();
  botLoop();
  root.addEventListener('click', e => {
    const c = e.target.closest('[data-card]');
    if (c && !c.disabled && !busy) { said = ''; act({ type: 'play', card: c.dataset.card }); return; }
    const k = e.target.closest('[data-call]');
    if (k && !busy) { said = ''; act({ type: k.dataset.call }); return; }
    if (e.target.closest('[data-next]') && pause) { pause(); return; }
    if (e.target.closest('[data-new]')) { if (pause) pause(); fresh(cfg.rules, cfg.level); render(); botLoop(); }
  });
  const form = $('[data-cfg]', root);
  form.addEventListener('change', () => {
    const lvl = form.elements.nivel.value, rules = form.elements.reglas.value;
    if (lvl === cfg.level && rules === cfg.rules) return;
    if (S.history.length && !S.over && !confirm('¿Empezar un partido nuevo con estas reglas?')) { render(); return; }
    if (pause) pause();
    fresh(rules, lvl); render(); botLoop();
  });
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,select,textarea')) return;
    if (/^[1-3]$/.test(e.key)) { const b = $$('[data-card]:not([disabled])', root)[+e.key - 1]; if (b) b.click(); }
    if (e.key === 'Enter' && pause) pause();
  });
}
