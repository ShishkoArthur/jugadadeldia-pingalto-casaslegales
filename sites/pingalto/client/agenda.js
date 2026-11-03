import { esc, load, stale, stamp, fail, arDay, arTime, dayName, today } from './fdkit.js';

const MAX_AGE = 4;
const ST = { running: 'En vivo', postponed: 'Postergado', finished: 'Final' };
const team = (t, win) => '<span class="pa-fdtm' + (win ? ' pa-fdwin' : '') + '">' + esc(t.a && t.n.length > 18 ? t.a : t.n) + (t.loc === 'AR' ? ' <i class="pa-fdar" title="Equipo de Argentina">AR</i>' : '') + '</span>';
function row(m, gname, showGame, withDay) {
  const t = m.teams.length ? m.teams : [{ n: 'A definir' }, { n: 'A definir' }];
  const sc = m.st === 'running' || m.st === 'finished' ? '<b class="pa-fdsc">' + m.score.join(' - ') + '</b>' : '<span class="pa-fdvs">vs</span>';
  const dd = withDay && m.at && arDay(m.at) !== today() ? '<span>' + esc(dayName(arDay(m.at))) + '</span><br>' : '';
  const when = m.st === 'running' ? '<span class="pa-fdlive">' + ST.running + '</span>' : m.at ? dd + '<time datetime="' + esc(m.at) + '">' + arTime(m.at) + '</time>' : '<span>a confirmar</span>';
  const meta = [showGame ? gname : '', m.lg, m.se || m.tn, m.bo ? (m.type === 'best_of' ? 'Bo' + m.bo : m.bo + ' mapas') : '', m.st === 'postponed' ? ST.postponed : '', m.resched && m.st === 'not_started' ? 'reprogramado' : ''].filter(Boolean).map(esc).join(' · ');
  const tv = m.tv && m.st !== 'finished' ? ' <a class="pa-fdtv" href="' + esc(m.tv.url) + '" rel="noopener">Ver' + (m.tv.lang === 'es' ? ' en español' : '') + '</a>' : '';
  return '<li class="pa-fdm' + (m.ar ? ' pa-fdmar' : m.latam ? ' pa-fdmla' : '') + '"><div class="pa-fdh">' + when + '</div><div class="pa-fdb"><div class="pa-fdtt">' + team(t[0], m.win === 0) + sc + team(t[1] || { n: 'A definir' }, m.win === 1) + '</div><small>' + meta + tv + '</small></div></li>';
}
const list = (items, names, showGame, withDay) => '<ol class="pa-fdl">' + items.map(m => row(m, names[m.g], showGame, withDay)).join('') + '</ol>';

async function agenda(el) {
  const doc = await load(el.dataset.fdSrc, 'agenda');
  const d = doc.data, names = Object.fromEntries(d.games.map(g => [g.k, g.name]));
  const only = el.dataset.fdG || '', n = Number(el.dataset.fdN) || 0;
  const tabs = document.querySelectorAll('[data-fd-tab]');
  let g = only;
  const draw = () => {
    if (stale(doc, MAX_AGE)) { el.innerHTML = stamp(doc, MAX_AGE); return; }
    const all = d.matches.filter(m => !g || m.g === g);
    const now = Date.now(), t = today();
    const live = all.filter(m => m.st === 'running');
    const up = all.filter(m => m.st === 'not_started' || m.st === 'postponed').filter(m => !m.at || Date.parse(m.at) > now - 3 * 3600e3);
    const done = all.filter(m => m.st === 'finished').sort((a, b) => (b.end || b.at || '') < (a.end || a.at || '') ? -1 : 1);
    let html = stamp(doc, MAX_AGE);
    if (n) {
      const next = [...live, ...up].slice(0, n);
      html += next.length ? list(next, names, false, true) : '<p>No hay partidos de primera línea cargados para los próximos días.</p>';
      el.innerHTML = html; return;
    }
    const ar = [...live, ...up, ...done].filter(m => m.ar);
    if (ar.length) html += '<h3 class="pa-fdh3">Con equipos argentinos</h3>' + list(ar.slice(0, 12), names, !g, true);
    if (live.length) html += '<h3 class="pa-fdh3">En vivo</h3>' + list(live, names, !g);
    const byDay = {};
    for (const m of up) { const k = m.at ? arDay(m.at) : 'tbd'; (byDay[k] = byDay[k] || []).push(m); }
    for (const k of Object.keys(byDay).sort()) html += '<h3 class="pa-fdh3">' + (k === 'tbd' ? 'Fecha a confirmar' : k === t ? 'Hoy, ' + dayName(k) : dayName(k)) + '</h3>' + list(byDay[k], names, !g);
    if (!live.length && !up.length) html += '<p>No hay partidos de primera línea cargados para los próximos días en este juego.</p>';
    if (done.length) html += '<h3 class="pa-fdh3">Resultados recientes</h3>' + list(done.slice(0, 20), names, !g, true);
    el.innerHTML = html;
  };
  tabs.forEach(b => b.addEventListener('click', () => { g = b.dataset.fdTab; tabs.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); draw(); }));
  draw();
}
for (const el of document.querySelectorAll('[data-fd="agenda"]')) agenda(el).catch(() => fail(el));
