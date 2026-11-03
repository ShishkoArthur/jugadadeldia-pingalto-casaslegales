import { CODE } from '../content/map.mjs';
import { src, hostHtml, sectionHead } from './parts.mjs';

export const licencias = {
  path: '/licencias',
  id: 'licencias',
  kind: 'registry',
  title: 'Registro de licencias de apuestas online por provincia',
  description: 'Registro de licencias de juego online en Argentina: los {{lic_total}} sitios de {{reg_total}} listas oficiales, con su dirección, provincia, acto y fecha de copia.',
  h1: 'Registro de licencias: sitio por sitio y provincia por provincia',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/licencias', 'Licencias']])],
  render(h) {
    const regs = h.regs;
    const all = regs.flatMap(r => r.licensees.map(l => ({ r, l })));
    const stats = '<div class="rl-stats" data-nosnippet>' +
      '<div><b>' + h.t('{{lic_total}}') + '</b><span>sitios en listas oficiales</span></div>' +
      '<div><b>' + h.t('{{brand_total}}') + '</b><span>marcas distintas</span></div>' +
      '<div><b>' + h.t('{{reg_total}}') + '</b><span>listas oficiales verificadas</span></div>' +
      '<div><b>' + h.t('{{jur_total}}') + '</b><span>jurisdicciones en el país</span></div></div>';
    const intro = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">' + h.t('Listas oficiales copiadas el {{checked}}') + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Cada fila es un sitio que figura en la lista oficial de una jurisdicción, tal como la publica su regulador. Al lado va el acto de autorización cuando la lista lo muestra y la fecha de nuestra copia. Las direcciones van como texto: no enlazamos a ningún operador.</p></div>' +
      '<div class="rl-big"><b>' + h.t('{{lic_total}}') + '</b><span>sitios con licencia en las listas que verificamos</span><small>' + h.t('{{reg_total}} de {{jur_total}} jurisdicciones') + '</small></div></section>';
    const filter = '<div class="rl-filter" data-rl-filter role="group" aria-label="Filtrar por jurisdicción"><button type="button" data-f="all" aria-pressed="true">Todas</button>' +
      regs.map(r => '<button type="button" data-f="' + r.id + '" aria-pressed="false">' + h.esc(h.rg.prov(r.id).name) + '</button>').join('') + '</div>';
    const rows = all.map(({ r, l }) => '<tr data-j="' + r.id + '"><th scope="row">' + h.esc(h.names[l.brand]) + '</th><td>' + h.esc(CODE[r.id]) + '</td><td class="rl-host">' + hostHtml(h, l.host) + '</td><td>' +
      (l.ref ? h.esc(l.ref) : '<span class="rl-src">la lista no lo indica</span>') + '</td><td>' + h.esc(r.regulator.short) + ' · ' + h.fmtDate(h.doc(l.evidence.doc).fetched) + '</td></tr>').join('');
    const table = '<section class="rl-sec">' + sectionHead(h, 'Todos los sitios', 'mostrando ') .replace('</p></div>', '<span data-rl-count>' + all.length + '</span></p></div>') +
      filter + '<div class="rl-card" data-nosnippet><div class="rl-scroll"><table class="rl-reg"><thead><tr><th scope="col">Marca</th><th scope="col">Jurisdicción</th><th scope="col">Dirección</th><th scope="col">Acto</th><th scope="col">Regulador y copia</th></tr></thead><tbody data-rl-rows>' + rows + '</tbody></table></div>' +
      regs.map(r => src(h, r.list.doc, h.rg.prov(r.id).name)).join('') + '</div></section>';
    const read = '<section class="rl-sec">' + sectionHead(h, 'Cómo leer esta tabla') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Figura en la lista</h3><p>El regulador de esa jurisdicción publica esa dirección entre los sitios autorizados. Cada jurisdicción otorga sus propias licencias: lo que figura es esa dirección exacta, en esa lista.</p></div>' +
      '<div class="rl-box"><h3>No está en la tabla</h3><p>Puede ser que el sitio tenga licencia en una provincia cuya lista todavía no verificamos, o que no tenga licencia. Por eso «no figura» nunca quiere decir «ilegal»: depende de la ley de tu provincia.</p></div>' +
      '</div>' + (h.built('/metodologia') ? '<p class="rl-note"><a href="' + h.href('/metodologia') + '">Cómo copiamos y verificamos cada lista</a></p>' : '') + '</section>';
    return intro + stats + table + read;
  },
};
