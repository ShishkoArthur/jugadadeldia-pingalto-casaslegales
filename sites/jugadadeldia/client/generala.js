import { $, $$, page, store, wait, sound, soundToggle, fmt } from './kit.js';
import { dieHtml } from './dice.js';
import { RULESETS, newGame, apply, solver, createBot, review, boxScore, total, serialize, deserialize } from '../../../engine/generala/index.mjs';

const D = page();
const root = $('[data-gen]');
const out = k => $('[data-o="' + k + '"]', root);
const KEY = 'jg-generala-v1';
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];
let S = null, cfg = null, bot = null, keep = [], busy = false, rolling = false;

function fresh(level) { cfg = { level, bs: seed() }; S = newGame(RULESETS.ruibal, { players: 2, seed: seed() }); bot = createBot(level, cfg.bs); keep = []; save(); }
function save() { store.set(KEY, JSON.stringify({ cfg, s: serialize(S) })); }
function load() { try { const x = JSON.parse(store.get(KEY) || 'null'); if (!x) return false; cfg = x.cfg; S = deserialize(x.s); bot = createBot(cfg.level, cfg.bs + S.log.length); return !S.over; } catch (e) { return false; } }

function render() {
  const me = S.turn === 0 && !S.over && !busy;
  const g = S.sheets[0].generala !== null && S.sheets[0].generala > 0;
  let html = '<thead><tr><th></th><th>Vos</th><th>Compu</th></tr></thead><tbody>';
  for (const b of D.boxes) {
    const mine = S.sheets[0][b], his = S.sheets[1][b];
    let cell;
    if (mine !== null) cell = mine === 0 ? '✕' : String(mine);
    else if (me && S.throws > 0) { const p = boxScore(S.rules, b, S.dice, S.throws, g); cell = '<button type="button" data-box="' + b + '">' + (p || '✕') + '</button>'; }
    else cell = '<span class="jg-mu">-</span>';
    html += '<tr><td>' + D.names[b] + '</td><td>' + cell + '</td><td>' + (his === null ? '<span class="jg-mu">-</span>' : his === 0 ? '✕' : his) + '</td></tr>';
  }
  html += '<tr class="tot"><td>Total</td><td>' + total(S.sheets[0]) + '</td><td>' + total(S.sheets[1]) + '</td></tr></tbody>';
  out('sheet').innerHTML = html;
  out('dice').innerHTML = S.dice ? S.dice.map((v, i) => dieHtml(v, { kept: keep.includes(i), roll: rolling, i })).join('') : '<span class="jg-mu">Tirá para empezar el turno</span>';
  out('turn').textContent = S.over ? '' : S.turn === 0 ? (S.throws === 0 ? 'Tu turno: tirá los dados' : 'Tiro ' + S.throws + ' de 3' + (S.throws < 3 ? ': tocá los que guardás o anotá' : ': anotá en un casillero')) : 'Juega la compu…';
  $('[data-roll]', root).disabled = !me || S.throws >= 3;
  $('[data-roll]', root).textContent = S.throws === 0 ? 'Tirar' : keep.length ? 'Tirar ' + (5 - keep.length) : 'Tirar los cinco';
  $('[data-hint]', root).disabled = !me || S.throws === 0;
  $('[name=nivel]', root).value = cfg.level;
}
async function finish() {
  if (!S.over) return;
  const box = out('end');
  const t = S.sheets.map(total);
  const won = S.winners.includes(0) && S.winners.length === 1, tie = S.winners.length > 1;
  let msg = S.how === 'servida' ? (S.winners[0] === 0 ? '¡Generala servida! Ganaste.' : 'La compu sacó generala servida.') : tie ? 'Empate ' + t[0] + ' a ' + t[1] : won ? '¡Ganaste ' + t[0] + ' a ' + t[1] + '!' : 'Ganó la compu ' + t[1] + ' a ' + t[0];
  const rv = review(S, 0).sort((a, b) => b.lost - a.lost).slice(0, 4);
  box.innerHTML = '<p class="jg-endt">' + msg + '</p>' + (rv.length ? '<p>Donde más puntos esperados dejaste:</p><ul>' + rv.map(x => '<li>Ronda ' + x.round + ', tiro ' + x.throwsDone + ' (' + x.dice.join(' ') + '): convenía ' + label(x.best) + ' en vez de ' + label(x.chose) + ' (−' + fmt(x.lost, 1) + ')</li>').join('') + '</ul>' : '<p>Jugaste perfecto: ninguna decisión tuya perdió puntos esperados.</p>') + '<button type="button" class="jg-b p" data-new>Otra partida</button>';
  box.hidden = false;
  sound.play(won ? 'win' : 'lose');
}
const label = o => (o.type === 'score' ? 'anotar en ' + D.names[o.box] : o.keep.length ? 'guardar ' + o.keep.join(' ') : 'tirar los cinco');

async function doRoll(k) {
  rolling = true;
  S = apply(S, { type: 'roll', keep: k });
  sound.play('roll');
  keep = [];
  render();
  rolling = false;
  save();
  await wait(450);
}
async function botTurn() {
  busy = true;
  while (!S.over && S.turn === 1) {
    render();
    await wait(700);
    const a = bot.choose(S);
    if (a.type === 'roll') {
      if (S.dice && a.keep.length) { const used = []; keep = a.keep.map(v => { const i = S.dice.findIndex((x, j) => x === v && !used.includes(j)); used.push(i); return i; }); render(); await wait(600); }
      await doRoll(a.keep);
    } else {
      S = apply(S, a);
      out('say').hidden = false;
      out('say').textContent = 'La compu anota ' + (S.log[S.log.length - 1].points || 'tacha') + ' en ' + D.names[a.box];
      save();
    }
  }
  busy = false;
  render();
  finish();
}
if (root) {
  if (!load()) fresh('normal');
  soundToggle($('[data-sound]', root));
  render();
  if (S.turn === 1) botTurn();
  root.addEventListener('click', async e => {
    if (busy) return;
    const d = e.target.closest('.jg-die');
    if (d && S.turn === 0 && S.throws > 0 && S.throws < 3) { const i = +d.dataset.i; keep = keep.includes(i) ? keep.filter(x => x !== i) : [...keep, i]; render(); return; }
    if (e.target.closest('[data-roll]') && S.turn === 0) { out('say').hidden = true; await doRoll(S.throws === 0 ? [] : keep.map(i => S.dice[i])); if (S.over) { render(); finish(); } return; }
    const b = e.target.closest('[data-box]');
    if (b && S.turn === 0) { S = apply(S, { type: 'score', box: b.dataset.box }); keep = []; save(); sound.play('card'); render(); if (S.over) finish(); else botTurn(); return; }
    if (e.target.closest('[data-hint]') && S.throws > 0) {
      out('info').textContent = 'Pensando…';
      await wait(30);
      const best = solver(S.rules, 'game').options(S.sheets[0], S.dice, S.throws)[0];
      out('info').textContent = 'Te conviene ' + label(best) + '.';
      return;
    }
    if (e.target.closest('[data-new]')) { out('end').hidden = true; fresh(cfg.level); render(); }
  });
  $('[data-cfg]', root).addEventListener('change', () => { const l = $('[name=nivel]', root).value; if (l === cfg.level) return; if (S.log.length && !S.over && !confirm('¿Empezar una partida nueva?')) { render(); return; } out('end').hidden = true; fresh(l); render(); });
}
