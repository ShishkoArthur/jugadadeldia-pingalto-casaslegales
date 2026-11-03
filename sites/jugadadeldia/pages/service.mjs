// Service pages of jugadadeldia.com: who we are, who writes (Denis Krazok, owner 2026-11-03: author only on this site),
// where the data comes from, and the 404.
import { hero, crumbs, ICONS } from './parts.mjs';
import { lotteryMissing } from '../../../tools/lib/lottery-sources.mjs';
import { daysBetween } from '../../../engine/format.mjs';

const TG = 'https://t.me/deniskrazok';
const ldBasic = h => [h.webPage(), crumbs(h, [])];

export const quienes = {
  path: '/quienes-somos/', kind: 'service',
  title: 'Quiénes somos: qué es Jugada del Día y qué no',
  h1: 'Quiénes somos',
  description: 'Quiénes somos: Jugada del Día cuenta premios y chances de la quiniela, las loterías argentinas y el truco. Sin apuestas ni links a operadores.',
  ld: ldBasic,
  render(h) {
    return hero(h, { kicker: 'Jugada del Día · Argentina', scene: 'quienes', lede: 'Un sitio argentino para entender la quiniela y las loterías con números de verdad, y para jugar al truco y a la generala por diversión.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c"><i class="jg-ba" aria-hidden="true">00</i><h2>Quiniela y loterías</h2><p>Cuánto paga cada jugada según el reglamento de cada lotería, y qué chance real tiene. Las cuentas las hace un código con pruebas, no una persona con calculadora.</p></section>' +
      '<section class="jg-c"><i class="jg-ba c2" aria-hidden="true">7</i><h2>Truco y juegos de mesa</h2><p>Truco, generala, chinchón y escoba contra la compu, anotadores y tablas. Sin plata, sin registro.</p></section>' +
      '<section class="jg-c"><i class="jg-ba c4" aria-hidden="true">18</i><h2>Ayuda</h2><p>En cada página de quiniela y loterías está la línea de ayuda de tu provincia. Los juegos de azar son para mayores de 18.</p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Lo que no hacemos</span><h2>Qué no vas a encontrar</h2><ul><li>Links a casas de apuestas, casinos u operadores: no hay ninguno.</li><li>Promesas de ganar: ningún número «sale más» por magia, y te lo mostramos con la cuenta.</li><li>Resultados inventados: si no tenemos el extracto oficial, no mostramos nada.</li><li>Publicidad o cobros: el sitio no vende nada.</li></ul></section>' +
      '<section class="jg-c"><span class="jg-sm">Contacto</span><h2>Escribinos</h2><p>Si encontrás un error en un número o una regla, avisanos por Telegram a Denis Krazok.</p><p><a class="jg-b" href="' + TG + '" rel="noopener">Telegram @deniskrazok</a></p>' +
      (h.built('/quien-escribe/') ? '<p><a href="' + h.href('/quien-escribe/') + '">Quién escribe y cómo</a></p>' : '') + '</section></div>';
  },
};

export const quienEscribe = {
  path: '/quien-escribe/', kind: 'service',
  title: 'Quién escribe en Jugada del Día',
  h1: 'Quién escribe',
  description: 'Quién escribe en Jugada del Día: la persona a cargo de los textos, cómo chequeamos cada número con fuentes oficiales argentinas y cómo usamos la IA.',
  ld: h => [h.webPage(), crumbs(h, []), { '@context': 'https://schema.org', '@type': 'Person', name: 'Denis Krazok', url: 'https://' + h.site.domain + '/quien-escribe/', sameAs: [TG], worksFor: h.org() }],
  render(h) {
    return '<section class="jg-hero no-g"><div><span class="jg-k">Autor</span><h1>' + h.esc(h.page.h1) + '</h1><p class="jg-lede">Denis Krazok está a cargo del contenido de Jugada del Día: qué páginas hay, qué dicen y de dónde sale cada dato.</p></div></section>' +
      '<div class="jg-mn">' +
      '<section class="jg-c jg-who"><i class="jg-ba c5" aria-hidden="true">DK</i><h2>Denis Krazok</h2><p>Editor de contenido. Arma las páginas de quiniela, loterías y juegos, y es a quien le escribís si algo está mal.</p><p><a class="jg-b p" href="' + TG + '" rel="noopener">Telegram @deniskrazok</a></p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Cómo se hacen las páginas</span><h2>IA para redactar, código para contar</h2><ol>' +
      '<li><b>Fuentes primero.</b> Guardamos una copia de cada reglamento oficial que usamos (loterías, Juegos Bonaerenses y otros) con su fecha.</li>' +
      '<li><b>Números por código.</b> Premios y chances los calcula un programa con fracciones exactas; pruebas automáticas comparan cada constante con la cita del reglamento.</li>' +
      '<li><b>Textos con IA.</b> Los textos se redactan con ayuda de una inteligencia artificial (Claude) a partir de esas fuentes.</li>' +
      '<li><b>Controles antes de publicar.</b> Si una cita no coincide palabra por palabra con su copia, o una copia está vieja, la página no se publica.</li></ol>' +
      (h.built('/de-donde-salen-los-datos/') ? '<p><a href="' + h.href('/de-donde-salen-los-datos/') + '">Ver todas las fuentes</a></p>' : '') + '</section></div>';
  },
};

export const fuentes = {
  path: '/de-donde-salen-los-datos/', kind: 'service',
  title: 'De dónde salen los datos y cómo calculamos',
  h1: 'De dónde salen los datos',
  description: 'De dónde salen los datos: cada reglamento de lotería y de juego que usamos, con su fuente, la fecha de la copia y cómo calculamos premios y chances.',
  ld: ldBasic,
  render(h) {
    const docs = h.src.docs;
    const rg = h.docs().filter(d => d.slug && d.jurName);
    const groups = [...new Set(docs.map(d => d.group))];
    const row = (title, url, fetched, maxAge, n) => {
      const age = daysBetween(fetched, h.today), ok = age <= maxAge;
      return '<tr><td>' + h.esc(title) + '<br><a href="' + h.esc(url) + '" rel="noopener">' + h.esc(new URL(url).hostname.replace(/^www\./, '')) + '</a></td><td class="n">' + h.fmtDate(fetched) + '</td><td class="n">' + n + '</td><td>' + (ok ? '<span class="jg-ok">al día</span>' : '<span class="jg-no">vieja</span>') + '</td></tr>';
    };
    const table = (rows) => '<div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Documento</th><th class="n">Copia</th><th class="n">Citas</th><th>Estado</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    const lotGroups = groups.map(g => '<section class="jg-c w3"><span class="jg-sm">' + h.esc(g) + '</span><h2>' + h.esc(g) + '</h2>' + table(docs.filter(d => d.group === g).map(d => row(d.title, d.url, d.fetched, d.maxAge, d.quotes)).join('')) + '</section>').join('');
    const rgRows = rg.map(d => row(d.jurName + ' · ' + d.use, d.url, d.fetched, h.rg.pack.maxAgeDays, d.quotes)).join('');
    const missing = [...lotteryMissing().values()];
    const miss = missing.length ? '<section class="jg-c w3"><span class="jg-sm">Lo que no encontramos</span><h2>Sin reglamento, sin cuenta</h2><p>Si no encontramos un reglamento oficial, la página de ese juego no muestra premios. Hoy faltan ' + missing.length + ' piezas, por ejemplo la quiniela de Córdoba, la de Mendoza y las tómbolas del norte.</p></section>' : '';
    return hero(h, { kicker: 'Fuentes · ' + docs.length + ' documentos', scene: 'fuentes', lede: 'Cada premio, regla y chance sale de un documento oficial que guardamos con su fecha. Si la copia envejece o la cita no coincide, la página no se publica.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c">' + ICONS.calc.replace('<svg', '<svg class="jg-ic"') + '<h2>Cuentas exactas</h2><p>Las chances se calculan con fracciones exactas sobre todas las combinaciones posibles, sin redondeos en el medio.</p></section>' +
      '<section class="jg-c">' + ICONS.check.replace('<svg', '<svg class="jg-ic"') + '<h2>Pruebas</h2><p>Cada constante del código (por ejemplo, cuántas veces paga una apuesta) se compara con la cita del reglamento. Si no coinciden, no hay publicación.</p></section>' +
      '<section class="jg-c">' + ICONS.dice.replace('<svg', '<svg class="jg-ic"') + '<h2>Simulación de control</h2><p>Además del cálculo exacto, una simulación con semilla fija tiene que dar lo mismo dentro del margen esperado.</p></section>' +
      lotGroups +
      '<section class="jg-c w3"><span class="jg-sm">Ayuda</span><h2>Líneas de ayuda y autoexclusión</h2>' + table(rgRows) + '</section>' + miss + '</div>';
  },
};

export const notFound = {
  path: '/404/', kind: 'service',
  title: 'No encontramos esta página · Jugada del Día',
  h1: 'Esta bolilla no salió',
  render(h) {
    return '<section class="jg-404"><i class="jg-ba c3" aria-hidden="true">404</i><h1 class="jg-h1">' + h.esc(h.page.h1) + '</h1><p class="jg-lede" style="margin:0 auto 20px">La página que buscás no existe o cambió de lugar.</p><div class="jg-r" style="justify-content:center"><a class="jg-b p" href="/">Ir al inicio</a>' +
      (h.built('/quiniela/cuanto-paga/') ? '<a class="jg-b" href="' + h.href('/quiniela/cuanto-paga/') + '">¿Cuánto paga la quiniela?</a>' : '') + (h.built('/truco/jugar/') ? '<a class="jg-b" href="' + h.href('/truco/jugar/') + '">Jugar al truco</a>' : '') + '</div></section>';
  },
};
