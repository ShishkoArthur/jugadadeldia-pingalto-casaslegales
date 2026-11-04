import { $, store, wait, sound, soundToggle } from './kit.js';
import { cardHtml, backHtml, cardName } from './cards.js';
import { RULESETS, newMatch, apply, toAct, observation, createBot, serialize, deserialize, captures } from '../../../engine/escoba/index.mjs';

const root = $('[data-esc]');
const out = k => $('[data-o="' + k + '"]', root);
const KEY = 'jg-escoba-v1';
const TARGET = 15;
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];
let S = null, cfg = null, bot = null, busy = false, pause = null, chosen = null;
const WHY = { escoba: 'escoba', sieteDeOros: 'siete de oros', cartas: 'cartas', oros: 'oros', setenta: 'setenta', sietes: 'sietes' };

function fresh(rules, level) { cfg = { rules, level, bs: seed() }; S = newMatch(RULESETS[rules], { players: 2, pairs: false, target: TARGET, seed: seed() }); bot = createBot(level, cfg.bs); chosen = null; save(); }
function save() { store.set(KEY, JSON.stringify({ cfg, s: serialize(S) })); }
function load() { try { const x = JSON.parse(store.get(KEY) || 'null'); if (!x || !RULESETS[x.cfg.rules]) return false; cfg = x.cfg; S = deserialize(x.s); bot = createBot(cfg.level, cfg.bs + S.hand.log.length); return !S.over; } catch (e) { return false; } }

function render() {
  const o = observation(S, 0), h = o.hand;
  const my = !busy && o.toAct === 0;
  const playable = my ? [...new Set(o.legal.map(a => a.card))] : [];
  out('opp').innerHTML = Array.from({ length: h.counts[1] }, () => backHtml()).join('');
  const opts = chosen ? o.legal.filter(a => a.card === chosen) : [];
  out('table').innerHTML = h.table.map(c => cardHtml(c)).join('') || '<span class="jg-mu">Mesa vacía</span>';
  out('mine').innerHTML = h.mine.map(c => cardHtml(c, { tag: 'button', attrs: 'type="button" data-card="' + c + '"' + (playable.includes(c) ? '' : ' disabled'), cls: (playable.includes(c) ? 'can' : '') + (c === chosen ? ' sel' : '') })).join('');
  out('calls').innerHTML = opts.map((a, i) => '<button type="button" class="jg-b s' + (a.take.length ? ' p' : '') + '" data-opt="' + i + '">' + (a.take.length ? 'Levantar ' + a.take.map(cardName).join(' + ') + (a.take.length === h.table.length ? ' (¡escoba!)' : '') : 'Tirarla a la mesa') + '</button>').join('');
  out('turn').textContent = S.over ? '' : busy || o.toAct === 1 ? 'Juega la compu…' : chosen ? 'Elegí qué hacer con ' + cardName(chosen) : 'Tocá una carta';
  out('info').textContent = 'Tus cartas levantadas: ' + h.piles[0].length + ' · escobas: ' + h.escobas[0] + ' · quedan ' + h.stock + ' en el mazo';
  out('us').textContent = S.scores[0]; out('them').textContent = S.scores[1];
  out('goal').textContent = 'A ' + TARGET + ' · ' + (cfg.rules === 'bonaerense' ? 'levantar es obligatorio' : 'levantar a elección');
  $('[name=nivel]', root).value = cfg.level; $('[name=reglas]', root).value = cfg.rules;
  return opts;
}
function missed(before, action) {
  const best = before.hand.hands[0].flatMap(c => captures(before.hand.table, c).filter(t => t.length === before.hand.table.length).map(t => c));
  if (best.length && !(action.take.length && action.take.length === before.hand.table.length)) return 'Se te pasó una escoba: con ' + cardName(best[0]) + ' levantabas toda la mesa.';
  return '';
}
async function showEnd(no) {
  const last = S.lastHand && S.lastHand.no === no ? S.lastHand : null;
  if (!last) return;
  busy = true; render();
  const r = last.result, box = out('end');
  const list = s => r.detail.filter(d => d.side === s).map(d => WHY[d.why] || d.why);
  box.innerHTML = '<p class="jg-endt">Fin de la mano: vos +' + r.points[0] + ', compu +' + r.points[1] + '</p><ul><li>Vos: ' + (list(0).join(', ') || 'nada') + '</li><li>Compu: ' + (list(1).join(', ') || 'nada') + '</li><li>Cartas: vos ' + last.piles[0].length + ', compu ' + last.piles[1].length + '</li></ul>' +
    (S.over ? '<p class="jg-endt">' + (S.winner === 0 ? '¡Ganaste ' : 'Ganó la compu ') + S.scores[0] + ' a ' + S.scores[1] + '</p><button type="button" class="jg-b p" data-new>Otro partido</button>' : '<button type="button" class="jg-b p" data-next>Seguir</button>');
  box.hidden = false;
  sound.play(S.over ? (S.winner === 0 ? 'win' : 'lose') : 'call');
  await new Promise(res => { pause = res; });
  pause = null; box.hidden = true; busy = false;
}
async function act(a) {
  const no = S.hand.no, tip = missed(S, a);
  S = apply(S, a); chosen = null; save(); sound.play(a.take.length ? 'call' : 'card');
  out('tip').hidden = !tip; out('tip').textContent = tip;
  if (S.hand.no !== no || S.over) await showEnd(no);
  render();
  await botLoop();
}
let loopId = 0;
async function botLoop() {
  const g = ++loopId;
  while (!S.over && toAct(S) === 1) {
    busy = true; render();
    await wait(700);
    if (g !== loopId) return;
    const no = S.hand.no, a = bot.choose(observation(S, 1));
    S = apply(S, a); save(); sound.play('card');
    busy = false;
    if (S.hand.no !== no || S.over) await showEnd(no);
    if (g !== loopId) return;
    render();
  }
  busy = false; render();
}
if (root) {
  if (!load()) fresh('bonaerense', 'normal');
  soundToggle($('[data-sound]', root));
  render(); botLoop();
  root.addEventListener('click', e => {
    if (e.target.closest('[data-next]') && pause) { pause(); return; }
    if (e.target.closest('[data-new]')) { if (pause) pause(); fresh(cfg.rules, cfg.level); render(); botLoop(); return; }
    if (busy) return;
    const c = e.target.closest('[data-card]');
    if (c && !c.disabled) {
      chosen = c.dataset.card === chosen ? null : c.dataset.card;
      const opts = render();
      if (opts.length === 1) act(opts[0]);
      return;
    }
    const k = e.target.closest('[data-opt]');
    if (k) { const opts = observation(S, 0).legal.filter(a => a.card === chosen); act(opts[+k.dataset.opt]); }
  });
  $('[data-cfg]', root).addEventListener('change', () => { const l = $('[name=nivel]', root).value, r = $('[name=reglas]', root).value; if (l === cfg.level && r === cfg.rules) return; if (S.history.length && !S.over && !confirm('¿Empezar un partido nuevo?')) { render(); return; } if (pause) pause(); fresh(r, l); render(); botLoop(); });
}

