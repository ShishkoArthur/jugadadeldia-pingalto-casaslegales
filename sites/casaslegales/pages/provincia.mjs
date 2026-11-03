import { SHORT, CODE } from '../content/map.mjs';
import { brandMatrix, distinctHosts } from '../../../engine/registry.mjs';
import { src, quote, rgQuote, hostHtml, sectionHead } from './parts.mjs';

function sites(h, r) {
  return '<ul class="rl-sites" data-nosnippet>' + r.licensees.map(l => '<li><h3>' + h.esc(h.names[l.brand]) + '</h3>' + hostHtml(h, l.host) +
    (l.ref ? '<span class="rl-ref">Autorizado por ' + h.esc(l.ref) + '</span>' : '') + '</li>').join('') + '</ul>';
}

function others(h, r) {
  const matrix = brandMatrix(h.regs, h.names).filter(row => row.cells[r.id] && distinctHosts(row) > 1);
  if (!matrix.length) return '';
  return '<section class="rl-sec">' + sectionHead(h, '¿Estás en el sitio de ' + SHORT[r.id] + '?', 'misma marca, otra dirección') +
    '<p class="rl-note">Estas marcas figuran también en otra lista oficial, con otra dirección. En la lista de ' + h.esc(h.rg.prov(r.id).name) + ' figura la dirección resaltada.</p>' +
    '<div class="rl-dom" data-nosnippet>' + matrix.map(row => '<article><h3>' + h.esc(row.name) + '</h3><ul>' +
      h.regs.filter(x => row.cells[x.id]).map(x => '<li><span class="rl-tag">' + h.esc(CODE[x.id]) + '</span>' + (x.id === r.id ? hostHtml(h, row.cells[x.id].host) : '<span class="rl-host rl-src">' + h.esc(row.cells[x.id].host) + '</span>') + '</li>').join('') +
      '</ul></article>').join('') + '</div></section>';
}

function help(h, j) {
  const parts = [];
  if (j.line) parts.push('<div class="rl-box"><h3>' + h.esc(j.line.name) + '</h3><a class="rl-tel" href="tel:' + h.esc(j.line.phoneTel) + '">' + h.esc(j.line.phone) + '</a>' +
    (j.line.free ? '<p>Línea gratuita.</p>' : '') + (j.line.hours ? '<p>' + h.esc(j.line.hours) + '.</p>' : '') + rgQuote(h, j.line, j.line.name) + '</div>');
  if (j.selfExclusion) parts.push('<div class="rl-box"><h3>Autoexclusión: ' + h.esc(j.selfExclusion.terms) + '</h3><p>' + h.esc(j.selfExclusion.name) + '.</p>' +
    rgQuote(h, j.selfExclusion, j.selfExclusion.name) + '</div>');
  else parts.push('<div class="rl-box"><h3>Autoexclusión</h3><p>No encontramos en una página oficial el plazo de la autoexclusión de esta jurisdicción, así que no lo publicamos. Consultá en la línea de ayuda.</p></div>');
  return parts.join('');
}

export function province(id, o) {
  return {
    path: '/provincia/' + id,
    id: 'provincia-' + id,
    kind: 'province',
    jurisdiction: id,
    title: o.title,
    description: o.description,
    h1: o.h1,
    ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/licencias', 'Licencias'], ['/provincia/' + id, h.rg.prov(id).name]])],
    render(h) {
      const r = h.reg(id), j = h.rg.prov(id);
      const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">' + h.esc(SHORT[id]) + ' · lista oficial copiada el ' + h.fmtDate(h.doc(r.list.doc).fetched) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
        '<p class="rl-lead">' + h.t(o.lead) + '</p></div>' +
        '<div class="rl-big"><b>' + r.licensees.length + '</b><span>sitios en la lista oficial de ' + h.esc(r.regulator.short) + '</span><small>' + h.esc(j.name) + '</small></div></section>';
      const list = '<section class="rl-sec">' + sectionHead(h, 'Los sitios de la lista oficial', 'tal como los publica el regulador') + sites(h, r) + src(h, r.list.doc) + '</section>';
      const shown = Object.values(r.quotes).filter(q => !q.hidden && (q.role === 'regulator' || q.role === 'list' || q.role === 'domain'));
      const reg = j.regulator && !shown.some(q => q.text === j.regulator.quote) ? j.regulator : null;
      const who = '<section class="rl-sec">' + sectionHead(h, 'Quién regula y con qué norma') + '<div class="rl-two">' +
        '<div class="rl-box"><h3>' + h.esc(r.regulator.name) + '</h3>' + (reg ? rgQuote(h, reg, reg.name) : '') + shown.map(q => quote(h, q, r.regulator.short)).join('') + '</div>' +
        '<div class="rl-box"><h3>La norma</h3>' + (r.law.length ? r.law.map(l => '<p><b>' + h.esc(l.name) + '</b>' + (l.date ? ' · ' + h.esc(l.date.text) : '') + '</p>' + quote(h, r.quotes[l.quote], l.name)).join('') :
          '<p>No citamos una ley de la jurisdicción porque todavía no guardamos su texto oficial. Lo que sí está verificado es la lista del regulador.</p>') + '</div>' +
        '</div></section>';
      const tools = Object.values(r.quotes).filter(q => q.role === 'tool');
      const extra = tools.length ? '<section class="rl-sec">' + sectionHead(h, o.toolsTitle || 'Herramientas del regulador') + '<div class="rl-law">' + tools.map(q => '<article>' + quote(h, q, r.regulator.short) + '</article>').join('') + '</div></section>' : '';
      const age = j.age ? '<section class="rl-sec">' + sectionHead(h, 'Edad mínima: ' + j.age.value + ' años') + rgQuote(h, j.age, j.regulator ? j.regulator.name : j.name) + '</section>' : '';
      const ayuda = '<section class="rl-sec">' + sectionHead(h, 'Ayuda y autoexclusión en ' + SHORT[id]) + '<div class="rl-two">' + help(h, j) + '</div>' +
        (h.built('/juego-responsable') ? '<p class="rl-note"><a href="' + h.href('/juego-responsable') + '">Líneas de ayuda de todas las provincias</a></p>' : '') + '</section>';
      return hero + list + others(h, r) + who + extra + age + ayuda;
    },
  };
}

export const provinces = [
  province('buenos-aires', {
    title: 'Apuestas online legales en Provincia de Buenos Aires',
    description: 'Apuestas online legales en Provincia de Buenos Aires: los {{pba_n}} sitios de la lista oficial del IPLyC, la ley 15.079, la línea de ayuda y la autoexclusión.',
    h1: 'Provincia de Buenos Aires: las {{pba_n}} licencias de juego online y cómo reconocerlas',
    lead: 'La Lotería de la Provincia publica una lista de {{pba_n}} sitios con licencia de juego online. Acá está esa lista, la norma que la sostiene y cómo distinguir la dirección bonaerense de la porteña de una misma marca.',
  }),
  province('caba', {
    title: 'Apuestas online legales en CABA: sitios que autorizó LOTBA',
    description: 'Sitios de apuestas autorizados por LOTBA en la Ciudad de Buenos Aires: cada agencia con su disposición y año, y cómo no confundir un sitio porteño con PBA.',
    h1: 'Ciudad de Buenos Aires: sitios de apuestas autorizados por LOTBA',
    lead: 'La Lotería de la Ciudad publica las agencias autorizadas para el juego en línea en la Ciudad: hoy son {{caba_n}}, cada una con el número de disposición o resolución que la habilitó.',
  }),
  province('cordoba', {
    title: 'Apuestas online legales en Córdoba: las {{cba_n}} plataformas',
    description: 'Apuestas online legales en Córdoba: las plataformas habilitadas por la Lotería de Córdoba, sus dominios y las herramientas de control LUCA y NoVa+.',
    h1: 'Córdoba: las {{cba_n}} plataformas de juego online habilitadas',
    lead: 'La Lotería de Córdoba muestra {{cba_n}} sitios oficiales de juego online, con una licencia otorgada por resolución de su directorio. Además ofrece dos herramientas para bloquear sitios ilegales.',
    toolsTitle: 'NoVa+ y LUCA: las herramientas de la Lotería',
  }),
];
