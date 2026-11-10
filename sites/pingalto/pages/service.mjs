// Service pages of pingalto.com: /equipo (editorial team, no named author - owner 2026-11-03), /metodo, /datos (every saved
// source), /contacto, /legal, and the 404.
import { fmt, hero, ldPage, sec, kindTag, girlCard } from './parts.mjs';
import { artSets, anyArt, PUBLISHER } from '../content/art.mjs';

export const equipo = {
  path: '/equipo',
  kind: 'service',
  title: 'Quiénes hacemos pingalto',
  description: 'Quiénes hacemos pingalto: una redacción chica que arma herramientas para gamers de Argentina, sin apuestas ni tienda. Qué hacemos y qué no.',
  h1: 'El equipo detrás de pingalto',
  ld: h => ldPage(h, [{ '@context': 'https://schema.org', '@type': 'Organization', name: 'pingalto', url: 'https://' + h.site.domain + '/', description: 'Herramientas y datos para jugadores de Argentina, sin apuestas ni venta.' }]),
  render(h) {
    const what = '<div class="pa-gd"><section class="pa-c pa-w4"><h2>Una redacción, no una persona</h2><p>pingalto lo arma un equipo de redacción que juega y programa. No firmamos con nombres: lo que tiene que hablar por nosotros es que cada número del sitio se puede revisar.</p>' +
      '<ul class="pa-dot" style="margin-top:12px"><li>Escribimos en castellano de Argentina y pensamos todo desde acá: provincias, servidores de la región, la SUBE como regla.</li><li>Cada cálculo vive en un programa con pruebas que fijan sus resultados; si alguien rompe una fórmula, el sitio no se publica.</li><li>Los textos los redactamos con ayuda de inteligencia artificial y los revisamos a mano; los números nunca salen de ahí, salen del código y de las fuentes.</li></ul></section>' +
      '<section class="pa-c pa-w2"><h2>Alt</h2><p>Alt es la guía de pingalto: un personaje creado con inteligencia artificial, no una persona real ni una autora. Aparece en cada herramienta haciendo algo que tiene que ver con esa página.</p><div style="width:min(180px,100%);margin:14px auto 0">' + girlCard(h, '/', { lazy: true, small: true }) + '</div></section></div>';
    const not = sec('Lo que pingalto no es', '<div class="pa-three"><div class="pa-c"><h3>No es un sitio de apuestas</h3><p>No hay apuestas, cuotas ni links a casas de apuestas. Tampoco hablamos de skins, cajas ni sorteos.</p></div>' +
      '<div class="pa-c"><h3>No es una tienda</h3><p>No vendemos diamantes, pavos, VP ni cuentas, y no tenemos links de recarga.</p></div>' +
      '<div class="pa-c"><h3>No es oficial</h3><p>No estamos afiliados a Riot, Valve, Epic, Garena ni a ningún otro editor. Citamos sus páginas públicas.</p></div></div>');
    return hero(h, { ey: 'Equipo · redacción', sub: 'Herramientas para jugadores de Argentina, hechas por gente que también juega desde acá.' }) + what + not;
  },
};

export const metodo = {
  path: '/metodo',
  kind: 'service',
  title: 'Cómo calculamos cada número de pingalto',
  description: 'Cómo calculamos cada número de pingalto: de dónde salen los datos, cómo guardamos cada fuente con fecha y qué prueba el código antes de publicar.',
  h1: 'Método: de dónde salen los números',
  ld: h => ldPage(h),
  render(h) {
    const steps = '<ol class="pa-steps"><li><span><b>Fuente primero.</b> Buscamos la página del editor del juego (Riot, Valve) o una referencia pública (Wikipedia, Wikidata). Si solo hay fuentes de la comunidad, lo decimos con una etiqueta.</span></li>' +
      '<li><span><b>Copia con fecha.</b> Guardamos la página tal como estaba, con su huella digital (SHA-256), y copiamos la frase exacta que respalda el número.</span></li>' +
      '<li><span><b>La compilación lo comprueba.</b> Antes de publicar, un programa busca cada frase en su copia, letra por letra, y comprueba que el número esté escrito dentro de la frase. Si algo no coincide, el sitio no se publica.</span></li>' +
      '<li><span><b>Cálculo con pruebas.</b> Las fórmulas (sensibilidad, DPI, ping mínimo, partidas hasta un rango) están en módulos con pruebas que fijan sus resultados.</span></li>' +
      '<li><span><b>Fecha de vencimiento.</b> ' + h.t('Una copia de más de {{max_age}} días frena la publicación hasta que la volvemos a revisar.') + '</span></li></ol>';
    const stats = '<div class="pa-gd"><section class="pa-c pa-w2"><p class="pa-big">' + h.t('{{doc_total}}') + '</p><p>documentos guardados</p></section><section class="pa-c pa-w2"><p class="pa-big">' + h.t('{{fact_total}}') + '</p><p>datos citados textualmente</p></section><section class="pa-c pa-w2"><p class="pa-big" style="font-size:40px">' + h.t('{{checked}}') + '</p><p>última revisión de fuentes</p></section></div>';
    const measured = sec('Medido, calculado o citado', '<div class="pa-three"><div class="pa-c"><h3>Medido</h3><p>Lo que mide tu navegador: tu ping a un servidor, los puntos que manda tu mouse. Se queda en tu compu.</p></div>' +
      '<div class="pa-c"><h3>Calculado</h3><p>Lo que sale de una fórmula con números citados: el ping mínimo por fibra, los centímetros por vuelta, las partidas hasta un rango.</p></div>' +
      '<div class="pa-c"><h3>Citado</h3><p>Lo que dice el editor del juego o una referencia: nombres de rangos, reglas de puntos, ubicación de servidores. Siempre con la frase y la fecha.</p></div></div>' +
      '<p class="pa-note" style="margin-top:14px">Números con formato de Argentina (coma decimal). Ninguna herramienta te promete ganar: te muestran cuentas para que decidas vos.</p>');
    return hero(h, { ey: 'Método', sub: 'Tres reglas: el número sale del código o de una fuente citada, la fuente se guarda con fecha, y la compilación se niega a publicar si algo no coincide.' }) + stats + sec('Paso a paso', steps) + measured;
  },
};

export const datos = {
  path: '/datos',
  kind: 'service',
  title: 'Fuentes de datos y licencias de pingalto',
  description: 'Todas las fuentes de pingalto con editor, tipo, licencia y fecha de copia: Riot, Valve, Amazon, Wikipedia, Wikidata y referencias de la comunidad.',
  h1: 'Fuentes de datos y licencias',
  ld: h => ldPage(h),
  render(h) {
    const S = h.pa.src;
    const uses = slug => Object.entries(S.facts).filter(([, f]) => f.doc === slug).length;
    const rows = Object.entries(S.docs).map(([slug, d]) => '<tr><td><a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.publisher) + '</a></td><td>' + kindTag(h, d.kind) + '</td><td class="pa-n">' + h.fmtDate(d.fetched) + '</td><td class="pa-n">' + fmt(uses(slug), 0) + '</td><td><code>' + d.sha256.slice(0, 12) + '</code></td></tr>').join('');
    const table = '<div class="pa-tw"><table class="pa-tb"><thead><tr><th>Fuente</th><th>Tipo</th><th class="pa-n">Copia</th><th class="pa-n">Citas</th><th>SHA-256</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="pa-src">Las fuentes JSON (Wikidata, Valve) se leen enteras: las coordenadas y los pings típicos salen directo del archivo guardado.</p>';
    const kinds = sec('Qué quiere decir cada etiqueta', '<div class="pa-three"><div class="pa-c"><h3>' + kindTag(h, 'official') + '</h3><p>Página o archivo del propio editor: Riot, Valve, Amazon.</p></div><div class="pa-c"><h3>' + kindTag(h, 'reference') + '</h3><p>Obras de referencia abiertas: Wikipedia (CC BY-SA 4.0) y Wikidata (CC0).</p></div><div class="pa-c"><h3>' + kindTag(h, 'community') + '</h3><p>Sitios o wikis de jugadores. Las usamos cuando el editor no publica el dato y lo marcamos.</p></div></div>');
    const lic = sec('Licencias y marcas', '<p>Los textos citados de Wikipedia se publican bajo CC BY-SA 4.0 y los datos de Wikidata bajo CC0. Riot Games, Valorant y League of Legends son marcas de Riot Games, Inc.; Counter-Strike y Steam, de Valve; Free Fire, de Garena; Overwatch, de Blizzard; Apex Legends, de Electronic Arts. Usamos sus nombres solo para decir de qué juego hablamos.</p>');
    const art = anyArt() ? sec('Arte oficial de los juegos', '<div class="pa-tw"><table class="pa-tb"><thead><tr><th>Qué</th><th>Editor</th><th class="pa-n">Archivos</th><th>De dónde</th><th class="pa-n">Copia</th></tr></thead><tbody>' +
      artSets().map(x => '<tr><td>' + (x.publisher === 'riot' ? 'Retratos de campeones de LoL' : 'Cartas de Clash Royale y sus evoluciones') + '</td><td>' + PUBLISHER[x.publisher] + '</td><td class="pa-n">' + (x.files ? fmt(x.files.length, 0) : 'todas las de la API') + '</td><td><code>' + h.esc(new URL(x.source.replace(/<[^>]+>/g, 'x')).hostname) + '</code></td><td class="pa-n">' + (x.fetched ? h.fmtDate(x.fetched) : 'cada día, sola') + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p class="pa-src">Imágenes sin cambios, de las fuentes oficiales de cada editor, guardadas en nuestro servidor. Las cartas las copia sola la actualización diaria, una vez por archivo; la lista de cada una, con su dirección de origen y su fecha, está en <code>/data/feeds/clash-art.json</code>. Antes de bajar algo leemos el robots.txt del sitio y no insistimos si nos niega el acceso.</p>', 'arte') : '';
    return hero(h, { ey: 'Datos · ' + h.t('{{doc_total}}') + ' fuentes', sub: 'La lista completa de lo que citamos: quién lo publica, de qué tipo es, cuándo lo copiamos y cuántos datos del sitio dependen de cada fuente.' }) + sec('Todas las fuentes', table) + art + kinds + lic;
  },
};

export const contacto = {
  path: '/contacto',
  kind: 'service',
  title: 'Contacto: errores, ideas y pedidos de herramientas',
  description: 'Cómo avisarnos de un error en pingalto: qué datos sirven para encontrarlo y cómo revisar vos mismo cualquier número con su fuente y su fecha.',
  h1: 'Contacto',
  ld: h => ldPage(h),
  render(h) {
    const now = '<div class="pa-gd"><section class="pa-c pa-w3"><h2>Por ahora, sin correo público</h2><p>Todavía no publicamos una dirección de contacto: preferimos no poner un correo que nadie conteste. Cuando la tengamos, va a estar en esta página.</p></section>' +
      '<section class="pa-c pa-w3"><h2>Revisalo vos</h2><p>Cada número tiene su fuente con fecha en <a href="' + h.href('/datos') + '">Datos</a>, y el método está en <a href="' + h.href('/metodo') + '">Método</a>. Si una cita no coincide con la página original, eso ya es un error que vale la pena reportar.</p></section></div>';
    const tpl = sec('Qué nos sirve para encontrar un error', '<ol class="pa-steps"><li><span>La página donde lo viste.</span></li><li><span>Lo que pusiste en la herramienta (por ejemplo: juego, sensibilidad, DPI).</span></li><li><span>Lo que esperabas ver y lo que viste.</span></li><li><span>Para el test de ping, solo tu provincia: nunca tu dirección ni tu IP.</span></li></ol>');
    return hero(h, { ey: 'Contacto', sub: 'Errores, ideas y pedidos de herramientas nuevas.' }) + now + tpl;
  },
};

export const legal = {
  path: '/legal',
  kind: 'service',
  title: 'Aviso legal, privacidad y marcas de terceros',
  description: 'Aviso legal y privacidad de pingalto: qué guarda tu navegador, a qué servidores se conecta el test de ping y por qué no hay apuestas ni compras.',
  h1: 'Aviso legal y privacidad',
  riot: true,
  ld: h => ldPage(h),
  render(h) {
    const priv = '<div class="pa-gd"><section class="pa-c pa-w3"><h2>Lo que guarda tu navegador</h2><ul class="pa-dot"><li>El tema claro u oscuro que elegiste.</li><li>Los valores que cargaste en el calibrador de Free Fire, para que no los pierdas.</li></ul><p>Queda en tu navegador (almacenamiento local), no nos llega a nosotros. Lo borrás limpiando los datos del sitio. No usamos cookies, analítica ni publicidad.</p></section>' +
      '<section class="pa-c pa-w3"><h2>Conexiones a terceros</h2><p>Solo una, y solo si apretás el botón: el <a href="' + h.href('/kit/ping') + '">test de ping</a> hace peticiones a servidores públicos de Amazon Web Services (amazonaws.com) para medir el tiempo de ida y vuelta. Como en cualquier conexión, Amazon ve tu dirección IP. pingalto no recibe ni guarda el resultado.</p></section></div>';
    const no = sec('Sin apuestas, sin compras', '<p>pingalto no tiene apuestas, cuotas, cajas, skins, sorteos ni links de recarga o compra. El público de los juegos que cubrimos es joven y lo tenemos en cuenta.</p>');
    const tm = sec('Marcas de terceros', '<p>Los nombres de juegos, rangos y servidores son marcas de sus dueños (Riot Games, Valve, Garena, Epic Games, Blizzard, Electronic Arts y otros). pingalto no está afiliado a ninguno de ellos, y las herramientas son cálculos propios.</p><p>No usamos logos ni capturas de los juegos: cada editor tiene sus reglas para sitios de fans y varias no permiten logos (Riot, por ejemplo).' + (anyArt() ? ' El único arte oficial que mostramos son imágenes que el propio editor publica para eso, sin cambios y con su aviso: ' + artSets().map(x => x.publisher === 'riot' ? 'los retratos de los campeones de LoL de Data Dragon, de Riot' : 'las cartas de Clash Royale de la API oficial de Supercell').join(' y ') + '. Las guardamos en nuestro servidor, así que tu navegador no se conecta a ellos; la lista con la fuente y la fecha de cada archivo está en <a href="' + h.href('/datos') + '#arte">fuentes de datos</a>. Si un editor nos pide sacarlas, las sacamos.' : '') + '</p><p>Los nombres de los juegos van escritos con nuestra tipografía, y los fondos de cada sección y Alt, nuestra guía, son ilustraciones propias generadas con IA, sin personajes, mapas ni marcas de los juegos. Los accesorios de Alt son de cosplay o de juguete.</p><p>Las herramientas son una ayuda: no garantizan resultados en ningún juego.</p>');
    return hero(h, { ey: 'Legal', sub: 'Corto y claro: qué se guarda, a quién se conecta tu navegador y de quién son las marcas.' }) + priv + no + tm;
  },
};

export const notFound = {
  path: '/404',
  kind: 'service',
  title: 'Ping perdido: esta página no existe',
  h1: 'Ping perdido',
  render(h) {
    const go = [['/', 'Inicio'], ['/kit/ping', 'Test de ping'], ['/kit/sensibilidad', 'Sensibilidad'], ['/valorant/rangos', 'Rangos de Valorant']].filter(([u]) => h.built(u));
    return '<section class="pa-he pa-sm pa-404"><div><p class="pa-ey">Error 404</p><h1>' + h.esc(h.page.h1) + '</h1><p class="pa-sb">El paquete salió, pero esta dirección no contestó. Probá con alguna de estas:</p><div class="pa-bt">' +
      go.map(([u, t], i) => '<a' + (i === 0 ? ' class="pa-b1"' : '') + ' href="' + h.href(u) + '">' + t + '</a>').join('') + '</div></div></section>';
  },
};
