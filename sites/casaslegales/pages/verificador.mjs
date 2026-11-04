// /verificador: paste an address, compare it in the browser with every address of the verified official lists (data embedded
// at build, no network call). Below the tool, the whole list of addresses so the page answers without JavaScript too.
import { anatomy, checkHost } from '../../../engine/hostcheck.mjs';
import { CODE } from '../content/map.mjs';
import { anat, listsDate } from './opparts.mjs';
import { quote, src, sectionHead, brandLink } from './parts.mjs';
import { opPath } from '../content/operators.mjs';
import { entries } from './operador.mjs';
import { officialUrl, DEAD } from '../content/official.mjs';

const EXAMPLES = ['pba.betsson.bet.ar', 'betsson.com', 'bplay.bet.ar', 'betano.bet.ar', 'sportsbet.io'];

export const verificador = {
  path: '/verificador',
  id: 'verificador',
  kind: 'tool',
  title: '¿Es legal este sitio de apuestas? Verificador .bet.ar',
  description: 'Pegá la dirección de un sitio de apuestas y fijate si figura en una de las {{reg_total}} listas oficiales que guardamos, de qué provincia es y su fecha.',
  h1: 'Verificador: pegá la dirección y mirá si figura en un registro oficial',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/verificador', 'Verificador']])],
  render(h) {
    const all = entries(h);
    const pages = Object.fromEntries(h.regs.flatMap(r => r.licensees.map(l => [l.brand, h.href(opPath(l.brand))])));
    const data = {
      e: all.map(e => { const l = h.reg(e.jur).licensees.find(x => x.host === e.host); return { h: e.host, j: e.jur, b: h.names[e.brand], r: l.ref || null, u: pages[e.brand], o: DEAD[l.host] ? null : officialUrl(l) }; }),
      j: Object.fromEntries(h.regs.map(r => [r.id, { n: h.rg.prov(r.id).name, c: CODE[r.id], r: r.regulator.short, d: h.fmtDate(h.doc(r.list.doc).fetched), u: h.built('/provincia/' + r.id) ? '/provincia/' + r.id : null }])),
      s: {
        listed: 'Figura en una lista oficial', sub: 'Es una subdirección de una dirección de la lista', similar: 'Dirección parecida: ojo', none: 'No figura en las listas que revisamos', empty: 'Escribí una dirección, por ejemplo pba.ejemplo.bet.ar',
        inList: 'Figura en la lista de {n} ({r}, copia del {d})', subOf: '{h} es parte de {p}, que figura en la lista de {n} ({r}, copia del {d}). La lista nombra {p}, no esta dirección exacta.',
        parent: 'La lista no nombra {h}: nombra {p} ({n}). Fijate que la dirección completa sea igual.', name: 'Mismo nombre que {p} ({n}), pero con otra terminación. No es la dirección de la lista.',
        typo: 'Se parece a {p} ({n}): difiere en una o dos letras. Revisá letra por letra.', contains: 'Contiene el nombre de {p} ({n}), pero no es esa dirección.',
        noneLong: 'No está en las listas oficiales de {lists} que revisamos. Eso no quiere decir que sea ilegal en otra provincia: todavía no verificamos las demás listas. Para saber si está habilitado donde vivís, buscalo en la lista oficial de tu provincia.',
        bet: 'Termina en .bet.ar', notBet: 'No termina en .bet.ar', act: 'Autorizado por {a}', ficha: 'Ver la ficha de {b}', prov: 'Ver la lista de {n}', off: 'Ir al sitio oficial ({n})', offNote: 'Dirección que publica la lista oficial, sin códigos de afiliado. Solo mayores de 18.',
      },
      lists: h.regs.map(r => CODE[r.id]).slice(0, -1).join(', ') + ' y ' + CODE[h.regs.at(-1).id],
    };
    for (const x of EXAMPLES) if (checkHost(x, all).state === 'empty') throw new Error('verificador: bad example ' + x);
    const hero = '<section class="rl-hero rl-vf"><div><p class="rl-kick">' + h.t('{{lic_total}} direcciones de {{reg_total}} listas oficiales · copiadas el ') + listsDate(h) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Copiá la dirección de la barra de tu navegador y pegala acá. La comparamos con las direcciones exactas que publican los reguladores. Todo pasa en tu teléfono: no se envía a ningún lado.</p></div>' +
      '<form class="rl-vbox" data-rl-ver role="search" action="/verificador" method="get"><label for="rl-vin">Dirección del sitio</label><div class="rl-vrow"><input id="rl-vin" name="d" type="text" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="pba.ejemplo.bet.ar"><button type="submit">Verificar</button></div>' +
      '<p class="rl-vex">Probá: ' + EXAMPLES.map(x => '<button type="button" data-ex="' + h.esc(x) + '">' + h.esc(x) + '</button>').join('') + '</p>' +
      '<div class="rl-vout" data-rl-vout aria-live="polite"><p class="rl-vwait">El resultado aparece acá.</p></div></form>' +
      '<script type="application/json" id="rl-ver">' + h.jsonScript(data) + '</script></section>';

    const pba = h.reg('buenos-aires'), caba = h.reg('caba'), cba = h.reg('cordoba');
    const nonBet = caba.licensees.filter(l => !anatomy(l.host).betAr);
    const read = '<section class="rl-sec">' + sectionHead(h, 'Cómo leer una dirección', 'de derecha a izquierda') +
      '<div class="rl-two"><div class="rl-box">' + anat(h, 'pba.betsson.bet.ar') + '<p>La <b>terminación</b> va al final. La provincia suele ir en el <b>subdominio</b>, adelante: pba., caba., cba. o cordoba. Lo que manda es la dirección completa: tiene que ser igual, letra por letra, a la de la lista.</p></div>' +
      '<div class="rl-box"><h3>Tres respuestas posibles</h3><ul class="rl-states"><li><i class="rl-y" aria-hidden="true"></i><p><b>Figura.</b> La dirección (o la dirección de la que es parte) está en una lista oficial.</p></li>' +
      '<li><i class="rl-w" aria-hidden="true"></i><p><b>Parecida.</b> Se parece a una de la lista, pero no es igual. Puede ser otra versión de la marca o una imitación.</p></li>' +
      '<li><i class="rl-n" aria-hidden="true"></i><p><b>No figura.</b> No está en las listas que revisamos. No quiere decir «ilegal» en todo el país.</p></li></ul></div></div></section>';
    const betar = '<section class="rl-sec">' + sectionHead(h, '¿Alcanza con que termine en .bet.ar?', 'depende de la provincia') + '<div class="rl-law">' +
      '<article><span class="rl-tag">PBA</span>' + quote(h, pba.quotes.betar, pba.regulator.name) + '</article>' +
      '<article><span class="rl-tag">CBA</span>' + quote(h, cba.quotes.betar, cba.regulator.name) + '</article>' +
      '<article><span class="rl-tag">CABA</span><p>La lista de la Ciudad incluye ' + nonBet.length + ' ' + (nonBet.length === 1 ? 'dirección que no termina' : 'direcciones que no terminan') + ' en .bet.ar: ' + nonBet.map(l => '<span class="rl-host">' + h.esc(l.host) + '</span>').join(' y ') + '.</p>' + src(h, caba.list.doc) + '</article>' +
      '</div>' + (h.built('/guia/bet-ar') ? '<p class="rl-note"><a href="' + h.href('/guia/bet-ar') + '">Qué garantiza el dominio .bet.ar y qué no</a></p>' : '') + '</section>';
    const list = '<section class="rl-sec">' + sectionHead(h, 'Todas las direcciones de las listas', h.t('{{lic_total}} direcciones')) + '<div class="rl-card" data-nosnippet><div class="rl-scroll"><table class="rl-reg"><thead><tr><th scope="col">Dirección</th><th scope="col">Marca</th><th scope="col">Lista</th></tr></thead><tbody>' +
      all.slice().sort((a, b) => a.host.localeCompare(b.host)).map(e => '<tr><td class="rl-host">' + h.esc(e.host) + '</td><td>' + brandLink(h, e.brand) + '</td><td>' + h.esc(CODE[e.jur]) + '</td></tr>').join('') +
      '</tbody></table></div>' + h.regs.map(r => src(h, r.list.doc, h.rg.prov(r.id).name)).join('') + '</div></section>';
    return hero + read + betar + list;
  },
};
export { slugOf } from '../content/operators.mjs';
