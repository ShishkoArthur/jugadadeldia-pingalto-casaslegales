import { $, $$, store, wait, frame, sound, soundToggle, esc, page } from './kit.js';
import { cardHtml, backHtml, cardName, scoreBlock } from './cards.js';
import { RULESETS, newMatch, apply, toAct, observation, createBot, serialize, deserialize, envidoPoints, hasFlor, buenasAt, legalSignals, signal, pieOf } from '../../../engine/truco/index.mjs';

const root = $('[data-truco]');
const D = page();
const KEYS = { 2: 'jg-truco-v1', 4: 'jg-truco4-v1' };
const MODE_KEY = 'jg-truco-modo';
const RULE_OPTS = {
  2: [['clasico-30-sin-flor', 'A 30, sin flor'], ['clasico-30-con-flor', 'A 30, con flor'], ['corto-15-sin-flor', 'A 15, sin flor'], ['bonaerense-40-con-flor', 'A 40, con flor (bonaerense)']],
  4: [['parejas-30-sin-flor', 'A 30, contesta el pie'], ['parejas-15-sin-flor', 'A 15, contesta el siguiente']],
};
const LABEL = {
  envido: 'Envido', realEnvido: 'Real envido', faltaEnvido: 'Falta envido', truco: 'Truco', retruco: 'Retruco', valeCuatro: 'Vale cuatro',
  quiero: 'Quiero', noQuiero: 'No quiero', mazo: 'Me voy al mazo', flor: 'Flor', conFlorMeAchico: 'Con flor me achico', contraflor: 'Contraflor', contraflorResto: 'Contraflor al resto',
};
const SAY = {
  envido: '¡Envido!', realEnvido: '¡Real envido!', faltaEnvido: '¡Falta envido!', truco: '¡Truco!', retruco: '¡Retruco!', valeCuatro: '¡Vale cuatro!',
  quiero: '¡Quiero!', noQuiero: 'No quiero.', mazo: 'Me voy al mazo.', flor: '¡Flor!', conFlorMeAchico: 'Con flor me achico.', contraflor: '¡Contraflor!', contraflorResto: '¡Contraflor al resto!',
};
const LEVEL_NAME = { facil: 'fácil', normal: 'normal', dificil: 'difícil' };
const WHO = ['vos', 'el rival de la derecha', 'tu compañero', 'el rival de la izquierda'];
const WHO_UP = ['Vos', 'Rival de la derecha', 'Compañero', 'Rival de la izquierda'];
const SENA = Object.fromEntries((D.s || []).map(x => [x.id, x]));
const RAISE = new Set(['retruco', 'valeCuatro']);
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const pts = n => n + (n === 1 ? ' punto' : ' puntos');
const side = s => (s % 2 === 0 ? 'nosotros' : 'ellos');

let mode = 2, S = null, cfg = null, bots = [], busy = false, pause = null, gen = 0;
let said = ['', '', '', ''], log = [], seen = new Set(), seenHand = 0;

const felt = () => $('[data-felt="' + mode + '"]', root);
const slot = k => $('[data-t="' + k + '"]', felt());

function makeBots(offset) {
  bots = [];
  if (mode === 2) bots[1] = createBot(cfg.level, cfg.botSeed + offset);
  else for (const s of [1, 2, 3]) bots[s] = createBot(cfg.level, (cfg.botSeed + s * 104729 + offset) >>> 0);
}
function fresh(rules, level) {
  gen++;
  cfg = { rules, level, botSeed: seed() };
  S = newMatch(RULESETS[rules], seed());
  makeBots(0);
  clearTable();
  save();
}
function clearTable() { said = ['', '', '', '']; log = []; }
function save() { try { store.set(KEYS[mode], JSON.stringify({ cfg, s: serialize(S) })); } catch (e) { return; } }
function load() {
  const raw = store.get(KEYS[mode]);
  if (!raw) return false;
  try {
    const x = JSON.parse(raw);
    const R = RULESETS[x.cfg.rules];
    if (!R || R.players !== mode) return false;
    cfg = x.cfg; S = deserialize(x.s);
    makeBots(S.history.length * 7919 + S.hand.actions.length);
    clearTable();
    return !S.over;
  } catch (e) { return false; }
}

const callLabel = (a, h) => {
  if (RAISE.has(a.type) && h.truco.pending) return 'Quiero ' + LABEL[a.type].toLowerCase();
  if (a.type === 'truco') return '¡Truco!';
  return LABEL[a.type];
};
const callsHtml = (calls, h) => calls.map(a => '<button type="button" class="jg-b s' + (['quiero', 'truco', 'flor'].includes(a.type) ? ' p' : '') + '" data-call="' + a.type + '">' + esc(callLabel(a, h)) + '</button>').join('');
function tableCard(c) {
  const fresh = !seen.has(c);
  seen.add(c);
  return cardHtml(c, { cls: fresh ? 'in' : '' });
}
const playedIn = (h, c) => h.bazas.some(b => b.cards.includes(c));

function render(view) {
  if (seenHand !== (view ? view.no : S.hand.no)) { seenHand = view ? view.no : S.hand.no; seen = new Set(); }
  $$('[data-felt]', root).forEach(el => { el.hidden = el.dataset.felt !== String(mode); });
  if (mode === 2) render2(view); else render4(view);
  renderScore();
  frame(() => $$('.jg-cd.in', root).forEach(el => el.classList.add('on')));
}

function renderScore() {
  const R = S.rules, target = R.target;
  $('[data-t="usl"]', root).textContent = mode === 2 ? 'Vos' : 'Nosotros';
  $('[data-t="theml"]', root).textContent = mode === 2 ? 'Compu' : 'Ellos';
  for (const [i, k] of [[0, 'us'], [1, 'them']]) $('[data-t="' + k + '"]', root).innerHTML = '<b>' + S.score[i] + '</b>' + scoreBlock(S.score[i], target);
  $('[data-t="goal"]', root).textContent = 'A ' + target + (buenasAt(R) ? ' · malas y buenas' : '') +
    (mode === 4 ? ' · de a 4 · contesta ' + (R.responder === 'pie' ? 'el pie' : 'el siguiente') : R.flor ? ' · con flor' : ' · sin flor') + ' · compu ' + LEVEL_NAME[cfg.level];
  const form = $('[data-cfg]', root);
  form.elements.nivel.value = cfg.level;
  form.elements.reglas.value = cfg.rules;
  for (const r of $$('[name=modo]', form)) r.checked = r.value === String(mode);
}

function render2(view) {
  const obs = observation(S, 0);
  const h = view || obs.hand;
  const R = S.rules;
  const mine = view ? [] : obs.hand.left[0];
  const oppLeft = view ? 0 : obs.hand.left[1];
  const myTurn = !view && obs.toAct === 0 && !busy;
  const plays = myTurn ? obs.legal.filter(a => a.type === 'play').map(a => a.card) : [];
  const calls = myTurn ? obs.legal.filter(a => a.type !== 'play') : [];
  slot('opp').innerHTML = view ? view.hands[1].filter(c => !playedIn(h, c)).map(c => cardHtml(c)).join('') : Array.from({ length: oppLeft }, () => backHtml()).join('') || '<span class="jg-mu">sin cartas</span>';
  slot('bazas').innerHTML = [0, 1, 2].map(i => h.bazas[i] || { cards: [null, null], winner: null }).map((b, i) => {
    const w = b.winner === null ? '' : b.winner === -1 ? 'parda' : b.winner === 0 ? 'tuya' : 'de la compu';
    return '<div class="jg-baza' + (b.winner === 0 ? ' gan' : b.winner === 1 ? ' per' : '') + '"><small>Baza ' + (i + 1) + (w ? ' · ' + w : '') + '</small>' +
      (b.cards[1] ? tableCard(b.cards[1]) : '<span class="jg-cd hole"></span>') + (b.cards[0] ? tableCard(b.cards[0]) : '<span class="jg-cd hole"></span>') + '</div>';
  }).join('');
  slot('mine').innerHTML = (view ? view.hands[0].filter(c => !playedIn(h, c)) : mine).map(c =>
    cardHtml(c, { tag: 'button', attrs: 'type="button" data-card="' + c + '"' + (plays.includes(c) ? '' : ' disabled'), cls: plays.includes(c) ? 'can' : '' })).join('');
  const env = envidoPoints(S.hand.hands[0]);
  slot('info').textContent = view ? '' : 'Tu envido: ' + env + (R.flor && hasFlor(S.hand.hands[0]) ? ' · tenés flor' : '') + ' · ' + (obs.hand.mano === 0 ? 'sos mano' : 'la compu es mano');
  slot('calls').innerHTML = callsHtml(calls, obs.hand);
  slot('turn').textContent = S.over ? '' : view ? '' : busy || obs.toAct === 1 ? 'Juega la compu…' : obs.hand.truco.pending || obs.hand.envido.pending === 0 || obs.hand.flor.pending === 0 ? 'Te toca responder' : 'Te toca';
  const bub = slot('say');
  bub.textContent = said[1]; bub.hidden = !said[1];
}

function shownBaza(h) {
  const last = h.bazas.length - 1;
  if (last > 0 && h.bazas[last].cards.every(c => c === null)) return last - 1;
  return last;
}
function badges(h, s) {
  const out = [];
  if (h.mano === s) out.push('<span class="jg-bd">mano</span>');
  if (pieOf(h, s % 2) === s) out.push('<span class="jg-bd">pie</span>');
  if (h.folded[s]) out.push('<span class="jg-bd m">al mazo</span>');
  return out.join('');
}
const answering = (h, s) => h.envido.pending === s || (h.truco.pending && h.truco.pending.responder === s);

function render4(view) {
  const F = felt();
  const obs = observation(S, 0);
  const h = view || obs.hand;
  const turnSeat = view || S.over ? null : toAct(S);
  const myTurn = !view && obs.toAct === 0 && !busy;
  const plays = myTurn ? obs.legal.filter(a => a.type === 'play').map(a => a.card) : [];
  const calls = myTurn ? obs.legal.filter(a => a.type !== 'play') : [];
  for (const s of [0, 1, 2, 3]) {
    const el = $('[data-seat="' + s + '"]', F);
    el.classList.toggle('on', turnSeat === s);
    el.classList.toggle('out', !!h.folded[s]);
    $('[data-o="bd"]', el).innerHTML = badges(h, s);
    const bub = $('[data-o="say"]', el);
    if (bub.textContent !== said[s]) bub.textContent = said[s];
    bub.hidden = !said[s];
    if (s === 0) continue;
    const box = $('[data-o="cards"]', el);
    if (view) { box.className = 'jg-hand up'; box.innerHTML = view.hands[s].filter(c => !playedIn(h, c)).map(c => cardHtml(c)).join(''); }
    else { box.className = 'jg-hand'; box.innerHTML = Array.from({ length: obs.hand.left[s] }, () => backHtml()).join(''); }
  }
  slot('bz').innerHTML = [0, 1, 2].map(i => {
    const b = h.bazas[i];
    const w = !b || b.winner === null ? '' : b.winner === -1 ? 'parda' : b.winner === 0 ? 'nuestra' : 'de ellos';
    return '<span class="' + (b && b.winner === 0 ? 'us' : b && b.winner === 1 ? 'th' : '') + '">' + (i + 1) + 'ª' + (w ? ' · ' + w : '') + '</span>';
  }).join('');
  const bi = shownBaza(h), b = h.bazas[bi];
  slot('x').innerHTML = [0, 1, 2, 3].map(s => '<div class="s' + s + (b.by === s && b.winner !== null ? ' w' : '') + '">' + (b.cards[s] ? tableCard(b.cards[s]) : '<span class="jg-cd hole"></span>') + '</div>').join('') +
    '<small class="jg-xn">Baza ' + (bi + 1) + '</small>';
  slot('mine').innerHTML = (view ? view.hands[0].filter(c => !playedIn(h, c)) : obs.hand.left[0]).map(c =>
    cardHtml(c, { tag: 'button', attrs: 'type="button" data-card="' + c + '"' + (plays.includes(c) ? '' : ' disabled'), cls: plays.includes(c) ? 'can' : '' })).join('');
  slot('info').textContent = view || h.folded[0] ? (h.folded[0] && !view ? 'Te fuiste al mazo: tu compañero sigue solo.' : '') :
    'Tu envido: ' + envidoPoints(S.hand.hands[0]) + ' · ' + (h.mano === 0 ? 'sos mano' : 'es mano ' + WHO[h.mano]) + ' · ' + (pieOf(h, 0) === 0 ? 'sos pie' : 'el pie es tu compañero');
  slot('calls').innerHTML = callsHtml(calls, obs.hand);
  let turn = '';
  if (turnSeat === 0 && !busy) turn = answering(h, 0) ? 'Te toca responder' : 'Te toca';
  else if (turnSeat !== null) turn = (answering(h, turnSeat) ? 'Contesta ' : 'Juega ') + WHO[turnSeat] + '…';
  slot('turn').textContent = turn;
  const lg = log.slice(-2).join(' · ');
  if (slot('log').textContent !== lg) slot('log').textContent = lg;
  const sn = slot('sn');
  sn.hidden = !!view || S.over;
  if (!sn.hidden) {
    const avail = legalSignals(S, 0);
    slot('snl').innerHTML = avail.length ? avail.map(id => {
      const x = SENA[id] || { what: id, how: '', face: '' };
      return '<button type="button" class="jg-snb" data-sena="' + id + '" title="' + esc(x.how) + '">' + x.face + '<span>' + esc(x.what) + '</span></button>';
    }).join('') : '<span class="jg-mu">' + (h.folded[0] ? 'Te fuiste al mazo.' : 'No te queda ninguna seña cierta para hacer.') + '</span>';
    const sent = obs.hand.senas.filter(x => x.seat === 0).map(x => (SENA[x.sign] || { what: x.sign }).what);
    slot('snd').textContent = sent.length ? 'Ya le marcaste: ' + sent.join(', ') + '. Tu compañero lo tiene en cuenta.' : 'Solo tu compañero ve tus señas. Solo se pueden hacer señas ciertas.';
  }
}

function describe2(hand) {
  const out = [];
  const e = hand.envido.result;
  if (e && !e.cancelled) {
    if (e.accepted) out.push('Envido: ' + (e.winner === 0 ? 'ganaste' : 'ganó la compu') + ' con ' + e.points[e.winner] + ' (vos ' + e.points[0] + ', compu ' + e.points[1] + '), ' + pts(e.value) + '.');
    else out.push('Envido no querido: ' + pts(e.value) + (e.winner === 0 ? ' para vos.' : ' para la compu.'));
  }
  const f = hand.flor.result;
  if (f) out.push('Flor: ' + f.value + ' para ' + (f.winner === 0 ? 'vos.' : 'la compu.'));
  if (hand.winner !== null && hand.winner !== undefined) {
    const us = hand.winner === 0;
    const how = hand.how === 'noQuiero' ? (us ? 'porque la compu no quiso' : 'porque no quisiste') : hand.how === 'mazo' ? (us ? 'porque la compu se fue al mazo' : 'porque te fuiste al mazo') : 'por las bazas';
    out.push((us ? 'Ganaste la mano ' : 'La compu ganó la mano ') + how + '.');
  }
  out.push('Puntos de la mano: vos ' + hand.points[0] + ', compu ' + hand.points[1] + '.');
  out.push('Cartas de la compu: ' + hand.hands[1].map(cardName).join(', ') + '.');
  return out;
}
function describe4(hand) {
  const out = [];
  const e = hand.envido.result;
  if (e) {
    if (e.accepted) {
      out.push('Envido querido: ganó ' + WHO[e.winner] + ' con ' + e.points[e.winner] + ', ' + pts(e.value) + ' para ' + side(e.winner) + '.');
      const order = [0, 1, 2, 3].map(k => (hand.mano + k) % 4).filter(s => e.points[s] !== null);
      out.push('Tantos desde el mano: ' + order.map(s => WHO[s] + ', ' + (e.shown[s] ? e.points[s] : 'son buenas (' + e.points[s] + ')')).join('; ') + '.');
    } else out.push('Envido no querido: ' + pts(e.value) + ' para ' + side(e.winner) + '.');
  }
  if (hand.winner !== null && hand.winner !== undefined) {
    const us = hand.winner === 0;
    const how = hand.how === 'noQuiero' ? (us ? 'porque ellos no quisieron' : 'porque no quisimos') : hand.how === 'mazo' ? (us ? 'porque ellos se fueron al mazo' : 'porque nos fuimos al mazo') : 'por las bazas';
    out.push((us ? 'Ganamos la mano ' : 'Ellos ganaron la mano ') + how + '.');
  }
  out.push('Puntos de la mano: nosotros ' + hand.points[0] + ', ellos ' + hand.points[1] + '.');
  for (const s of [2, 1, 3]) out.push(WHO_UP[s] + ': ' + hand.hands[s].map(cardName).join(', ') + '.');
  return out;
}

async function showEnd(prevHandNo) {
  const last = S.lastHand && S.lastHand.no === prevHandNo ? S.lastHand : null;
  if (!last) return;
  busy = true;
  render(last);
  const box = slot('end');
  const lines = mode === 2 ? describe2(last) : describe4(last);
  const won = S.winner === 0;
  const title = S.over ? (mode === 2 ? (won ? '¡Ganaste el partido!' : 'Ganó la compu') : won ? '¡Ganamos el partido!' : 'Ganaron ellos') + ' · ' + S.score[0] + ' a ' + S.score[1] : 'Fin de la mano';
  box.innerHTML = '<p class="jg-endt">' + title + '</p><ul>' + lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' +
    (S.over ? '<button type="button" class="jg-b p" data-new>Otro partido</button>' + historyHtml() : '<button type="button" class="jg-b p" data-next>Repartir</button>');
  box.hidden = false;
  sound.play(S.over ? (won ? 'win' : 'lose') : last.winner === 0 ? 'win' : 'card');
  const btn = $('[data-next],[data-new]', box);
  if (btn && root.contains(document.activeElement)) btn.focus({ preventScroll: true });
  await new Promise(r => { pause = r; });
  pause = null;
  box.hidden = true;
  busy = false;
}
function historyHtml() {
  const a = mode === 2 ? ['vos', 'compu'] : ['nosotros', 'ellos'];
  return '<details class="jg-src"><summary>Mano por mano</summary><ol>' + S.history.map(x => '<li>Mano ' + x.no + ': ' + a[0] + ' +' + x.points[0] + ', ' + a[1] + ' +' + x.points[1] + ' (' + x.score[0] + ' a ' + x.score[1] + ')</li>').join('') + '</ol></details>';
}

function note(seat, a, prev) {
  const h0 = prev.hand;
  const text = a.type === 'play' ? '' : RAISE.has(a.type) && h0.truco.pending ? '¡Quiero ' + LABEL[a.type].toLowerCase() + '!' : SAY[a.type] || '';
  if (mode === 2) { said[1] = seat === 1 ? text : ''; return; }
  said[seat] = text;
  if (text) log.push(WHO_UP[seat] + ': ' + text);
  const now = S.hand.no === h0.no ? S.hand : S.lastHand;
  if (!now || now.no !== h0.no) return;
  if (!h0.envido.result && now.envido.result) {
    const e = now.envido.result;
    if (e.accepted) {
      for (let k = 0; k < 4; k++) { const s = (now.mano + k) % 4; if (e.points[s] !== null) said[s] = e.shown[s] ? 'Tengo ' + e.points[s] + '.' : 'Son buenas.'; }
      log.push('Envido para ' + side(e.winner) + ': ' + pts(e.value));
    } else log.push('Envido no querido: ' + pts(e.value) + ' para ' + side(e.winner));
  }
  const i = h0.bazas.length - 1;
  if (now.bazas[i] && h0.bazas[i].winner === null && now.bazas[i].winner !== null) {
    const w = now.bazas[i].winner;
    log.push('Baza ' + (i + 1) + ': ' + (w === -1 ? 'parda' : w === 0 ? 'nuestra' : 'de ellos'));
  }
}

async function doAction(seat, a) {
  const g = gen, before = S.hand.no, prev = S;
  S = apply(S, a);
  note(seat, a, prev);
  sound.play(a.type === 'play' ? 'card' : 'call');
  save();
  if (S.hand.no !== before || S.over) {
    await showEnd(before);
    if (g !== gen) return false;
    clearTable();
  }
  return g === gen;
}
async function humanAct(a) {
  if (busy || S.over || toAct(S) !== 0) return;
  busy = true;
  const ok = await doAction(0, a);
  if (!ok) return;
  busy = false;
  render();
  botLoop();
}
async function botLoop() {
  const g = gen;
  for (;;) {
    if (g !== gen) return;
    const seat = S.over ? null : toAct(S);
    if (seat === null || seat === 0) break;
    busy = true; render();
    await wait(mode === 4 ? 700 + Math.random() * 450 : 650 + Math.random() * 400);
    if (g !== gen) return;
    const a = bots[seat].choose(observation(S, seat));
    if (!(await doAction(seat, a))) return;
    busy = false;
  }
  busy = false;
  render();
}

function setRuleOptions() {
  const sel = $('[data-cfg]', root).elements.reglas;
  sel.innerHTML = RULE_OPTS[mode].map(([v, l]) => '<option value="' + v + '">' + l + '</option>').join('');
}
function start(m) {
  gen++;
  if (pause) pause();
  busy = false;
  mode = m;
  store.set(MODE_KEY, String(m));
  setRuleOptions();
  if (!load()) fresh(mode === 2 ? 'clasico-30-sin-flor' : 'parejas-30-sin-flor', cfg && LEVEL_NAME[cfg.level] ? cfg.level : 'normal');
  const sn = $('[data-t="sn"]', root);
  if (sn && mode === 4 && window.innerWidth > 620) sn.open = true;
  render();
  botLoop();
}

if (root) {
  soundToggle($('[data-sound]', root));
  start(store.get(MODE_KEY) === '4' ? 4 : 2);
  root.addEventListener('click', e => {
    const c = e.target.closest('[data-card]');
    if (c && !c.disabled && !busy) { humanAct({ type: 'play', card: c.dataset.card }); return; }
    const k = e.target.closest('[data-call]');
    if (k && !busy) { humanAct({ type: k.dataset.call }); return; }
    const sg = e.target.closest('[data-sena]');
    if (sg && mode === 4 && !S.over && legalSignals(S, 0).includes(sg.dataset.sena)) {
      S = signal(S, 0, sg.dataset.sena);
      log.push('Le marcaste a tu compañero: ' + ((SENA[sg.dataset.sena] || {}).what || sg.dataset.sena));
      save(); render(); return;
    }
    if (e.target.closest('[data-next]') && pause) { pause(); return; }
    if (e.target.closest('[data-new]')) { gen++; if (pause) pause(); fresh(cfg.rules, cfg.level); render(); botLoop(); }
  });
  const form = $('[data-cfg]', root);
  form.addEventListener('change', e => {
    if (e.target.name === 'modo') { const m = +e.target.value; if (m !== mode) start(m); return; }
    const lvl = form.elements.nivel.value, rules = form.elements.reglas.value;
    if (lvl === cfg.level && rules === cfg.rules) return;
    if (S.history.length && !S.over && !confirm('¿Empezar un partido nuevo con estas reglas?')) { render(); return; }
    if (pause) pause();
    fresh(rules, lvl); render(); botLoop();
  });
  const KEYCALL = { q: ['quiero'], n: ['noQuiero'], t: ['truco', 'retruco', 'valeCuatro'], e: ['envido'] };
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,select,textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[1-3]$/.test(e.key)) { const b = $$('[data-card]:not([disabled])', felt())[+e.key - 1]; if (b) b.click(); return; }
    const want = KEYCALL[e.key.toLowerCase()];
    if (want) { const b = want.map(t => $('[data-call="' + t + '"]', felt())).find(Boolean); if (b) b.click(); return; }
    if (e.key === 'Enter' && pause && !e.target.closest('button,a,summary')) pause();
  });
}
