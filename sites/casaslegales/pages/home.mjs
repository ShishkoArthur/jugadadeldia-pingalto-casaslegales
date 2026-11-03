import { TILES, CODE } from '../content/map.mjs';
import { brandMatrix, splitAddress } from '../../../engine/registry.mjs';
import { isoMap, isoHeight, isoLadder } from './iso.mjs';
import { src, quote, hostHtml, sectionHead } from './parts.mjs';
import { provData } from '../content/provdata.mjs';

export const home = {
  path: '/',
  id: 'home',
  kind: 'hub',
  title: 'Casas de apuestas legales en Argentina, por provincia',
  description: 'Qué casas de apuestas tienen licencia en tu provincia: mapa de las {{jur_total}} jurisdicciones de Argentina, regulador, dominios .bet.ar y fecha de verificación.',
  h1: 'Casas de apuestas legales: qué sitio está habilitado en tu provincia',
  ld: h => [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'casaslegales.com', url: 'https://' + h.site.domain + '/', inLanguage: 'es-AR', publisher: h.org() },
    h.org(true),
  ],
  render(h) {
    const def = h.site.defaultJurisdiction;
    const dj = h.rg.prov(def), dreg = h.reg(def);
    const P = provData(h);
    const map = isoMap(h, t => {
      const x = P.one(t.id);
      const label = x.name + ': ' + (x.st === 'list' ? x.n + ' sitios en la lista oficial' : x.st === 'platform' ? x.label + ', ' + x.e.platforms.map(q => q.name).join(', ') : x.label);
      return { kind: x.st, h: isoHeight(x.st, x.n), on: t.id === def, label: t.id === def ? t.code + (x.n !== null ? ' · ' + x.n : '') : null,
        attrs: ' type="button" data-j="' + t.id + '" aria-pressed="' + (t.id === def) + '" aria-label="' + h.esc(label) + '"' };
    }, { size: 'l', tag: 'button', group: true, aria: 'Mapa de las jurisdicciones: la altura de cada ficha es la cantidad de sitios de su lista oficial', ladder: isoLadder(h, P) });
    const opts = TILES.map(t => [t.id, h.rg.prov(t.id).name]).sort((a, b) => a[1].localeCompare(b[1], 'es'))
      .map(([id, n]) => '<option value="' + id + '"' + (id === def ? ' selected' : '') + '>' + h.esc(n) + '</option>').join('');
    const ver = h.built('/verificador');
    const hero = '<section class="rl-hero rl-hero-home"><div class="rl-htxt">' +
      '<p class="rl-kick">' + h.t('{{jur_total}} jurisdicciones · {{reg_total}} listas oficiales verificadas · revisado {{checked}}') + '</p>' +
      '<h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Qué casas de apuestas figuran en la lista oficial de cada provincia, con la cita del regulador y la fecha en que la copiamos. Sin enlaces a operadores, sin bonos. Depende de la ley de tu provincia; esto no es asesoramiento legal.</p>' +
      '<div class="rl-pick"><label for="rl-pick">Elegí tu provincia</label><select id="rl-pick" data-rl-pick>' + opts + '</select></div>' +
      '</div><div class="rl-hside"><aside class="rl-panel" data-rl-panel aria-live="polite"><h2>' + h.esc(dj.name) + '</h2>' +
      '<div class="rl-num" data-s="list">' + dreg.licensees.length + '<small>sitios en la lista oficial</small></div>' +
      '<p class="rl-meta" data-rl-meta>' + h.esc(dreg.regulator.short) + ' · revisado ' + h.fmtDate(dreg.checked) + '</p>' +
      '<p class="rl-line" data-rl-help>Ayuda: <a href="tel:' + h.esc(dj.line.phoneTel) + '">' + h.esc(dj.line.phone) + '</a></p>' +
      '<a class="rl-go" data-rl-go href="' + h.href('/provincia/' + def) + '">Ver ' + h.esc(dj.name) + '</a>' +
      '<div class="rl-leg"><span><i class="rl-s-list"></i>lista oficial verificada</span><span><i class="rl-s-platform"></i>plataforma provincial</span><span><i class="rl-s-none"></i>sin dato verificado</span><span><i class="rl-s-blocked"></i>no consultable</span></div>' +
      '</aside><div class="rl-acts"><a class="rl-b2" href="' + h.href(ver ? '/verificador' : '/licencias') + '">' + (ver ? 'Verificar una dirección' : 'Ver las licencias') + '</a><a class="rl-b2" href="' + h.href('/metodologia') + '">Cómo lo verificamos</a></div></div>' +
      '<div class="rl-hmap">' + map + '</div></section>';

    const regs = h.regs;
    const matrix = brandMatrix(regs, h.names);
    const head = '<thead><tr><th scope="col"><span class="rl-vh">Marca</span></th>' + regs.map(r => '<th scope="col"><abbr title="' + h.esc(h.rg.prov(r.id).name) + '">' + h.esc(CODE[r.id]) + '</abbr></th>').join('') + '</tr></thead>';
    const rows = matrix.map(row => '<tr><th scope="row">' + h.esc(row.name) + '</th>' + regs.map(r => {
      const c = row.cells[r.id];
      return '<td>' + (c ? '<i class="rl-y" title="' + h.esc(c.host) + '"><span class="rl-vh">Figura: ' + h.esc(c.host) + '</span></i>' : '<i class="rl-n"><span class="rl-vh">No figura</span></i>') + '</td>';
    }).join('') + '</tr>').join('');
    const table = '<section class="rl-sec">' + sectionHead(h, 'Licencias por provincia', h.t('{{brand_total}} marcas en {{reg_total}} listas oficiales · fuente y fecha abajo')) +
      '<div class="rl-card" data-nosnippet><div class="rl-scroll"><table class="rl-tbl">' + head + '<tbody>' + rows + '</tbody></table></div>' +
      '<p class="rl-cap">Verde: figura en la lista oficial de esa jurisdicción. Gris: no figura en esa lista (no quiere decir que sea ilegal en otra provincia). Las demás jurisdicciones no tienen una lista verificada acá' + (h.built('/provincias') ? ': su estado está en <a href="' + h.href('/provincias') + '">provincias</a>' : '') + '.</p>' +
      regs.map(r => src(h, r.list.doc, h.rg.prov(r.id).name)).join('') + '</div></section>';

    const multi = splitAddress(matrix);
    const dom = '<section class="rl-sec">' + sectionHead(h, '¿Estás en el sitio de tu provincia?', h.t('{{split_total}} marcas cambian de dirección según la jurisdicción')) +
      '<p class="rl-note">La misma marca puede tener una dirección distinta en cada provincia. En la lista oficial figura una dirección exacta: mirá la dirección completa, no solo el nombre de la marca.</p>' +
      '<div class="rl-dom" data-nosnippet>' + multi.map(row => '<article><h3>' + h.esc(row.name) + '</h3><ul>' +
        regs.filter(r => row.cells[r.id]).map(r => '<li><span class="rl-tag">' + h.esc(CODE[r.id]) + '</span>' + hostHtml(h, row.cells[r.id].host) + '</li>').join('') +
        '</ul></article>').join('') + '</div></section>';

    const pba = h.reg('buenos-aires'), caba = h.reg('caba'), cba = h.reg('cordoba');
    const law = '<section class="rl-sec">' + sectionHead(h, 'Lo que dice cada regulador', 'citas textuales con fecha') + '<div class="rl-law">' +
      '<article><span class="rl-tag">PBA</span>' + quote(h, pba.quotes.licences, pba.regulator.name) + quote(h, pba.quotes.betar, pba.regulator.name) + '</article>' +
      '<article><span class="rl-tag">CABA</span>' + quote(h, caba.quotes.list, caba.regulator.name) + '</article>' +
      '<article><span class="rl-tag">CBA</span>' + quote(h, cba.quotes.list, cba.regulator.name) + quote(h, cba.quotes.licence, cba.regulator.name) + '</article>' +
      '</div></section>';

    const guides = [
      ['/verificador', 'Verificá una dirección contra las listas'],
      ['/operadores', 'Fichas de operadores, con capturas propias'],
      ['/licencias', 'Registro de licencias, sitio por sitio'],
      ['/provincias', 'Las 24 jurisdicciones, una por una'],
      ['/guia/como-verificar', 'Cómo verificar un sitio paso a paso'],
      ['/provincia/buenos-aires', 'Provincia de Buenos Aires'],
      ['/provincia/caba', 'Ciudad de Buenos Aires'],
      ['/provincia/cordoba', 'Córdoba'],
      ['/guia/menores', 'Menores y apuestas: la regla de los 18'],
      ['/calculadora/margen', 'Calculadora de margen de cuotas'],
      ['/guia/bet-ar', 'Qué garantiza el dominio .bet.ar'],
      ['/guia/sitios-ilegales', 'Sitios sin licencia: riesgos y denuncias'],
      ['/juego-responsable', 'Ayuda y autoexclusión en tu provincia'],
      ['/metodologia', 'Cómo verificamos cada dato'],
      ['/registro-de-fuentes', 'Todas las fuentes, con fecha'],
      ['/redaccion', 'Quiénes hacemos este sitio'],
    ].filter(([u]) => h.built(u));
    const gd = '<section class="rl-sec">' + sectionHead(h, 'Por dónde seguir') + '<div class="rl-gd">' +
      guides.map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div></section>';
    return hero + table + dom + law + gd;
  },
};
