import { TILES } from '../content/map.mjs';
import { PROV_COPY } from '../content/provcopy.mjs';
import { provData, pdQuote, pdSrc, STATUS_LABEL } from '../content/provdata.mjs';
import { brandMatrix, distinctHosts } from '../../../engine/registry.mjs';
import { src, quote, rgQuote, hostHtml, sectionHead } from './parts.mjs';

export function relief(h, P, cur, { links = false, cls: clsOf = null, tip = null } = {}) {
  const tiles = P.all.map(x => {
    const t = TILES.find(y => y.id === x.id);
    const cls = (clsOf ? clsOf(x) : 'rl-s-' + x.st) + (x.id === cur ? ' rl-cur' : '');
    const label = x.name + ': ' + (tip ? tip(x) : x.label);
    if (links && h.built('/provincia/' + x.id)) return '<a class="' + cls + '" style="grid-area:' + t.area + '" href="' + h.href('/provincia/' + x.id) + '" aria-label="' + h.esc(label) + '">' + x.code + '</a>';
    return '<i class="' + cls + '" style="grid-area:' + t.area + '">' + x.code + '</i>';
  }).join('');
  return '<div class="rl-relw"' + (links ? '' : ' aria-hidden="true"') + '><div class="rl-rel">' + tiles + '</div></div>';
}
export function reliefLegend() {
  return '<ul class="rl-rleg">' + ['list', 'platform', 'none', 'blocked'].map(s => '<li><i class="rl-s-' + s + '"></i>' + STATUS_LABEL[s] + '</li>').join('') + '</ul>';
}

function chips(h, x) {
  const c = ['<span class="rl-c-' + x.st + '">' + h.esc(x.label) + '</span>'];
  if (x.st === 'list') c.push('<span>' + x.n + (x.n === 1 ? ' sitio en la lista' : ' sitios en la lista') + '</span>');
  if (x.st === 'platform') c.push('<span>' + x.n + (x.n === 1 ? ' plataforma enlazada' : ' plataformas enlazadas') + '</span>');
  c.push(x.j.line ? '<span>línea de ayuda provincial</span>' : '<span class="rl-c-off">sin línea provincial verificada</span>');
  if (x.j.selfExclusion) c.push('<span>autoexclusión' + (x.j.selfExclusion.terms ? ': ' + h.esc(x.j.selfExclusion.terms) : '') + '</span>');
  if (x.j.age) c.push('<span>18+ con cita oficial</span>');
  if (x.date) c.push('<span class="rl-c-off">copia del ' + h.fmtDate(x.date) + '</span>');
  return '<div class="rl-chips rl-pchips">' + c.join('') + '</div>';
}

function hero(h, P, x, o) {
  const kick = x.code + ' · ' + x.label;
  const side = '<div class="rl-pvv">' + relief(h, P, x.id) +
    '<p class="rl-pvn">' + (x.n !== null ? '<b>' + x.n + '</b>' : '<b class="rl-pvn-0">-</b>') + '<span>' + h.esc(
      x.st === 'list' ? (x.n === 1 ? 'sitio en la lista oficial de ' : 'sitios en la lista oficial de ') + x.reg.regulator.short :
      x.st === 'platform' ? (x.n === 1 ? 'plataforma enlazada por el regulador' : 'plataformas enlazadas por el regulador') :
      x.st === 'none' ? 'sitios que podamos citar: no hay lista oficial verificada' : 'datos publicados: la fuente no se puede consultar') + '</span></p>' +
    '<p class="rl-pvcap">' + h.esc(x.name) + ' resaltada en el mapa de las 24 jurisdicciones</p></div>';
  return '<section class="rl-hero rl-hero-pv rl-hero-pr"><div><p class="rl-kick">' + h.esc(kick) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
    '<p class="rl-lead">' + h.t(o.lead) + '</p>' + chips(h, x) + '</div>' + side + '</section>';
}

function sites(h, r) {
  return '<ul class="rl-sites" data-nosnippet>' + r.licensees.map(l => '<li><h3>' + h.esc(h.names[l.brand]) + '</h3>' + hostHtml(h, l.host) +
    (l.ref ? '<span class="rl-ref">Autorizado por ' + h.esc(l.ref) + '</span>' : '') + '</li>').join('') + '</ul>';
}

function others(h, x) {
  const r = x.reg;
  const matrix = brandMatrix(h.regs, h.names).filter(row => row.cells[r.id] && Object.values(row.cells).filter(Boolean).length > 1);
  if (!matrix.length) return '';
  const code = id => TILES.find(t => t.id === id).code;
  const split = matrix.filter(row => distinctHosts(row) > 1).length;
  return '<section class="rl-sec">' + sectionHead(h, '¿Estás en el sitio de ' + x.name + '?', split ? 'misma marca, otra dirección' : 'misma marca en otras listas') +
    '<p class="rl-note">Estas marcas figuran también en otra lista oficial. En la lista de ' + h.esc(x.name) + ' figura la dirección resaltada; cada provincia autoriza la suya.</p>' +
    '<div class="rl-dom" data-nosnippet>' + matrix.map(row => '<article><h3>' + h.esc(row.name) + '</h3><ul>' +
      h.regs.filter(y => row.cells[y.id]).map(y => '<li><span class="rl-tag">' + h.esc(code(y.id)) + '</span>' + (y.id === r.id ? hostHtml(h, row.cells[y.id].host) : '<span class="rl-host rl-src">' + h.esc(row.cells[y.id].host) + '</span>') + '</li>').join('') +
      '</ul></article>').join('') + '</div></section>';
}

function help(h, x) {
  const j = x.j, parts = [];
  if (j.line) parts.push('<div class="rl-box"><h3>' + h.esc(j.line.name) + '</h3><a class="rl-tel" href="tel:' + h.esc(j.line.phoneTel) + '">' + h.esc(j.line.phone) + '</a>' +
    (j.line.free ? '<p>Línea gratuita.</p>' : '') + (j.line.hours ? '<p>' + h.esc(j.line.hours) + '.</p>' : '') + rgQuote(h, j.line, j.line.name) + '</div>');
  else parts.push('<div class="rl-box"><h3>Línea de ayuda</h3><p>No verificamos una línea propia de ' + h.esc(x.name) + '. La línea nacional de salud mental atiende en todo el país:</p><a class="rl-tel" href="tel:' + h.esc(h.rg.crisis.phoneTel) + '">' + h.esc(h.rg.crisis.phone) + '</a><p>' + h.esc(h.rg.crisis.hours) + '.</p></div>');
  if (j.selfExclusion) parts.push('<div class="rl-box"><h3>Autoexclusión' + (j.selfExclusion.terms ? ': ' + h.esc(j.selfExclusion.terms) : '') + '</h3><p>' + h.esc(j.selfExclusion.name) + '.' +
    (j.selfExclusion.terms ? '' : ' La página oficial no indica un plazo, así que no lo publicamos.') + '</p>' + rgQuote(h, j.selfExclusion, j.selfExclusion.name) + '</div>');
  else parts.push('<div class="rl-box"><h3>Autoexclusión</h3><p>No encontramos en una página oficial cómo pedir la autoexclusión en esta jurisdicción, así que no lo publicamos. Consultá en la línea de ayuda.</p></div>');
  return '<section class="rl-sec">' + sectionHead(h, 'Ayuda y autoexclusión en ' + x.name) + '<div class="rl-two">' + parts.join('') + '</div>' +
    (h.built('/juego-responsable') ? '<p class="rl-note"><a href="' + h.href('/juego-responsable') + '">Líneas de ayuda de todas las provincias</a></p>' : '') + '</section>';
}

function age(h, x) {
  const j = x.j;
  if (!j.age) return '';
  return '<section class="rl-sec">' + sectionHead(h, 'Edad mínima: ' + j.age.value + ' años') + rgQuote(h, j.age, j.regulator ? j.regulator.name : j.name) + '</section>';
}

function regulatorBox(h, x, extra = '') {
  const reg = x.j.regulator;
  if (!reg && !extra) return '';
  return '<div class="rl-box"><h3>' + h.esc(reg ? reg.name : 'Regulador') + '</h3>' + (reg ? rgQuote(h, reg, reg.name) : '') + extra + '</div>';
}

function nextSteps(h) {
  const l = [['/guia/como-verificar', 'Cómo verificar un sitio paso a paso'], ['/verificador', 'Verificar una dirección contra las listas'], ['/provincias', 'Estado de las 24 jurisdicciones']].filter(([u]) => h.built(u));
  if (!l.length) return '';
  return '<section class="rl-sec">' + sectionHead(h, 'Mientras tanto') + '<div class="rl-gd">' + l.map(([u, t], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(t) + '</a>').join('') + '</div></section>';
}

function listBody(h, P, x, o) {
  const r = x.reg;
  const list = '<section class="rl-sec">' + sectionHead(h, 'Los sitios de la lista oficial', 'tal como los publica el regulador') + sites(h, r) +
    [r.list.doc, ...(r.list.more || []).map(m => m.doc)].map(d => src(h, d)).join('') + '</section>';
  const shown = Object.values(r.quotes).filter(q => !q.hidden && ['regulator', 'list', 'domain', 'platform'].includes(q.role));
  const reg = x.j.regulator && !shown.some(q => q.text === x.j.regulator.quote) ? x.j.regulator : null;
  const who = '<section class="rl-sec">' + sectionHead(h, 'Quién regula y con qué norma') + '<div class="rl-two">' +
    '<div class="rl-box"><h3>' + h.esc(r.regulator.name) + '</h3>' + (reg ? rgQuote(h, reg, reg.name) : '') + shown.map(q => quote(h, q, r.regulator.short)).join('') + '</div>' +
    '<div class="rl-box"><h3>La norma</h3>' + (r.law.length ? r.law.map(l => '<p><b>' + h.esc(l.name) + '</b>' + (l.date ? ' · ' + h.esc(l.date.text) : '') + '</p>' + quote(h, r.quotes[l.quote], l.name)).join('') :
      '<p>No citamos una ley de la jurisdicción porque todavía no guardamos su texto oficial. Lo que sí está verificado es la lista del regulador' + (r.quotes.date ? ', publicada el ' + h.esc(r.quotes.date.text) : '') + '.</p>') + '</div>' +
    '</div></section>';
  const tools = Object.values(r.quotes).filter(q => q.role === 'tool');
  const extra = tools.length ? '<section class="rl-sec">' + sectionHead(h, o.toolsTitle || 'Herramientas del regulador') + '<div class="rl-law">' + tools.map(q => '<article>' + quote(h, q, r.regulator.short) + '</article>').join('') + '</div></section>' : '';
  const report = r.quotes.report ? '<section class="rl-sec">' + sectionHead(h, 'Denunciar juego ilegal') + quote(h, r.quotes.report, r.regulator.short) + '</section>' : '';
  const ageQ = !x.j.age && r.quotes.age ? '<section class="rl-sec">' + sectionHead(h, 'Edad mínima') + quote(h, r.quotes.age, r.regulator.short) + '</section>' : age(h, x);
  return list + others(h, x) + who + extra + report + ageQ + help(h, x);
}

function platformBody(h, P, x) {
  const e = x.e;
  const cards = '<section class="rl-sec">' + sectionHead(h, e.platforms.length === 1 ? 'La plataforma que enlaza el regulador' : 'Las plataformas que enlaza el regulador', 'enlace en su sitio oficial, sin lista de otros operadores') +
    '<div class="rl-plat" data-nosnippet>' + e.platforms.map(p => {
      const d = P.doc(p.evidence.doc);
      return '<article><h3>' + h.esc(p.name) + '</h3>' + hostHtml(h, p.host) + (p.quote ? pdQuote(h, P, p.quote, x.j.regulator ? x.j.regulator.name : x.name) : '<p class="rl-note">El enlace está en el portal del regulador, sin texto propio que citar.</p>') +
        '<p class="rl-src">Enlazada desde ' + h.esc(d.host) + ' · copia del ' + h.fmtDate(d.fetched) + '</p></article>';
    }).join('') + '</div>' +
    '<p class="rl-note">Qué quiere decir: el sitio oficial del regulador manda a esta dirección para jugar online. No encontramos una lista de otros operadores habilitados en ' + h.esc(x.name) + ', así que no decimos que no existan ni cuáles serían.</p>' +
    [...new Set(e.platforms.map(p => p.evidence.doc))].map(d => pdSrc(h, P, d)).join('') + '</section>';
  const who = x.j.regulator ? '<section class="rl-sec">' + sectionHead(h, 'Quién regula') + '<div class="rl-two">' + regulatorBox(h, x) +
    (e.report ? '<div class="rl-box"><h3>Denunciar juego ilegal</h3>' + pdQuote(h, P, e.report, x.j.regulator.name) + '</div>' : '') + '</div></section>' : '';
  return cards + who + age(h, x) + help(h, x);
}

function seenBody(h, P, x, o) {
  const e = x.e;
  const boxes = (e.seen || []).map(s => {
    const d = P.doc(s.doc);
    return '<div class="rl-box"><h3>' + h.esc(d.host + (d.path && d.path !== '/' ? d.path : '')) + '</h3><p>Copiamos esta página el ' + h.fmtDate(d.fetched) + '. No enlaza ningún sitio .bet.ar ni muestra una lista de plataformas online.</p>' +
      Object.values(e.quotes || {}).filter(q => q.doc === s.doc).map(q => pdQuote(h, P, q, x.j.regulator ? x.j.regulator.name : d.host)).join('') + pdSrc(h, P, s.doc) + '</div>';
  });
  if (o.checked) boxes.push('<div class="rl-box"><h3>' + (x.st === 'blocked' ? 'Por qué no la usamos' : 'Qué intentamos') + '</h3><p>' + h.esc(o.checked) + '</p></div>');
  const what = '<section class="rl-sec">' + sectionHead(h, 'Qué revisamos', x.st === 'blocked' ? 'fuente no consultable: no afirmamos nada sobre sitios' : 'sin lista oficial verificada') +
    '<div class="rl-two">' + boxes.join('') + '</div>' +
    '<p class="rl-note">Que no haya lista acá no quiere decir que no haya sitios habilitados en ' + h.esc(x.name) + ', ni que los haya. Depende de la ley de tu provincia; esto no es asesoramiento legal.</p></section>';
  const who = x.j.regulator ? '<section class="rl-sec">' + sectionHead(h, 'Quién regula') + '<div class="rl-two">' + regulatorBox(h, x) + '</div></section>' : '';
  return what + who + age(h, x) + help(h, x) + nextSteps(h);
}

export function province(id) {
  const o = PROV_COPY[id];
  if (!o) throw new Error('no copy for province ' + id);
  return {
    path: '/provincia/' + id,
    id: 'provincia-' + id,
    kind: 'province',
    jurisdiction: id,
    title: o.title,
    description: o.description,
    h1: o.h1,
    ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], [h.built('/provincias') ? '/provincias' : '/licencias', h.built('/provincias') ? 'Provincias' : 'Licencias'], ['/provincia/' + id, h.rg.prov(id).name]])],
    render(h) {
      const P = provData(h), x = P.one(id);
      if (x.st !== o.status) throw new Error('/provincia/' + id + ': the copy is written for status ' + o.status + ' but the verified data says ' + x.st);
      const body = x.st === 'list' ? listBody(h, P, x, o) : x.st === 'platform' ? platformBody(h, P, x) : seenBody(h, P, x, o);
      return hero(h, P, x, o) + body;
    },
  };
}

export const provinces = TILES.map(t => t.id).sort((a, b) => {
  const order = ['buenos-aires', 'caba', 'cordoba'];
  const ia = order.indexOf(a), ib = order.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
}).map(province);
