import { $, page, esc, fmt } from './kit.js';

const D = page();
const TZ = 'America/Argentina/Buenos_Aires';
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const out = k => $('[data-o="' + k + '"]');
const wd = d => new Date(d + 'T12:00:00Z').getUTCDay();
const dm = d => +d.slice(8, 10) + '/' + +d.slice(5, 7);
const addDays = (d, k) => new Date(Date.parse(d + 'T12:00:00Z') + k * 864e5).toISOString().slice(0, 10);
function nowAr() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { d: p.year + '-' + p.month + '-' + p.day, t: p.hour + ':' + p.minute, s: +p.hour * 3600 + +p.minute * 60 + +p.second };
}
const secs = t => +t.slice(0, 2) * 3600 + +t.slice(3, 5) * 60;
const rowsOf = d => D.prog.rows.filter(r => r[0] === d);
const inProg = d => d >= D.prog.from && d <= D.prog.to;
let archive = null, today = null;

function pattern(d) {
  if (!archive) return null;
  const w = wd(d), days = new Set(archive.draws.map(e => e.d));
  let total = 0, with_ = 0;
  for (let x = archive.from; x <= archive.to && x < d; x = addDays(x, 1)) if (wd(x) === w) { total++; if (days.has(x)) with_++; }
  return { total, with_ };
}
function answer(d, label) {
  const rs = rowsOf(d);
  if (inProg(d)) {
    if (!rs.length) return '<div class="jg-now no"><i class="jg-ba c4" aria-hidden="true">no</i><b>' + label + ' no</b><span>' + DAYS[wd(d)] + ' ' + dm(d) + ': no hay sorteos en el programa oficial de la Ciudad.</span></div>';
    const done = d === today?.d && archive ? new Set(archive.draws.filter(e => e.d === d).map(e => e.t)) : new Set();
    return '<div class="jg-now si"><i class="jg-ba" aria-hidden="true">sí</i><b>' + label + ' sí: ' + rs.length + ' sorteos</b><span>' + DAYS[wd(d)] + ' ' + dm(d) + ' · ' + rs.map(r => r[2] + ' ' + r[1]).join(' · ') + '</span></div>';
  }
  const p = pattern(d);
  if (!p || !p.total) return '<div class="jg-now"><i class="jg-ba c3" aria-hidden="true">?</i><b>' + label + ': sin dato</b><span>El programa que guardamos no llega a esta fecha.</span></div>';
  const yes = p.with_ / p.total >= 0.5;
  return '<div class="jg-now ' + (yes ? 'si' : 'no') + '"><i class="jg-ba ' + (yes ? '' : 'c4') + '" aria-hidden="true">' + (yes ? 'sí' : 'no') + '</i><b>' + label + ' ' + (yes ? 'casi seguro que sí' : 'casi seguro que no') + '</b><span>El programa que guardamos no llega al ' + dm(d) + '. En nuestro registro, los ' + DAYS[wd(d)] + ' hubo sorteo ' + p.with_ + ' de ' + p.total + ' veces.</span></div>';
}
function next() {
  const n = nowAr();
  const r = D.prog.rows.find(x => x[0] > n.d || (x[0] === n.d && x[1] > n.t));
  if (!r) { out('next').innerHTML = ''; return; }
  const left = (Date.parse(r[0] + 'T00:00:00Z') - Date.parse(n.d + 'T00:00:00Z')) / 1000 + secs(r[1]) - n.s;
  const hh = Math.floor(left / 3600), mm = Math.floor(left % 3600 / 60), ss = Math.floor(left % 60);
  out('next').innerHTML = '<p class="jg-win"><span>Próximo: ' + esc(r[2]) + ' del ' + DAYS[wd(r[0])] + ' ' + dm(r[0]) + ', ' + r[1] + ' hs</span><b>' + (hh ? hh + ' h ' : '') + String(mm).padStart(2, '0') + ' min ' + String(ss).padStart(2, '0') + ' s</b></p>' +
    '<p class="jg-note">Extractos en ese turno: ' + r[3].map(c => D.codes[c]).join(', ') + '.</p>';
}
function draw() {
  today = nowAr();
  out('now').innerHTML = answer(today.d, 'Hoy') + '<div style="height:8px"></div>' + answer(addDays(today.d, 1), 'Mañana');
}
function days() {
  const dates = new Set(archive.draws.map(e => e.d));
  const per = Array.from({ length: 7 }, () => ({ t: 0, w: 0 })), off = [];
  for (let x = archive.from; x <= archive.to; x = addDays(x, 1)) {
    const w = wd(x); per[w].t++;
    if (dates.has(x)) per[w].w++; else if (w !== 0 && x < archive.to) off.push(x);
  }
  const order = [1, 2, 3, 4, 5, 6, 0];
  out('days').innerHTML = '<p class="jg-mu">Del ' + dm(archive.from) + ' al ' + dm(archive.to) + ': de cada día de la semana, cuántos tuvieron sorteo.</p><div class="jg-days">' +
    order.map(w => '<div' + (per[w].w ? '' : ' class="z"') + '><span>' + DAYS[w] + '</span><b>' + per[w].w + '</b><small>de ' + per[w].t + '</small></div>').join('') + '</div>';
  out('off').innerHTML = off.length ? '<h3>De lunes a sábado sin ningún sorteo</h3><ul class="jg-chipl">' + off.map(x => '<li>' + DAYS[wd(x)].slice(0, 3) + ' ' + dm(x) + '</li>').join('') + '</ul><p class="jg-note">' + (off.length === 1 ? 'Es un día' : 'Son ' + off.length + ' días') + ' en el registro. Suelen coincidir con feriados nacionales.</p>' : '';
}
async function load() {
  try {
    const r = await fetch(D.feed + 'quiniela-archivo.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    archive = (await r.json()).data;
    days();
  } catch (e) {
    out('days').innerHTML = '<p class="jg-note">No pudimos leer el registro de sorteos ahora. Probá de nuevo en un rato.</p>';
  }
  draw();
}
if (out('now')) { draw(); next(); setInterval(next, 1000); setInterval(draw, 60000); load(); }
