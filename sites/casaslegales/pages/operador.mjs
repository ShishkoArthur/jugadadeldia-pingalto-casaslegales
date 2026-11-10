// /operador/<slug>: one licensed operator. Its own licence map (which of the verified lists name it and with which address),
// the address read part by part, what its own public pages say (quoted, with date), own screenshots, and the visits where
// the site did not show itself to us. No link to the operator anywhere: addresses are text.
import { brandMatrix, presence, hostKey } from '../../../engine/registry.mjs';
import { checkHost } from '../../../engine/hostcheck.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPS, slugOf } from '../content/operators.mjs';
import { opData, quotesOf, shotsOf, docOf, quoteById } from '../content/opdata.mjs';
import { licenceMap, mapLegend, anat, opQuote, shotFigure, codeOf } from './opparts.mjs';
import { src, quote, sectionHead, brandLink, officialLinks } from './parts.mjs';
import { help } from './provincia.mjs';
import { THUMB, thumbName, hasThumb } from '../content/thumbs.mjs';
import { ROOT } from '../../../tools/env.mjs';
import { review } from '../content/reviews.mjs';
import { loadReviews } from '../../../tools/lib/revsources.mjs';
import { brandNames, loadRegistries, loadRg } from '../../../tools/lib/sources.mjs';
import { SITE } from '../config.mjs';
import { SECTIONS, reviewSection, summary, toc, reviewShots, viewLabel, enterSection, appExtra, ICON, VIEW_SECTION } from './review.mjs';

const SHOT_LABEL = { home: 'Página de entrada', parked: 'Lo que muestra la dirección', footer: 'Pie de página', rg: 'Juego responsable', sports: 'Apuestas deportivas', pay: 'Medios de pago', tc: 'Términos y condiciones', block: 'Lo que muestra fuera de su provincia' };
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
  for (const [jid, label] of o.labels || []) {
    const l = h.reg(jid).licensees.find(x => x.brand === o.brand);
    if (!l || l.label !== label) throw new Error('/operador/' + o.slug + ': the copy says the ' + jid + ' list calls it ' + label + ' but the list says ' + (l ? l.label : 'nothing'));
  }
  for (const r of h.regs) for (const l of r.licensees) slugOf(l.brand);
}

// Santa Fe publishes two lists on one page (CASINOS ONLINE, APUESTAS DEPORTIVAS): the categories of each address, read from the saved copy
let sfeCache = null;
export function sfeCats(h) {
  if (sfeCache) return sfeCache;
  const r = h.regs.find(x => x.id === 'santa-fe');
  sfeCache = {};
  if (!r) return sfeCache;
  const html = readFileSync(join(ROOT, h.doc(r.list.doc).file), 'utf8');
  for (const m of html.matchAll(/<p><b>([A-ZÁÉÍÓÚ ]+)<\/b><\/p>\s*<ul>([\s\S]*?)<\/ul>/g)) {
    const cat = m[1].trim().toLowerCase();
    for (const l of r.licensees) if (m[2].includes('//' + l.host + '/')) (sfeCache[l.host] = sfeCache[l.host] || []).push(cat);
  }
  for (const l of r.licensees) if (!sfeCache[l.host]) throw new Error('santa-fe: no category found for ' + l.host);
  return sfeCache;
}
const joinY = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a.at(-1);

// the hero verdict: one chip per verified list, lit where the brand is named (the same data as the licence map below)
function listChips(h, row) {
  return '<ul class="rl-bj">' + h.regs.map(r => '<li' + (row.cells[r.id] ? ' class="rl-bj-on"' : '') + ' title="' + h.esc(h.rg.prov(r.id).name + ': ' + (row.cells[r.id] ? 'figura en la lista oficial' : 'no figura en la lista oficial')) + '">' + h.esc(codeOf(r.id)) + '</li>').join('') + '</ul>';
}

function mapSection(h, o, row) {
  const svg = licenceMap(h, { title: 'Mapa de licencias de ' + row.name + ': ' + h.regs.filter(r => row.cells[r.id]).map(r => h.rg.prov(r.id).name).join(', '),
    state: jid => (h.regs.some(r => r.id === jid) ? (row.cells[jid] ? 'yes' : 'no') : 'na'), label: jid => row.cells[jid] ? row.cells[jid].host : '' });
  const items = h.regs.map(r => {
    const c = row.cells[r.id];
    const doc = h.doc(r.list.doc);
    return '<li class="' + (c ? 'rl-in' : 'rl-out') + '"><div class="rl-jr"><span class="rl-tag">' + h.esc(codeOf(r.id)) + '</span><b>' + h.esc(h.rg.prov(r.id).name) + '</b></div>' +
      (c ? anat(h, c.host) + (c.ref ? '<p class="rl-ref">Autorizado por ' + h.esc(c.ref) + '</p>' : '') + (r.id === 'santa-fe' ? '<p class="rl-ref">En la lista: ' + h.esc(joinY(sfeCats(h)[c.host])) + '</p>' : '') + (h.built('/operador/' + o.slug + '/' + r.id) ? '<p><a href="' + h.href('/operador/' + o.slug + '/' + r.id) + '">' + h.esc(row.name + ' en ' + h.rg.prov(r.id).name) + '</a></p>' : '') : '<p class="rl-none">No figura en esta lista (' + r.licensees.length + ' sitios).</p>') +
      '<p class="rl-src">' + h.esc(r.regulator.short) + ' · <a href="' + h.esc(doc.url) + '" rel="noopener">' + h.esc(doc.host) + '</a> · copia del ' + h.fmtDate(doc.fetched) + '</p></li>';
  });
  // lists that do not name the brand: one compact card with their codes; each list, with its source, stays behind "Ver cada lista"
  const outs = h.regs.filter(r => !row.cells[r.id]), only = f => items.filter((x, i) => f(!!row.cells[h.regs[i].id])).join('');
  const list = outs.length < 3 ? items.join('') : only(x => x) +
    '<li class="rl-out rl-outs"><div class="rl-jr"><b>No figura en ' + outs.length + ' listas</b></div><div class="rl-dots">' + outs.map(r => '<i>' + h.esc(codeOf(r.id)) + '</i>').join('') + '</div>' +
    '<details class="rl-more"><summary>Ver cada lista, con su fuente</summary><ul class="rl-jlist">' + only(x => !x) + '</ul></details></li>';
  return '<section class="rl-sec" id="licencias">' + sectionHead(h, 'Mapa de licencias de ' + row.name, o.angle, ICON.licencias) +
    '<div class="rl-opmap"><div class="rl-card rl-mapcard" data-nosnippet>' + svg + mapLegend() + '</div><ul class="rl-jlist">' + list + '</ul></div>' +
    '<p class="rl-cap">Las demás jurisdicciones aparecen sin dato: no quiere decir que la marca no esté habilitada ahí, sino que todavía no guardamos esa lista oficial.</p></section>';
}

// brands in two or more lists: how each list names it, side by side (labels, acts and counts come from the registries)
function listsTable(h, o, row) {
  const in_ = h.regs.filter(r => row.cells[r.id]);
  if (in_.length < 2) return '';
  const hosts = new Set(in_.map(r => row.cells[r.id].host));
  const rows = in_.map(r => {
    const c = row.cells[r.id], l = r.licensees.find(x => x.brand === o.brand);
    return '<tr><th scope="row"><span class="rl-tag">' + h.esc(codeOf(r.id)) + '</span> ' + h.esc(h.rg.prov(r.id).name) + '</th><td class="rl-host"><p class="rl-lbl">Dirección</p>' + h.esc(c.host) + '</td><td><p class="rl-lbl">Cómo la nombra</p>' +
      (l.label ? '«' + h.esc(l.label) + '»' : '<span class="rl-src">solo la dirección</span>') + '</td><td><p class="rl-lbl">Acto</p>' + (c.ref ? h.esc(c.ref) : '<span class="rl-src">la lista no lo indica</span>') + '</td><td><p class="rl-lbl">Regulador</p>' +
      h.esc(r.regulator.short) + '</td><td><p class="rl-lbl">Sitios en la lista</p>' + r.licensees.length + '</td><td><p class="rl-lbl">Copia</p>' + h.fmtDate(h.doc(r.list.doc).fetched) + '</td></tr>';
  }).join('');
  return '<section class="rl-sec">' + sectionHead(h, row.name + ' en cada lista', hosts.size === 1 ? 'la misma dirección en ' + in_.length + ' listas' : hosts.size + ' direcciones en ' + in_.length + ' listas') +
    '<div class="rl-card" data-nosnippet><div class="rl-scroll"><table class="rl-reg rl-optab rl-cards rl-kv"><thead><tr><th scope="col">Lista</th><th scope="col">Dirección</th><th scope="col">Cómo la nombra</th><th scope="col">Acto</th><th scope="col">Regulador</th><th scope="col">Sitios en la lista</th><th scope="col">Copia</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="rl-cap">' + (hosts.size === 1 ? 'Cada regulador autoriza por su cuenta, aunque la dirección sea la misma: la licencia de una provincia no vale en la otra.' : 'Cada provincia nombra su propia dirección: si estás en una, la que vale es la de su lista.') + '</p></div></section>';
}

// a platform of the province itself (the regulator names it apart from, or above, the private operators)
function platformSection(h, o, row) {
  if (!o.platform) return '';
  const jid = o.jurisdiction, r = h.reg(jid), l = r.licensees.find(x => x.brand === o.brand), p = h.rg.prov(jid);
  const apart = l.evidence.doc !== r.list.doc;
  const others = r.licensees.filter(x => x.brand !== o.brand);
  const regQ = Object.values(r.quotes).filter(q => q.role === 'platform' || (apart && q.role === 'list' && q.doc === l.evidence.doc));
  if (!regQ.length) throw new Error('/operador/' + o.slug + ': no quote of the regulator about the platform');
  return '<section class="rl-sec">' + sectionHead(h, row.name + ' en la lista de ' + p.name, 'qué la distingue de los demás sitios') + '<div class="rl-two">' +
    '<div class="rl-box"><h3>Qué dice el regulador</h3>' + regQ.map(q => quote(h, q, r.regulator.name)).join('') + '</div>' +
    '<div class="rl-box"><h3>Cómo figura</h3><p>' + (apart ? 'En las páginas del regulador (' + h.esc(r.regulator.short) + '), la tabla de sitios trae ' + others.length + ' direcciones y ' + h.esc(row.name) + ' figura aparte, en otra página, entre las plataformas autorizadas en ' + h.esc(p.name) + '.' :
      'Figura en el mismo bloque que los otros ' + others.length + ' sitios autorizados de la lista del regulador (' + h.esc(r.regulator.short) + ').') + '</p>' +
      '<p>Los demás sitios de esa lista: ' + others.map(x => brandLink(h, x.brand)).join(', ') + '.</p>' +
      (h.built('/provincia/' + jid) ? '<p><a href="' + h.href('/provincia/' + jid) + '">Lista completa de ' + h.esc(p.name) + '</a></p>' : '') + '</div></div></section>';
}

// quotes of the regulator page about this brand (registry quotes with role operator)
function regSays(h, o) {
  if (!o.regQuotes) return '';
  const qs = o.regQuotes.map(([jid, k, label]) => { const q = h.reg(jid).quotes[k]; if (!q) throw new Error('/operador/' + o.slug + ': no quote ' + k + ' in ' + jid); return quote(h, q, label); });
  return '<section class="rl-sec">' + sectionHead(h, 'Lo que cuenta el regulador', 'citas de la misma página de la lista', 'quote') + '<div class="rl-law rl-law-1"><article>' + qs.join('') + '</article></div></section>';
}

// another listed brand whose own page names this one (quoted, with a caveat): never a claim of our own
function relatedSection(h, o, D) {
  const x = o.related;
  if (!x) return '';
  const q = quoteById(D, x.quote);
  return '<section class="rl-sec">' + sectionHead(h, x.title) + '<div class="rl-box"><p>' + h.esc(x.text).replace('{b}', brandLink(h, x.brand)) + '</p>' + opQuote(h, D, q, q.label) + '</div></section>';
}

const ACCESS = {
  robots: 'su archivo robots.txt pide que los agentes de inteligencia artificial no visiten el sitio, y lo respetamos',
  botcheck: 'el servidor responde con una verificación contra robots, que no intentamos pasar',
  tls: 'la conexión segura con el servidor falló',
  dns: 'la dirección no respondía: su nombre no apuntaba a ningún servidor',
  geo: 'desde fuera de Argentina responde con un aviso de acceso restringido, que no intentamos esquivar',
};
function accessReason(o) {
  const a = o.access;
  if (!a || !ACCESS[a.kind]) throw new Error('/operador/' + o.slug + ': no capture and no access reason');
  return ACCESS[a.kind];
}
function accessSection(h, o) {
  const a = o.access;
  return '<section class="rl-sec" id="capturas">' + sectionHead(h, 'Capturas propias', 'sin registrarnos, sin depositar') +
    '<div class="rl-box rl-miss"><h3>No pudimos ver su sitio</h3><p>Lo intentamos el ' + h.fmtDate(a.date) + ': ' + h.esc(accessReason(o)) + '. No usamos capturas ajenas, así que esta ficha no tiene imagen de su sitio. Lo que sí está verificado es la lista oficial de arriba.</p>' +
    '<ul class="rl-misslist">' + a.hosts.map(x => '<li><span class="rl-host">' + h.esc(x) + '</span><span>' + h.fmtDate(a.date) + '</span></li>').join('') + '</ul></div></section>';
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
  return '<section class="rl-sec">' + sectionHead(h, 'La dirección, parte por parte', hosts.length === 1 ? 'una sola dirección en las listas' : hosts.length + ' direcciones distintas en las listas', 'link') +
    '<div class="rl-anats">' + cards.join('') + looks.join('') + '</div>' +
    (nonBet.length ? '<p class="rl-note">' + h.esc(nonBet.join(', ')) + ' no termina en .bet.ar y aun así figura en una lista oficial: por eso la terminación sola no alcanza para saber si un sitio está habilitado.' + (h.built('/guia/bet-ar') ? ' <a href="' + h.href('/guia/bet-ar') + '">Qué dice cada regulador sobre .bet.ar</a>' : '') + '</p>' : '') +
    '</section>';
}

function siteSays(h, o, D, row) {
  const lic = quotesOf(D, o.brand, 'licence');
  const age = quotesOf(D, o.brand, 'rg-age').concat(quotesOf(D, o.brand, 'rg-help'));
  const about = quotesOf(D, o.brand, 'about');
  if (!lic.length && !age.length && !about.length) return '';
  const cmp = (D.data.brands[o.brand].compare || []).map(c => {
    const q = D.data.quotes[c.quote];
    if (!q || !q.text.includes(c.site)) throw new Error(o.brand + ': compare site ref ' + c.site + ' not in quote ' + c.quote);
    const r = h.reg(c.jur);
    const listText = c.jur === 'cordoba' ? r.quotes.licence.text : (row.cells[c.jur] || {}).ref || '';
    if (!listText.includes(c.list)) throw new Error(o.brand + ': compare list ref ' + c.list + ' not in the ' + c.jur + ' registry');
    return '<div class="rl-cmp"><div><small>El pie del sitio</small><b>' + h.esc(c.site) + '</b></div><div><small>La lista de ' + h.esc(r.regulator.short) + '</small><b>' + h.esc(c.list) + '</b></div>' +
      '<p>' + (c.site === c.list ? 'Coinciden.' : 'Los números no coinciden. No sabemos por qué (puede ser otro acto, anterior o posterior). Para saber si un sitio está habilitado, manda la lista oficial.') + '</p></div>';
  }).join('');
  return '<section class="rl-sec">' + sectionHead(h, 'Lo que dice el propio sitio', 'citas textuales de su página pública', 'quote') +
    '<div class="rl-two"><div class="rl-box"><h3>Sobre su licencia</h3>' + (lic.length ? lic.map(q => opQuote(h, D, q, q.label)).join('') : '<p>No guardamos un texto del sitio sobre su licencia.</p>') + '</div>' +
    '<div class="rl-box"><h3>Edad y ayuda</h3>' + (age.length ? age.map(q => opQuote(h, D, q, q.label)).join('') : '<p>No guardamos ese texto del sitio.</p>') + '</div></div>' + cmp +
    (about.length ? '<div class="rl-box rl-about"><h3>Cómo se presenta</h3>' + about.map(q => opQuote(h, D, q, q.label)).join('') + (o.caveat ? '<p class="rl-note">' + h.esc(o.caveat) + (h.built('/verificador') ? ' <a href="' + h.href('/verificador') + '">Abrir el verificador</a>' : '') + '</p>' : '') + '</div>' : '') + '</section>';
}

function shotsSection(h, o, D, R, skip = null) {
  const shots = shotsOf(D, o.brand);
  const rev = R ? reviewShots(h, R, viewLabel, skip) : '';
  const moved = !!(skip && skip.size);
  const used = new Set(shots.map(s => s.id));
  const misses = Object.values(D.shots).filter(s => s.brand === o.brand && !used.has(s.id) && !s.ok);
  const figs = rev + shots.map(s => shotFigure(h, s, SHOT_LABEL[s.kind] || 'Página pública')).join('');
  const blockQuotes = quotesOf(D, o.brand, 'block');
  const fromAr = !!rev || moved || shots.some(s => s.source === 'owner');
  const miss = misses.map(s => '<li><span class="rl-host">' + h.esc(new URL(s.url).hostname) + '</span><span>' +
    (s.status >= 400 || s.status === 202 ? 'respondió con una página de bloqueo (código ' + s.status + ')' : 'no cargó') + ' · ' + h.fmtDate(s.date) + '</span></li>').join('');
  if (R && !figs && !moved) return '';
  if (!figs && !miss && !(moved && blockQuotes.length)) return moved ? '' : o.access ? accessSection(h, o) : '';
  return '<section class="rl-sec" id="capturas">' + sectionHead(h, 'Capturas propias', 'sin registrarnos, sin depositar', ICON.capturas) +
    (figs ? '<div class="rl-shots">' + figs + '</div>' : '') +
    (blockQuotes.length ? '<div class="rl-law rl-law-1">' + blockQuotes.map(q => '<article>' + opQuote(h, D, q, q.label) + '</article>').join('') + '</div>' : '') +
    (miss ? (fromAr ? '<div class="rl-box rl-miss"><h3>Desde fuera de Argentina</h3><p>Cuando visitamos estas direcciones desde fuera del país, no mostraron su contenido. Las capturas de arriba se hicieron desde un navegador en Argentina, sin registrarnos.</p>' :
      '<div class="rl-box rl-miss"><h3>' + (figs ? 'Otras direcciones que no pudimos ver' : 'No pudimos ver su sitio') + '</h3><p>Las visitamos desde fuera de Argentina y el sitio no mostró su contenido. No usamos capturas ajenas, así que esta ficha no tiene imagen de esas páginas.</p>') + '<ul class="rl-misslist">' + miss + '</ul></div>' : '') +
    '</section>';
}

function toolsReason(o, shots) {
  if (shots.some(s => s.source === 'owner')) return ' solo la vimos en capturas hechas desde Argentina, sin un texto guardado que podamos citar';
  if (!shots.length && o.access) return ' no la guardamos: ' + accessReason(o);
  if (shots.some(s => s.kind === 'parked')) return ' no muestra un sitio de juego';
  if (shots.some(s => s.ok)) return ' la guardamos solo en su página de entrada, que no detalla esas herramientas';
  return ' no se mostró desde nuestra ubicación';
}
const rgQuotes = (D, o) => quotesOf(D, o.brand, 'rg').filter(q => q.topic !== 'rg-age' && q.topic !== 'rg-help').sort((a, b) => RG_ORDER.indexOf(a.topic) - RG_ORDER.indexOf(b.topic));
function toolsSection(h, o, D, only) {
  const rg = rgQuotes(D, o);
  const pay = quotesOf(D, o.brand, 'pay');
  if (only && !(only === 'rg' ? rg : pay).length) return '';
  if (!rg.length && !pay.length) {
    return '<section class="rl-sec">' + sectionHead(h, 'Herramientas de juego responsable y medios de pago') +
      '<div class="rl-box"><p>No publicamos una lista: solo contamos lo que dice una página pública del operador que pudimos guardar, y la de ' + h.esc(h.names[o.brand]) + h.esc(toolsReason(o, shotsOf(D, o.brand))) + '. Las herramientas que exige cada provincia están en la página de esa provincia.</p></div></section>';
  }
  const groups = list => [...new Set(list.map(q => q.doc))].map(slug => ({ d: docOf(D, slug), qs: list.filter(q => q.doc === slug) }));
  const head = d => '<p class="rl-src rl-gsrc">' + h.esc(d.title) + ' · <span class="rl-host">' + h.esc(d.host + (d.path === '/' ? '' : d.path)) + '</span> · copia del ' + h.fmtDate(d.fetched) + '</p>';
  const short = q => '<blockquote class="rl-q">«' + h.esc(q.text) + '»</blockquote>';
  const rgHtml = groups(rg).map(g => head(g.d) + '<div class="rl-tools">' + g.qs.map(q => '<article class="rl-tool"><h3><i class="rl-y" aria-hidden="true"></i>' + h.esc(q.label.replace(/ \((Ciudad|Córdoba)\)$/, '')) + '</h3>' + short(q) + '</article>').join('') + '</div>').join('');
  const payHtml = groups(pay).map(g => head(g.d) + '<div class="rl-pays">' + [...new Set(g.qs.map(q => q.item))].map(it => '<article class="rl-pay"><h3>' + h.esc(it) + '</h3>' +
    g.qs.filter(q => q.item === it).map(q => '<p class="rl-plab">' + h.esc(q.label) + '</p>' + short(q)).join('') + '</article>').join('') + '</div>').join('');
  if (only === 'rg') return rg.length ? '<p class="rl-note">Otras páginas que guardamos antes:</p>' + rgHtml : '';
  if (only === 'pay') return pay.length ? '<p class="rl-note">Otras páginas que guardamos antes:</p>' + payHtml : '';
  return (rg.length ? '<section class="rl-sec">' + sectionHead(h, 'Herramientas de juego responsable', 'citas de su página') +
      '<p class="rl-note">Solo lo que dice la página del operador, con su texto. Que una herramienta figure acá no quiere decir que la hayamos probado: no abrimos cuentas.</p>' + rgHtml + '</section>' : '') +
    (pay.length ? '<section class="rl-sec">' + sectionHead(h, 'Medios de pago y retiros', 'citas de su página') + payHtml + '</section>' : '');
}

// what the visit from Argentina (review collection) found on each address: the page copies we saved and the hosts that did not open
const VISIT = { open: 'abrió', partial: 'abrió solo en parte', 'bot-check': 'mostró una verificación contra robots, que no intentamos pasar', down: 'no respondía', parked: 'mostraba una página del proveedor del dominio, sin sitio de juego', 'geo-block': 'mostró un bloqueo por ubicación', blank: 'cargó en blanco', redirect: 'redirige a otra dirección', error: 'mostró una página de error', empty: 'cargó sin contenido', 'age-gate': 'pidió confirmar la edad' };
function visitRows(h, R) {
  const at = u => { const x = new URL(u); return hostKey(x.hostname) + (x.pathname === '/' ? '' : x.pathname.replace(/\/$/, '')); };
  const st = R.r.status || {}, seen = new Set();
  const rows = Object.values(R.r.docs || {}).map(d => { seen.add(new URL(d.url).hostname); return '<li><span class="rl-host">' + h.esc(at(d.url)) + '</span><span>guardamos el texto · ' + h.fmtDate(d.date) + '</span></li>'; });
  for (const [host, x] of Object.entries(st)) {
    if (!VISIT[x.status]) throw new Error('review ' + R.brand + ': unknown visit status ' + x.status);
    const pop = /pop-?up/i.test(x.note || '') ? [...(x.note.matchAll(/'([^']+)'/g))].map(m => m[1]) : [];
    if (x.status === 'open' && seen.has(host) && !pop.length) continue;
    const what = x.status === 'open' && pop.length ? 'abrió; ' + pop.map(t => '«' + t + '»').join(' y ') + (pop.length > 1 ? ' se abren' : ' se abre') + ' en una ventana emergente que no guardamos' : VISIT[x.status];
    rows.push('<li><span class="rl-host">' + h.esc(host.replace(/^www\./, '')) + '</span><span>' + h.esc(what) + (x.date ? ' · ' + h.fmtDate(x.date) : '') + '</span></li>');
  }
  return [...new Set(rows)].join('');
}
function missingSection(h, R, absent, noShots) {
  if (!absent.length && !noShots) return '';
  const names = absent.map(([, t]) => t.toLowerCase());
  return '<section class="rl-sec" id="sin-ver">' + sectionHead(h, 'Lo que no pudimos ver', 'y por qué', ICON['sin-ver']) + '<div class="rl-box rl-miss">' +
    (absent.length ? '<p>En las páginas públicas que guardamos no encontramos datos sobre ' + h.esc(joinY(names)) + '. No abrimos cuenta, no depositamos y no usamos chats ni formularios: lo que el sitio muestra solo con una cuenta queda afuera de esta reseña.</p>' : '') +
    (noShots ? '<p>No guardamos capturas de este sitio: lo que citamos sale del texto de sus páginas.</p>' : '') +
    '<h3>Lo que visitamos desde Argentina</h3><ul class="rl-misslist">' + visitRows(h, R) + '</ul></div></section>';
}
function visitsSection(h, R) {
  if (!Object.keys(R.r.status || {}).length) return '';
  return '<section class="rl-sec" id="visita">' + sectionHead(h, 'Lo que vimos desde Argentina', 'sin abrir cuenta', ICON.visita) + '<div class="rl-box rl-miss"><p>Lo intentamos desde un navegador en Argentina, sin registrarnos. Ninguna página nos dejó un texto que podamos citar sobre deportes, casino, pagos o juego responsable, así que esta ficha no es una reseña: solo muestra lo que dicen las listas oficiales.</p><ul class="rl-misslist">' + visitRows(h, R) + '</ul></div></section>';
}

function nextSection(h, row) {
  const links = [
    ['/verificador', 'Verificá la dirección que tenés abierta'],
    ...h.regs.filter(r => row.cells[r.id]).map(r => ['/provincia/' + r.id, 'Lista completa de ' + h.rg.prov(r.id).name]),
    ['/guia/bet-ar', 'Qué garantiza el dominio .bet.ar y qué no'],
    ['/operadores', 'Las demás fichas de operadores'],
  ].filter(([u]) => h.built(u));
  return '<section class="rl-sec">' + sectionHead(h, 'Para seguir', '', 'list') + '<div class="rl-gd">' + links.map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div></section>';
}

// Title, H1 and description follow the search intent of a brand query (owner 2026-11-04, keyword audit): a brand with review data
// is a review ("reseña"), every brand page names its official site; numbers of lists come from the registries.
const SHORT = { 'buenos-aires': 'PBA', caba: 'CABA' };
const GROUPS = [['sportsbook', 'deportes'], ['sportsbook.odds1x2', 'cuotas'], ['casino', 'casino'], ['app', 'app'], ['payments', 'pagos'], ['rg', 'juego responsable']];
function reviewLead(h, o, R) {
  const hosts = [...new Set(R.r.facts.map(f => new URL(R.doc(f.doc).url).hostname.replace(/^www\./, '')).filter(x => !/^support\.|^ayuda\.|^help\./.test(x)))];
  const has = GROUPS.filter(([k]) => R.r.facts.some(f => f.field === k || f.field.startsWith(k + '.'))).map(([, w]) => w);
  return 'Recorrimos ' + joinY(hosts) + ' desde Argentina, sin abrir cuenta' + (has.length > 2 ? ': ' + joinY(has) : has.length ? ', y solo encontramos datos de ' + joinY(has) : ', y guardamos lo que muestra su página') + '. Cada dato va con la cita de su página y la fecha. ' + o.lead;
}
export function opCopy(o) {
  const name = brandNames()[o.brand];
  const regs = loadRegistries().filter(r => SITE.registries.includes(r.id)), jurs = regs.filter(r => r.licensees.some(l => l.brand === o.brand)).map(r => r.id);
  const provName = Object.fromEntries(loadRg().provinces.map(p => [p.id, p.name]));
  const fit = (n, ...xs) => xs.find(x => x.length <= n) || xs.at(-1);
  const rv = loadReviews()[o.brand];
  if (rv && (rv.facts || []).length) {
    const has = GROUPS.filter(([k]) => rv.facts.some(f => f.field === k || f.field.startsWith(k + '.'))).map(([, w]) => w);
    const list = has.length < 2 ? has.join('') : has.slice(0, -1).join(', ') + ' y ' + has.at(-1);
    const span = (...xs) => xs.find(x => x.length >= 115 && x.length <= 155) || xs.at(-1);
    const what = list ? ' (' + list + ')' : '';
    const of = jurs.length > 1 ? 'de cada provincia' : 'de ' + provName[jurs[0]];
    return {
      title: fit(60, name + ' Argentina: reseña, licencias y sitio oficial', name + ': reseña, licencias y sitio oficial', name + ': reseña y sitio oficial'),
      h1: name + ' en Argentina: reseña con datos, licencias y sitio oficial' + (jurs.length > 1 ? ' por provincia' : ''),
      description: span('Reseña de ' + name + ' en Argentina con datos de su sitio' + what + ', sus licencias y el sitio oficial ' + of + '.',
        'Reseña de ' + name + ' en Argentina con datos de su sitio' + what + ', licencias y sitio oficial' + (jurs.length > 1 ? ' por provincia.' : '.'),
        'Reseña de ' + name + ' con datos de su sitio' + what + ', licencias y sitio oficial.',
        'Reseña de ' + name + ' en Argentina: lo que muestra su sitio' + what + ', lo que no pudimos ver, sus licencias y el sitio oficial ' + of + '.',
        'Reseña de ' + name + ': lo que muestra su sitio' + what + ', lo que no pudimos ver, licencias y sitio oficial.'),
    };
  }
  const where = jurs.length === 1 ? (SHORT[jurs[0]] || provName[jurs[0]]) : null;
  return {
    title: where ? fit(60, name + ': licencia en ' + where + ' y sitio oficial', name + ': licencia y sitio oficial') : fit(60, name + ' Argentina: licencias y sitio oficial por provincia', name + ': licencias y sitio oficial por provincia', name + ': licencias y sitio oficial'),
    h1: o.h1, description: o.description,
  };
}
export function operatorPage(o) {
  const c = opCopy(o);
  return {
    path: '/operador/' + o.slug,
    id: 'operador-' + o.slug,
    kind: 'operator',
    jurisdiction: o.jurisdiction,
    brand: o.brand,
    title: c.title,
    description: c.description,
    h1: c.h1,
    ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ...(h.built('/operadores') ? [['/operadores', 'Operadores']] : []), ['/operador/' + o.slug, h.names[o.brand]]])],
    render(h) {
      const D = opData(h.today);
      const row = rowOf(h, o.brand);
      checks(h, o, row);
      const n = presence(row), all = entries(h);
      const R = review(h.today, o.brand), isRev = !!(R && R.r.facts.length);
      if ((h.lang === 'en' ? /review/i : /rese[nñ]a/i).test(h.page.title + h.page.h1 + h.page.description) !== isRev) throw new Error('/operador/' + o.slug + ': title/H1/description ' + (isRev ? 'must say «reseña» (review data exists)' : 'say «reseña» but there is no review data'));
      const hero = '<section class="rl-hero rl-hero-pv rl-hero-op"><div><p class="rl-kick">' + (isRev ? 'Reseña con datos · sitio visto desde Argentina el ' + h.fmtDate(R.r.collected) + ' · listas copiadas el ' : 'Ficha de operador · listas copiadas el ') + h.fmtDate(h.regs.map(r => r.checked).sort()[0]) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
        '<p class="rl-lead">' + h.esc(isRev ? o.reviewLead || reviewLead(h, o, R) : o.lead) + '</p>' + officialLinks(h, o.brand, h.regs.filter(r => row.cells[r.id]).map(r => r.id)) + '<p class="rl-note">Sin promociones ni afiliados. Depende de la ley de tu provincia; esto no es asesoramiento legal.</p></div>' +
        '<div class="rl-big">' + (hasThumb(o.brand) ? '<img class="rl-bigt" src="' + h.asset('shots/' + thumbName(o.brand)) + '" width="' + THUMB.w + '" height="' + THUMB.h + '" decoding="async" alt="' + h.esc('Captura propia del sitio de ' + h.names[o.brand]) + '">' : '') + '<b>' + n + '<small> de ' + h.regs.length + '</small></b><span>listas oficiales que revisamos lo nombran</span><small>' + h.esc(o.angle) + '</small>' + listChips(h, row) + '</div></section>';
      const aid = o.platform ? help(h, { j: h.rg.prov(o.jurisdiction), name: h.rg.prov(o.jurisdiction).name }) : '';
      if (isRev) {
        const casinoPath = '/operador/' + o.slug + '/casino';
        const rgN = new Set(R.pre('rg').map(f => f.field)).size + new Set(rgQuotes(D, o).map(q => q.topic)).size;
        const extra = {
          casino: h.built(casinoPath) ? '<p class="rl-note"><a href="' + h.href(casinoPath) + '">' + h.esc(row.name) + ' Casino: juegos, proveedores y en qué provincias tiene licencia</a></p>' : '',
          'juego-responsable': rgN === 0 ? '' : toolsSection(h, o, D, 'rg') + '<p class="rl-note">Que una herramienta figure acá no quiere decir que la hayamos probado: no abrimos cuentas. Las herramientas que exige cada provincia y sus líneas de ayuda están más abajo y en la página de cada provincia.</p>',
          pagos: toolsSection(h, o, D, 'pay'),
          app: appExtra(h, R),
        };
        const present = SECTIONS.filter(x => reviewSection(h, R, x, { ...extra, skipEmpty: true }));
        const ids = new Set(present.map(x => x[0])), moved = new Set(R.shots.filter(x => ids.has(VIEW_SECTION[x.view])));
        const secShots = {};
        for (const x of moved) secShots[VIEW_SECTION[x.view]] = (secShots[VIEW_SECTION[x.view]] || '') + reviewShots(h, { ...R, shots: [x] }, viewLabel);
        const sec = present.map(x => reviewSection(h, R, x, { ...extra, shots: secShots })).join('');
        const shots = shotsSection(h, o, D, R, moved);
        const miss = missingSection(h, R, SECTIONS.filter(x => !present.includes(x) && x[0] !== 'sitio'), !shots);
        return hero + toc(h, [...(miss ? [['sin-ver', 'Lo que no vimos']] : []), ...(shots ? [['capturas', 'Capturas']] : [])], present.map(x => x[0])) + summary(h, R, { lists: n, total: h.regs.length, rgCount: rgN, casinoPath, missingLink: !!miss }) + enterSection(h, R, o, row) + sec + miss +
          mapSection(h, o, row) + (R.pre('licence').length ? reviewSection(h, R, ['pie', 'La licencia según el pie de cada sitio', 'licence']) : '') + platformSection(h, o, row) + listsTable(h, o, row) + addressSection(h, o, row, all) + regSays(h, o) + siteSays(h, o, D, row) + relatedSection(h, o, D) + shots + aid + nextSection(h, row);
      }
      return hero + (R ? visitsSection(h, R) : '') + mapSection(h, o, row) + platformSection(h, o, row) + listsTable(h, o, row) + addressSection(h, o, row, all) + regSays(h, o) + siteSays(h, o, D, row) + relatedSection(h, o, D) + shotsSection(h, o, D) + toolsSection(h, o, D) + aid + nextSection(h, row);
    },
  };
}
export const operatorPages = OPS.map(operatorPage);
export { src };
