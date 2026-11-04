import { $, $$, page, store, esc, pesos, fmt } from './kit.js';
import { STALE_HOURS } from '../../../engine/lottery/extract.mjs';

const D = page();
const form = $('[data-sorteo]');
const two = n => String(n).padStart(2, '0');

function readBalls(box) {
  return $$('input', box).map(i => i.value.trim()).filter(Boolean).map(v => (/^\d+$/.test(v) ? +v : NaN));
}
function readMany(area, four) {
  const raw = (area.value.match(/\d+/g) || []).map(Number);
  return four ? raw.map(x => x % 100) : raw;
}
function line(el, cls, text) {
  el.className = 'jg-res ' + cls;
  el.textContent = text;
}
function check(e) {
  if (e) e.preventDefault();
  const sum = $('[data-sum]', form);
  sum.textContent = '';
  const mine = readBalls($('[data-balls="mine"]', form));
  const bad = mine.some(x => Number.isNaN(x) || x < D.min || x > D.max);
  if (mine.length !== D.pick || bad || new Set(mine).size !== mine.length) {
    sum.className = 'jg-sum jg-no';
    sum.textContent = 'Tu jugada tiene que tener ' + D.pick + ' números distintos, del ' + two(D.min) + ' al ' + two(D.max) + '.';
    return;
  }
  store.set('jg-boleta-' + D.game, mine.join(','));
  const mineSet = new Set(mine);
  const results = {};
  let any = false, anyWin = false;
  for (const s of D.sets) {
    const res = $('[data-res="' + s.id + '"]', form);
    const area = $('[data-many="' + s.id + '"]', form);
    const drawn = area ? readMany(area, s.four) : readBalls($('[data-balls="' + s.id + '"]', form));
    if (!drawn.length) { line(res, '', ''); continue; }
    const need = s.four ? s.drawn : s.drawn;
    if (drawn.length !== need || drawn.some(x => Number.isNaN(x) || x < D.min || x > D.max) || (!s.four && new Set(drawn).size !== drawn.length)) {
      line(res, 'jg-no', 'Faltan números o hay alguno repetido o fuera de rango: tienen que ser ' + need + '.');
      continue;
    }
    any = true;
    const hits = [...new Set(drawn)].filter(x => mineSet.has(x)).length;
    results[s.id] = { hits, drawn };
    let verdict;
    if (s.win === 'most') verdict = hits + (hits === 1 ? ' acierto' : ' aciertos') + '. Acá gana quien tenga más aciertos: depende de las otras boletas.';
    else if (s.win.includes(hits)) { anyWin = true; verdict = hits + ' aciertos: ¡esta categoría tiene premio! Confirmalo con el extracto oficial.'; }
    else verdict = hits + (hits === 1 ? ' acierto' : ' aciertos') + ': sin premio en esta modalidad.';
    line(res, s.win !== 'most' && s.win.includes(hits) ? 'jg-ok' : '', verdict);
  }
  if (D.extra === 'quini6' && results.tr && results.se && results.re) {
    const union = new Set([...results.tr.drawn, ...results.se.drawn, ...results.re.drawn]);
    const inUnion = mine.filter(x => union.has(x)).length;
    const six = [results.tr, results.se, results.re].some(r => r.hits === 6);
    const p = document.createElement('p');
    p.className = inUnion === 6 && !six ? 'jg-ok' : '';
    p.textContent = 'Premio Extra: ' + inUnion + ' de tus 6 números están entre los ' + union.size + ' que salieron en Tradicional, La Segunda y Revancha.' + (inUnion === 6 && !six ? ' Entrás en el Premio Extra.' : '');
    sum.append(p);
  }
  if (D.extra === 'loto') {
    const pl = form.elements.plus.value.trim(), po = form.elements.plusOut.value.trim();
    const six = ['tr', 'ma', 'de'].some(k => results[k] && results[k].hits === 6);
    if (pl !== '' && po !== '') {
      const p = document.createElement('p');
      p.className = six && pl === po ? 'jg-ok' : '';
      p.textContent = pl === po ? (six ? 'Número Plus acertado y 6 aciertos: entrás en el Multiplicador.' : 'Acertaste el número Plus, pero el Multiplicador pide además 6 aciertos.') : 'El número Plus no coincide.';
      sum.append(p);
    }
  }
  if (!any) { sum.className = 'jg-sum'; sum.textContent = 'Cargá los números que salieron en al menos una modalidad.'; return; }
  sum.className = 'jg-sum';
  const p = document.createElement('p');
  p.className = 'jg-note';
  p.textContent = anyWin ? 'El premio en pesos lo publica la lotería con el extracto: depende de cuántos ganadores hubo.' : 'Controlado. Recordá que cada sorteo es independiente: los números de hoy no cambian la chance del próximo.';
  sum.append(p);
}
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
async function fill(btn) {
  const F = D.fill, id = btn.dataset.fill;
  const area = $('[data-many="' + id + '"]', form), note = $('[data-fill-note="' + id + '"]', form);
  if (!F || !area) return;
  note.textContent = 'Buscando…';
  try {
    const r = await fetch(F.feed, { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    const doc = await r.json();
    const e = [...doc.data.draws].reverse().find(x => x.t === F.t && x.j[F.jur]);
    if (!e) { note.textContent = 'Todavía no tenemos esa Nocturna. Copiá los números del extracto oficial.'; return; }
    area.value = e.j[F.jur][0].match(/\d{4}/g).join(' ');
    const d = e.d, wd = DAYS[new Date(d + 'T12:00:00Z').getUTCDay()];
    const stale = Date.now() - Date.parse(doc.updated) > STALE_HOURS * 3600e3;
    note.textContent = 'Nocturna de la Provincia del ' + wd + ' ' + +d.slice(8, 10) + '/' + +d.slice(5, 7) + (e.j[F.jur][1] === 'LP' ? ' · 2 fuentes oficiales coinciden' : ' · 1 fuente oficial') + (stale ? ' · ojo: hace más de ' + STALE_HOURS + ' horas que no pudimos revisar las fuentes' : '') + '. Para cobrar, manda el extracto oficial.';
    if (readBalls($('[data-balls="mine"]', form)).length === D.pick) check();
  } catch (err) { note.textContent = 'No pudimos traer el extracto. Copialo del extracto oficial.'; }
}
const TZ = 'America/Argentina/Buenos_Aires';
const SRCS = { CL: '2 fuentes: Lotería de la Ciudad y CAS San Juan', CT: '2 fuentes: telekino.com.ar y CAS San Juan', C: '1 fuente: copia de la CAS San Juan', L: '1 fuente: Lotería de la Ciudad', T: '1 fuente: telekino.com.ar' };
const dmy = d => +d.slice(8, 10) + '/' + +d.slice(5, 7);
const dayName = d => DAYS[new Date(d + 'T12:00:00Z').getUTCDay()] + ' ' + dmy(d);
const hhmm = iso => new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
const ymd = iso => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
function fillDraw(L, e, note) {
  if (!form) return;
  for (const [k, [id]] of Object.entries(L.sets)) {
    if (!id || !e.mods[k]) continue;
    const list = e.mods[k].split(' ');
    const area = $('[data-many="' + id + '"]', form);
    if (area) { area.value = list.join(' '); continue; }
    $$('input', $('[data-balls="' + id + '"]', form)).forEach((el, i) => { el.value = list[i] || ''; });
  }
  if (L.plus && form.elements[L.plus]) form.elements[L.plus].value = e.plus || '';
  const n = $('[data-lot-fill]', form.parentNode) || document.createElement('p');
  n.className = 'jg-note'; n.setAttribute('data-lot-fill', '');
  n.textContent = note;
  if (!n.parentNode) form.parentNode.insertBefore(n, form);
  if (readBalls($('[data-balls="mine"]', form)).length === D.pick) check();
}
function drawHtml(L, g, e) {
  const sets = Object.entries(L.sets).filter(([k]) => e.mods[k]).map(([k, [, name]]) => '<div class="jg-lm"><h3>' + esc(name) + '</h3><p class="jg-lb">' + e.mods[k].split(' ').map(v => '<i>' + v + '</i>').join('') + '</p></div>').join('');
  const plus = e.plus ? '<div class="jg-lm"><h3>Número Plus</h3><p class="jg-lb"><i class="p">' + esc(e.plus) + '</i></p></div>' : '';
  const prizes = e.prizes && e.prizes.length ? '<div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Modalidad</th><th class="n">Aciertos</th><th class="n">Ganadores</th><th class="n">Premio por ganador</th></tr></thead><tbody>' +
    e.prizes.map(r => '<tr><td>' + esc(r.mod) + '</td><td class="n">' + r.hits + '</td><td class="n">' + (r.winners ? fmt(r.winners, 0) : 'vacante') + '</td><td class="n">' + (r.winners ? pesos(r.each) : '—') + '</td></tr>').join('') + '</tbody></table></div>' +
    (e.pozo ? '<p class="jg-note">Pozo estimado que informa la Lotería de la Ciudad para este sorteo: <b>' + pesos(e.pozo) + '</b>.</p>' : '') : '';
  return '<p class="jg-xh"><b>Sorteo N° ' + e.s + '</b> del ' + esc(dayName(e.d)) + ' <span class="jg-xb' + (e.src && e.src.length > 1 ? ' ok' : '') + '">' + esc(SRCS[e.src] || '') + '</span></p><div class="jg-lms">' + sets + plus + '</div>' + prizes;
}
async function lot(el) {
  const L = D.lot;
  const r = await fetch(L.feed, { cache: 'no-cache' });
  if (!r.ok) throw new Error(r.status);
  const doc = await r.json(), g = doc.data.games[L.game];
  if (!g || !g.draws || !g.draws.length) return;
  const now = new Date().toISOString();
  const stale = Date.now() - Date.parse(doc.updated) > L.stale * 3600e3;
  const when = (ymd(doc.updated) === ymd(now) ? 'hoy' : 'el ' + dayName(ymd(doc.updated))) + ' a las ' + hhmm(doc.updated);
  const head = stale ? '<p class="jg-xs no" role="status"><b>Sin datos al ' + hhmm(now) + '.</b> No pudimos revisar las fuentes desde ' + esc(when) + ' (hora argentina): puede haber un sorteo más nuevo que este. Mirá ' + '<a href="' + L.official[0] + '" rel="noopener">' + esc(L.official[1]) + '</a>.</p>' : '<p class="jg-xs" role="status">Revisado ' + esc(when) + ' · hora argentina</p>';
  const behind = g.behind > 0 && g.expected ? '<p class="jg-xs no"><b>Pendiente de publicación oficial.</b> La copia oficial de San Juan todavía no publicó el sorteo del ' + esc(dayName(g.expected)) + (g.behind > 1 ? ' (faltan ' + g.behind + ' sorteos)' : '') + '. Abajo, el último que publicó. Los números del ' + esc(dmy(g.expected)) + ' están en <a href="' + L.official[0] + '" rel="noopener">' + esc(L.official[1]) + '</a>.</p>' : '';
  let cur = g.draws[0];
  const draw = () => {
    el.innerHTML = head + behind + (g.draws.length > 1 ? '<label class="jg-fl jg-xsel"><span>Sorteo</span><select class="jg-se" data-lot-sel>' + g.draws.map((e, i) => '<option value="' + e.s + '"' + (e === cur ? ' selected' : '') + '>N° ' + e.s + ' · ' + esc(dayName(e.d)) + (i === 0 ? ' (el último publicado)' : '') + '</option>').join('') + '</select></label>' : '') + drawHtml(L, g, cur) +
      '<p class="jg-note">Para cobrar manda el extracto oficial: <a href="' + L.official[0] + '" rel="noopener">' + esc(L.official[1]) + '</a>.</p>';
  };
  el.addEventListener('change', ev => { if (!ev.target.matches('[data-lot-sel]')) return; cur = g.draws.find(e => String(e.s) === ev.target.value) || cur; draw(); fillDraw(L, cur, 'Cargamos los números del sorteo N° ' + cur.s + ' del ' + dayName(cur.d) + '.'); });
  draw();
  const typed = form && Object.values(L.sets).some(([id]) => { if (!id) return false; const box = $('[data-balls="' + id + '"]', form), area = $('[data-many="' + id + '"]', form); return (box && $$('input', box).some(i => i.value)) || (area && area.value); });
  if (!typed) fillDraw(L, cur, 'Ya cargamos los números del sorteo N° ' + cur.s + ' del ' + dayName(cur.d) + '. Escribí tu jugada y tocá Controlar.');
}
const lotEl = $('[data-lot]');
if (lotEl && D.lot) lot(lotEl).catch(() => { lotEl.insertAdjacentHTML('beforeend', '<p class="jg-xs no">No pudimos cargar el último sorteo. Probá de nuevo en un rato.</p>'); });
if (form) {
  form.addEventListener('click', e => { const b = e.target.closest('[data-fill]'); if (b) fill(b); });
  const saved = store.get('jg-boleta-' + D.game);
  if (saved) $$('input', $('[data-balls="mine"]', form)).forEach((el, i) => { const v = saved.split(',')[i]; if (v !== undefined) el.value = D.max > 9 ? two(v) : v; });
  form.addEventListener('submit', check);
  form.addEventListener('reset', () => { store.del('jg-boleta-' + D.game); setTimeout(() => { $$('.jg-res', form).forEach(r => { r.textContent = ''; }); $('[data-sum]', form).textContent = ''; }, 0); });
  form.addEventListener('input', e => {
    const el = e.target;
    if (el.closest('[data-balls]') && el.value.length >= el.maxLength) {
      const next = el.nextElementSibling;
      if (next && next.tagName === 'INPUT') next.focus();
    }
  });
}
