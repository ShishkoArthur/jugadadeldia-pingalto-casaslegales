// Service pages of casaslegales.com: legal notice, contact and privacy. Short, plain, and only what is true today: no public mail
// address until the owner sets one up (a mailbox nobody reads is not published), no analytics, two values kept in the browser.
import { sectionHead } from './parts.mjs';

const hero = (h, kick, lead) => '<section class="rl-hero"><div><p class="rl-kick">' + h.esc(kick) + '</p><h1>' + h.esc(h.page.h1) + '</h1><p class="rl-lead">' + h.esc(lead) + '</p></div></section>';
const more = (h, list) => {
  const l = list.filter(([u]) => h.built(u));
  return l.length ? '<section class="rl-sec">' + sectionHead(h, 'Relacionado') + '<div class="rl-gd">' + l.map(([u, t], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(t) + '</a>').join('') + '</div></section>' : '';
};

export const avisoLegal = {
  path: '/aviso-legal',
  id: 'aviso-legal',
  kind: 'service',
  title: 'Aviso legal: sin asesoramiento legal ni afiliados',
  description: 'Aviso legal de casaslegales.com: no damos asesoramiento legal, sin acuerdos con operadores ni links de afiliado; lo que vale es la ley de tu provincia.',
  h1: 'Aviso legal',
  ld: h => [h.webPage()],
  render(h) {
    const items = [
      ['No es asesoramiento legal', 'Mostramos lo que publica cada regulador provincial, con la cita y la fecha de nuestra copia. Lo que vale es la ley de tu provincia y la lista oficial vigente: si hay una diferencia entre este sitio y la página del regulador, manda la del regulador.'],
      ['Sin acuerdos con operadores', 'No cobramos por aparecer, no tenemos programas de afiliados y no publicamos bonos, códigos ni promociones. Los botones «Ir al sitio oficial» llevan a la dirección que publica la lista oficial de cada provincia, sin códigos de seguimiento.'],
      ['Solo para mayores de 18', 'Los juegos de azar y las apuestas están prohibidos para menores de 18 años. Este sitio informa sobre licencias; no invita a jugar.'],
      ['Las listas cambian', h.t('Revisamos las {{reg_total}} listas oficiales que guardamos al menos cada {{max_age}} días, o cada {{owner_max_age}} cuando el sitio del regulador no deja entrar a programas y la copia se guarda a mano desde un navegador. Entre una revisión y otra, un regulador puede sumar o sacar un sitio: cada página dice la fecha de la copia que usa.')],
      ['Marcas y capturas', 'Los nombres de operadores, loterías e institutos son de sus dueños y los usamos solo para identificarlos. Las capturas son nuestras, de páginas públicas, sin abrir cuentas ni depositar.'],
    ];
    const list = '<section class="rl-sec">' + sectionHead(h, 'Lo que conviene saber') + '<ol class="rl-steps">' + items.map(([a, b]) => '<li><b>' + h.esc(a) + '</b><p>' + h.esc(b) + '</p></li>').join('') + '</ol></section>';
    return hero(h, 'casaslegales.com · ' + h.t('revisado {{checked}}'), 'casaslegales.com es un sitio editorial independiente sobre licencias de juego online en Argentina. Lo que sigue explica qué es y qué no es lo que publicamos.') + list +
      more(h, [['/metodologia', 'Cómo verificamos cada dato'], ['/redaccion', 'Quiénes hacemos este sitio'], ['/privacidad', 'Privacidad'], ['/contacto', 'Contacto y correcciones']]);
  },
};

export const contacto = {
  path: '/contacto',
  id: 'contacto',
  kind: 'service',
  title: 'Contacto: correcciones y consultas',
  description: '¿Viste un error en un registro o en una ficha? Qué datos sirven para encontrarlo (provincia, sitio y fuente oficial) y cómo revisarlo vos mientras tanto.',
  h1: 'Contacto y correcciones',
  ld: h => [h.webPage()],
  render(h) {
    const now = '<section class="rl-sec"><div class="rl-two">' +
      '<div class="rl-box"><h3>Todavía sin correo público</h3><p>No publicamos una dirección de correo hasta tener a alguien que la lea todos los días. Cuando esté, va a figurar en esta página.</p></div>' +
      '<div class="rl-box"><h3>Mientras tanto, revisalo vos</h3><p>Cada dato del sitio tiene al lado la página oficial de donde sale y la fecha de nuestra copia. Si la lista del regulador dice otra cosa, vale la del regulador.</p>' +
      (h.built('/registro-de-fuentes') ? '<p><a href="' + h.href('/registro-de-fuentes') + '">Todas las fuentes, con fecha y huella</a></p>' : '') + '</div></div></section>';
    const steps = [['La provincia', 'Cada lista es de una jurisdicción: decinos cuál.'], ['La dirección del sitio', 'Completa, como la ves en la barra del navegador.'], ['La fuente oficial', 'La página del regulador donde figura (o donde ya no figura) y la fecha en que la viste.'], ['Nada personal', 'No hace falta tu nombre, tu DNI ni datos de una cuenta de apuestas. No los mandes.']];
    const what = '<section class="rl-sec">' + sectionHead(h, 'Qué sirve para corregir un dato') + '<ol class="rl-steps">' + steps.map(([a, b]) => '<li><b>' + h.esc(a) + '</b><p>' + h.esc(b) + '</p></li>').join('') + '</ol></section>';
    const help = h.built('/juego-responsable') ? '<section class="rl-sec"><div class="rl-box"><h3>¿Buscás ayuda con el juego?</h3><p>Este no es un canal de ayuda. Las líneas gratuitas de cada provincia están en <a href="' + h.href('/juego-responsable') + '">juego responsable</a>.</p></div></section>' : '';
    return hero(h, 'Contacto', 'Si un sitio entró o salió de una lista oficial, o si una cita no coincide con su fuente, eso es lo que más nos interesa saber.') + now + what + help;
  },
};

export const privacidad = {
  path: '/privacidad',
  id: 'privacidad',
  kind: 'service',
  title: 'Privacidad y datos personales en casaslegales.com',
  description: 'Privacidad en casaslegales.com: sin datos personales, sin cookies ni analítica; qué guarda tu navegador y qué pasa con la dirección que verificás.',
  h1: 'Privacidad',
  ld: h => [h.webPage()],
  render(h) {
    const keep = '<section class="rl-sec">' + sectionHead(h, 'Lo que queda en tu navegador') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Dos preferencias</h3><ul class="rl-states"><li><i class="rl-y" aria-hidden="true"></i><p>El tema claro u oscuro, si lo cambiaste.</p></li><li><i class="rl-y" aria-hidden="true"></i><p>La provincia que elegiste en el mapa, para mostrarte su línea de ayuda.</p></li></ul>' +
      '<p>Se guardan en el almacenamiento local de tu navegador y no nos llegan. Se borran al limpiar los datos del sitio.</p></div>' +
      '<div class="rl-box"><h3>La dirección que verificás</h3><p>El verificador compara la dirección dentro de tu navegador, con las listas que ya vienen en la página: no la envía a ningún servidor. Para que puedas compartir el resultado, la agrega al final de la dirección de la página: solo viaja si recargás o compartís ese enlace, como cualquier dirección web.</p></div></div></section>';
    const no = '<section class="rl-sec">' + sectionHead(h, 'Lo que no hacemos') + '<div class="rl-card"><ul class="rl-states">' +
      '<li><i class="rl-n" aria-hidden="true"></i><p>No usamos cookies, analítica, píxeles de publicidad ni botones de redes sociales.</p></li>' +
      '<li><i class="rl-n" aria-hidden="true"></i><p>No hay registro de usuarios, cuentas ni boletines: no te pedimos nombre, correo ni DNI.</p></li>' +
      '<li><i class="rl-n" aria-hidden="true"></i><p>Las fuentes tipográficas y las imágenes se sirven desde este mismo dominio, sin servicios de terceros.</p></li></ul></div></section>';
    const net = '<section class="rl-sec">' + sectionHead(h, 'La conexión') + '<div class="rl-box"><p>Como cualquier sitio web, para entregarte una página el servidor recibe tu dirección IP y los datos técnicos de tu navegador. El sitio pasa por la red de Cloudflare, que también los procesa para entregar la página y protegerla de ataques. Los enlaces a reguladores llevan a sus propias páginas, con sus propias reglas de privacidad.</p></div></section>';
    const rights = '<section class="rl-sec">' + sectionHead(h, 'Tus derechos') + '<div class="rl-box"><p>En Argentina, la autoridad de control en materia de datos personales es la Agencia de Acceso a la Información Pública (AAIP). Como no guardamos datos personales tuyos, no tenemos nada que corregir ni borrar a tu nombre; si creés que no es así, podés reclamar ante ella.</p></div></section>';
    return hero(h, 'Sin datos personales', 'Este sitio se puede usar entero sin dar ningún dato personal. Acá está todo lo que pasa con tu visita.') + keep + no + net + rights +
      more(h, [['/aviso-legal', 'Aviso legal'], ['/contacto', 'Contacto y correcciones']]);
  },
};
