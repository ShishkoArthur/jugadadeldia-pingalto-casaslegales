import { $, $$, esc, page, params, setParams, fmt, pesos } from './kit.js';
import { settleDirect } from '../../../engine/lottery/quiniela.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';
import { xoshiro128ss } from '../../../engine/lottery/rng.mjs';
import { chiSquareP } from '../../../engine/lottery/extract.mjs';

const P = page();
const TZ = 'America/Argentina/Buenos_Aires';
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const SRC = { LP: ['2 fuentes', 'ok'], L: ['1 fuente · LOTBA', ''], P: ['1 fuente · Provincia', ''] };

function nowAr() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { d: p.year + '-' + p.month + '-' + p.day, t: p.hour + ':' + p.minute };
}
const arTime = iso => new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
const arDate = iso => { const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso)); return p; };
const dm = d => +d.slice(8, 10) + '/' + +d.slice(5, 7);
const day = d => DAYS[new Date(d + 'T12:00:00Z').getUTCDay()] + ' ' + dm(d);
const nums = s => s.match(/\d{4}/g);
const end2 = v => v.slice(2);

const cache = {};
async function load(name) {
  if (!cache[name]) cache[name] = fetch(P.feed + name + '.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  return cache[name];
}
const isStale = doc => Date.now() - Date.parse(doc.updated) > P.stale * 3600e3;
function status(doc) {
  const when = arDate(doc.updated) === nowAr().d ? 'hoy a las ' + arTime(doc.updated) : 'el ' + day(arDate(doc.updated)) + ' a las ' + arTime(doc.updated);
  if (isStale(doc)) return '<p class="jg-xs no" role="status"><b>Sin datos al ' + nowAr().t + '.</b> No pudimos revisar las fuentes desde ' + esc(when) + ' (hora argentina). Lo de abajo puede estar incompleto: no lo damos por actualizado.</p>';
  return '<p class="jg-xs" role="status">Revisado ' + esc(when) + ' · hora argentina</p>';
}
const badge = s => { const [t, c] = SRC[s] || ['', '']; return t ? '<span class="jg-xb' + (c ? ' ' + c : '') + '">' + t + '</span>' : ''; };
const name = (meta, id) => (meta.jurs.find(j => j.id === id) || { name: id }).name;
const tName = (meta, id) => (meta.turnos.find(t => t.id === id) || { name: id }).name;
const tTime = (meta, id) => (meta.turnos.find(t => t.id === id) || {}).time;

function extract(list, { mark = new Set(), label = '' } = {}) {
  const li = (v, i) => '<li' + (mark.has(end2(v)) ? ' class="on"' : '') + '><i>' + (i + 1) + '</i><span>' + v.slice(0, 2) + '<b>' + v.slice(2) + '</b></span></li>';
  return '<div class="jg-xx"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '><ol>' + list.slice(0, 10).map(li).join('') + '</ol><ol start="11">' + list.slice(10).map((v, i) => li(v, i + 10)).join('') + '</ol></div>';
}
function head(e, meta, jur) {
  return '<p class="jg-xh"><b>' + esc(tName(meta, e.t)) + '</b> del ' + esc(day(e.d)) + (e.h ? ' · ' + esc(e.h) + ' hs' : '') + ' ' + badge(e.j[jur][1]) + '</p>';
}
const reveal = x => { if (!x) return; const r = x.getBoundingClientRect(); if (r.top > innerHeight - 140 || r.bottom < 80) x.scrollIntoView({ block: 'start' }); };
const theTurn = (n, cap) => /^La /.test(n) ? (cap ? n : 'la ' + n.slice(3)) : (cap ? 'La ' : 'la ') + n;
const fail = (el, msg) => { el.innerHTML = '<p class="jg-xs no">' + esc(msg) + '</p>'; };

async function hoy(el) {
  const doc = await load('quiniela'), m = doc.data;
  const now = nowAr();
  if (isStale(doc)) { el.innerHTML = status(doc) + '<p class="jg-note">Mientras tanto, el archivo de sorteos anteriores sigue disponible.</p>'; return; }
  const dayShown = m.days.includes(now.d) ? now.d : m.days[m.days.length - 1];
  const list = m.draws.filter(e => e.d === dayShown);
  const by = Object.fromEntries(list.map(e => [e.t, e]));
  const cell = (t, j) => {
    const e = by[t.id], x = e && e.j[j.id];
    if (x) return '<td><button type="button" class="jg-xc" data-k="' + e.d + '|' + e.t + '|' + j.id + '" aria-label="' + esc(t.name + ' de ' + j.name + ': ' + nums(x[0])[0]) + '"><span>' + x[0].slice(0, 2) + '<b>' + x[0].slice(2, 4) + '</b></span>' + (x[1] === 'LP' ? '<i title="2 fuentes">✓</i>' : '') + '</button></td>';
    const later = dayShown === now.d && t.time && t.time > now.t;
    return '<td class="jg-xe">' + (later ? t.time : (e && (e.x || []).includes(j.id)) ? 'en revisión' : '—') + '</td>';
  };
  el.innerHTML = status(doc) + (dayShown !== now.d ? '<p class="jg-xh">Hoy todavía no hay extractos. Este es el último día con sorteos: <b>' + esc(day(dayShown)) + '</b>.</p>' : '<p class="jg-xh"><b>' + esc(day(dayShown)) + '</b></p>') +
    '<p class="jg-xlg"><span><i class="jg-xsw">✓</i>las copias de LOTBA y de la Provincia coinciden cifra por cifra. Mendoza llega solo por LOTBA.</span><span><i class="jg-xsw on"></i>la cabeza que estás viendo: sus 20 números salen debajo de la tabla.</span></p>' +
    '<div class="jg-tw"><table class="jg-tbl jg-xg"><thead><tr><th>Provincia</th>' + m.turnos.map(t => '<th>' + (P.tpaths && P.tpaths[t.id] ? '<a href="' + P.tpaths[t.id] + '">' + esc(t.name) + '</a>' : esc(t.name)) + (t.time ? '<small>' + t.time + '</small>' : '') + '</th>').join('') + '</tr></thead><tbody>' +
    m.jurs.map(j => '<tr><th scope="row">' + (P.paths[j.id] ? '<a href="' + P.paths[j.id] + '">' + esc(j.name) + '</a>' : esc(j.name)) + '</th>' + m.turnos.map(t => cell(t, j)).join('') + '</tr>').join('') + '</tbody></table></div><div class="jg-xd" data-xd></div>';
  const show = k => {
    const [d, t, j] = k.split('|');
    const e = m.draws.find(x => x.d === d && x.t === t);
    if (!e || !e.j[j]) return;
    $$('.jg-xc', el).forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k ? 'true' : 'false'));
    $('[data-xd]', el).innerHTML = '<h3>' + esc(name(m, j)) + '</h3>' + head(e, m, j) + extract(nums(e.j[j][0]), { label: 'Extracto de ' + name(m, j) });
  };
  el.addEventListener('click', ev => { const b = ev.target.closest('.jg-xc'); if (b) { show(b.dataset.k); reveal($('[data-xd]', el)); } });
  const last = [...list].reverse().find(e => e.j.caba) || list[list.length - 1];
  if (last) show(last.d + '|' + last.t + '|' + (last.j.caba ? 'caba' : Object.keys(last.j)[0]));
}

function weekTable(m, jur, pick) {
  const days = [...m.days].reverse();
  return '<div class="jg-tw"><table class="jg-tbl jg-xg"><thead><tr><th>Día</th>' + m.turnos.map(t => '<th>' + esc(t.name) + '</th>').join('') + '</tr></thead><tbody>' +
    days.map(d => '<tr><th scope="row">' + esc(day(d)) + '</th>' + m.turnos.map(t => {
      const e = m.draws.find(x => x.d === d && x.t === t.id), x = e && e.j[jur];
      return x ? '<td><button type="button" class="jg-xc" data-k="' + d + '|' + t.id + '"' + (pick && pick.d === d && pick.t === t.id ? ' aria-pressed="true"' : '') + '><span>' + x[0].slice(0, 2) + '<b>' + x[0].slice(2, 4) + '</b></span></button></td>' : '<td class="jg-xe">—</td>';
    }).join('') + '</tr>').join('') + '</tbody></table></div>';
}

async function jur(el) {
  const id = el.dataset.jur;
  const doc = await load('quiniela'), m = doc.data;
  const mine = m.draws.filter(e => e.j[id]);
  if (!mine.length) { fail(el, 'Todavía no tenemos extractos de esta provincia.'); return; }
  let cur = mine[mine.length - 1];
  const draw = () => {
    const sameDay = mine.filter(e => e.d === cur.d);
    el.innerHTML = status(doc) + '<div class="jg-sg jg-xt" role="group" aria-label="Turno">' + sameDay.map(e => '<button type="button" data-k="' + e.d + '|' + e.t + '" aria-pressed="' + (e === cur ? 'true' : 'false') + '">' + esc(tName(m, e.t)) + '</button>').join('') + '</div>' +
      head(cur, m, id) + extract(nums(cur.j[id][0]), { label: 'Extracto' });
    const w = $('[data-xweek]');
    if (w) w.innerHTML = weekTable(m, id, cur) + '<p class="jg-note">Tocá una cabeza para ver su extracto completo arriba.</p>';
  };
  const pick = k => { const [d, t] = k.split('|'); const e = mine.find(x => x.d === d && x.t === t); if (e) { cur = e; draw(); } };
  el.addEventListener('click', ev => { const b = ev.target.closest('button[data-k]'); if (b) pick(b.dataset.k); });
  const w = $('[data-xweek]');
  if (w) w.addEventListener('click', ev => { const b = ev.target.closest('button[data-k]'); if (b) { pick(b.dataset.k); el.scrollIntoView({ block: 'start' }); } });
  draw();
  checker(m, id, mine);
}

function checker(m, id, mine, sel = '', get = e => nums(e.j[id][0])) {
  const f = $('[data-xchk' + sel + ']'), out = $('[data-xchk-out' + sel + ']');
  if (!f || !out) return;
  const run = () => {
    const raw = (f.elements.n.value || '').replace(/\D/g, '');
    if (raw.length < 2) { out.innerHTML = ''; return; }
    const digits = raw.length, mod = 10 ** digits, num = Number(raw);
    const stakeIn = f.elements.s ? f.elements.s.value.replace(/\./g, '').replace(',', '.') : '';
    const stake = Number(stakeIn) > 0 ? Number(stakeIn) : null;
    const places = f.elements.u ? Number(f.elements.u.value) : 20;
    const rows = [];
    for (const e of [...mine].reverse()) {
      const list = get(e);
      const at = list.map((v, i) => Number(v) % mod === num ? i + 1 : 0).filter(Boolean);
      if (!at.length) continue;
      let pay = '';
      if (P.rules && stake) {
        try { const r = settleDirect({ rules: P.rules, digits, number: num, places, stake, extract: list.map(Number) }); pay = r.hits ? ' · cobrabas ' + pesos(toNumber(r.payout)) : ' · fuera de tu ubicación'; }
        catch (err) { pay = ''; }
      }
      rows.push('<li><b>' + esc(tName(m, e.t)) + ' del ' + esc(day(e.d)) + '</b>: ' + (at[0] === 1 ? 'a la cabeza' : 'en el lugar ' + at[0]) + (at.length > 1 ? ' (y ' + (at.length - 1) + (at.length === 2 ? ' vez' : ' veces') + ' más)' : '') + pay + '</li>');
    }
    out.innerHTML = rows.length ? '<ul class="jg-ul">' + rows.join('') + '</ul>' : '<p>El ' + esc(raw) + ' no salió en ninguno de los ' + mine.length + ' sorteos de ' + (new Set(mine.map(e => e.d)).size === 1 ? 'ese día' : 'los últimos ' + new Set(mine.map(e => e.d)).size + ' días') + '.</p>';
  };
  f.addEventListener('input', run);
  f.addEventListener('submit', e => { e.preventDefault(); run(); });
}

function coincide(a, b) { const s = new Set(a.map(end2)); return new Set(b.map(end2).filter(v => s.has(v))); }
function chanceShared(n = 20000) {
  const rng = xoshiro128ss(20261103);
  let hit = 0;
  for (let i = 0; i < n; i++) {
    const s = new Set();
    for (let k = 0; k < 20; k++) s.add(rng.int(100));
    for (let k = 0; k < 20; k++) if (s.has(rng.int(100))) { hit++; break; }
  }
  return hit / n;
}
async function nyp(el) {
  const doc = await load('quiniela'), m = doc.data;
  const both = m.draws.filter(e => e.j.caba && e.j['buenos-aires']);
  if (!both.length) { fail(el, 'Todavía no hay un turno con los dos extractos.'); return; }
  let cur = both[both.length - 1];
  const draw = () => {
    const a = nums(cur.j.caba[0]), b = nums(cur.j['buenos-aires'][0]), c = coincide(a, b);
    el.innerHTML = status(doc) + '<label class="jg-fl jg-xsel"><span>Turno</span><select class="jg-se" data-xsel>' + [...both].reverse().map(e => '<option value="' + e.d + '|' + e.t + '"' + (e === cur ? ' selected' : '') + '>' + esc(tName(m, e.t) + ' del ' + day(e.d)) + '</option>').join('') + '</select></label>' +
      '<p class="jg-xh">' + (c.size ? 'Terminaciones en los dos: <b>' + [...c].sort().join(', ') + '</b>' : 'Ninguna terminación se repite entre los dos extractos.') + '</p>' +
      '<div class="jg-x2"><div><h3>Nacional (Ciudad) ' + badge(cur.j.caba[1]) + '</h3>' + extract(a, { mark: c }) + '</div><div><h3>Provincia ' + badge(cur.j['buenos-aires'][1]) + '</h3>' + extract(b, { mark: c }) + '</div></div>';
  };
  el.addEventListener('change', ev => { if (ev.target.matches('[data-xsel]')) { const [d, t] = ev.target.value.split('|'); cur = both.find(e => e.d === d && e.t === t) || cur; draw(); } });
  draw();
  const w = $('[data-xnyp-week]');
  if (w) {
    const withShared = both.filter(e => coincide(nums(e.j.caba[0]), nums(e.j['buenos-aires'][0])).size).length;
    const p = chanceShared();
    w.innerHTML = '<p class="jg-hon">En los últimos ' + both.length + ' turnos, compartieron al menos una terminación <b>' + withShared + '</b>. Con dos extractos al azar pasa en el <b>' + fmt(p * 100, 0) + ' %</b> de los turnos (lo calcula la compu con 20.000 pares de extractos inventados).</p>';
  }
}

async function ext(el) {
  const doc = await load('quiniela-archivo'), m = doc.data;
  const r = $('[data-xrange]'); if (r) r.textContent = 'Del ' + dm(m.from) + ' al ' + dm(m.to);
  const dates = [...new Set(m.draws.map(e => e.d))].reverse();
  const q = params();
  let d = dates.includes(q.get('d')) ? q.get('d') : dates[0];
  let j = m.jurs.some(x => x.id === q.get('j')) ? q.get('j') : 'caba';
  let t = q.get('t') || null;
  const draw = () => {
    const dayList = m.draws.filter(e => e.d === d && e.j[j]);
    if (!dayList.some(e => e.t === t)) t = dayList.length ? dayList[dayList.length - 1].t : null;
    const e = dayList.find(x => x.t === t);
    el.innerHTML = '<div class="jg-x3"><label class="jg-fl"><span>Día</span><select class="jg-se" data-f="d">' + dates.map(x => '<option value="' + x + '"' + (x === d ? ' selected' : '') + '>' + esc(day(x)) + '</option>').join('') + '</select></label>' +
      '<label class="jg-fl"><span>Provincia</span><select class="jg-se" data-f="j">' + m.jurs.map(x => '<option value="' + x.id + '"' + (x.id === j ? ' selected' : '') + '>' + esc(x.long) + '</option>').join('') + '</select></label>' +
      '<label class="jg-fl"><span>Turno</span><select class="jg-se" data-f="t">' + dayList.map(x => '<option value="' + x.t + '"' + (x.t === t ? ' selected' : '') + '>' + esc(tName(m, x.t)) + '</option>').join('') + '</select></label></div>' +
      (e ? head(e, m, j) + extract(nums(e.j[j][0])) : '<p class="jg-xh">Ese día no hay extractos de esta provincia en el archivo.</p>');
    setParams({ d, j, t });
  };
  el.addEventListener('change', ev => { const f = ev.target.dataset.f; if (!f) return; if (f === 'd') d = ev.target.value; if (f === 'j') j = ev.target.value; if (f === 't') t = ev.target.value; draw(); });
  draw();
  const f = $('[data-xwhen]'), out = $('[data-xwhen-out]');
  if (!f || !out) return;
  const run = () => {
    const raw = (f.elements.n.value || '').replace(/\D/g, '');
    if (raw.length !== 2) { out.innerHTML = ''; return; }
    const jj = f.elements.j.value;
    const list = m.draws.filter(e => e.j[jj]);
    const hits = list.filter(e => e.j[jj][0].slice(2, 4) === raw).reverse();
    out.innerHTML = '<p class="jg-hon">El <b>' + raw + '</b> salió a la cabeza <b>' + hits.length + '</b> ' + (hits.length === 1 ? 'vez' : 'veces') + ' en ' + list.length + ' sorteos de ' + esc(name(m, jj)) + '. Lo esperable: ' + fmt(list.length / 100, 1) + '.</p>' +
      (hits.length ? '<ul class="jg-ul">' + hits.slice(0, 30).map(e => '<li>' + esc(tName(m, e.t)) + ' del ' + esc(day(e.d)) + ': ' + nums(e.j[jj][0])[0] + '</li>').join('') + '</ul>' : '');
  };
  f.addEventListener('input', run);
  f.addEventListener('submit', e => { e.preventDefault(); run(); });
}

const KEY = '<div class="jg-xky"><span>Salió menos de lo esperable</span><i aria-hidden="true"></i><span>Salió más</span></div>';
function heat(counts, expected, label) {
  const max = Math.max(...counts.map(c => Math.abs(c - expected)), 1);
  return '<div class="jg-xm" role="img" aria-label="' + esc(label) + '">' + counts.map((c, i) => {
    const v = (c - expected) / max;
    return '<i style="--v:' + v.toFixed(3) + '" title="' + String(i).padStart(2, '0') + ': ' + c + '"><b>' + String(i).padStart(2, '0') + '</b><small>' + c + '</small></i>';
  }).join('') + '</div>';
}
function simulate(draws, all) {
  const rng = xoshiro128ss(draws * 7919 + (all ? 1 : 0));
  const c = new Array(100).fill(0);
  for (let i = 0; i < draws * (all ? 20 : 1); i++) c[rng.int(100)]++;
  return c;
}
async function freq(el) {
  const doc = await load('quiniela-frecuencia'), m = doc.data;
  const r = $('[data-xrange]'); if (r) r.textContent = 'Del ' + dm(m.from) + ' al ' + dm(m.to);
  let j = 'caba', all = false;
  const draw = () => {
    const f = m.freq[j];
    const counts = all ? f.all : f.head, e = all ? f.expectedAll : f.expectedHead;
    const sim = simulate(f.draws, all);
    const chiSim = sim.reduce((s, o) => s + (o - e) ** 2 / e, 0);
    const order = counts.map((c, i) => [i, c]).sort((a, b) => b[1] - a[1]);
    const top = order.slice(0, 5), low = order.slice(-5).reverse();
    el.innerHTML = '<div class="jg-x3"><label class="jg-fl"><span>Provincia</span><select class="jg-se" data-f="j">' + m.jurs.map(x => '<option value="' + x.id + '"' + (x.id === j ? ' selected' : '') + '>' + esc(x.long) + '</option>').join('') + '</select></label>' +
      '<div class="jg-fl"><span>Qué contamos</span><div class="jg-sg" role="group"><button type="button" data-a="0" aria-pressed="' + !all + '">A la cabeza</button><button type="button" data-a="1" aria-pressed="' + all + '">Los 20 lugares</button></div></div></div>' +
      '<p class="jg-xh">' + f.draws + ' sorteos · lo esperable para cada terminación: <b>' + fmt(e, 1) + '</b></p>' +
      KEY + '<p class="jg-note">Más oscuro: salió más de lo esperable; más claro: menos. El de la derecha lo inventó la compu con bolillas perfectas: también sale desparejo.</p>' +
      '<div class="jg-x2"><div><h3>Lo que salió</h3>' + heat(counts, e, 'Veces que salió cada terminación') + '</div><div><h3>Un sorteo inventado al azar</h3>' + heat(sim, e, 'Un sorteo al azar con la misma cantidad') + '</div></div>' +
      '<p>Más veces: ' + top.map(([i, c]) => '<b>' + String(i).padStart(2, '0') + '</b> (' + c + ')').join(', ') + '. Menos: ' + low.map(([i, c]) => '<b>' + String(i).padStart(2, '0') + '</b> (' + c + ')').join(', ') + '.</p>';
    const chi = $('[data-xchi]');
    const p = all ? f.pAll : f.pHead, c2 = all ? f.chiAll : f.chiHead;
    if (chi && p !== undefined) chi.innerHTML = '<p class="jg-hon">Chi cuadrado de lo que salió: <b>' + fmt(c2, 1) + '</b>. Con 99 grados de libertad, el azar da un desorden así o mayor en el <b>' + fmt(p * 100, 0) + ' %</b> de los casos. El sorteo inventado da ' + fmt(chiSim, 1) + ' (' + fmt(chiSquareP(chiSim, 99) * 100, 0) + ' %).</p>';
  };
  el.addEventListener('change', ev => { if (ev.target.dataset.f === 'j') { j = ev.target.value; draw(); } });
  el.addEventListener('click', ev => { const b = ev.target.closest('button[data-a]'); if (b) { all = b.dataset.a === '1'; draw(); } });
  draw();
}

async function turno(el) {
  const T = el.dataset.t;
  const doc = await load('quiniela'), m = doc.data, now = nowAr();
  const t = m.turnos.find(x => x.id === T) || { id: T, name: T };
  const mine = m.draws.filter(e => e.t === T);
  if (!mine.length) { fail(el, 'Todavía no tenemos extractos de este turno.'); return; }
  let cur = mine[mine.length - 1], jSel = cur.j.caba ? 'caba' : Object.keys(cur.j)[0];
  const pending = cur.d !== now.d && t.time && now.t < t.time;
  const draw = () => {
    const note = cur.d === now.d ? '' : pending ? '<p class="jg-xh">' + esc(theTurn(t.name, true)) + ' de hoy sale a las <b>' + esc(t.time) + '</b>. Mientras tanto, la última: <b>' + esc(day(cur.d)) + '</b>.</p>' : '<p class="jg-xh">Todavía no tenemos ' + esc(theTurn(t.name)) + ' de hoy (o hoy no hubo sorteo). Esta es la última: <b>' + esc(day(cur.d)) + '</b>.</p>';
    const rows = m.jurs.map(j => {
      const x = cur.j[j.id];
      const label = P.paths[j.id] ? '<a href="' + P.paths[j.id] + '">' + esc(j.name) + '</a>' : esc(j.name);
      if (!x) return '<tr><th scope="row">' + label + '</th><td class="jg-xe">' + ((cur.x || []).includes(j.id) ? 'en revisión' : '—') + '</td><td></td></tr>';
      return '<tr><th scope="row">' + label + '</th><td><button type="button" class="jg-xc" data-j="' + j.id + '" aria-pressed="' + (j.id === jSel ? 'true' : 'false') + '" aria-label="' + esc(t.name + ' de ' + j.name + ': ' + nums(x[0])[0]) + '"><span>' + x[0].slice(0, 2) + '<b>' + x[0].slice(2, 4) + '</b></span></button></td><td>' + badge(x[1]) + '</td></tr>';
    }).join('');
    el.innerHTML = status(doc) + note + '<p class="jg-xh"><b>' + esc(t.name) + ' del ' + esc(day(cur.d)) + '</b>' + (t.time ? ' · ' + esc(t.time) + ' hs' : '') + '</p>' +
      '<div class="jg-tw"><table class="jg-tbl jg-xg jg-xt1"><thead><tr><th>Provincia</th><th>Cabeza</th><th>Fuentes</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="jg-note">Tocá una cabeza para ver los 20 números de esa provincia.</p><div class="jg-xd">' + (cur.j[jSel] ? '<h3>' + esc(name(m, jSel)) + '</h3>' + head(cur, m, jSel) + extract(nums(cur.j[jSel][0]), { label: 'Extracto de ' + name(m, jSel) }) : '') + '</div>';
    const w = $('[data-xtweek]');
    if (w) {
      const days = [...new Set(mine.map(e => e.d))].reverse();
      w.innerHTML = '<div class="jg-tw"><table class="jg-tbl jg-xg"><thead><tr><th>Día</th>' + m.jurs.map(j => '<th>' + esc(j.name) + '</th>').join('') + '</tr></thead><tbody>' +
        days.map(d => { const e = mine.find(x => x.d === d); return '<tr><th scope="row">' + esc(day(d)) + '</th>' + m.jurs.map(j => { const x = e.j[j.id]; return x ? '<td><button type="button" class="jg-xc" data-k="' + d + '|' + j.id + '"' + (e === cur && j.id === jSel ? ' aria-pressed="true"' : '') + '><span>' + x[0].slice(0, 2) + '<b>' + x[0].slice(2, 4) + '</b></span></button></td>' : '<td class="jg-xe">—</td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table></div><p class="jg-note">Los días que faltan no tuvieron ' + esc(t.name) + ' en nuestro registro (domingos y feriados). Tocá una cabeza para ver su extracto arriba.</p>';
    }
  };
  el.addEventListener('click', ev => { const b = ev.target.closest('button[data-j]'); if (b) { jSel = b.dataset.j; draw(); } });
  const w = $('[data-xtweek]');
  if (w) w.addEventListener('click', ev => { const b = ev.target.closest('button[data-k]'); if (!b) return; const [d, j] = b.dataset.k.split('|'); const e = mine.find(x => x.d === d); if (e) { cur = e; jSel = j; draw(); el.scrollIntoView({ block: 'start' }); } });
  draw();
}

const PV = {};
const pnums = e => e.n.match(/\d{4}/g);
const pbadge = e => e.c ? '<span class="jg-xb ok" title="La página oficial coincide con nuestras copias de LOTBA y la Provincia">verificada</span>' : '<span class="jg-xb">1 fuente</span>';
function pmeta(m, id) {
  const J = m.jurs.find(x => x.id === id);
  if (!J) return null;
  const order = J.turnos.map(t => t.id);
  const mine = m.draws.filter(e => e.j === id).sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : order.indexOf(a.t) - order.indexOf(b.t));
  const seen = new Set(mine.map(e => e.t));
  const tl = J.turnos.filter(t => seen.has(t.id));
  return { J, mine, tl: tl.length ? tl : J.turnos, meta: { turnos: J.turnos } };
}
const ptime = (t, e) => (e && e.h) || (P.times && P.times[t.id]) || '';
const cab = v => '<span>' + v.slice(0, 2) + '<b>' + v.slice(2, 4) + '</b></span>';

const jstale = (J, now) => {
  if (!J.stale || !J.stale.since) return '';
  const s = J.stale.since, when = arDate(s) === now.d ? 'hoy a las ' + arTime(s) : 'el ' + day(arDate(s)) + ' a las ' + arTime(s);
  return '<p class="jg-xs no" role="status"><b>La fuente de la ' + esc(J.long) + ' no responde bien desde ' + esc(when) + '.</b> Abajo están los últimos sorteos que sí pudimos revisar; puede faltar alguno más nuevo.</p>';
};

async function pv(el) {
  const id = el.dataset.jur;
  const doc = await load('provincias'), m = doc.data, now = nowAr();
  const x = pmeta(m, id);
  if (!x) { fail(el, 'Todavía no tenemos extractos de esta provincia.'); return; }
  const { J, mine, tl, meta } = x;
  const st = () => status(doc) + jstale(J, now);
  if (!mine.length) { el.innerHTML = st() + '<p class="jg-xh">Todavía no tenemos extractos de la ' + esc(J.long) + '.</p>'; return; }
  const last = mine[mine.length - 1];
  let cur = last;
  const draw = () => {
    const d = cur.d, isToday = d === now.d;
    let lead;
    if (isToday) lead = '<p class="jg-xh"><b>Hoy, ' + esc(day(d)) + '</b></p>';
    else if (cur === last || d === last.d) {
      const next = P.times ? tl.map(t => P.times[t.id]).filter(v => v && v > now.t).sort()[0] : null;
      lead = '<p class="jg-xh">Hoy todavía no hay sorteos de la ' + esc(J.long) + '. El último día con sorteos: <b>' + esc(day(d)) + '</b>.' + (next ? ' El primero de hoy sale a las <b>' + esc(next) + '</b>.' : '') + '</p>';
    } else lead = '<p class="jg-xh">Sorteos del <b>' + esc(day(d)) + '</b> · <button type="button" class="jg-lk" data-back>Volver al último</button></p>';
    const chips = tl.map(t => {
      const e = mine.find(z => z.d === d && z.t === t.id), tm = ptime(t, e);
      if (e) return '<button type="button" class="jg-pk" data-k="' + e.d + '|' + e.t + '" aria-pressed="' + (e === cur ? 'true' : 'false') + '" aria-label="' + esc(t.name + ': ' + pnums(e)[0]) + '"><small>' + esc(t.name) + (tm ? ' · ' + esc(tm) : '') + '</small>' + cab(pnums(e)[0]) + '</button>';
      const later = isToday && tm && tm > now.t;
      return '<div class="jg-pk off"><small>' + esc(t.name) + (tm ? ' · ' + esc(tm) : '') + '</small><span class="jg-xe">' + (later ? 'a las ' + esc(tm) : isToday ? 'todavía no' : '—') + '</span></div>';
    }).join('');
    const tn = tName(meta, cur.t), tm = ptime({ id: cur.t }, cur);
    el.innerHTML = st() + lead + '<div class="jg-pt" role="group" aria-label="Sorteos del día">' + chips + '</div>' +
      '<div class="jg-xd"><h3>' + (cur === last ? 'Último sorteo: ' : '') + esc(tn) + ' del ' + esc(day(cur.d)) + '</h3><p class="jg-xh">' + (cur.s ? 'Sorteo N° ' + cur.s : '') + (tm ? ' · ' + esc(tm) + ' hs' : '') + ' ' + pbadge(cur) + '</p>' +
      extract(pnums(cur), { label: 'Extracto de la ' + J.long }) + '</div>';
  };
  const pick = k => { const [d, t] = k.split('|'); const e = mine.find(z => z.d === d && z.t === t); if (e) { cur = e; draw(); } };
  el.addEventListener('click', ev => { if (ev.target.closest('[data-back]')) { cur = last; draw(); return; } const b = ev.target.closest('button[data-k]'); if (b) pick(b.dataset.k); });
  PV[id] = { doc, m, x, pick: k => { pick(k); el.scrollIntoView({ block: 'start' }); }, cur: () => cur };
  draw();
  checker(meta, id, mine, '="' + id + '"', pnums);
}

async function pvweek(el) {
  const id = el.dataset.jur;
  const doc = await load('provincias'), m = doc.data;
  const x = pmeta(m, id);
  if (!x || !x.mine.length) { fail(el, 'Todavía no hay sorteos para mostrar.'); return; }
  const days = [...new Set(x.mine.map(e => e.d))].reverse();
  el.innerHTML = '<div class="jg-tw"><table class="jg-tbl jg-xg' + (x.tl.length < 4 ? ' jg-xt1' : '') + '"><thead><tr><th>Día</th>' + x.tl.map(t => '<th>' + esc(t.name) + '</th>').join('') + '</tr></thead><tbody>' +
    days.map(d => '<tr><th scope="row">' + esc(day(d)) + '</th>' + x.tl.map(t => {
      const e = x.mine.find(z => z.d === d && z.t === t.id);
      return e ? '<td><button type="button" class="jg-xc" data-k="' + d + '|' + t.id + '">' + cab(pnums(e)[0]) + '</button></td>' : '<td class="jg-xe">—</td>';
    }).join('') + '</tr>').join('') + '</tbody></table></div>';
  el.addEventListener('click', ev => { const b = ev.target.closest('button[data-k]'); if (b && PV[id]) PV[id].pick(b.dataset.k); });
}

async function pvarch(el) {
  const id = el.dataset.jur;
  const doc = await load('provincias-archivo'), m = doc.data;
  const x = pmeta(m, id);
  if (!x || !x.mine.length) { fail(el, 'El archivo todavía está vacío.'); return; }
  const r = $('[data-xrange="' + id + '"]');
  const dates = [...new Set(x.mine.map(e => e.d))].reverse();
  if (r) r.textContent = 'Archivo: ' + dates.length + (dates.length === 1 ? ' día' : ' días') + ', del ' + dm(dates[dates.length - 1]) + ' al ' + dm(dates[0]);
  let d = dates[0], t = null;
  const draw = () => {
    const list = x.mine.filter(e => e.d === d);
    if (!list.some(e => e.t === t)) t = list[list.length - 1].t;
    const e = list.find(z => z.t === t);
    el.innerHTML = '<div class="jg-x3"><label class="jg-fl"><span>Día</span><select class="jg-se" data-f="d">' + dates.map(v => '<option value="' + v + '"' + (v === d ? ' selected' : '') + '>' + esc(day(v)) + '</option>').join('') + '</select></label>' +
      '<label class="jg-fl"><span>Sorteo</span><select class="jg-se" data-f="t">' + list.map(z => '<option value="' + z.t + '"' + (z.t === t ? ' selected' : '') + '>' + esc(tName(x.meta, z.t)) + '</option>').join('') + '</select></label></div>' +
      '<p class="jg-xh"><b>' + esc(tName(x.meta, e.t)) + '</b> del ' + esc(day(e.d)) + (e.s ? ' · Sorteo N° ' + e.s : '') + (e.h ? ' · ' + esc(e.h) + ' hs' : '') + ' ' + pbadge(e) + '</p>' + extract(pnums(e));
  };
  el.addEventListener('change', ev => { const f = ev.target.dataset.f; if (f === 'd') d = ev.target.value; if (f === 't') t = ev.target.value; if (f) draw(); });
  draw();
}

async function pvfreq(el) {
  const id = el.dataset.jur;
  const doc = await load('provincias-archivo'), m = doc.data;
  const x = pmeta(m, id);
  if (!x || !x.mine.length) { fail(el, 'El archivo todavía está vacío.'); return; }
  const n = x.mine.length, head = new Array(100).fill(0), all = new Array(100).fill(0);
  for (const e of x.mine) pnums(e).forEach((v, i) => { const k = Number(v.slice(2)); all[k]++; if (!i) head[k]++; });
  let wide = false;
  const draw = () => {
    const counts = wide ? all : head, e = wide ? n * 20 / 100 : n / 100;
    const chi = counts.reduce((s, o) => s + (o - e) ** 2 / e, 0), p = chiSquareP(chi, 99);
    const order = counts.map((c, i) => [i, c]).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    el.innerHTML = '<div class="jg-sg" role="group" aria-label="Qué contamos"><button type="button" data-a="0" aria-pressed="' + !wide + '">A la cabeza</button><button type="button" data-a="1" aria-pressed="' + wide + '">Los 20 lugares</button></div>' +
      '<p class="jg-xh">' + n + (n === 1 ? ' sorteo' : ' sorteos') + ' en el archivo · lo esperable para cada terminación: <b>' + fmt(e, 2) + '</b></p>' + KEY +
      heat(counts, e, 'Veces que salió cada terminación') +
      (n >= 30 ? '<p>Más veces: ' + order.slice(0, 5).map(([i, c]) => '<b>' + String(i).padStart(2, '0') + '</b> (' + c + ')').join(', ') + '. Menos: ' + order.slice(-5).reverse().map(([i, c]) => '<b>' + String(i).padStart(2, '0') + '</b> (' + c + ')').join(', ') + '.</p><p class="jg-hon">Chi cuadrado: <b>' + fmt(chi, 1) + '</b>. Con 99 grados de libertad, el puro azar da un desorden así o mayor en el <b>' + fmt(p * 100, 0) + ' %</b> de los casos.</p>' : '<p class="jg-hon">Con ' + n + ' sorteos todavía es muy poco para comparar con el azar: hacen falta al menos 30. El archivo crece con cada sorteo.</p>');
  };
  el.addEventListener('click', ev => { const b = ev.target.closest('button[data-a]'); if (b) { wide = b.dataset.a === '1'; draw(); } });
  draw();
}

async function otras(el) {
  const doc = await load('provincias'), m = doc.data, now = nowAr();
  const cards = m.jurs.map(J => {
    const x = pmeta(m, J.id);
    if (!x || !x.mine.length) return '';
    const d = x.mine[x.mine.length - 1].d, list = x.mine.filter(e => e.d === d);
    const href = P.ppaths && P.ppaths[J.id];
    const body = '<b>' + esc(J.long) + '</b><small>' + (d === now.d ? 'Hoy' : esc(day(d))) + (J.via ? ' · copia de ' + esc(J.via) : '') + '</small><ul>' +
      list.map(e => '<li><small>' + esc(tName(x.meta, e.t)) + '</small>' + cab(pnums(e)[0]) + '</li>').join('') + '</ul>';
    return href ? '<a class="jg-pc" href="' + href + '">' + body + '</a>' : '<div class="jg-pc">' + body + '</div>';
  }).join('');
  el.innerHTML = status(doc) + '<div class="jg-pcs">' + cards + '</div>';
}

async function tprov(el) {
  const T = el.dataset.t;
  const doc = await load('provincias'), m = doc.data;
  const rows = m.jurs.map(J => {
    const x = pmeta(m, J.id);
    const e = x && [...x.mine].reverse().find(z => z.t === T);
    if (!e) return '';
    const href = P.ppaths && P.ppaths[J.id];
    return '<tr><th scope="row">' + (href ? '<a href="' + href + '">' + esc(J.name) + '</a>' : esc(J.name)) + '</th><td>' + esc(tName(x.meta, T)) + '<small>' + esc(day(e.d)) + (e.h ? ' · ' + esc(e.h) + ' hs' : '') + '</small></td><td>' + (href ? '<a class="jg-xc" href="' + href + '">' + cab(pnums(e)[0]) + '</a>' : cab(pnums(e)[0])) + '</td></tr>';
  }).join('');
  if (!rows) { const s = el.closest('section'); if (s) s.hidden = true; return; }
  el.innerHTML = status(doc) + '<div class="jg-tw"><table class="jg-tbl jg-xg jg-xt1 jg-xtp"><thead><tr><th>Provincia</th><th>Sorteo</th><th>Cabeza</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

const MODES = { hoy, jur, nyp, ext, freq, turno, pv, pvweek, pvarch, pvfreq, otras, tprov };
for (const el of $$('[data-xq]')) {
  const fn = MODES[el.dataset.xq];
  if (fn) fn(el).catch(() => fail(el, 'No pudimos cargar los extractos. Probá de nuevo en un rato.'));
}
