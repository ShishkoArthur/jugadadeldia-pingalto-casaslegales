// /operador/<slug>: one licensed operator. Its own licence map (which of the verified lists name it and with which address),
// the address read part by part, what its own public pages say (quoted, with date), own screenshots, and the visits where
// the site did not show itself to us. No link to the operator anywhere: addresses are text.
import { brandMatrix, presence } from '../../../engine/registry.mjs';
import { checkHost } from '../../../engine/hostcheck.mjs';
import { OPS } from '../content/operators.mjs';
import { opData, quotesOf, shotsOf, docOf } from '../content/opdata.mjs';
import { licenceMap, mapLegend, anat, opQuote, shotFigure, codeOf } from './opparts.mjs';
import { src, sectionHead } from './parts.mjs';

const SHOT_LABEL = { home: 'Página de entrada', footer: 'Pie de página', rg: 'Juego responsable', sports: 'Apuestas deportivas', pay: 'Medios de pago', tc: 'Términos y condiciones', block: 'Lo que muestra fuera de su provincia' };
const RG_ORDER = ['rg-deposit', 'rg-loss', 'rg-bet', 'rg-time', 'rg-pause', 'rg-selfex', 'rg-check', 'rg-age', 'rg-help'];

export function rowOf(h, brand) {
  const row = brandMatrix(h.regs, h.names).find(r => r.brand === brand);
  if (!row) throw new Error('operator ' + brand + ' is in no verified registry');
  return row;
}
export function entries(h) {
  return h.regs.flatMap(r => r.licensees.map(l => ({ host: l.host, jur: r.id, brand: l.brand })));
}
function checks(h, o, row) {
  const missing = h.regs.filter(r => !o.check.some(([jid]) => jid === r.id)).map(r => r.id);
  if (missing.length) throw new Error('/operador/' + o.slug + ': the copy has no check line for ' + missing.join(', ') + ' (every verified list must be checked)');
  for (const [jid, host] of o.check) {
    const c = row.cells[jid];
    if (host === null ? c : !c || c.host !== host) throw new Error('/operador/' + o.slug + ': the copy says ' + jid + ' = ' + host + ' but the registry has ' + (c ? c.host : 'nothing'));
  }
}

function mapSection(h, o, row) {
  const svg = licenceMap(h, { title: 'Mapa de licencias de ' + row.name + ': ' + h.regs.filter(r => row.cells[r.id]).map(r => h.rg.prov(r.id).name).join(', '),
    state: jid => (h.regs.some(r => r.id === jid) ? (row.cells[jid] ? 'yes' : 'no') : 'na'), label: jid => row.cells[jid] ? row.cells[jid].host : '' });
  const items = h.regs.map(r => {
    const c = row.cells[r.id];
    const doc = h.doc(r.list.doc);
    return '<li class="' + (c ? 'rl-in' : 'rl-out') + '"><div class="rl-jr"><span class="rl-tag">' + h.esc(codeOf(r.id)) + '</span><b>' + h.esc(h.rg.prov(r.id).name) + '</b></div>' +
      (c ? anat(h, c.host) + (c.ref ? '<p class="rl-ref">Autorizado por ' + h.esc(c.ref) + '</p>' : '') + (h.built('/operador/' + o.slug + '/' + r.id) ? '<p><a href="' + h.href('/operador/' + o.slug + '/' + r.id) + '">' + h.esc(row.name + ' en ' + h.rg.prov(r.id).name) + '</a></p>' : '') : '<p class="rl-none">No figura en esta lista (' + r.licensees.length + ' sitios).</p>') +
      '<p class="rl-src">' + h.esc(r.regulator.short) + ' · <a href="' + h.esc(doc.url) + '" rel="noopener">' + h.esc(doc.host) + '</a> · copia del ' + h.fmtDate(doc.fetched) + '</p></li>';
  }).join('');
  return '<section class="rl-sec" id="licencias">' + sectionHead(h, 'Mapa de licencias de ' + row.name, o.angle) +
    '<div class="rl-opmap"><div class="rl-card rl-mapcard" data-nosnippet>' + svg + mapLegend() + '</div><ul class="rl-jlist">' + items + '</ul></div>' +
    '<p class="rl-cap">Las demás jurisdicciones aparecen sin dato: no quiere decir que la marca no esté habilitada ahí, sino que todavía no guardamos esa lista oficial.</p></section>';
}

function addressSection(h, o, row, all) {
  const hosts = [...new Set(Object.values(row.cells).filter(Boolean).map(c => c.host))];
  const cards = hosts.map(host => {
    const in_ = h.regs.filter(r => row.cells[r.id] && row.cells[r.id].host === host).map(r => codeOf(r.id));
    return '<article>' + anat(h, host) + '<p>Figura en: ' + in_.map(c => '<span class="rl-tag">' + h.esc(c) + '</span>').join(' ') + '</p></article>';
  });
  const looks = (o.lookalikes || []).map(x => {
    const r = checkHost(x, all);
    if (r.state === 'listed') throw new Error('/operador/' + o.slug + ': ' + x + ' is listed, the copy says it is not');
    return '<article class="rl-look">' + anat(h, x, { dim: true }) + '<p>No figura en ninguna de las ' + h.regs.length + ' listas que revisamos.' + (r.state === 'similar' ? ' Se parece a ' + r.matches.map(m => h.esc(m.host)).join(', ') + ', pero no es la misma dirección.' : '') + '</p></article>';
  });
  const nonBet = hosts.filter(x => !/\.bet\.ar$/.test(x));
  return '<section class="rl-sec">' + sectionHead(h, 'La dirección, parte por parte', hosts.length === 1 ? 'una sola dirección en las listas' : hosts.length + ' direcciones distintas en las listas') +
    '<div class="rl-anats">' + cards.join('') + looks.join('') + '</div>' +
    (nonBet.length ? '<p class="rl-note">' + h.esc(nonBet.join(', ')) + ' no termina en .bet.ar y aun así figura en una lista oficial: por eso la terminación sola no alcanza para saber si un sitio está habilitado.' + (h.built('/guia/bet-ar') ? ' <a href="' + h.href('/guia/bet-ar') + '">Qué dice cada regulador sobre .bet.ar</a>' : '') + '</p>' : '') +
    '</section>';
}

function siteSays(h, o, D, row) {
  const lic = quotesOf(D, o.brand, 'licence');
  const age = quotesOf(D, o.brand, 'rg-age').concat(quotesOf(D, o.brand, 'rg-help'));
  if (!lic.length && !age.length) return '';
  const cmp = (D.data.brands[o.brand].compare || []).map(c => {
    const q = D.data.quotes[c.quote];
    if (!q || !q.text.includes(c.site)) throw new Error(o.brand + ': compare site ref ' + c.site + ' not in quote ' + c.quote);
    const r = h.reg(c.jur);
    const listText = c.jur === 'cordoba' ? r.quotes.licence.text : (row.cells[c.jur] || {}).ref || '';
    if (!listText.includes(c.list)) throw new Error(o.brand + ': compare list ref ' + c.list + ' not in the ' + c.jur + ' registry');
    return '<div class="rl-cmp"><div><small>El pie del sitio</small><b>' + h.esc(c.site) + '</b></div><div><small>La lista de ' + h.esc(r.regulator.short) + '</small><b>' + h.esc(c.list) + '</b></div>' +
      '<p>' + (c.site === c.list ? 'Coinciden.' : 'Los números no coinciden. No sabemos por qué (puede ser otro acto, anterior o posterior). Para saber si un sitio está habilitado, manda la lista oficial.') + '</p></div>';
  }).join('');
  return '<section class="rl-sec">' + sectionHead(h, 'Lo que dice el propio sitio', 'citas textuales de su página pública') +
    '<div class="rl-two"><div class="rl-box"><h3>Sobre su licencia</h3>' + (lic.length ? lic.map(q => opQuote(h, D, q, q.label)).join('') : '<p>No guardamos un texto del sitio sobre su licencia.</p>') + '</div>' +
    '<div class="rl-box"><h3>Edad y ayuda</h3>' + (age.length ? age.map(q => opQuote(h, D, q, q.label)).join('') : '<p>No guardamos ese texto del sitio.</p>') + '</div></div>' + cmp + '</section>';
}

function shotsSection(h, o, D) {
  const shots = shotsOf(D, o.brand);
  const used = new Set(shots.map(s => s.id));
  const misses = Object.values(D.shots).filter(s => s.brand === o.brand && !used.has(s.id) && !s.ok);
  const figs = shots.map(s => shotFigure(h, s, SHOT_LABEL[s.kind] || 'Página pública')).join('');
  const blockQuotes = quotesOf(D, o.brand, 'block');
  const fromAr = shots.some(s => s.source === 'owner');
  const miss = misses.map(s => '<li><span class="rl-host">' + h.esc(new URL(s.url).hostname) + '</span><span>' +
    (s.status >= 400 || s.status === 202 ? 'respondió con una página de bloqueo (código ' + s.status + ')' : 'no cargó') + ' · ' + h.fmtDate(s.date) + '</span></li>').join('');
  if (!figs && !miss) return '';
  return '<section class="rl-sec" id="capturas">' + sectionHead(h, 'Capturas propias', 'sin registrarnos, sin depositar') +
    (figs ? '<div class="rl-shots">' + figs + '</div>' : '') +
    (blockQuotes.length ? '<div class="rl-law rl-law-1">' + blockQuotes.map(q => '<article>' + opQuote(h, D, q, q.label) + '</article>').join('') + '</div>' : '') +
    (miss ? (fromAr ? '<div class="rl-box rl-miss"><h3>Desde fuera de Argentina</h3><p>Cuando visitamos estas direcciones desde fuera del país, no mostraron su contenido. Las capturas de arriba se hicieron desde un navegador en Argentina, sin registrarnos.</p>' :
      '<div class="rl-box rl-miss"><h3>' + (figs ? 'Otras direcciones que no pudimos ver' : 'No pudimos ver su sitio') + '</h3><p>Las visitamos desde fuera de Argentina y el sitio no mostró su contenido. No usamos capturas ajenas, así que esta ficha no tiene imagen de esas páginas.</p>') + '<ul class="rl-misslist">' + miss + '</ul></div>' : '') +
    '</section>';
}

function toolsSection(h, o, D) {
  const rg = quotesOf(D, o.brand, 'rg').filter(q => q.topic !== 'rg-age' && q.topic !== 'rg-help').sort((a, b) => RG_ORDER.indexOf(a.topic) - RG_ORDER.indexOf(b.topic));
  const pay = quotesOf(D, o.brand, 'pay');
  if (!rg.length && !pay.length) {
    return '<section class="rl-sec">' + sectionHead(h, 'Herramientas de juego responsable y medios de pago') +
      '<div class="rl-box"><p>No publicamos una lista: solo contamos lo que dice una página pública del operador que pudimos guardar, y la de ' + h.esc(h.names[o.brand]) + (shotsOf(D, o.brand).some(s => s.source === 'owner') ? ' solo la vimos en capturas hechas desde Argentina, sin un texto guardado que podamos citar' : ' no se mostró desde nuestra ubicación') + '. Las herramientas que exige cada provincia están en la página de esa provincia.</p></div></section>';
  }
  const groups = list => [...new Set(list.map(q => q.doc))].map(slug => ({ d: docOf(D, slug), qs: list.filter(q => q.doc === slug) }));
  const head = d => '<p class="rl-src rl-gsrc">' + h.esc(d.title) + ' · <span class="rl-host">' + h.esc(d.host + (d.path === '/' ? '' : d.path)) + '</span> · copia del ' + h.fmtDate(d.fetched) + '</p>';
  const short = q => '<blockquote class="rl-q">«' + h.esc(q.text) + '»</blockquote>';
  const rgHtml = groups(rg).map(g => head(g.d) + '<div class="rl-tools">' + g.qs.map(q => '<article class="rl-tool"><h3><i class="rl-y" aria-hidden="true"></i>' + h.esc(q.label.replace(/ \((Ciudad|Córdoba)\)$/, '')) + '</h3>' + short(q) + '</article>').join('') + '</div>').join('');
  const payHtml = groups(pay).map(g => head(g.d) + '<div class="rl-pays">' + [...new Set(g.qs.map(q => q.item))].map(it => '<article class="rl-pay"><h3>' + h.esc(it) + '</h3>' +
    g.qs.filter(q => q.item === it).map(q => '<p class="rl-plab">' + h.esc(q.label) + '</p>' + short(q)).join('') + '</article>').join('') + '</div>').join('');
  return (rg.length ? '<section class="rl-sec">' + sectionHead(h, 'Herramientas de juego responsable', 'citas de su página') +
      '<p class="rl-note">Solo lo que dice la página del operador, con su texto. Que una herramienta figure acá no quiere decir que la hayamos probado: no abrimos cuentas.</p>' + rgHtml + '</section>' : '') +
    (pay.length ? '<section class="rl-sec">' + sectionHead(h, 'Medios de pago y retiros', 'citas de su página') + payHtml + '</section>' : '');
}

function nextSection(h, row) {
  const links = [
    ['/verificador', 'Verificá la dirección que tenés abierta'],
    ...h.regs.filter(r => row.cells[r.id]).map(r => ['/provincia/' + r.id, 'Lista completa de ' + h.rg.prov(r.id).name]),
    ['/guia/bet-ar', 'Qué garantiza el dominio .bet.ar y qué no'],
    ['/operadores', 'Las demás fichas de operadores'],
  ].filter(([u]) => h.built(u));
  return '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + '<div class="rl-gd">' + links.map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div></section>';
}

export function operatorPage(o) {
  return {
    path: '/operador/' + o.slug,
    id: 'operador-' + o.slug,
    kind: 'operator',
    jurisdiction: o.jurisdiction,
    brand: o.brand,
    title: o.title,
    description: o.description,
    h1: o.h1,
    ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ...(h.built('/operadores') ? [['/operadores', 'Operadores']] : []), ['/operador/' + o.slug, h.names[o.brand]]])],
    render(h) {
      const D = opData(h.today);
      const row = rowOf(h, o.brand);
      checks(h, o, row);
      const n = presence(row), all = entries(h);
      const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">Ficha de operador · listas copiadas el ' + h.fmtDate(h.regs.map(r => r.checked).sort()[0]) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
        '<p class="rl-lead">' + h.esc(o.lead) + '</p><p class="rl-note">Sin enlaces al operador, sin promociones. Depende de la ley de tu provincia; esto no es asesoramiento legal.</p></div>' +
        '<div class="rl-big"><b>' + n + '<small> de ' + h.regs.length + '</small></b><span>listas oficiales que revisamos lo nombran</span><small>' + h.esc(o.angle) + '</small></div></section>';
      return hero + mapSection(h, o, row) + addressSection(h, o, row, all) + siteSays(h, o, D, row) + shotsSection(h, o, D) + toolsSection(h, o, D) + nextSection(h, row);
    },
  };
}
export const operatorPages = OPS.map(operatorPage);
export { src };
