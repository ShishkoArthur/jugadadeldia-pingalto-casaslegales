import { provData, STATUS_LABEL, STATUS_ORDER } from '../content/provdata.mjs';
import { relief, reliefLegend } from './provincia.mjs';
import { sectionHead } from './parts.mjs';

const MEANING = {
  list: 'El regulador publica una lista de sitios autorizados. La copiamos, guardamos su huella sha256 y citamos cada dirección tal como aparece.',
  platform: 'El sitio oficial del regulador enlaza su propia plataforma .bet.ar, pero no publica una lista de otros operadores. Mostramos ese enlace y nada más.',
  none: 'Revisamos el sitio del regulador o no encontramos uno que responda, y no hay lista de plataformas online que podamos citar. No nombramos sitios.',
  blocked: 'La fuente oficial existe pero no se puede consultar desde fuera de Argentina, o no está en condiciones de citarse. No afirmamos nada sobre sitios.',
};

export const provincias = {
  path: '/provincias',
  id: 'provincias',
  kind: 'hub',
  title: 'Juego online por provincia: regulador y sitios habilitados',
  description: 'Juego online en las {{jur_total}} jurisdicciones argentinas: quién regula cada una, si hay lista oficial de sitios, la línea de ayuda y la autoexclusión, con fecha.',
  h1: 'Juego online en las {{jur_total}} jurisdicciones: quién regula y qué está verificado',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/provincias', 'Provincias']])],
  render(h) {
    const P = provData(h);
    const stats = '<div class="rl-stats" data-nosnippet>' + STATUS_ORDER.map(s => '<div class="rl-st-' + s + '"><b>' + P.count[s] + '</b><span>' + h.esc(STATUS_LABEL[s]) + '</span></div>').join('') + '</div>';
    const hero = '<section class="rl-hero rl-hero-pv rl-hero-hub"><div><p class="rl-kick">' + h.t('{{jur_total}} jurisdicciones · revisado {{checked}}') + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Cada provincia y la Ciudad de Buenos Aires regulan su propio juego online. Acá está el estado de cada una según lo que pudimos copiar de su regulador: con lista oficial, con una plataforma propia, sin dato verificable o con la fuente bloqueada. Depende de la ley de tu provincia; esto no es asesoramiento legal.</p>' + stats + '</div>' +
      '<div class="rl-pvv">' + relief(h, P, null, { links: true }) + reliefLegend() + '</div></section>';
    const rows = [...P.all].sort((a, b) => STATUS_ORDER.indexOf(a.st) - STATUS_ORDER.indexOf(b.st) || (b.n || 0) - (a.n || 0) || a.name.localeCompare(b.name, 'es')).map(x => {
      const reg = x.reg ? x.reg.regulator.short : x.j.regulator ? (x.j.regulator.short || x.j.regulator.name) : null;
      const what = x.st === 'list' ? x.n + ' sitios' : x.st === 'platform' ? x.e.platforms.map(p => p.name).join(', ') : '-';
      return '<tr data-s="' + x.st + '"><th scope="row"><a href="' + h.href('/provincia/' + x.id) + '">' + h.esc(x.name) + '</a></th>' +
        '<td class="rl-pst"><span class="rl-sb rl-c-' + x.st + '">' + h.esc(x.label) + '</span></td>' +
        '<td data-l="Regulador">' + (reg ? h.esc(reg) : '<span class="rl-src">sin cita</span>') + '</td>' +
        '<td data-l="Sitios">' + h.esc(what) + '</td>' +
        '<td data-l="Ayuda">' + (x.j.line ? '<a href="tel:' + h.esc(x.j.line.phoneTel) + '">' + h.esc(x.j.line.phone) + '</a>' : '<span class="rl-src">nacional</span>') + '</td>' +
        '<td data-l="Autoexclusión">' + (x.j.selfExclusion ? h.esc(x.j.selfExclusion.terms || 'sí, sin plazo publicado') : '<span class="rl-src">sin dato</span>') + '</td>' +
        '<td data-l="Copia">' + (x.date ? h.fmtDate(x.date) : '<span class="rl-src">-</span>') + '</td></tr>';
    }).join('');
    const filter = '<div class="rl-filter" data-rl-sfilter role="group" aria-label="Filtrar por estado"><button type="button" data-f="all" aria-pressed="true">Todas</button>' +
      STATUS_ORDER.map(s => '<button type="button" data-f="' + s + '" aria-pressed="false">' + h.esc(STATUS_LABEL[s]) + '</button>').join('') + '</div>';
    const table = '<section class="rl-sec">' + sectionHead(h, 'Las 24 jurisdicciones', 'la fecha es la de nuestra copia de la fuente oficial') + filter +
      '<div class="rl-card" data-nosnippet><div class="rl-scroll"><table class="rl-reg rl-ptbl"><thead><tr><th scope="col">Jurisdicción</th><th scope="col">Estado</th><th scope="col">Regulador</th><th scope="col">Sitios o plataformas</th><th scope="col">Línea de ayuda</th><th scope="col">Autoexclusión</th><th scope="col">Copia</th></tr></thead><tbody data-rl-srows>' + rows + '</tbody></table></div>' +
      '<p class="rl-cap">«Nacional»: no verificamos una línea propia de esa jurisdicción; la línea nacional de salud mental es ' + h.esc(h.rg.crisis.phone) + '. El regulador se nombra solo cuando una página oficial lo cita.</p></div></section>';
    const meaning = '<section class="rl-sec">' + sectionHead(h, 'Qué quiere decir cada estado') + '<div class="rl-two rl-four">' +
      STATUS_ORDER.map(s => '<div class="rl-box rl-bx-' + s + '"><h3><i class="rl-s-' + s + '"></i>' + h.esc(STATUS_LABEL[s]) + '</h3><p>' + h.esc(MEANING[s]) + '</p><p class="rl-src">' + P.count[s] + ' de ' + P.all.length + ' jurisdicciones</p></div>').join('') + '</div>' +
      (h.built('/metodologia') ? '<p class="rl-note"><a href="' + h.href('/metodologia') + '">Cómo copiamos y verificamos cada fuente</a></p>' : '') + '</section>';
    return hero + table + meaning;
  },
};
