import { TILES } from '../content/map.mjs';
import { rgQuote, sectionHead } from './parts.mjs';

export const ayuda = {
  path: '/juego-responsable',
  id: 'juego-responsable',
  kind: 'help',
  help: true,
  title: 'Juego responsable en Argentina: ayuda en tu provincia',
  description: 'Ayuda con el juego en Argentina: la línea gratuita de tu provincia, la línea de crisis y cómo es la autoexclusión. Sin publicidad ni links de apuestas.',
  h1: 'Ayuda con el juego: líneas y programas en tu provincia',
  ld: h => [h.webPage()],
  render(h) {
    const c = h.rg.crisis;
    const crisis = '<section class="rl-hero"><div><p class="rl-kick">Gratis y confidencial</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Si el juego te está costando plata, sueño o vínculos, no tenés que esperar a tocar fondo para pedir ayuda. Las líneas de esta página son las que publican los organismos oficiales de cada provincia.</p></div>' +
      '<div class="rl-crisis"><h2>Urgencia de salud mental</h2><p>Si estás en peligro o pensás en hacerte daño, llamá ahora. Atiende en todo el país, ' + h.esc(c.hours) + '.</p>' +
      '<a class="rl-tel" href="tel:' + h.esc(c.phoneTel) + '">' + h.esc(c.phone) + '</a>' + rgQuote(h, c, c.name) + '</div></section>';
    const list = TILES.map(t => ({ id: t.id, j: h.rg.prov(t.id) })).sort((a, b) => a.j.name.localeCompare(b.j.name, 'es'));
    const pick = '<div class="rl-pick"><label for="rl-jump">Ir a tu provincia</label><select id="rl-jump" data-rl-jump>' +
      list.map(x => '<option value="' + x.id + '">' + h.esc(x.j.name) + '</option>').join('') + '</select></div>';
    const items = list.map(({ id, j }) => {
      const line = j.line
        ? '<p><a class="rl-tel" href="tel:' + h.esc(j.line.phoneTel) + '">' + h.esc(j.line.phone) + '</a></p><p>' + h.esc(j.line.name) + (j.line.free ? ' · línea gratuita' : '') + (j.line.hours ? ' · ' + h.esc(j.line.hours) : '') + '</p>'
        : '<p class="rl-none">No encontramos una línea provincial en una página oficial que pudiéramos guardar. Usá la línea nacional: <a href="tel:' + h.esc(c.phoneTel) + '">' + h.esc(c.phone) + '</a>.</p>';
      const se = j.selfExclusion
        ? '<p><b>Autoexclusión:</b> ' + h.esc(j.selfExclusion.name) + (j.selfExclusion.terms ? ' · plazo: ' + h.esc(j.selfExclusion.terms) : '') + (j.selfExclusion.web ? ' · <a href="' + h.esc(j.selfExclusion.web) + '" rel="noopener">página oficial</a>' : '') + '</p>'
        : '';
      const age = j.age ? '<p class="rl-src">Edad mínima: ' + j.age.value + ' años</p>' : '';
      return '<li id="j-' + id + '" tabindex="-1"><h3>' + h.esc(j.name) + '</h3>' + line + se + age + '</li>';
    }).join('');
    const lines = '<section class="rl-sec">' + sectionHead(h, 'Líneas por provincia', h.t('{{rg_lines}} de {{jur_total}} jurisdicciones con línea propia verificada')) + pick + '<ul class="rl-lines">' + items + '</ul>' +
      '<p class="rl-cap">Cada número sale de una página oficial que guardamos con fecha; si no lo encontramos, no lo inventamos. Revisión completa del paquete: ' + h.t('{{next_check}}') + ' como máximo.</p></section>';
    const se = '<section class="rl-sec">' + sectionHead(h, 'Qué es la autoexclusión') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>La pedís vos</h3><p>Es un pedido voluntario para que no te dejen jugar durante un tiempo. Cada provincia tiene su propio programa y su propio plazo: el que figura arriba es el que dice la página oficial.</p></div>' +
      '<div class="rl-box"><h3>Si ayudás a alguien</h3><p>Escuchar sin juzgar sirve más que un reto. Compartí esta página: la línea de su provincia está más arriba.</p></div>' +
      '</div></section>';
    return crisis + lines + se;
  },
};

export const metodologia = {
  path: '/metodologia',
  id: 'metodologia',
  kind: 'service',
  title: 'Metodología: cómo verificamos licencias y operadores',
  description: 'Cómo verificamos licencias: el registro de cada regulador provincial, una copia con fecha, la cita de la fuente y solo capturas de páginas públicas.',
  h1: 'Cómo trabajamos: registros, citas, capturas y fechas',
  ld: h => [h.webPage()],
  render(h) {
    const steps = [
      ['Buscamos la lista del regulador', 'Solo cuenta la página oficial de la lotería o el instituto de cada jurisdicción. Notas de prensa y sitios de terceros no alcanzan.'],
      ['Guardamos una copia con fecha', 'Descargamos la página tal como está y guardamos su huella digital (SHA-256). Así sabemos si la página oficial cambió desde nuestra copia.'],
      ['Copiamos la cita textual', 'Cada dato lleva una frase literal de esa copia: el nombre del sitio, su dirección, el número de disposición o el teléfono.'],
      ['La compilación lo comprueba', 'Antes de publicar, un programa compara cada cita con la copia guardada, letra por letra, y revisa que la lista esté completa. Si algo no coincide, el sitio no se publica.'],
      ['Mostramos la fecha', h.t('Cada dato dice cuándo copiamos su fuente. Una copia de más de {{max_age}} días frena la publicación hasta que la volvemos a revisar.')],
    ];
    const stats = '<div class="rl-stats" data-nosnippet>' +
      '<div><b>' + h.t('{{doc_total}}') + '</b><span>documentos oficiales guardados</span></div>' +
      '<div><b>' + h.t('{{quote_total}}') + '</b><span>citas comprobadas</span></div>' +
      '<div><b>' + h.t('{{reg_total}}') + '</b><span>listas de licencias</span></div>' +
      '<div><b>' + h.t('{{max_age}}') + '</b><span>días como máximo sin revisar</span></div></div>';
    const states = '<ul class="rl-states">' +
      '<li><i class="rl-y" aria-hidden="true"></i><p><b>Figura en la lista oficial.</b> El regulador publica esa dirección entre los sitios autorizados.</p></li>' +
      '<li><i class="rl-n" aria-hidden="true"></i><p><b>No figura.</b> No está en esa lista. No quiere decir que sea ilegal en otra provincia.</p></li>' +
      '<li><i class="rl-n" aria-hidden="true"></i><p><b>Sin lista verificada.</b> Todavía no guardamos una lista oficial de esa jurisdicción, así que no afirmamos nada sobre ella.</p></li></ul>';
    return '<section class="rl-hero"><div><p class="rl-kick">' + h.t('Última revisión de las listas: {{checked}}') + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Este sitio no opina sobre qué casa de apuestas es mejor. Responde una sola pregunta: ¿esta dirección figura en la lista oficial de mi provincia? Para eso seguimos siempre los mismos pasos.</p></div>' + stats + '</section>' +
      '<section class="rl-sec">' + sectionHead(h, 'Los cinco pasos de cada dato') + '<ol class="rl-steps">' + steps.map(([a, b]) => '<li><b>' + h.esc(a) + '</b><p>' + h.esc(b) + '</p></li>').join('') + '</ol></section>' +
      '<section class="rl-sec">' + sectionHead(h, 'Qué significa cada marca') + '<div class="rl-card">' + states + '</div></section>' +
      '<section class="rl-sec">' + sectionHead(h, 'Capturas y operadores') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Solo páginas públicas</h3><p>Si mostramos una captura de un sitio de apuestas, es nuestra y de una página que cualquiera ve sin registrarse. No abrimos cuentas, no depositamos y no usamos capturas ajenas. Hoy el sitio no publica capturas.</p></div>' +
      '<div class="rl-box"><h3>Sin enlaces ni acuerdos</h3><p>No enlazamos a ningún operador y no cobramos por aparecer. Las direcciones van como texto para que puedas compararlas con la barra de tu navegador.</p></div>' +
      '</div>' + (h.built('/registro-de-fuentes') ? '<p class="rl-note"><a href="' + h.href('/registro-de-fuentes') + '">Ver todas las fuentes con su fecha y su huella</a></p>' : '') + '</section>';
  },
};

export const redaccion = {
  path: '/redaccion',
  id: 'redaccion',
  kind: 'service',
  title: 'Redacción: quiénes somos y cómo trabajamos',
  description: 'Quiénes hacen casaslegales.com: una redacción sin firmas ni afiliados, que escribe con ayuda de IA y verifica cada dato contra el registro oficial.',
  h1: 'La redacción: quiénes somos y cómo trabajamos',
  ld: h => [h.webPage(), h.org(true)],
  render(h) {
    return '<section class="rl-hero"><div><p class="rl-kick">Redacción de casaslegales.com</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Somos un equipo editorial. No firmamos con nombres propios: lo que respalda cada página no es una firma, sino la fuente oficial que está al lado de cada dato.</p></div>' +
      '<div class="rl-box"><h3>Independientes</h3><div class="rl-chips"><span>sin publicidad</span><span>sin afiliados</span><span>sin enlaces a operadores</span></div></div></section>' +
      '<section class="rl-sec">' + sectionHead(h, 'Cómo escribimos') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Con ayuda de IA, contra las fuentes</h3><p>Los textos se redactan con ayuda de inteligencia artificial. Los datos no salen de la memoria de nadie: licencias, normas y teléfonos se copian de documentos oficiales guardados, y un programa comprueba cada cita antes de publicar.</p></div>' +
      '<div class="rl-box"><h3>Lenguaje simple</h3><p>Escribimos para quien recién llega al tema: frases cortas, la respuesta primero y un esquema en lugar de párrafos largos. Si algo no está verificado, lo decimos y no lo afirmamos.</p></div>' +
      '</div></section>' +
      '<section class="rl-sec">' + sectionHead(h, 'Qué no hacemos') + '<div class="rl-card"><ul class="rl-states">' +
      '<li><i class="rl-n" aria-hidden="true"></i><p>No recomendamos casas de apuestas ni armamos rankings.</p></li>' +
      '<li><i class="rl-n" aria-hidden="true"></i><p>No publicamos promociones, códigos ni ofertas de ningún operador.</p></li>' +
      '<li><i class="rl-n" aria-hidden="true"></i><p>No damos asesoramiento legal: lo que vale es la ley de tu provincia.</p></li></ul></div>' +
      (h.built('/metodologia') ? '<p class="rl-note"><a href="' + h.href('/metodologia') + '">Cómo verificamos cada dato, paso a paso</a></p>' : '') + '</section>';
  },
};

export const fuentes = {
  path: '/registro-de-fuentes',
  id: 'registro-de-fuentes',
  kind: 'service',
  title: 'Registro de fuentes: cada dato con su cita y fecha',
  description: 'Todas las fuentes oficiales que usamos: regulador, dirección, fecha de la copia, huella digital y cantidad de citas, de cada provincia argentina.',
  h1: 'Registro de fuentes oficiales usadas en el sitio',
  ld: h => [h.webPage()],
  render(h) {
    const docs = h.docs().sort((a, b) => a.jurName.localeCompare(b.jurName, 'es') || a.host.localeCompare(b.host));
    const rows = docs.map(d => '<tr><th scope="row">' + h.esc(d.jurName) + '</th><td><a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.host + d.pathShort) + '</a>' + (d.archived ? ' <span class="rl-src">(copia de archivo web)</span>' : '') + '</td><td>' + h.esc(d.use) + '</td><td>' + h.fmtDate(d.fetched) + '</td><td class="rl-host">' + h.esc(d.sha256.slice(0, 12)) + '</td><td>' + d.quotes + '</td></tr>').join('');
    return '<section class="rl-hero"><div><p class="rl-kick">' + h.t('{{doc_total}} documentos · {{quote_total}} citas') + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Cada documento oficial que usamos, con la fecha de nuestra copia y su huella digital (los primeros caracteres del SHA-256). Si una página oficial cambia, la huella cambia y lo revisamos.</p></div></section>' +
      '<section class="rl-sec"><div class="rl-card" data-nosnippet><div class="rl-scroll"><table class="rl-reg"><thead><tr><th scope="col">Jurisdicción</th><th scope="col">Documento</th><th scope="col">Para qué</th><th scope="col">Copia</th><th scope="col">Huella</th><th scope="col">Citas</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<p class="rl-cap">' + h.t('Ningún documento tiene más de {{max_age}} días: la próxima revisión completa es antes del {{next_check}}.') + '</p></section>';
  },
};

export const notFound = {
  path: '/404',
  id: '404',
  kind: 'service',
  is404: true,
  title: 'Página no encontrada | casaslegales.com',
  description: '',
  h1: 'Esta página no existe',
  render(h) {
    return '<section class="rl-404"><b aria-hidden="true">404</b><h1>' + h.esc(h.page.h1) + '</h1><p class="rl-lead">Puede que la dirección esté mal escrita o que la página se haya movido.</p>' +
      '<div class="rl-acts"><a class="rl-b1" href="/">Ir al inicio</a>' + (h.built('/licencias') ? '<a class="rl-b2" href="' + h.href('/licencias') + '">Ver las licencias</a>' : '') + '</div></section>';
  },
};
