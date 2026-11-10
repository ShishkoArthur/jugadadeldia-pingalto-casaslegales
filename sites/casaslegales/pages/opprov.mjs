// /operador/<brand>/<jurisdiction>: one brand in one province, built only where the brand is in that province's verified list.
// Own visual: a side-by-side table of the brand's versions in every verified list (the cells that differ from this province
// are marked), plus a "am I on this province's site?" check that runs engine/hostcheck.mjs in the browser.
import { hostKey } from '../../../engine/registry.mjs';
import { anatomy } from '../../../engine/hostcheck.mjs';
import { OPPROV } from '../content/opprov.mjs';
import { opData, quotesOf, docOf } from '../content/opdata.mjs';
import { provData } from '../content/provdata.mjs';
import { rowOf, entries } from './operador.mjs';
import { anat, opQuote, shotFigure, codeOf, mapLegend } from './opparts.mjs';
import { relief, help } from './provincia.mjs';
import { quote, sectionHead, brandLink, officialLinks } from './parts.mjs';
import { trAll } from '../content/lang.mjs';

const DE = { IPLyC: 'del IPLyC', 'Lotería de Córdoba': 'de la Lotería de Córdoba', 'Lotería de Río Negro': 'de la Lotería de Río Negro', 'Lotería de Santa Fe': 'de la Lotería de Santa Fe', IPJyC: 'del IPJyC' };
const actOf = (h, r, cell) => {
  if (cell.ref) return cell.ref;
  const lic = r.quotes.licence && /Resoluci[oó]n\D*\d+\/\d+/.exec(r.quotes.licence.text);
  return lic ? lic[0] + ' (la misma para toda la lista)' : 'la lista no lo indica por sitio';
};

function diffTable(h, o, row) {
  const jurs = [o.jur, ...h.regs.map(r => r.id).filter(j => j !== o.jur && row.cells[j])];
  const col = j => {
    const r = h.reg(j), c = row.cells[j], a = anatomy(c.host), p = h.rg.prov(j);
    return {
      host: c.host,
      bet: a.betAr ? 'sí' : 'no',
      sub: a.sub ? a.sub + '.' : 'sin subdominio',
      reg: r.regulator.short,
      act: actOf(h, r, c),
      n: String(r.licensees.length),
      line: p.line ? p.line.phone : 'sin línea provincial verificada',
      selfex: p.selfExclusion ? (p.selfExclusion.terms || 'sí, sin plazo publicado') : 'sin dato oficial',
      date: h.fmtDate(h.doc(r.list.doc).fetched),
    };
  };
  const cols = jurs.map(col);
  const ROWS = [['host', 'Dirección en la lista'], ['bet', 'Termina en .bet.ar'], ['sub', 'Subdominio'], ['reg', 'Regulador'], ['act', 'Acto que figura'], ['n', 'Sitios en esa lista'], ['line', 'Línea de ayuda de la provincia'], ['selfex', 'Autoexclusión'], ['date', 'Copia de la lista']];
  const diffs = ROWS.filter(([k]) => cols.slice(1).some(c => c[k] !== cols[0][k])).length;
  const head = '<thead><tr><th scope="col"><span class="rl-vh">Dato</span></th>' + jurs.map((j, i) => '<th scope="col"' + (i === 0 ? ' class="rl-dcur"' : '') + '><span class="rl-tag">' + h.esc(codeOf(j)) + '</span> ' + h.esc(h.rg.prov(j).name) + '</th>').join('') + '</tr></thead>';
  const body = ROWS.map(([k, l]) => '<tr><th scope="row">' + h.esc(l) + '</th>' + cols.map((c, i) => '<td class="' + (i === 0 ? 'rl-dcur' : c[k] !== cols[0][k] ? 'rl-dif' : 'rl-same') + (k === 'host' ? ' rl-host' : '') + '">' + h.esc(c[k]) + '</td>').join('') + '</tr>').join('');
  return { html: '<div class="rl-card" data-nosnippet>' + (jurs.length > 1 ? '<p class="rl-cap rl-capt">Columna resaltada: ' + h.esc(h.rg.prov(o.jur).name) + '. En las demás columnas, con fondo de color, los datos que cambian frente a esta provincia.</p>' : '') +
    '<div class="rl-scroll"><table class="rl-reg rl-diff">' + head + '<tbody>' + body + '</tbody></table></div></div>', diffs, n: jurs.length };
}

function checker(h, o, row) {
  const all = entries(h);
  const data = { jur: o.jur, b: row.name, host: o.host, j: Object.fromEntries(h.regs.map(r => [r.id, h.rg.prov(r.id).name])), e: all.map(x => ({ h: x.host, j: x.jur })),
    s: trAll(h, { yes: 'Sí: {h} es la dirección de {b} que figura en la lista de {p}.', under: 'Es una página dentro de {m}, la dirección de {b} que figura en la lista de {p}.',
      other: '{h} figura en la lista de {o}, no en la de {p}. En {p}, {b} figura como {x}.', similar: '{h} no figura en ninguna lista: se parece a {m}, pero no es la misma dirección. En {p}, {b} figura como {x}.',
      none: '{h} no figura en ninguna de las {n} listas que revisamos. En {p}, {b} figura como {x}.', n: String(h.regs.length) }) };
  return '<form class="rl-pchk" data-rl-pchk novalidate><label for="rl-pchk-in">Pegá la dirección que tenés abierta</label><div class="rl-pchk-row"><input id="rl-pchk-in" inputmode="url" autocomplete="off" spellcheck="false" placeholder="' + h.esc(o.host) + '"><button type="submit" class="rl-b1">Comparar</button></div>' +
    '<p class="rl-pchk-out" data-rl-pchk-out aria-live="polite"></p></form><script type="application/json" id="rl-pchk">' + h.jsonScript(data) + '</script>';
}

function siteSeen(h, o, D, row) {
  const under = (k, host) => k === host || k.endsWith('.' + host);
  const others = [...new Set(Object.values(row.cells).filter(Boolean).map(c => c.host))].filter(x => x !== o.host && under(x, o.host));
  const mine = x => { try { const k = hostKey(x); return under(k, o.host) && !others.some(y => under(k, y)); } catch { return false; } };
  const listed = new Set((D.data.brands[o.brand] || { shots: [] }).shots);
  const shots = Object.values(D.shots).filter(s => s.brand === o.brand && mine(s.url));
  const figs = shots.filter(s => listed.has(s.id)).map(s => shotFigure(h, s, s.ok ? 'Página de entrada' : 'Lo que muestra fuera de su provincia')).join('');
  const miss = shots.filter(s => !listed.has(s.id) && !s.ok);
  const qs = quotesOf(D, o.brand).filter(q => mine(docOf(D, q.doc).url));
  if (!figs && !miss.length && !qs.length) return '';
  return '<section class="rl-sec">' + sectionHead(h, 'Lo que vimos en ' + o.host, 'captura propia, sin registrarnos') +
    (figs ? '<div class="rl-shots">' + figs + '</div>' : '') +
    (qs.length ? '<div class="rl-law rl-law-1">' + qs.map(q => '<article>' + opQuote(h, D, q, q.label) + '</article>').join('') + '</div>' : '') +
    (miss.length ? '<div class="rl-box rl-miss"><h3>No pudimos ver su sitio</h3><p>Lo visitamos desde fuera de Argentina y respondió con una página de bloqueo (código ' + miss.map(s => s.status).join(', ') + ', ' + h.fmtDate(miss[0].date) + '). No usamos capturas ajenas.</p></div>' : '') + '</section>';
}

export function opProvPage(o) {
  const path = '/operador/' + o.brand + '/' + o.jur;
  return {
    path, id: 'operador-' + o.brand + '-' + o.jur, kind: 'operator', jurisdiction: o.jur, brand: o.brand,
    title: o.title, description: o.description, h1: o.h1,
    ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ...(h.built('/operadores') ? [['/operadores', 'Operadores']] : []), ['/operador/' + o.brand, h.names[o.brand]], [path, h.rg.prov(o.jur).name]])],
    render(h) {
      const row = rowOf(h, o.brand);
      const cell = row.cells[o.jur];
      if (!cell || cell.host !== o.host) throw new Error(path + ': the copy says ' + o.host + ' but the ' + o.jur + ' registry has ' + (cell ? cell.host : 'nothing'));
      const r = h.reg(o.jur), P = provData(h), D = opData(h.today), x = P.one(o.jur);
      const prov = h.rg.prov(o.jur).name, listDoc = h.doc(r.list.doc);
      const others = h.regs.filter(y => y.id !== o.jur && row.cells[y.id]);
      const otherHosts = [...new Set(others.map(y => row.cells[y.id].host))].filter(z => z !== o.host);
      const sameHost = others.filter(y => row.cells[y.id].host === o.host);
      const T = diffTable(h, o, row);
      const lead = 'En la lista oficial ' + (DE[r.regulator.short] || 'de ' + r.regulator.short) + ', ' + row.name + ' figura con la dirección ' + o.host + '.' +
        (otherHosts.length ? ' En ' + others.filter(y => row.cells[y.id].host !== o.host).map(y => h.rg.prov(y.id).name).join(' y ') + ' la marca figura con ' + (otherHosts.length === 1 ? 'otra dirección' : 'otras direcciones') + ': si jugás desde ' + prov + ', vale la de esta lista.' : '') +
        (sameHost.length ? ' La misma dirección figura también en la lista de ' + sameHost.map(y => h.rg.prov(y.id).name).join(' y ') + ', con otro regulador.' : '');
      const map = relief(h, P, o.jur, { cls: y => row.cells[y.id] ? 'rl-s-yes' : h.regs.some(z => z.id === y.id) ? 'rl-s-no' : 'rl-s-none', tip: y => row.cells[y.id] ? 'figura en la lista oficial' : h.regs.some(z => z.id === y.id) ? 'no figura en la lista oficial' : 'sin dato verificado' });
      const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">' + brandLink(h, o.brand, row.name) + h.esc(' × ' + prov) + ' · lista copiada el ' + h.fmtDate(listDoc.fetched) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
        '<p class="rl-lead">' + h.esc(lead) + '</p>' + officialLinks(h, o.brand, [o.jur]) + '<p class="rl-note">Sin promociones ni afiliados. Depende de la ley de tu provincia; esto no es asesoramiento legal.</p></div>' +
        '<div class="rl-pvv">' + map + '<p class="rl-pvn"><b>' + T.n + '</b><span>' + (T.n === 1 ? 'lista oficial nombra a ' : 'listas oficiales de las que revisamos nombran a ') + h.esc(row.name) + '</span></p><p class="rl-pvcap">' + h.esc(prov) + ' resaltada; en verde, donde figura</p>' + mapLegend() + '</div></section>';
      const licQuote = r.quotes.licences || r.quotes.licence || r.quotes.list;
      const addr = '<section class="rl-sec">' + sectionHead(h, 'La dirección que figura en ' + prov, 'copiada de la lista oficial') + '<div class="rl-two">' +
        '<div class="rl-box"><h3>' + h.esc(o.host) + '</h3>' + anat(h, o.host) + (cell.ref ? '<p class="rl-ref">Autorizado por ' + h.esc(cell.ref) + '</p>' : '') + officialLinks(h, o.brand, [o.jur]) +
        '<p class="rl-src">' + h.esc(r.regulator.name) + ' · <a href="' + h.esc(listDoc.url) + '" rel="noopener">' + h.esc(listDoc.host) + '</a> · copia del ' + h.fmtDate(listDoc.fetched) + ' · ' + r.licensees.length + ' sitios en la lista</p></div>' +
        '<div class="rl-box"><h3>Qué dice el regulador</h3>' + (licQuote ? quote(h, licQuote, r.regulator.name) : '') + (r.quotes.betar ? quote(h, r.quotes.betar, r.regulator.name) : '') +
        (anatomy(o.host).betAr ? '' : '<p>Esta dirección no termina en .bet.ar y aun así es la que figura en la lista de ' + h.esc(prov) + '. Por eso la terminación sola no alcanza: hay que comparar con la lista.</p>') + '</div></div></section>';
      const diff = '<section class="rl-sec">' + sectionHead(h, row.name + ' en cada lista oficial', T.n > 1 ? T.diffs + ' de 9 datos cambian entre provincias' : 'una sola lista') + T.html + '</section>';
      const chk = '<section class="rl-sec">' + sectionHead(h, '¿Estás en el sitio de ' + prov + '?', 'se compara en tu navegador, no se envía') + '<div class="rl-card">' + checker(h, o, row) + '</div>' +
        (h.built('/verificador') ? '<p class="rl-note">Para cualquier otro sitio, usá el <a href="' + h.href('/verificador') + '">verificador</a>.</p>' : '') + '</section>';
      const links = [['/operador/' + o.brand, 'Ficha completa de ' + row.name], ['/operador/' + o.brand + '/ingresar', 'Cómo iniciar sesión en ' + row.name + ' ' + (o.jur === 'buenos-aires' ? 'PBA' : o.jur === 'caba' ? 'CABA' : prov)], ...OPPROV.filter(y => y.brand === o.brand && y.jur !== o.jur).map(y => ['/operador/' + y.brand + '/' + y.jur, row.name + ' en ' + h.rg.prov(y.jur).name]),
        ['/provincia/' + o.jur, 'Todos los sitios de la lista de ' + prov], ['/guia/como-verificar', 'Cómo verificar un sitio']].filter(([u]) => h.built(u));
      const next = '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + '<div class="rl-gd">' + links.map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div></section>';
      return hero + addr + diff + chk + siteSeen(h, o, D, row) + help(h, x) + next;
    },
  };
}
export const opProvPages = OPPROV.map(opProvPage);
