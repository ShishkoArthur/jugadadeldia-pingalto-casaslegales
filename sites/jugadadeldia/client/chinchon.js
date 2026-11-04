import { $, store, wait, sound, soundToggle, esc } from './kit.js';
import { cardHtml, backHtml, cardName } from './cards.js';
import { RULESETS, newMatch, apply, toAct, observation, createBot, serialize, deserialize, bestSplit } from '../../../engine/chinchon/index.mjs';

const root = $('[data-chin]');
const out = k => $('[data-o="' + k + '"]', root);
const KEY = 'jg-chinchon-v1';
const LIMIT = 101;
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];
let S = null, cfg = null, bot = null, busy = false, pause = null;

function fresh(rules, level) { cfg = { rules, level, bs: seed() }; S = newMatch(RULESETS[rules], { players: 2, limit: LIMIT, reenganches: 0, seed: seed() }); bot = createBot(level, cfg.bs); save(); }
function save() { store.set(KEY, JSON.stringify({ cfg, s: serialize(S) })); }
function load() { try { const x = JSON.parse(store.get(KEY) || 'null'); if (!x || !RULESETS[x.cfg.rules]) return false; cfg = x.cfg; S = deserialize(x.s); bot = createBot(cfg.level, cfg.bs + S.hand.log.length); return !S.over; } catch (e) { return false; } }
const sortHand = (r, cards) => cards.slice().sort((a, b) => (/^J/.test(a) ? 99 : parseInt(a, 10)) - (/^J/.test(b) ? 99 : parseInt(b, 10)) || a.slice(-1).localeCompare(b.slice(-1)));

function render() {
  const o = observation(S, 0), h = o.hand, R = S.rules;
  const my = !busy && o.toAct === 0;
  const discards = my && h.phase === 'discard' ? o.legal.filter(a => a.type === 'discard').map(a => a.card) : [];
  const cuts = my && h.phase === 'discard' ? o.legal.filter(a => a.type === 'cut').map(a => a.card) : [];
  out('opp').innerHTML = Array.from({ length: h.counts[1] }, () => backHtml()).join('');
  out('stock').textContent = h.stock + ' en el mazo';
  out('pozo').innerHTML = h.pozo.length ? cardHtml(h.pozo[h.pozo.length - 1], { tag: 'button', attrs: 'type="button" data-draw="pozo"' + (my && h.phase === 'draw' ? '' : ' disabled'), cls: my && h.phase === 'draw' ? 'can' : '' }) : '<span class="jg-cd hole"></span>';
  $('[data-draw="mazo"]', root).disabled = !(my && h.phase === 'draw');
  out('mine').innerHTML = sortHand(R, h.mine).map(c => cardHtml(c, { tag: 'button', attrs: 'type="button" data-card="' + c + '"' + (discards.includes(c) ? '' : ' disabled'), cls: discards.includes(c) ? 'can' : '' })).join('');
  const split = bestSplit(R, h.mine);
  out('info').textContent = h.mine.length === 7 ? 'Te quedan ' + split.points + ' puntos sueltos' + (split.melds.length ? ' · juegos: ' + split.melds.map(m => m.length).join(' + ') + ' cartas' : '') : 'Tenés 8 cartas: tirá una' + (cuts.length ? ' o cortá' : '');
  out('calls').innerHTML = cuts.length ? cuts.map(c => '<button type="button" class="jg-b p s" data-cut="' + c + '">Cortar tirando ' + esc(cardName(c)) + '</button>').join('') : '';
  out('turn').textContent = S.over ? '' : busy || o.toAct === 1 ? 'Juega la compu…' : h.phase === 'draw' ? 'Robá del mazo o del pozo' : 'Tirá una carta';
  out('us').textContent = S.scores[0]; out('them').textContent = S.scores[1];
  out('goal').textContent = 'Hasta ' + LIMIT + ' · ' + { 'bonaerense-50': '50 cartas', 'ludoteka-40': '40 cartas', 'ludoteka-48': '48 cartas' }[cfg.rules];
  $('[name=nivel]', root).value = cfg.level; $('[name=reglas]', root).value = cfg.rules;
}
async function showEnd(no) {
  const last = S.lastHand && S.lastHand.no === no ? S.lastHand : null;
  if (!last) return;
  busy = true; render();
  const r = last.result, box = out('end');
  const who = x => (+x === 0 ? 'Vos' : 'Compu');
  const how = { cut: 'cortó', 'all-melded': 'cortó con todo ligado', 'chinchon-comodin': 'hizo chinchón con comodín', chinchon: '¡hizo chinchón!', 'deck-out': 'se terminó el mazo' }[r.how];
  box.innerHTML = '<p class="jg-endt">' + (r.cutter !== null ? who(r.cutter) + ' ' + how : 'Se terminó el mazo') + '</p><ul>' + Object.entries(r.shown).map(([x, v]) => '<li>' + who(x) + ': ' + (v.points < 0 ? v.points : '+' + v.points) + (v.left.length ? ' (sueltas: ' + v.left.map(cardName).join(', ') + ')' : '') + '</li>').join('') + '</ul>' +
    (S.over ? '<p class="jg-endt">' + (S.winner === 0 ? '¡Ganaste el partido!' : 'Ganó la compu') + '</p><button type="button" class="jg-b p" data-new>Otro partido</button>' : '<button type="button" class="jg-b p" data-next>Seguir</button>');
  box.hidden = false;
  sound.play(S.over ? (S.winner === 0 ? 'win' : 'lose') : 'call');
  await new Promise(res => { pause = res; });
  pause = null; box.hidden = true; busy = false;
}
async function act(a) {
  const no = S.hand.no;
  S = apply(S, a); save(); sound.play('card');
  if (S.hand.no !== no || S.over) await showEnd(no);
  render();
  await botLoop();
}
let loopId = 0;
async function botLoop() {
  const g = ++loopId;
  while (!S.over && toAct(S) === 1) {
    busy = true; render();
    await wait(600);
    if (g !== loopId) return;
    const no = S.hand.no;
    S = apply(S, bot.choose(observation(S, 1))); save(); sound.play('card');
    busy = false;
    if (S.hand.no !== no || S.over) await showEnd(no);
    if (g !== loopId) return;
    render();
  }
  busy = false; render();
}
if (root) {
  if (!load()) fresh('bonaerense-50', 'normal');
  soundToggle($('[data-sound]', root));
  render(); botLoop();
  root.addEventListener('click', e => {
    if (e.target.closest('[data-next]') && pause) { pause(); return; }
    if (e.target.closest('[data-new]')) { if (pause) pause(); fresh(cfg.rules, cfg.level); render(); botLoop(); return; }
    if (busy) return;
    const d = e.target.closest('[data-draw]'); if (d && !d.disabled) { act({ type: 'draw', from: d.dataset.draw }); return; }
    const c = e.target.closest('[data-card]'); if (c && !c.disabled) { act({ type: 'discard', card: c.dataset.card }); return; }
    const k = e.target.closest('[data-cut]'); if (k) act({ type: 'cut', card: k.dataset.cut });
  });
  $('[data-cfg]', root).addEventListener('change', () => { const l = $('[name=nivel]', root).value, r = $('[name=reglas]', root).value; if (l === cfg.level && r === cfg.rules) return; if (S.history.length && !S.over && !confirm('¿Empezar un partido nuevo?')) { render(); return; } if (pause) pause(); fresh(r, l); render(); botLoop(); });
}
