import { kdPlan, everyN, cleanName, PLACES } from '../../../engine/games/fnstats.mjs';
import { $, $$, data, out, params, setParams, share, fmt, fmtPct, parseNum, esc } from './kit.js';

const D = data();
const f = $('#pa-ft');
const TZ = 'America/Argentina/Buenos_Aires';
const EN = document.documentElement.lang === 'en';
const when = iso => new Intl.DateTimeFormat(EN ? 'en-GB' : 'es-AR', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
const slot = k => document.querySelector('[data-o="' + k + '"]');
const MODE_NAMES = { solo: 'Solo', duo: 'Dúo', squad: 'Escuadras' };

if (D && f) {
  const n = $('#ft-n'), v = $('#ft-v'), p = $('#ft-p'), w = $('#ft-w'), k = $('#ft-k');
  const box = $('.pa-ftout');
  let last = null, seq = 0;
  const optText = (sel, val) => { const o = [...sel.options].find(x => x.value === val); return o ? o.textContent : val; };
  const msg = html => { const el = out('ftmsg', html); if (el) el.hidden = !html; };
  const MSG = {
    bad_name: q => 'El nombre «' + esc(q) + '» no sirve: los nombres de Epic llevan de ' + D.min + ' a ' + D.max + ' caracteres (letras, números, espacio, punto, guion o guion bajo).',
    not_found: q => 'No hay ninguna cuenta de Epic con el nombre «' + esc(q) + '». Fijate cómo está escrito: tiene que ser el nombre de Epic, no el de PlayStation o Xbox.',
    private: q => 'La cuenta «' + esc(q) + '» existe, pero sus estadísticas son privadas. Si es tuya, más abajo te contamos cómo hacerlas públicas.',
    no_matches: q => '«' + esc(q) + '» no jugó ninguna partida en este período. Probá con «Desde siempre».',
    rate_ip: (q, s) => 'Hiciste muchas búsquedas seguidas: esperá ' + s + ' segundos y probá de nuevo (hasta ' + D.perMin + ' por minuto).',
    busy: (q, s) => 'Hay muchas búsquedas en este momento. Probá de nuevo en ' + s + ' segundos.',
    upstream: () => 'fortnite-api.com no responde ahora. Probá de nuevo en unos minutos.',
    net: () => 'No pudimos conectarnos. Revisá tu internet y probá de nuevo.',
  };
  const fail = (code, q, secs) => (MSG[code] || MSG.upstream)(q, secs || 30);

  async function ask(name) {
    const u = D.api + '?name=' + encodeURIComponent(name) + '&platform=' + encodeURIComponent(p.value) + '&window=' + encodeURIComponent(w.value);
    try {
      const r = await fetch(u, { headers: { Accept: 'application/json' } });
      const j = await r.json().catch(() => null);
      return j && typeof j.ok === 'boolean' ? j : { ok: false, error: 'upstream' };
    } catch (e) { return { ok: false, error: 'net' }; }
  }

  const hours = m => m / 60;
  const reset = () => {
    for (const c of $$('.pa-fts')) { c.querySelector('[data-v]').innerHTML = '—'; }
    out('ftmodes', ''); out('ftvs', '');
    slot('ftkd').hidden = true;
  };

  function cards(o) {
    for (const c of $$('.pa-fts')) {
      let val = '', say = '';
      switch (c.dataset.k) {
        case 'wins': {
          const e = everyN(o.wins, o.matches);
          val = fmt(o.wins, 0);
          say = o.wins > 0 ? 'Gana 1 de cada ' + fmt(e, e < 10 ? 1 : 0) + ' partidas.' : 'Todavía no ganó ninguna partida en este filtro.';
          break;
        }
        case 'winRate':
          val = fmtPct(o.winRate / 100, 1);
          say = fmt(o.winRate, 1) + ' de cada 100 partidas terminan con su victoria.';
          break;
        case 'kd':
          val = fmt(o.kd, 2);
          say = 'Elimina a ' + fmt(o.kd, 1) + ' rivales por cada vez que lo eliminan (' + fmt(o.kills, 0) + ' eliminaciones, ' + fmt(o.deaths, 0) + ' veces eliminado).';
          break;
        case 'kpm':
          val = fmt(o.killsPerMatch, 2);
          say = 'En una partida promedio saca a ' + fmt(o.killsPerMatch, 1) + ' rivales.';
          break;
        case 'matches':
          val = fmt(o.matches, 0);
          say = 'Partidas con ' + optText(p, p.value).toLowerCase() + ', ' + optText(w, w.value).toLowerCase() + '.';
          break;
        case 'time': {
          const hh = hours(o.minutesPlayed);
          val = fmt(hh, 0) + ' <small>h</small>';
          say = hh >= 48 ? 'Son unos ' + fmt(hh / 24, 0) + ' días enteros adentro de partidas.' : 'Horas adentro de partidas, sin menús ni esperas.';
          break;
        }
      }
      c.querySelector('[data-v]').innerHTML = val;
      c.querySelector('[data-s]').innerHTML = say;
    }
  }

  function modes(st) {
    const rows = ['solo', 'duo', 'squad'].filter(m => st[m] && st[m].matches > 0);
    if (!rows.length) { out('ftmodes', ''); return; }
    const place = m => PLACES[m].map(x => '<span class="pa-ftpl">' + fmt(st[m]['top' + x] || 0, 0) + ' <small>entre los ' + x + ' primeros</small></span>').join('');
    out('ftmodes', '<h3 class="pa-fth3">Por modo</h3><div class="pa-tw"><table class="pa-tb"><thead><tr><th>Modo</th><th class="pa-n">Partidas</th><th class="pa-n">Victorias</th><th class="pa-n">De cada 100</th><th class="pa-n">K/D</th><th class="pa-n">Elim. por partida</th><th>Puestos</th></tr></thead><tbody>' +
      rows.map(m => { const o = st[m]; return '<tr><td><b>' + MODE_NAMES[m] + '</b></td><td class="pa-n">' + fmt(o.matches, 0) + '</td><td class="pa-n">' + fmt(o.wins, 0) + '</td><td class="pa-n">' + fmtPct(o.winRate / 100, 1) + '</td><td class="pa-n">' + fmt(o.kd, 2) + '</td><td class="pa-n">' + fmt(o.killsPerMatch, 2) + '</td><td>' + place(m) + '</td></tr>'; }).join('') +
      '</tbody></table></div>');
  }

  function versus(a, b) {
    const A = a.stats.overall, B = b.stats.overall;
    const rows = [['Victorias', 'wins', 0], ['De cada 100 partidas', 'winRate', 1], ['K/D', 'kd', 2], ['Eliminaciones por partida', 'killsPerMatch', 2], ['Partidas', 'matches', 0], ['Horas jugadas', 'minutesPlayed', 0]];
    const cell = (x, y, d, key) => { const val = key === 'minutesPlayed' ? hours(x) : x; return '<td class="pa-n' + (x > y ? ' pa-ftwin' : '') + '">' + (key === 'winRate' ? fmtPct(val / 100, d) : fmt(val, d)) + (x > y ? ' <i aria-label="más alto">▲</i>' : '') + '</td>'; };
    out('ftvs', '<h3 class="pa-fth3">' + esc(a.name) + ' contra ' + esc(b.name) + '</h3><div class="pa-tw"><table class="pa-tb pa-ftvt"><thead><tr><th></th><th class="pa-n">' + esc(a.name) + '</th><th class="pa-n">' + esc(b.name) + '</th></tr></thead><tbody>' +
      rows.map(([label, key, d]) => '<tr><td>' + label + '</td>' + cell(A[key], B[key], d, key) + cell(B[key], A[key], d, key) + '</tr>').join('') +
      '</tbody></table></div><p class="pa-src">▲ marca el número más alto de los dos. Un jugador con muchas más partidas suele tener números más parejos: compará también cuánto jugó cada uno.</p>');
  }

  function kdCalc() {
    if (!last) return;
    const o = last.stats.overall, target = parseNum(k.value);
    out('ftkdnow', 'K/D ' + fmt(o.kd, 2) + ' · ' + fmt(o.killsPerMatch, 1) + ' eliminaciones por partida');
    if (!(target > 0 && target < 100)) { out('ftkdsay', 'Poné un K/D mayor que 0, por ejemplo ' + fmt(2, 1) + '.'); return; }
    const r = kdPlan({ kills: o.kills, deaths: o.deaths, killsPerMatch: o.killsPerMatch, target });
    if (!r.need) { out('ftkdsay', 'Ya tiene un K/D de ' + fmt(o.kd, 2) + ': está en ' + fmt(target, 2) + ' o más.'); return; }
    out('ftkdsay', 'Le faltan <b>' + fmt(r.need, 0) + ' eliminaciones</b> sin que lo eliminen. ' + (Number.isFinite(r.matches)
      ? 'A su ritmo de ' + fmt(o.killsPerMatch, 1) + ' por partida, perdiendo cada una, son unas <b>' + fmt(r.matches, 0) + ' partidas</b>.'
      : 'Con ' + fmt(o.killsPerMatch, 1) + ' por partida no llega nunca si lo eliminan en cada una: tiene que sacar más de ' + fmt(target, 1) + ' por partida o ganar más.'));
  }

  async function run(push = true) {
    const qa = n.value, qb = v.value.trim();
    const a = cleanName(qa), b = qb ? cleanName(qb) : '';
    const my = ++seq;
    msg('');
    if (!a) { reset(); msg(fail('bad_name', qa.trim())); n.focus(); return; }
    if (b === null) { reset(); msg(fail('bad_name', qb)); v.focus(); return; }
    box.setAttribute('aria-busy', 'true');
    out('ftname', esc(a) + (b ? ' <small>y ' + esc(b) + '</small>' : ''));
    out('ftmeta', 'Buscando…');
    const [ra, rb] = await Promise.all([ask(a), b ? ask(b) : Promise.resolve(null)]);
    if (my !== seq) return;
    box.setAttribute('aria-busy', 'false');
    if (push) setParams({ n: a, vs: b || '', p: p.value === 'all' ? '' : p.value, w: w.value === 'lifetime' ? '' : w.value });
    slot('ftshare').hidden = false;
    out('copied', '');
    if (!ra.ok) { last = null; reset(); out('ftname', esc(a)); out('ftmeta', ''); msg(fail(ra.error, a, ra.retryAfter)); return; }
    if (!ra.stats || !ra.stats.overall) {
      last = null; reset(); out('ftname', esc(ra.name)); out('ftmeta', '');
      const other = $$('option', p).filter(o => ra.has && ra.has[o.value]).map(o => o.textContent.toLowerCase());
      msg('«' + esc(ra.name) + '» no tiene partidas con ' + esc(optText(p, p.value).toLowerCase()) + ' en este período.' + (other.length ? ' Sí tiene con: ' + esc(other.join(', ')) + '.' : ''));
      return;
    }
    last = ra;
    const o = ra.stats.overall;
    out('ftname', esc(ra.name));
    out('ftmeta', [ra.bp ? 'Pase de batalla de esta temporada: nivel ' + fmt(ra.bp.level, 0) : '', o.last ? 'última partida registrada: ' + when(o.last) + ' (hora argentina)' : '', 'datos de fortnite-api.com, consultados ' + when(ra.at)].filter(Boolean).join(' · '));
    cards(o);
    modes(ra.stats);
    slot('ftkd').hidden = false;
    kdCalc();
    if (b) {
      if (!rb.ok) { out('ftvs', ''); msg(fail(rb.error, b, rb.retryAfter)); }
      else if (!rb.stats || !rb.stats.overall) { out('ftvs', ''); msg('«' + esc(rb.name) + '» no tiene partidas con ' + esc(optText(p, p.value).toLowerCase()) + ' en este período.'); }
      else versus(ra, rb);
    } else out('ftvs', '');
  }

  f.addEventListener('submit', e => { e.preventDefault(); run(); });
  p.addEventListener('change', () => { if (n.value.trim()) run(); });
  w.addEventListener('change', () => { if (n.value.trim()) run(); });
  k.addEventListener('input', kdCalc);
  share();
  const q = params();
  if (q.get('p') && $$('option', p).some(o => o.value === q.get('p'))) p.value = q.get('p');
  if (q.get('w') && $$('option', w).some(o => o.value === q.get('w'))) w.value = q.get('w');
  if (q.get('vs')) v.value = q.get('vs').slice(0, D.max);
  if (q.get('n')) { n.value = q.get('n').slice(0, D.max); run(false); }
}
