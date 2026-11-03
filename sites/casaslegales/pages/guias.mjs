// Guides that need no new data: /guia/bet-ar, /guia/sitios-ilegales; the operators hub /operadores; and the help page
// /juego-responsable/autoexclusion (help: true - no menu, no link to betting pages). Each has its own small diagram.
import { anatomy, termMonths } from '../../../engine/hostcheck.mjs';
import { brandMatrix, presence } from '../../../engine/registry.mjs';
import { TILES, CODE } from '../content/map.mjs';
import { OPS } from '../content/operators.mjs';
import { opData, quoteById } from '../content/opdata.mjs';
import { anat, opSrcQuote, listsDate } from './opparts.mjs';
import { quote, rgQuote, src, sectionHead } from './parts.mjs';
import { slugOf } from './verificador.mjs';

const go = (h, list) => '<div class="rl-gd">' + list.filter(([u]) => h.built(u)).map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div>';

export const betAr = {
  path: '/guia/bet-ar',
  id: 'guia-bet-ar',
  kind: 'guide',
  title: 'Qué es el dominio .bet.ar y por qué importa',
  description: 'Qué es el dominio .bet.ar, cómo leer el subdominio de cada provincia, qué dicen los reguladores y por qué dos sitios legales de la Ciudad no lo usan.',
  h1: 'El dominio .bet.ar: qué garantiza y qué no',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/guia/bet-ar', 'El dominio .bet.ar']])],
  render(h) {
    const pba = h.reg('buenos-aires'), cba = h.reg('cordoba'), caba = h.reg('caba');
    const bars = h.regs.map(r => {
      const bet = r.licensees.filter(l => anatomy(l.host).betAr).length, n = r.licensees.length;
      return '<li><span class="rl-tag">' + h.esc(CODE[r.id]) + '</span><div class="rl-bar" role="img" aria-label="' + h.esc(h.rg.prov(r.id).name + ': ' + bet + ' de ' + n + ' direcciones terminan en .bet.ar') + '">' +
        '<i style="--w:' + (100 * bet / n).toFixed(1) + '%"></i>' + (n - bet ? '<i class="rl-bar-o" style="--w:' + (100 * (n - bet) / n).toFixed(1) + '%"></i>' : '') + '</div><b>' + bet + ' de ' + n + '</b></li>';
    }).join('');
    const nonBet = caba.licensees.filter(l => !anatomy(l.host).betAr);
    const subs = [...new Set(h.regs.flatMap(r => r.licensees.map(l => anatomy(l.host).sub).filter(Boolean)))].sort();
    const hero = '<section class="rl-hero"><div><p class="rl-kick">Guía · listas copiadas el ' + listsDate(h) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">.bet.ar es la terminación que usan casi todos los sitios de apuestas con licencia provincial. Sirve como primera pista, pero la prueba es otra: que la dirección completa figure en la lista oficial de tu provincia.</p></div>' +
      '<div class="rl-box">' + anat(h, 'cba.betsson.bet.ar') + '<p>Leela de derecha a izquierda: primero la terminación, después el nombre y, adelante, el subdominio de la provincia.</p></div></section>';
    const count = '<section class="rl-sec">' + sectionHead(h, '¿Cuántas direcciones de cada lista terminan en .bet.ar?', 'contado por el programa en cada lista') +
      '<div class="rl-card" data-nosnippet><ul class="rl-bars">' + bars + '</ul><div class="rl-leg"><span><i style="--c:var(--t1)"></i>termina en .bet.ar</span><span><i style="--c:var(--co)"></i>otra terminación</span></div></div></section>';
    const say = '<section class="rl-sec">' + sectionHead(h, 'Qué dice cada regulador', 'citas textuales') + '<div class="rl-law">' +
      '<article><span class="rl-tag">PBA</span>' + quote(h, pba.quotes.betar, pba.regulator.name) + '</article>' +
      '<article><span class="rl-tag">CBA</span>' + quote(h, cba.quotes.betar, cba.regulator.name) + '</article>' +
      '<article><span class="rl-tag">CABA</span>' + quote(h, caba.quotes.list, caba.regulator.name) + '<p>En esa lista ' + (nonBet.length === 1 ? 'hay una dirección que no termina' : 'hay ' + nonBet.length + ' direcciones que no terminan') + ' en .bet.ar: ' + nonBet.map(l => '<span class="rl-host">' + h.esc(l.host) + '</span>').join(' y ') + '.</p></article></div></section>';
    const yesno = '<section class="rl-sec">' + sectionHead(h, 'Qué te dice y qué no') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Lo que te dice</h3><ul class="rl-states"><li><i class="rl-y" aria-hidden="true"></i><p>Que el sitio usa la terminación que piden la Provincia de Buenos Aires y Córdoba, según sus propias páginas.</p></li>' +
      '<li><i class="rl-y" aria-hidden="true"></i><p>Muchas veces, de qué provincia es: los subdominios de las listas son ' + subs.map(s => '<span class="rl-host">' + h.esc(s) + '.</span>').join(', ') + '.</p></li></ul></div>' +
      '<div class="rl-box"><h3>Lo que no te dice</h3><ul class="rl-states"><li><i class="rl-n" aria-hidden="true"></i><p>Que esa dirección exacta tenga licencia: eso lo dice la lista oficial, no la terminación.</p></li>' +
      '<li><i class="rl-n" aria-hidden="true"></i><p>Que el sitio sea legal en tu provincia: una licencia de Córdoba no es una licencia de la Ciudad.</p></li></ul></div></div></section>';
    return hero + count + say + yesno + '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + go(h, [['/verificador', 'Pegá una dirección en el verificador'], ['/licencias', 'Todas las direcciones con licencia'], ['/guia/sitios-ilegales', 'Cómo reconocer un sitio sin licencia']]) + '</section>';
  },
};

export const ilegales = {
  path: '/guia/sitios-ilegales',
  id: 'guia-sitios-ilegales',
  kind: 'guide',
  title: 'Sitios de apuestas ilegales: qué dicen las provincias',
  description: 'Qué dicen la Ciudad y Córdoba sobre los sitios de apuestas sin licencia, qué riesgos señalan, cómo denunciarlos y cómo chequear una dirección vos.',
  h1: 'Sitios de apuestas sin licencia: riesgos, señales y dónde denunciar',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/guia/sitios-ilegales', 'Sitios sin licencia']])],
  render(h) {
    const D = opData(h.today);
    const Q = id => quoteById(D, id);
    const cmp = '<div class="rl-vs" data-nosnippet><div class="rl-vs-ok"><h3>Con licencia</h3>' + ['cba-controlado', 'cba-herramientas'].map(id => opSrcQuote(h, D, Q(id), Q(id).label)).join('') + '</div>' +
      '<div class="rl-vs-no"><h3>Sin licencia</h3>' + ['cba-estafa', 'cba-manipulados', 'cba-respaldo'].map(id => opSrcQuote(h, D, Q(id), Q(id).label)).join('') + '</div></div>';
    const hero = '<section class="rl-hero"><div><p class="rl-kick">Guía · fuentes oficiales con fecha</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Un sitio sin licencia no aparece en ninguna lista oficial. Acá está lo que dicen los propios reguladores sobre esos sitios, en sus palabras, y dónde avisar si encontrás uno.</p></div>' +
      '<div class="rl-box">' + opSrcQuote(h, D, Q('caba-ilegal'), Q('caba-ilegal').label) + '</div></section>';
    const risks = '<section class="rl-sec">' + sectionHead(h, 'Con licencia y sin licencia, según la Lotería de Córdoba', 'su comparación, textual') + cmp + '</section>';
    const steps = '<section class="rl-sec">' + sectionHead(h, 'Tres pasos para chequear un sitio') + '<ol class="rl-steps">' +
      '<li><b>Copiá la dirección completa</b><p>De la barra del navegador, no del anuncio ni del mensaje que te la mandó.</p></li>' +
      '<li><b>Buscala en la lista de tu provincia</b><p>Tiene que ser igual, letra por letra. El verificador lo hace por vos con las listas que guardamos.</p></li>' +
      '<li><b>Si no figura, no es una prueba de nada más</b><p>Puede tener licencia en una provincia que todavía no verificamos. Pero si no figura en la lista de donde vivís, no es un sitio habilitado por tu regulador según esa lista.</p></li></ol></section>';
    const tel = Q('cba-denuncias-tel');
    const report = '<section class="rl-sec">' + sectionHead(h, 'Dónde denunciar', 'canales de los reguladores') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Córdoba</h3><a class="rl-tel" href="tel:' + h.esc(tel.phoneTel) + '">' + h.esc(tel.phone) + '</a>' + opSrcQuote(h, D, tel, tel.label) + opSrcQuote(h, D, Q('cba-reporta'), Q('cba-reporta').label) + '</div>' +
      '<div class="rl-box"><h3>Ciudad de Buenos Aires</h3>' + opSrcQuote(h, D, Q('caba-denuncia'), Q('caba-denuncia').label) + '</div></div>' +
      '<p class="rl-note">La Lotería de Córdoba ofrece además herramientas para bloquear sitios ilegales en el teléfono y en la red de una escuela o un club:</p><div class="rl-law">' +
      ['nova', 'luca'].map(k => '<article>' + quote(h, h.reg('cordoba').quotes[k], h.reg('cordoba').regulator.name) + '</article>').join('') + '</div></section>';
    const bill = '<section class="rl-sec">' + sectionHead(h, 'Lo que propone el proyecto de ley nacional', 'todavía no es ley') + '<div class="rl-law">' +
      ['nac-nic', 'nac-direcciones'].map(id => '<article>' + opSrcQuote(h, D, Q(id), Q(id).label) + '</article>').join('') + '</div></section>';
    return hero + risks + steps + report + bill + '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + go(h, [['/verificador', 'Verificá una dirección'], ['/guia/bet-ar', 'Qué garantiza el dominio .bet.ar'], ['/juego-responsable', 'Ayuda con el juego en tu provincia']]) + '</section>';
  },
};

export const operadores = {
  path: '/operadores',
  id: 'operadores',
  kind: 'hub',
  title: 'Operadores de apuestas con licencia provincial en Argentina',
  description: 'Operadores de apuestas con licencia provincial: en cuántas de las listas oficiales que revisamos figura cada uno, con qué dirección y fichas con capturas.',
  h1: 'Operadores con licencia provincial: fichas con fecha de verificación',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/operadores', 'Operadores']])],
  render(h) {
    const D = opData(h.today);
    const matrix = brandMatrix(h.regs, h.names);
    const cards = matrix.map(row => {
      const u = '/operador/' + slugOf(row.brand);
      const shots = ((D.data.brands[row.brand] || {}).shots || []).length;
      const dots = '<span class="rl-dots" aria-label="' + h.esc('Figura en ' + presence(row) + ' de ' + h.regs.length + ' listas') + '">' + h.regs.map(r => '<i class="' + (row.cells[r.id] ? 'on' : '') + '" title="' + h.esc(CODE[r.id]) + '">' + h.esc(CODE[r.id]) + '</i>').join('') + '</span>';
      const hosts = [...new Set(Object.values(row.cells).filter(Boolean).map(c => c.host))];
      const inner = '<h3>' + h.esc(row.name) + '</h3>' + dots + '<p class="rl-host">' + hosts.map(x => h.esc(x)).join('<br>') + '</p>' +
        '<p class="rl-src">' + (h.built(u) ? (shots ? shots + (shots === 1 ? ' captura propia' : ' capturas propias') : 'sin capturas: el sitio no se mostró') : 'ficha todavía no publicada') + '</p>';
      return h.built(u) ? '<a class="rl-opc" href="' + h.href(u) + '">' + inner + '</a>' : '<div class="rl-opc rl-opc-off">' + inner + '</div>';
    }).join('');
    const withRg = OPS.filter(o => Object.values(D.data.quotes).some(q => q.brand === o.brand && /^rg-(deposit|loss|time|bet|pause|selfex)$/.test(q.topic)));
    const TOOLS = [['rg-deposit', 'Depósito'], ['rg-loss', 'Pérdida'], ['rg-time', 'Tiempo'], ['rg-pause', 'Pausa'], ['rg-selfex', 'Autoexclusión']];
    const tbl = withRg.length ? '<section class="rl-sec">' + sectionHead(h, 'Herramientas que nombran sus páginas', 'solo operadores cuya página pudimos guardar') + '<div class="rl-card" data-nosnippet><div class="rl-scroll"><table class="rl-tbl"><thead><tr><th scope="col"><span class="rl-vh">Operador</span></th>' +
      TOOLS.map(([, l]) => '<th scope="col">' + h.esc(l) + '</th>').join('') + '</tr></thead><tbody>' +
      withRg.map(o => '<tr><th scope="row">' + h.esc(h.names[o.brand]) + '</th>' + TOOLS.map(([t]) => '<td>' + (Object.values(D.data.quotes).some(q => q.brand === o.brand && q.topic === t) ? '<i class="rl-y"><span class="rl-vh">La nombra</span></i>' : '<i class="rl-n"><span class="rl-vh">No la encontramos en la página guardada</span></i>') + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div><p class="rl-cap">Tilde: la página de juego responsable del operador nombra esa herramienta (cita en su ficha). Raya: no la encontramos en la copia que guardamos. No es una evaluación: no abrimos cuentas.</p></div></section>' : '';
    const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">' + h.t('{{brand_total}} marcas en {{reg_total}} listas oficiales · ') + listsDate(h) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Cada marca que figura en al menos una lista oficial que verificamos. El orden es por cantidad de listas y después alfabético: no es un ranking ni una recomendación.</p></div>' +
      '<div class="rl-big"><b>' + h.t('{{brand_total}}') + '</b><span>marcas con al menos una licencia en las listas que revisamos</span><small>' + h.t('{{multi_total}} figuran en más de una lista') + '</small></div></section>';
    return hero + '<section class="rl-sec">' + sectionHead(h, 'Las marcas, lista por lista', h.regs.map(r => CODE[r.id]).join(' · ')) + '<div class="rl-opcs">' + cards + '</div></section>' + tbl;
  },
};

export const autoexclusion = {
  path: '/juego-responsable/autoexclusion',
  id: 'autoexclusion',
  kind: 'help',
  help: true,
  title: 'Autoexclusión de juego online por provincia: cómo pedirla',
  description: 'Autoexclusión en cada provincia argentina: cuánto dura según la página oficial, de meses a años, quién la administra y dónde pedirla. Sin publicidad.',
  h1: 'Autoexclusión: cómo pedirla en cada provincia y cuánto dura',
  ld: h => [h.webPage()],
  render(h) {
    const rows = TILES.map(t => ({ id: t.id, j: h.rg.prov(t.id) })).filter(x => x.j.selfExclusion)
      .map(x => ({ ...x, m: termMonths(x.j.selfExclusion.terms) })).sort((a, b) => (b.m ? b.m.max : -1) - (a.m ? a.m.max : -1) || a.j.name.localeCompare(b.j.name, 'es'));
    const maxM = Math.max(...rows.filter(r => r.m).map(r => r.m.max));
    const none = TILES.filter(t => !h.rg.prov(t.id).selfExclusion).map(t => h.rg.prov(t.id).name).sort((a, b) => a.localeCompare(b, 'es'));
    const years = Math.ceil(maxM / 12);
    const ticks = Array.from({ length: years + 1 }, (_, i) => '<span style="--x:' + (100 * i * 12 / (years * 12)).toFixed(2) + '%">' + i + (i === 1 ? ' año' : ' años') + '</span>').join('');
    const chart = '<div class="rl-card rl-se" data-nosnippet><div class="rl-se-ax">' + ticks + '</div><ul>' + rows.map(r => {
      const m = r.m;
      const bar = m ? '<div class="rl-se-b"><i style="--a:' + (100 * m.min / (years * 12)).toFixed(2) + '%;--b:' + (100 * m.max / (years * 12)).toFixed(2) + '%"' + (m.min !== m.max ? ' class="rl-se-r"' : '') + '></i></div>' : '<div class="rl-se-b rl-se-0">la página no dice el plazo</div>';
      return '<li><span>' + h.esc(r.j.name) + '</span>' + bar + '<b>' + h.esc(r.j.selfExclusion.terms || '-') + '</b></li>';
    }).join('') + '</ul><p class="rl-cap">Plazo tal como lo escribe cada página oficial; la barra lo dibuja. Un tramo claro marca un mínimo y un máximo.</p></div>';
    const hero = '<section class="rl-hero"><div><p class="rl-kick">Ayuda · gratis y voluntaria</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">La autoexclusión es un pedido que hacés vos para que no te dejen jugar durante un tiempo. Cada provincia tiene su propio programa y su propio plazo. Acá están los que publican las páginas oficiales.</p></div>' +
      '<div class="rl-crisis"><h2>Si necesitás hablar ahora</h2><p>Línea nacional, ' + h.esc(h.rg.crisis.hours) + '.</p><a class="rl-tel" href="tel:' + h.esc(h.rg.crisis.phoneTel) + '">' + h.esc(h.rg.crisis.phone) + '</a></div></section>';
    const list = '<section class="rl-sec">' + sectionHead(h, 'Programa por programa', rows.length + ' de ' + TILES.length + ' jurisdicciones con programa verificado') + '<ul class="rl-lines">' + rows.map(r => {
      const se = r.j.selfExclusion;
      return '<li id="se-' + r.id + '"><h3>' + h.esc(r.j.name) + '</h3><p><b>' + h.esc(se.name) + '</b>' + (se.terms ? ' · plazo: ' + h.esc(se.terms) : '') + '</p>' + rgQuote(h, se, se.name) +
        (se.web ? '<p><a href="' + h.esc(se.web) + '" rel="noopener">Página oficial del programa</a></p>' : '') +
        (r.j.line ? '<p>Ayuda: <a href="tel:' + h.esc(r.j.line.phoneTel) + '">' + h.esc(r.j.line.phone) + '</a></p>' : '') + '</li>';
    }).join('') + '</ul>' + (none.length ? '<p class="rl-cap">Sin programa verificado en una página oficial que pudiéramos guardar: ' + h.esc(none.join(', ')) + '. Preguntá en la línea de ayuda de tu provincia o en la línea nacional.</p>' : '') + '</section>';
    const how = '<section class="rl-sec">' + sectionHead(h, 'Antes de pedirla') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Es por un plazo</h3><p>Durante ese tiempo no te dejan entrar o apostar donde alcanza el programa. Fijate en la página oficial si cubre también el juego online y las salas.</p></div>' +
      '<div class="rl-box"><h3>No estás solo</h3><p>Pedirla es una decisión valiente. Si querés hablarlo antes, las líneas de ayuda son gratuitas y confidenciales.</p></div></div>' +
      (h.built('/juego-responsable') ? '<p class="rl-note"><a href="' + h.href('/juego-responsable') + '">Líneas de ayuda de todas las provincias</a></p>' : '') + '</section>';
    return hero + '<section class="rl-sec">' + sectionHead(h, 'Cuánto dura en cada provincia') + chart + '</section>' + list + how;
  },
};
