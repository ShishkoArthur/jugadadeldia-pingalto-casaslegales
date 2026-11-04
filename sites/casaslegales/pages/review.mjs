// The review part of /operador/<slug> and the casino page /operador/<slug>/casino: what the operator's own public pages
// say (data/sources/reviews/<brand>.json, verified), section by section, each fact with its verbatim quote, URL and date.
// The summary card is computed from those facts and the registries; a section without data says so in one line.
// No ratings, no bonuses, no promotions: the page reports what the site shows and links only to the address of the official list.
import { margin } from '../../../engine/odds.mjs';
import { hostKey } from '../../../engine/registry.mjs';
import { fmtInt, addDays } from '../../../engine/format.mjs';
import { sectionHead, officialLinks } from './parts.mjs';
import { anat } from './opparts.mjs';
import { isAbsence, REVIEW_MAX_AGE } from '../../../tools/lib/revsources.mjs';

// field -> label (es-AR) and how its value shows: chips (items checked against the copy), yes, money, count or quote only
const F = {
  'site.about': ['Cómo se presenta', 'quote'],
  'site.games': ['Juegos de su portada', 'chips'],
  'licence.footer': ['Licencia según el pie del sitio', 'licence'],
  'account.provinceRestriction': ['Solo para una provincia', 'quote'],
  'account.kyc': ['Verificación de identidad', 'quote'],
  'account.age': ['Edad mínima', 'quote'],
  'account.documents': ['Documentos que pide', 'quote'],
  'account.registration': ['Registro', 'quote'],
  'payments.depositMethods': ['Medios para depositar', 'chips'],
  'payments.withdrawalMethods': ['Medios para retirar', 'chips'],
  'payments.minDeposit': ['Depósito mínimo', 'money'],
  'payments.maxDeposit': ['Depósito máximo', 'money'],
  'payments.minWithdrawal': ['Retiro mínimo', 'money'],
  'payments.maxWithdrawal': ['Retiro máximo', 'money'],
  'payments.currency': ['Moneda', 'quote'],
  'payments.withdrawalTimes': ['Plazos de retiro', 'quote'],
  'payments.depositTimes': ['Plazos de depósito', 'quote'],
  'payments.fees': ['Comisiones', 'quote'],
  'support.channels': ['Canales de contacto', 'quote'],
  'support.email': ['Correo electrónico', 'quote'],
  'support.phone': ['Teléfono', 'quote'],
  'support.chat': ['Chat', 'quote'],
  'support.responseTime': ['Tiempo de respuesta', 'quote'],
  'support.whatsapp': ['WhatsApp', 'quote'],
  'account.minAge': ['Edad mínima', 'quote'],
  'account.residence': ['Residencia', 'quote'],
  'account.verificationTime': ['Plazo de verificación', 'quote'],
  'account.closure': ['Cierre de cuenta', 'quote'],
  'account.oneAccount': ['Una cuenta por persona', 'quote'],
  'payments.methods': ['Medios de pago', 'quote'],
  'payments.withdrawalTime': ['Plazo de retiro', 'quote'],
  'payments.limits': ['Límites de pago', 'quote'],
  'payments.limitsPublished': ['Límites de depósito y retiro', 'quote'],
  'payments.withdrawalConditions': ['Condiciones para retirar', 'quote'],
  'payments.depositTime': ['Plazo de depósito', 'quote'],
  'payments.methodsPage': ['Página de medios de pago', 'quote'],
  'sportsbook.markets': ['Mercados', 'quote'],
  'sportsbook.liveCount': ['Eventos en vivo', 'quote'],
  'sportsbook.virtuals': ['Deportes virtuales', 'yes'],
  'casino.liveProviders': ['Proveedores del casino en vivo', 'quote'],
  'casino.liveGames': ['Juegos en vivo', 'quote'],
  'casino.rtpPublished': ['Publica el RTP', 'quote'],
  'casino.gameCount': ['Cantidad de juegos', 'quote'],
  'casino.slots': ['Tragamonedas', 'yes'],
  'casino.volatilityFilter': ['Filtro por volatilidad', 'quote'],
  'licence.claimed': ['Licencia que declara el sitio', 'quote'],
  'licence.age': ['Edad que declara el sitio', 'quote'],
  'casino.searchByProvider': ['Búsqueda por proveedor', 'quote'],
  'casino.jackpotFilter': ['Filtro de pozos', 'quote'],
  'casino.bingo': ['Bingo', 'yes'],
  'casino.poker': ['Póker', 'yes'],
  'app.store': ['Tiendas de apps', 'quote'],
  'app.apk': ['Archivo APK', 'quote'],
  'app.download': ['Descarga', 'quote'],
  'support.hours': ['Horario', 'quote'],
  'support.language': ['Idioma', 'quote'],
  'support.helpCenter': ['Centro de ayuda', 'quote'],
  'sportsbook.sports': ['Deportes en su lista A-Z', 'sports'],
  'sportsbook.exists': ['Apuestas deportivas', 'yes'],
  'sportsbook.live': ['Apuestas en vivo', 'yes'],
  'sportsbook.streaming': ['Transmisiones en vivo', 'yes'],
  'sportsbook.cashout': ['Cierre de apuesta (cash out)', 'yes'],
  'sportsbook.betBuilder': ['Apuesta combinada en un partido', 'yes'],
  'sportsbook.marketsOneMatch': ['Mercados en un partido', 'markets'],
  'sportsbook.odds1x2': ['Cuotas 1X2 que copiamos', 'odds'],
  'sportsbook.esports': ['Esports', 'yes'],
  'casino.exists': ['Sección de casino', 'yes'],
  'casino.live': ['Casino en vivo', 'yes'],
  'casino.providers': ['Proveedores en su filtro', 'providers'],
  'casino.categories': ['Categorías del casino', 'categories'],
  'casino.rtp': ['Retorno al jugador (RTP)', 'quote'],
  'casino.games': ['Cantidad de juegos', 'quote'],
  'app.mentioned': ['El sitio menciona una app', 'yes'],
  'app.android': ['App para Android', 'quote'],
  'app.ios': ['App para iPhone', 'quote'],
  'app.page': ['Página de la app', 'quote'],
};
const LABEL_RG = { limits: 'Límites de juego', sessionLimit: 'Límite de tiempo de sesión', pauseSelfExclusion: 'Pausa y autoexclusión', provincialProgramme: 'Programa de autoexclusión de la provincia', realityCheck: 'Aviso de tiempo de juego', depositLimit: 'Límite de depósito', lossLimit: 'Límite de pérdida', wagerLimit: 'Límite de apuesta', selfTest: 'Test de autoevaluación', helpLines: 'Líneas de ayuda', minors: 'Protección de menores', history: 'Historial de juego', cooling: 'Pausa (tiempo fuera)', deposit: 'Límite de depósito', loss: 'Límite de pérdida', bet: 'Límite de apuesta', time: 'Límite de tiempo', session: 'Límite de sesión', pause: 'Pausa (tiempo fuera)', timeout: 'Pausa (tiempo fuera)', selfex: 'Autoexclusión', selfExclusion: 'Autoexclusión', reality: 'Aviso de tiempo de juego', test: 'Test de autoevaluación', help: 'Ayuda y líneas', age: 'Solo mayores de 18', tools: 'Herramientas' };
const labelOf = field => {
  if (F[field]) return F[field][0];
  const m = /^rg\.(.+)$/.exec(field);
  if (m) { const k = m[1].replace(/Limit$/, ''); if (LABEL_RG[k] || LABEL_RG[m[1]]) return LABEL_RG[k] || LABEL_RG[m[1]]; }
  return null;
};
const warned = new Set();
const known = f => { if (labelOf(f.field)) return true; if (!warned.has(f.field)) { warned.add(f.field); console.log('review: field ' + f.field + ' has no label in pages/review.mjs - not shown'); } return false; };
const modeOf = field => (F[field] || [null, 'quote'])[1];
const NON_SPORT = new Set(['Mercados Especiales', 'Película']);
const PROMO = /\btop ?\d+|torneo|reward|drop|bono|bonus|promo|gratis|jackpot|zaira|exclusiv/i;
const CTA = /jug[aá] ahora|apost[aá] ahora|apost[aá] ya|registrate|reg[ií]strate|depositá/i;
export const SECTIONS = [
  ['sitio', 'Qué es el sitio', 'site'],
  ['deportes', 'Deportes y mercados', 'sportsbook'],
  ['casino', 'Casino', 'casino'],
  ['app', 'App', 'app'],
  ['pagos', 'Pagos y retiros', 'payments'],
  ['cuenta', 'Cuenta y verificación', 'account'],
  ['atencion', 'Atención al cliente', 'support'],
  ['juego-responsable', 'Juego responsable', 'rg'],
];
const pct = x => (x * 100).toFixed(1).replace('.', ',') + ' %';
const odd = x => x.toFixed(2).replace('.', ',');

// the saved copies write links and images as [link "text" -> url] and [alt text]: on the page the quote shows what a visitor reads
export const readable = q => String(q).replace(/\s*(?:\||->)\s*https?:\/\/\S+/g, '').replace(/\s*\[(?:\.\.\.|…)\]\s*/g, ' \u2026 ').replace(/\[link "([^"]*)" -> [^\]]*\]/g, '$1').replace(/\[[^\]]*\blogo\b[^\]]*\]\s*/gi, '').replace(/\[([^\]]{1,60})\]/g, '$1').replace(/\s+/g, ' ').trim();
const decodePath = p => { try { return decodeURIComponent(p); } catch (e) { return p; } };
export function cite(h, R, f) {
  const d = R.doc(f.doc), u = new URL(d.url), where = hostKey(d.url) + (u.pathname === '/' ? '' : decodePath(u.pathname.replace(/\/$/, '')));
  const tail = '<span class="rl-host">' + h.esc(where) + '</span> · copia del ' + h.fmtDate(d.date);
  if (f.quote == null && isAbsence(f.value)) return '<p class="rl-src">Lo buscamos en ' + tail + '</p>';
  const txt = readable(f.quote);
  if (CTA.test(f.quote) || !txt || /^\[/.test(txt)) return '<p class="rl-src">Lo vimos en ' + tail + '</p>';
  return '<blockquote class="rl-q">«' + h.esc(txt).replace(/@/g, '<span>@</span>') + '»<cite>' + tail + '</cite></blockquote>';
}
const chipRow = (h, items) => '<div class="rl-chips rl-chips-s">' + items.map(x => '<span>' + h.esc(x) + '</span>').join('') + '</div>';
const chips = (h, items, what = 'todos') => items.length <= 12 ? chipRow(h, items) : chipRow(h, items.slice(0, 10)) + '<details class="rl-more"><summary>Ver ' + (what === 'todos' ? 'los ' + items.length : what) + '</summary>' + chipRow(h, items.slice(10)) + '</details>';
export function sportsOf(R) {
  const f = R.one('sportsbook.sports');
  if (!f) return null;
  const names = f.value && (f.value.names || f.value);
  if (!Array.isArray(names) || !R.found(f, names)) return null;
  const sports = names.filter(n => !NON_SPORT.has(n));
  return { f, names, sports, other: names.filter(n => NON_SPORT.has(n)) };
}
export function providersOf(R) {
  const f = R.one('casino.providers');
  const names = f && f.value && (f.value.names || f.value);
  return f && Array.isArray(names) && R.found(f, names) ? { f, names } : null;
}
export function marginOf(R) {
  const f = R.one('sportsbook.odds1x2');
  if (!f) return null;
  const rows = ((f.value || {}).matches || []).filter(m => Array.isArray(m.odds) && m.odds.length >= 2 && R.found(f, [m.home, m.away]) && R.oddsFound(f, m.odds)).map(m => ({ ...m, m: margin(m.odds).margin }));
  if (!rows.length) return null;
  const avg = rows.reduce((a, r) => a + r.m, 0) / rows.length;
  return { f, rows, avg, min: Math.min(...rows.map(r => r.m)), max: Math.max(...rows.map(r => r.m)), date: R.doc(f.doc).date };
}
function moneyOf(R, f) {
  const v = f.value;
  if (!v || typeof v !== 'object' || !Number.isInteger(v.amount)) return null;
  const s = fmtInt(v.amount) + ' ' + v.currency;
  if (!f.quote || (!f.quote.includes(fmtInt(v.amount)) && !f.quote.includes(String(v.amount)))) return null;
  return s;
}

function valueHtml(h, R, f) {
  const mode = modeOf(f.field);
  if (f.quote == null && isAbsence(f.value)) return '<b class="rl-fno">No lo encontramos en esa página</b>';
  if (mode === 'chips') {
    const off = /([A-Za-zÁÉÍÓÚáéíóúñ ]+) -> (https?:\/\/[^\s\]·|]+)/.exec(f.quote || ''), site = hostKey(R.doc(f.doc).url);
    if (!Array.isArray(f.value) && off && hostKey(off[2]) !== site && !hostKey(off[2]).endsWith('.' + site)) return '<p>En su página, el enlace «' + h.esc(off[1].trim().replace(/^Link targets: /, '')) + '» lleva a <span class="rl-host">' + h.esc(new URL(off[2]).hostname) + '</span>, fuera de ' + h.esc(site) + ': un formulario externo, que no abrimos. No cargues datos en formularios que no estén en la dirección de la lista.</p>';
    const items = Array.isArray(f.value) ? f.value : f.value && Array.isArray(f.value.names) ? f.value.names : null;
    return items && R.found(f, items) ? chips(h, items) : '';
  }
  if (mode === 'yes') return f.value === true ? '<b class="rl-fyes">Sí</b>' : f.value === false ? '<b>No</b>' : '';
  if (mode === 'money') { const s = moneyOf(R, f); return s ? '<b class="rl-fnum">' + h.esc(s) + '</b>' : ''; }
  if (mode === 'sports') { const s = sportsOf(R); if (!s || s.f !== f) return ''; return '<b class="rl-fnum">' + s.sports.length + ' deportes</b>' + chips(h, s.sports) + (s.other.length ? '<p class="rl-src">La lista trae ' + s.names.length + ' entradas: no contamos como deporte ' + s.other.map(x => '«' + h.esc(x) + '»').join(' ni ') + '.</p>' : ''); }
  if (mode === 'providers') { const p = providersOf(R); if (!p || p.f !== f) return ''; return '<b class="rl-fnum">' + p.names.length + ' proveedores</b>' + chips(h, p.names); }
  if (mode === 'categories') { if (!Array.isArray(f.value) || !R.found(f, f.value)) return ''; const all = f.value, kept = all.filter(x => !PROMO.test(x)); return '<b class="rl-fnum">' + all.length + ' categorías</b>' + chips(h, kept) + (kept.length < all.length ? '<p class="rl-src">No listamos ' + (all.length - kept.length) + ' categorías que son promociones o rankings del propio sitio.</p>' : ''); }
  if (mode === 'markets') { const v = f.value || {}; if (!Number.isInteger(v.markets)) return ''; const seen = R.found(f, String(v.match).split(/\s+vs\.?\s+/i)); return '<b class="rl-fnum">' + fmtInt(v.markets) + ' mercados</b><p>' + (seen ? h.esc(v.match.replace(/\s+vs\.?\s+/i, ' – ')) + (v.competition && R.found(f, [v.competition]) ? ' · ' + h.esc(v.competition) : '') + '. ' : '') + 'Contamos los títulos de mercado de la página de ese partido, el ' + h.fmtDate(R.doc(f.doc).date) + '.</p>'; }
  if (mode === 'licence') { const v = f.value || {}; if (!v.operator || !R.found(f, [v.operator, v.act].filter(Boolean))) return ''; return '<p><b>' + h.esc(v.operator) + '</b>' + (v.act ? '<br><span class="rl-host">' + h.esc(v.act) + '</span>' : '') + '</p>'; }
  return '';
}
// one item per field, in the order of F; when two pages say it, both show, each with its source
const HIDE = new Set(['payments.currency']);
const ORDER = Object.keys(F);
const rank = f => { const i = ORDER.indexOf(f.field); return (f.quote == null && isAbsence(f.value) ? 2000 : 0) + (i < 0 ? 999 : i); };
function factList(h, R, facts) {
  const fields = [...new Set(facts.filter(f => !HIDE.has(f.field) && known(f)).sort((a, b) => rank(a) - rank(b)).map(f => f.field))];
  return '<dl class="rl-fl">' + fields.map(k => '<div class="rl-fi"><dt>' + h.esc(labelOf(k)) + '</dt><dd>' + facts.filter(f => f.field === k).map(f => '<div class="rl-fv">' + valueHtml(h, R, f) + cite(h, R, f) + '</div>').join('') + '</dd></div>').join('') + '</dl>';
}
const none = (h, why) => '<p class="rl-sd"><b>Sin dato:</b> ' + h.esc(why) + '</p>';
export const SIN = 'no lo guardamos de sus páginas públicas vistas desde Argentina';

function marginBlock(h, R, M) {
  if (!M) return '';
  const rows = M.rows.map(r => '<tr><th scope="row">' + h.esc(r.home + ' – ' + r.away) + '</th>' + r.odds.map(o => '<td>' + odd(o) + '</td>').join('') + '<td><b>' + pct(r.m) + '</b></td></tr>').join('');
  return '<div class="rl-box rl-mgb"><h3>Margen medido: ' + pct(M.avg) + '</h3><p>Promedio de ' + M.rows.length + ' partidos de la Liga Profesional, mercado 1X2, con las cuotas que mostraba el sitio el ' + h.fmtDate(M.date) + '. El margen es lo que suma la casa por encima del 100 % en las probabilidades de las tres opciones: cuanto más bajo, más se acercan las cuotas a las justas. Va de ' + pct(M.min) + ' a ' + pct(M.max) + ' según el partido.</p>' +
    '<div class="rl-scroll"><table class="rl-reg rl-mg"><thead><tr><th scope="col">Partido</th><th scope="col">1</th><th scope="col">X</th><th scope="col">2</th><th scope="col">Margen</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    cite(h, R, M.f) + (h.built('/calculadora/margen') ? '<p class="rl-note"><a href="' + h.href('/calculadora/margen') + '">Calculá el margen de cualquier cuota</a></p>' : '') + '</div>';
}

export function reviewSection(h, R, [id, title, prefix], extra = {}) {
  const facts = R.pre(prefix).filter(f => f.field !== 'sportsbook.odds1x2' && known(f));
  const M = prefix === 'sportsbook' ? marginOf(R) : null;
  const add = extra[id] || '';
  const body = (facts.length ? factList(h, R, facts) : '') + (M ? marginBlock(h, R, M) : '') + add;
  if (!body && extra.skipEmpty) return '';
  return '<section class="rl-sec" id="' + id + '">' + sectionHead(h, title, facts.length || M ? 'de sus páginas públicas, con cita y fecha' : '') + (body || none(h, extra.why && extra.why[id] || SIN)) + '</section>';
}

// the summary card: facts only, each computed from the data above (or "sin dato")
export function summary(h, R, { lists, total, rgCount, casinoPath, missingLink }) {
  const S = sportsOf(R), P = providersOf(R), M = marginOf(R);
  const deps = R.all('payments.depositMethods'), dep = deps.filter(f => Array.isArray(f.value) && R.found(f, f.value)).sort((a, b) => b.value.length - a.value.length)[0], live = R.one('sportsbook.live');
  const real = f => f && !isAbsence(f.value) && f.value !== false;
  const cas = [R.one('casino.exists'), R.one('casino.live'), P && P.f].find(real);
  const app = R.pre('app').find(real);
  // withdrawal times as the pages write them ("Hasta 24 horas hábiles", "1-4 horas", "1-2 días laborables"): the shortest upper bound
  const DUR = /(hasta\s+)?(\d+(?:\s*-\s*\d+)?)\s*(minutos?|horas?(?:\s+h[aá]biles)?|d[ií]as?(?:\s+(?:h[aá]biles|laborables))?)/gi;
  const hours = (n, u) => +String(n).split('-').pop().trim() * (/^h/i.test(u) ? 1 : /^m/i.test(u) ? 1 / 60 : 24);
  const wtTxt = R.all('payments.withdrawalTimes').filter(f => f.quote).flatMap(f => [...readable(f.quote).matchAll(DUR)].map(m => ({ txt: m[0].trim().toLowerCase(), h: hours(m[2], m[3]) }))).sort((a, b) => a.h - b.h).map(x => x.txt);
  const t = (k, v, sub, href) => v === null ? { none: k } : { html: '<div class="rl-rsi"><span>' + h.esc(k) + '</span><b>' + h.esc(v) + '</b>' + (sub ? '<small>' + (href ? '<a href="' + href + '">' + h.esc(sub) + '</a>' : h.esc(sub)) + '</small>' : '') + '</div>' };
  const tiles = [
    t('Listas oficiales', lists + ' de ' + total, 'que revisamos la nombran', '#licencias'),
    t('Deportes', S ? String(S.sports.length) : null, S ? 'en su lista A-Z' : SIN, S ? '#deportes' : ''),
    t('Apuestas en vivo', live ? (live.value ? 'Sí' : 'No') : null, live ? 'según su página' : SIN),
    t('Casino', cas ? 'Sí' : null, cas ? (P ? P.names.length + ' proveedores' : 'sección propia') : SIN, cas ? (casinoPath && h.built(casinoPath) ? h.href(casinoPath) : '#casino') : ''),
    t('App', app ? 'Mencionada' : null, app ? 'en su sitio' : SIN, app ? '#app' : ''),
    t('Medios de pago', dep ? String(dep.value.length) : deps.length ? 'Publicados' : null, dep ? 'para depositar, en la lista más larga que publica' : deps.length ? 'ver la cita en pagos' : SIN, deps.length ? '#pagos' : ''),
    t('Retiro', wtTxt.length ? wtTxt[0] : null, wtTxt.length ? 'el plazo más corto que publica' : SIN, wtTxt.length ? '#pagos' : ''),
    t('Juego responsable', rgCount ? String(rgCount) : null, rgCount ? (rgCount === 1 ? 'herramienta citada' : 'herramientas citadas') : SIN, rgCount ? '#juego-responsable' : ''),
    t('Margen medido', M ? pct(M.avg) : null, M ? '1X2, ' + M.rows.length + ' partidos, ' + h.fmtDate(M.date) : 'no copiamos cuotas', M ? '#deportes' : ''),
  ];
  const miss = tiles.filter(x => x.none).map(x => x.none.toLowerCase());
  return '<section class="rl-sec" id="resumen">' + sectionHead(h, 'Resumen', 'solo datos, sin puntaje') + '<div class="rl-rs">' + tiles.filter(x => x.html).map(x => x.html).join('') + '</div>' +
    (miss.length ? '<p class="rl-cap"><b>Sin dato:</b> ' + h.esc(miss.length < 2 ? miss.join('') : miss.slice(0, -1).join(', ') + ' y ' + miss.at(-1)) + '. No lo vimos en las páginas públicas que guardamos' + (missingLink ? ' (<a href="#sin-ver">por qué</a>)' : '') + '.</p>' : '') +
    '<p class="rl-cap">Cada número sale de una página pública del operador o de una lista oficial, con su cita más abajo. No ponemos notas ni puntajes: no abrimos cuentas ni probamos depósitos o retiros.' + dataDate(h, R) + '</p></section>';
}
// when the review data were copied and when they are copied again (REVIEW_MAX_AGE: the owner collects them every half year)
export function dataDate(h, R) {
  const ds = [...Object.values(R.r.docs || {}).map(d => d.date), ...(R.r.shots || []).map(x => x.date)].filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d || '')).sort();
  if (!ds.length) return '';
  const max = R.r.maxAgeDays || REVIEW_MAX_AGE;
  return ' Copiamos estas páginas ' + (ds[0] === ds.at(-1) ? 'el ' + h.fmtDate(ds[0]) : 'entre el ' + h.fmtDate(ds[0]) + ' y el ' + h.fmtDate(ds.at(-1))) + ' y las volvemos a copiar como máximo cada ' + max + ' días: próxima revisión antes del ' + h.fmtDate(addDays(ds[0], max)) + '.';
}
export function toc(h, extra = [], only = null) {
  const items = [['resumen', 'Resumen'], ['ingresar', 'Sitio oficial'], ...SECTIONS.filter(([id]) => !only || only.includes(id)).map(([id, t]) => [id, t]), ['licencias', 'Licencias'], ...extra];
  return '<nav class="rl-toc" aria-label="En esta reseña">' + items.map(([id, t]) => '<a href="#' + id + '">' + h.esc(t) + '</a>').join('') + '</nav>';
}
export function reviewShots(h, R, label) {
  return R.shots.map(s => {
    const u = new URL(s.url);
    const name = h.names[R.brand];
    return '<figure class="rl-shot"><div class="rl-shot-bar"><i></i><i></i><i></i><span>' + h.esc(hostKey(s.url) + (u.pathname === '/' ? '' : decodePath(u.pathname))) + '</span></div>' +
      '<img src="' + h.asset('shots/' + s.name) + '" width="' + s.width + '" height="' + s.height + '" loading="lazy" decoding="async" alt="' + h.esc(label(s.view) + ' de ' + name + ', vista desde Argentina') + '">' +
      '<figcaption><b>' + h.esc(label(s.view)) + '</b> Captura propia de la página pública, desde Argentina, sin cuenta · ' + h.fmtDate(s.date) + '</figcaption></figure>';
  }).join('');
}
export const VIEW_LABEL = { 'age-gate': 'Aviso de mayoría de edad', home: 'Página de inicio', sportsbook: 'Apuestas deportivas', 'match-markets': 'Mercados de un partido', casino: 'Casino', 'live-casino': 'Casino en vivo', payments: 'Medios de pago', rg: 'Juego responsable', app: 'App', support: 'Atención al cliente', footer: 'Pie de página' };
export const viewLabel = v => VIEW_LABEL[v] || 'Página pública';

// "Cómo entrar al sitio oficial" (login intent): the address each list names, a button to it, how to tell it from a copy. We never
// link a login page and never log in: the official address is enough to find the site's own "Ingresar" button.
export function enterSection(h, R, o, row) {
  const jurs = h.regs.filter(r => row.cells[r.id]);
  const hosts = [...new Set(jurs.map(r => row.cells[r.id].host))];
  const only = R ? R.all('account.provinceRestriction') : [];
  const items = jurs.map(r => '<li><span class="rl-tag">' + h.esc(r.id === 'buenos-aires' ? 'PBA' : r.id === 'caba' ? 'CABA' : h.rg.prov(r.id).name) + '</span>' + anat(h, row.cells[r.id].host) + '</li>').join('');
  const ing = '/operador/' + o.slug + '/ingresar';
  if (h.built(ing)) {
    return '<section class="rl-sec" id="ingresar">' + sectionHead(h, 'Cómo entrar al sitio oficial de ' + row.name, hosts.length === 1 ? 'una sola dirección en las listas' : hosts.length + ' direcciones en ' + jurs.length + ' listas') +
      '<div class="rl-box"><ul class="rl-enter rl-enter-s">' + items + '</ul>' + officialLinks(h, o.brand, jurs.map(r => r.id), { note: false, small: true }) +
      '<p>Entrá con la dirección de la provincia donde estás: el botón para ingresar a tu cuenta está en ese sitio. <a href="' + h.href(ing) + '">Cómo iniciar sesión en ' + h.esc(row.name) + ' paso a paso: tu provincia, la app, la contraseña y cómo no caer en copias</a></p></div></section>';
  }
  return '<section class="rl-sec" id="ingresar">' + sectionHead(h, 'Cómo entrar al sitio oficial de ' + row.name, hosts.length === 1 ? 'una sola dirección en las listas' : hosts.length + ' direcciones, una por lista') +
    '<div class="rl-two"><div class="rl-box"><h3>La dirección según cada lista</h3><ul class="rl-enter">' + items + '</ul>' + officialLinks(h, o.brand, jurs.map(r => r.id), { note: false, small: true }) +
    '<p>Entrá con la dirección de la provincia donde estás: el botón para ingresar a tu cuenta está en ese sitio. Nosotros no enlazamos páginas de acceso ni pedimos datos.</p></div>' +
    '<div class="rl-box"><h3>Para no caer en una copia</h3><ol class="rl-chk"><li>Compará la barra del navegador con la dirección de la lista, letra por letra.</li><li>No entres desde anuncios, mensajes o perfiles que te pasen un enlace: escribí la dirección o usá un enlace oficial.</li><li>Un sitio que pide depositar a una cuenta personal o por chat no es el sitio de la lista.</li>' +
    (h.built('/verificador') ? '<li>¿Dudás? Pegá la dirección en el <a href="' + h.href('/verificador') + '">verificador</a>.</li>' : '') + '</ol>' +
    only.map(f => cite(h, R, f)).join('') + '</div></div></section>';
}
// "App" with the store listings the operator's own page links (taken from its verified quote); an Android link that does not go
// to Google Play is said as it is (a file from the operator's site), never linked
const STORE = /https?:\/\/(?:apps\.apple\.com|itunes\.apple\.com|play\.google\.com)\/[^\s|»"]+/i;
export function storeLinks(h, R) {
  const out = [], notes = [];
  for (const f of R.pre('app')) {
    if (!f.quote) continue;
    const m = STORE.exec(f.quote), any = /https?:\/\/[^\s|»"]+/.exec(f.quote);
    if (m) {
      const u = new URL(m[0]), apple = /apple/.test(u.hostname);
      const clean = 'https://' + u.hostname + u.pathname + (u.hostname === 'play.google.com' && u.searchParams.get('id') ? '?id=' + encodeURIComponent(u.searchParams.get('id')) : '');
      out.push('<a class="rl-off rl-off-s rl-store" href="' + h.esc(clean) + '" rel="nofollow noopener" target="_blank"><span>' + (apple ? 'Ver en App Store' : 'Ver en Google Play') + '</span><small>enlace de ' + h.esc(hostKey(R.doc(f.doc).url)) + '</small></a>');
    } else if (any && /android/i.test(f.field + f.quote)) {
      notes.push('<p class="rl-note">Para Android, su página enlaza ' + h.esc(new URL(any[0]).hostname) + ', no Google Play: la app se baja desde el sitio del operador. Hacelo solo desde la dirección oficial de tu provincia.</p>');
    }
  }
  return out.length || notes.length ? (out.length ? '<div class="rl-offs">' + out.join('') + '</div>' : '') + notes.join('') : '';
}
export function appExtra(h, R) {
  if (!R.pre('app').length) return '';
  const st = storeLinks(h, R);
  return (st ? '<div class="rl-box rl-appb"><h3>Dónde bajar la app oficial</h3>' + st + '<p class="rl-offn">Los enlaces salen de la página del operador que copiamos. Una app con otro nombre o de otro desarrollador puede ser una copia.</p></div>' : '') +
    (h.built('/guia/apps-oficiales') ? '<p class="rl-note"><a href="' + h.href('/guia/apps-oficiales') + '">Cómo reconocer la app oficial de tu provincia</a></p>' : '');
}
