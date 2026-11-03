import { esc, load, stale, stamp, fail, arDay, arTime, dayName, today } from './fdkit.js';
import { fmt, fmtPct } from '../../../engine/games/num.mjs';
import { eloExpect } from '../../../engine/games/elo.mjs';
import { series, mapChanceFor } from '../../../engine/games/series.mjs';

const TR = [
  [/^Grand final$/i, 'Gran final'], [/^3rd place match$/i, 'Tercer puesto'], [/^Decider Match$/i, 'Partido decisivo'], [/^Winners Match$/i, 'Partido de ganadores'], [/^Elimination Match$/i, 'Partido de eliminación'],
  [/Upper bracket /i, 'Llave de arriba, '], [/Lower bracket /i, 'Llave de abajo, '], [/quarterfinal/i, 'cuartos'], [/semifinal/i, 'semifinal'], [/\bfinal\b/i, 'final'], [/round (\d+)/i, 'ronda $1'], [/ match (\d+)/i, ', partido $1'],
];
const STG = [[/^Group Stage$/i, 'Fase de grupos'], [/^Group ([A-H])$/i, 'Grupo $1'], [/^Knockout Stage$/i, 'Eliminación directa'], [/^Elimination Round$/i, 'Ronda de eliminación'], [/^Swiss Stage$/i, 'Fase suiza']];
const tr = (s, list) => { let x = String(s || ''); for (const [r, t] of list) x = x.replace(r, t); return x.charAt(0).toUpperCase() + x.slice(1); };
const VCT = new Set(['champions', 'masters', 'americas']);
const title = (ev, ed) => VCT.has(ev.k) ? 'VCT ' + ed.name : ev.name + (ed.name && !/^\d{4}$/.test(ed.name) ? ' ' + ed.name : ed.year ? ' ' + ed.year : '');
const ST = { running: 'En curso', upcoming: 'Por empezar', finished: 'Terminado' };
const SA = new Set(['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'PE', 'PY', 'UY', 'VE']);
const flag = loc => loc === 'AR' ? ' <i class="pa-fdar" title="Argentina">AR</i>' : '';
const team = (t, win) => '<span class="pa-fdtm' + (win ? ' pa-fdwin' : '') + '">' + esc(t.a && t.n.length > 18 ? t.a : t.n) + flag(t.loc) + '</span>';
const when = iso => (arDay(iso) === today() ? 'hoy' : dayName(arDay(iso))) + ' ' + arTime(iso);
const range = (a, b) => a ? (b && arDay(b) !== arDay(a) ? dayName(arDay(a)) + ' al ' + dayName(arDay(b)) + ' de ' + arDay(b).slice(0, 4) : dayName(arDay(a)) + ' de ' + arDay(a).slice(0, 4)) : 'fecha a confirmar';

function row(m) {
  const t = m.teams.length ? m.teams : [{ n: 'A definir' }, { n: 'A definir' }];
  const sc = m.st === 'running' || m.st === 'finished' ? '<b class="pa-fdsc">' + m.score.join(' - ') + '</b>' : '<span class="pa-fdvs">vs</span>';
  const h = m.st === 'running' ? '<span class="pa-fdlive">En vivo</span>' : m.at ? '<span>' + esc(arDay(m.at) === today() ? 'hoy' : dayName(arDay(m.at))) + '</span><br><time datetime="' + esc(m.at) + '">' + arTime(m.at) + '</time>' : '<span>a confirmar</span>';
  const meta = [tr(m.rd, TR), m.bo ? 'Bo' + m.bo : '', m.st === 'postponed' ? 'postergado' : ''].filter(Boolean).map(esc).join(' · ');
  const tv = m.tv && m.st !== 'finished' ? ' <a class="pa-fdtv" href="' + esc(m.tv.url) + '" rel="noopener">Ver' + (m.tv.lang === 'es' ? ' en español' : '') + '</a>' : '';
  return '<li class="pa-fdm' + (m.ar ? ' pa-fdmar' : '') + '"><div class="pa-fdh">' + h + '</div><div class="pa-fdb"><div class="pa-fdtt">' + team(t[0], m.win === 0) + sc + team(t[1] || { n: 'A definir' }, m.win === 1) + '</div><small>' + meta + tv + '</small></div></li>';
}

function edition(ed, ev) {
  const live = ed.matches.filter(m => m.st === 'running'), next = ed.matches.filter(m => m.st === 'not_started' && m.at && Date.parse(m.at) > Date.now() - 3 * 3600e3);
  const ar = [...new Set(ed.matches.flatMap(m => m.teams.filter(t => t.loc === 'AR').map(t => t.n)))];
  const sa = [...new Set(ed.matches.flatMap(m => m.teams.filter(t => SA.has(t.loc) && t.loc !== 'AR').map(t => t.n)))];
  let h = '<div class="pa-evh"><div><p class="pa-x">' + esc(ev.game) + ' · ' + esc(range(ed.begin, ed.end)) + '</p><h3>' + esc(title(ev, ed)) + '</h3></div><span class="pa-evs pa-evs-' + ed.st + '">' + ST[ed.st] + '</span></div>';
  h += '<div class="pa-evk">' + (ed.winner ? '<div><small>Campeón</small><b>' + esc(ed.winner.n) + flag(ed.winner.loc) + '</b></div>' : '') + '<div><small>Partidos</small><b>' + ed.matches.length + '</b></div><div><small>Fases</small><b>' + ed.stages.length + '</b></div>' + (ar.length ? '<div><small>Equipos argentinos</small><b>' + ar.map(esc).join(', ') + '</b></div>' : '') + '<div><small>Otros de Sudamérica</small><b>' + (sa.length ? sa.map(esc).join(', ') : 'ninguno') + '</b></div></div>';
  if (live.length || next.length) h += '<h4 class="pa-fdh3">' + (live.length ? 'En vivo y lo que viene' : 'Lo que viene') + ' · hora argentina</h4><ol class="pa-fdl">' + [...live, ...next.slice(0, 8)].map(row).join('') + '</ol>';
  const tabs = ed.stages.filter(s => ed.matches.some(m => m.stage === s.id));
  h += '<div class="pa-seg pa-evt" role="group" aria-label="Fase">' + tabs.map((s, i) => '<button type="button" data-stage="' + s.id + '" aria-pressed="' + (i === tabs.length - 1) + '">' + esc(tr(s.n, STG)) + '</button>').join('') + '</div><div data-stage-list></div>';
  return h;
}
function stageList(ed, id) {
  const ms = ed.matches.filter(m => m.stage === id);
  const g = {};
  for (const m of ms) { let k = m.rd.replace(/ match \d+$/i, '') || 'Partidos'; if (/final/i.test(k)) k = k.replace(/ \d+$/, ''); (g[k] = g[k] || []).push(m); }
  return Object.entries(g).map(([k, list]) => '<h4 class="pa-fdh3">' + esc(tr(k, TR)) + '</h4><ol class="pa-fdl">' + list.map(row).join('') + '</ol>').join('');
}

async function event(el) {
  const doc = await load(el.dataset.fdSrc, 'torneos'), d = doc.data;
  const ev = d.events.find(e => e.k === el.dataset.ev);
  if (!ev || !ev.eds.length) { el.innerHTML = '<p>Todavía no hay datos de este torneo.</p>'; return; }
  const ed = ev.eds[Number(el.dataset.ed || 0)] || ev.eds[0];
  el.innerHTML = stamp(doc, 6) + (stale(doc, 6) && ed.st !== 'finished' ? '' : edition(ed, ev));
  const list = el.querySelector('[data-stage-list]');
  if (!list) return;
  const btn = [...el.querySelectorAll('[data-stage]')];
  const show = id => { btn.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.stage === String(id)))); list.innerHTML = stageList(ed, id); };
  btn.forEach(b => b.addEventListener('click', () => show(Number(b.dataset.stage))));
  if (btn.length) show(Number(btn[btn.length - 1].dataset.stage));
}

async function champs(el) {
  const doc = await load(el.dataset.fdSrc, 'torneos'), d = doc.data, g = el.dataset.g;
  const eds = d.events.filter(e => !g || e.g === g).flatMap(e => e.eds.map(ed => ({ e, ed })));
  el.innerHTML = '<ul class="pa-evc">' + eds.map(({ e, ed }) => '<li><small>' + esc(e.game) + ' · ' + esc(range(ed.begin, ed.end)) + '</small><b>' + esc(title(e, ed)) + '</b><span>' + (ed.winner ? 'Campeón: <strong>' + esc(ed.winner.n) + '</strong>' + flag(ed.winner.loc) : esc(ST[ed.st])) + '</span></li>').join('') + '</ul>';
}

async function argentinos(el) {
  const [doc, ag] = await Promise.all([load(el.dataset.fdSrc, 'argentinos'), load(el.dataset.fdSrc, 'agenda').catch(() => null)]);
  const d = doc.data, only = el.dataset.g || '';
  const games = Object.keys(d.games).filter(k => d.players.some(p => p.g === k)).sort((a, b) => d.players.filter(p => p.g === b).length - d.players.filter(p => p.g === a).length);
  let g = only || '', where = '';
  const ids = new Set(d.players.map(p => p.ti));
  const draw = () => {
    const ps = d.players.filter(p => (!g || p.g === g) && (!where || (where === 'home' ? p.tl === 'AR' : p.tl && p.tl !== 'AR')));
    const abroad = d.players.filter(p => (!g || p.g === g) && p.tl && p.tl !== 'AR').length;
    let h = stamp(doc, 72) + '<div class="pa-evk"><div><small>Con equipo hoy</small><b>' + fmt(d.players.filter(p => !g || p.g === g).length, 0) + '</b></div><div><small>En equipos de otro país</small><b>' + fmt(abroad, 0) + '</b></div><div><small>Equipos argentinos</small><b>' + fmt(d.teams.filter(t => !g || t.g === g).length, 0) + '</b></div></div>';
    if (!only) h += '<div class="pa-seg" role="group" aria-label="Juego"><button type="button" data-g="" aria-pressed="' + !g + '">Todos</button>' + games.map(k => '<button type="button" data-g="' + esc(k) + '" aria-pressed="' + (g === k) + '">' + esc(d.games[k]) + ' · ' + d.players.filter(p => p.g === k).length + '</button>').join('') + '</div>';
    h += '<div class="pa-seg" role="group" aria-label="Dónde juegan"><button type="button" data-w="" aria-pressed="' + !where + '">Todos</button><button type="button" data-w="home" aria-pressed="' + (where === 'home') + '">En equipos argentinos</button><button type="button" data-w="out" aria-pressed="' + (where === 'out') + '">Afuera</button></div>';
    h += ps.length ? '<div class="pa-tw"><table class="pa-tb"><thead><tr><th>Jugador</th><th>Equipo</th><th>País del equipo</th>' + (g ? '' : '<th>Juego</th>') + '</tr></thead><tbody>' + ps.map(p => '<tr><td><b>' + esc(p.n) + '</b></td><td>' + esc(p.t) + '</td><td>' + esc(p.tl || 'sin dato') + '</td>' + (g ? '' : '<td>' + esc(d.games[p.g]) + '</td>') + '</tr>').join('') + '</tbody></table></div>' : '<p>No hay jugadores con esos filtros.</p>';
    if (ag && !stale(ag, 4)) {
      const ms = ag.data.matches.filter(m => m.st !== 'finished' && m.teams.some(t => ids.has(t.i)) && (!g || d.players.some(p => p.g === g && m.teams.some(t => t.i === p.ti)))).slice(0, 8);
      h += '<h3 class="pa-fdh3">Próximos partidos con argentinos</h3>' + (ms.length ? '<ol class="pa-fdl">' + ms.map(m => { const who = d.players.filter(p => m.teams.some(t => t.i === p.ti)).map(p => p.n); return '<li class="pa-fdm pa-fdmar"><div class="pa-fdh">' + (m.st === 'running' ? '<span class="pa-fdlive">En vivo</span>' : m.at ? '<span>' + esc(arDay(m.at) === today() ? 'hoy' : dayName(arDay(m.at))) + '</span><br>' + arTime(m.at) : 'a confirmar') + '</div><div class="pa-fdb"><div class="pa-fdtt">' + team(m.teams[0] || { n: 'A definir' }, false) + '<span class="pa-fdvs">vs</span>' + team(m.teams[1] || { n: 'A definir' }, false) + '</div><small>' + esc(m.lg) + ' · con ' + esc(who.join(', ')) + '</small></div></li>'; }).join('') + '</ol>' : '<p>Esta semana no hay partidos cargados de equipos con argentinos en este juego.</p>');
    }
    el.innerHTML = h;
  };
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if ('g' in b.dataset) g = b.dataset.g; else if ('w' in b.dataset) where = b.dataset.w; else return; draw(); });
  draw();
}

async function latam(el) {
  const [doc, ar] = await Promise.all([load(el.dataset.fdSrc, 'agenda'), load(el.dataset.fdSrc, 'argentinos').catch(() => null)]);
  if (stale(doc, 4)) { el.innerHTML = stamp(doc, 4); return; }
  const names = Object.fromEntries(doc.data.games.map(g => [g.k, g.name]));
  const ms = doc.data.matches.filter(m => m.latam || m.reg === 'SA');
  const lg = {};
  for (const m of ms) { const k = m.g + '|' + m.lg; (lg[k] = lg[k] || []).push(m); }
  const rows = Object.entries(lg).map(([k, list]) => { const [g, n] = k.split('|'); const next = list.filter(m => m.st !== 'finished').sort((a, b) => (a.at || '9') < (b.at || '9') ? -1 : 1)[0]; const art = [...new Set(list.flatMap(m => m.teams.filter(t => t.loc === 'AR').map(t => t.n)))]; return { g, n, list, next, art }; })
    .sort((a, b) => b.art.length - a.art.length || b.list.length - a.list.length);
  let h = stamp(doc, 4);
  h += rows.length ? '<ul class="pa-evc">' + rows.map(r => '<li><small>' + esc(names[r.g]) + ' · ' + r.list.length + ' partidos con equipos de la región</small><b>' + esc(r.n) + '</b><span>' + (r.next ? 'Próximo: ' + esc(r.next.teams.map(t => t.n).join(' vs ') || 'a definir') + (r.next.at ? ', ' + esc(when(r.next.at)) : '') : 'Sin partidos pendientes esta semana') + '</span>' + (r.art.length ? '<span>Argentinos: ' + esc(r.art.join(', ')) + '</span>' : '') + '</li>').join('') + '</ul>' : '<p>Esta semana no hay ligas con equipos de Latinoamérica en la agenda.</p>';
  if (ar) { const t = ar.data.teams; const by = {}; for (const x of t) by[x.g] = (by[x.g] || 0) + 1; h += '<h3 class="pa-fdh3">Equipos argentinos por juego</h3><ul class="pa-bl">' + Object.entries(by).sort((a, b) => b[1] - a[1]).map(([g, n]) => '<li><span>' + esc(ar.data.games[g] || g) + '</span><i style="--v:' + Math.round(n / Math.max(...Object.values(by)) * 100) + '"></i><b>' + n + '</b></li>').join('') + '</ul>'; }
  el.innerHTML = h;
}

async function dotaelo(el) {
  const doc = await load(el.dataset.fdSrc, 'dotaelo'), d = doc.data;
  const all = [...d.rows, ...d.sa];
  let sa = false, q = '', more = false;
  const draw = () => {
    const hit = all.filter(r => (!sa || r.sa) && (!q || r.n.toLowerCase().includes(q)));
    const rows = more || sa || q ? hit : hit.slice(0, 25);
    el.querySelector('[data-rows]').innerHTML = '<table class="pa-tb"><thead><tr><th class="pa-n">#</th><th>Equipo</th><th class="pa-n">Elo</th><th class="pa-n">Series</th><th class="pa-n">Últimos 30 días</th></tr></thead><tbody>' + rows.map(r => '<tr' + (r.sa ? ' class="pa-hi"' : '') + '><td class="pa-n">' + r.rank + '</td><td><b>' + esc(r.n) + '</b>' + (r.loc ? ' <small>' + esc(r.loc) + '</small>' : '') + flag(r.loc) + '</td><td class="pa-n">' + fmt(r.r, 0) + '</td><td class="pa-n">' + r.w + '-' + r.l + '</td><td class="pa-n">' + r.f[0] + '-' + r.f[1] + '</td></tr>').join('') + '</tbody></table>' + (rows.length ? '' : '<p>Ningún equipo con ese filtro.</p>') + (rows.length < hit.length ? '<div class="pa-share"><button type="button" data-more>Ver los ' + hit.length + '</button></div>' : '');
  };
  const opts = sel => all.map((r, i) => '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + esc(r.rank + '. ' + r.n) + '</option>').join('');
  const firstSa = Math.max(0, all.findIndex(r => r.sa));
  el.innerHTML = stamp(doc, 72) + '<div class="pa-tool"><div class="pa-c pa-fm"><h2>Cara a cara</h2><div class="pa-row"><div class="pa-f"><label for="de-a">Equipo 1</label><select id="de-a">' + opts(0) + '</select></div><div class="pa-f"><label for="de-b">Equipo 2</label><select id="de-b">' + opts(firstSa) + '</select></div></div><p class="pa-src">Nuestro Elo aprende de series enteras, sean Bo1, Bo3 o Bo5; los empates de un Bo2 no cuentan. Pasarlo a chance por mapa es una estimación, no una regla del juego.</p></div><div class="pa-c pa-out" aria-live="polite" data-duel></div></div>' +
    '<div class="pa-fdf"><label class="pa-f"><span>Buscar</span><input type="search" data-q placeholder="Spirit" autocomplete="off"></label><label class="pa-ck"><input type="checkbox" data-sa><span>Solo Sudamérica</span></label></div><div class="pa-tw" data-rows></div>' +
    '<p class="pa-src">' + fmt(d.series, 0) + ' series del ' + esc(dayName(arDay(d.from))) + ' al ' + esc(dayName(arDay(d.to))) + '. Prueba hacia atrás: en las ' + fmt(d.test.n, 0) + ' series de los últimos ' + d.test.days + ' días, el equipo con más Elo antes de jugar ganó ' + fmtPct(d.test.hit / d.test.n, 1) + ' de las veces.</p>';
  const A = el.querySelector('#de-a'), B = el.querySelector('#de-b'), out = el.querySelector('[data-duel]');
  const duel = () => {
    const a = all[A.value], b = all[B.value];
    if (a === b) { out.innerHTML = '<p>Elegí dos equipos distintos.</p>'; return; }
    const p = eloExpect(a.r, b.r), m = mapChanceFor(3, p);
    out.innerHTML = '<p class="pa-x">' + esc(a.n) + ' le gana a ' + esc(b.n) + '</p><p class="pa-big">' + fmtPct(p, 1) + '</p><p class="pa-say">Chance de ganar la serie según el Elo. Tomada como un Bo3, equivale a ' + fmtPct(m, 1) + ' por mapa; con esa chance, un Bo5 sería ' + fmtPct(series(5, m).pA, 1) + '.</p>';
  };
  A.addEventListener('change', duel); B.addEventListener('change', duel);
  el.querySelector('[data-rows]').addEventListener('click', e => { if (e.target.closest('[data-more]')) { more = true; draw(); } });
  el.querySelector('[data-sa]').addEventListener('change', e => { sa = e.target.checked; draw(); });
  el.querySelector('[data-q]').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); draw(); });
  draw(); duel();
}

const MODES = { event, champs, argentinos, latam, dotaelo };
for (const el of document.querySelectorAll('[data-fd]')) { const f = MODES[el.dataset.fd]; if (f) f(el).catch(() => fail(el)); }
