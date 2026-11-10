// Wave 3 guides that need no new data: /guia/como-verificar, /guia/menores, /calculadora/margen (engine/odds.mjs, also in the
// browser) and /guia/handicap (every cell computed by engine/odds.mjs). Each has its own diagram.
import { margin, settleHandicap, handicapLabel, handicapReturn } from '../../../engine/odds.mjs';
import { anatomy } from '../../../engine/hostcheck.mjs';
import { brandMatrix, distinctHosts, licensees } from '../../../engine/registry.mjs';
import { fmtInt } from '../../../engine/format.mjs';
import { CODE } from '../content/map.mjs';
import { provData, STATUS_LABEL, STATUS_ORDER } from '../content/provdata.mjs';
import { opData, quotesOf } from '../content/opdata.mjs';
import { anat, opQuote, listsDate } from './opparts.mjs';
import { quote, rgQuote, sectionHead, hostHtml, brandLink } from './parts.mjs';
import { relief } from './provincia.mjs';
import { otherCalcs } from './guias5.mjs';

const go = (h, list) => '<div class="rl-gd">' + list.filter(([u]) => h.built(u)).map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div>';
const dec = (x, d = 2) => x.toFixed(d).replace('.', ',');
const pct = (x, d = 2) => dec(x * 100, d) + ' %';

export const comoVerificar = {
  path: '/guia/como-verificar',
  id: 'guia-como-verificar',
  kind: 'guide',
  title: 'Cómo verificar si un sitio de apuestas es legal en Argentina',
  description: 'Cómo verificar un sitio de apuestas en cinco pasos: dirección completa, tu provincia, la lista oficial letra por letra, .bet.ar y qué hacer si no figura.',
  h1: 'Cómo verificar si un sitio de apuestas tiene licencia en tu provincia',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/guia/como-verificar', 'Cómo verificar']])],
  render(h) {
    const P = provData(h);
    const matrix = brandMatrix(h.regs, h.names);
    const widest = [...matrix].sort((a, b) => distinctHosts(b) - distinctHosts(a) || a.name.localeCompare(b.name, 'es'))[0];
    const all = licensees(h.regs);
    const nonBet = all.filter(l => !anatomy(l.host).betAr);
    const byHost = {};
    for (const l of all) (byHost[l.host] = byHost[l.host] || []).push(l.jur);
    const shared = Object.entries(byHost).filter(([, j]) => j.length > 1).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    const ex = all.find(l => anatomy(l.host).sub) || all[0];
    const hero = '<section class="rl-hero"><div><p class="rl-kick">Guía · listas copiadas el ' + listsDate(h) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Cada provincia autoriza sus propios sitios. Verificar es comparar la dirección exacta que tenés en el navegador con la lista oficial de donde vivís. Estos cinco pasos usan las listas que guardamos, con su fecha.</p></div>' +
      '<div class="rl-box">' + anat(h, ex.host) + '<p>Una dirección de la lista de ' + h.esc(h.rg.prov(ex.jur).name) + ', separada en partes. Se lee de derecha a izquierda.</p></div></section>';
    const statusLine = STATUS_ORDER.map(s => P.count[s] + ' ' + STATUS_LABEL[s]).join(' · ');
    const steps = '<section class="rl-sec">' + sectionHead(h, 'Cinco pasos', 'cada ejemplo sale de las listas verificadas') + '<ol class="rl-steps">' +
      '<li><b>Copiá la dirección completa</b><p>De la barra del navegador, no del anuncio, del mensaje ni del perfil que te la pasó. Lo que importa es todo lo que está antes de la primera barra: subdominio, nombre y terminación.</p></li>' +
      '<li><b>Fijate qué publica tu provincia</b><p>No todas publican una lista. Hoy, de ' + P.all.length + ' jurisdicciones: ' + h.esc(statusLine) + '.' + (h.built('/provincias') ? ' El detalle está en <a href="' + h.href('/provincias') + '">provincias</a>.' : '') + '</p></li>' +
      '<li><b>Compará letra por letra</b><p>La misma marca puede tener una dirección distinta en cada provincia. ' + brandLink(h, widest.brand, widest.name) + ' figura con ' + distinctHosts(widest) + ' direcciones: ' +
        h.regs.filter(r => widest.cells[r.id]).map(r => '<span class="rl-host">' + h.esc(widest.cells[r.id].host) + '</span> (' + h.esc(CODE[r.id]) + ')').join(', ') + '. Solo vale la de tu lista.</p></li>' +
      '<li><b>.bet.ar ayuda, pero no alcanza</b><p>' + (nonBet.length ? 'En las listas que guardamos hay ' + nonBet.length + (nonBet.length === 1 ? ' dirección que no termina' : ' direcciones que no terminan') + ' en .bet.ar: ' + nonBet.map(l => '<span class="rl-host">' + h.esc(l.host) + '</span>').join(', ') + '. ' : '') +
        'Y una dirección .bet.ar puede ser de otra provincia: la terminación no dice dónde vale la licencia.</p></li>' +
      '<li><b>Si no figura, no saques más conclusiones que esa</b><p>«No figura en la lista de tu provincia» es un dato. «Es ilegal» depende de la ley de tu provincia y de listas que quizá no publicamos. Si sospechás de un sitio, tu regulador tiene canales de denuncia.</p></li></ol></section>';
    const same = shared.length ? '<section class="rl-sec">' + sectionHead(h, 'La misma dirección en más de una lista', 'contado por el programa') +
      '<p class="rl-note">Estas direcciones figuran tal cual en más de una lista oficial. Por eso conviene mirar la lista de tu provincia y no la de otra.</p>' +
      '<div class="rl-dom" data-nosnippet>' + shared.map(([host, j]) => '<article>' + hostHtml(h, host) + '<ul>' + j.map(x => '<li><span class="rl-tag">' + h.esc(CODE[x]) + '</span>' + h.esc(h.rg.prov(x).name) + '</li>').join('') + '</ul></article>').join('') + '</div></section>' : '';
    return hero + steps + same + '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + go(h, [['/verificador', 'Pegá una dirección en el verificador'], ['/provincias', 'Estado de cada provincia'], ['/guia/bet-ar', 'Qué garantiza el dominio .bet.ar'], ['/guia/sitios-ilegales', 'Sitios sin licencia y dónde denunciar']]) + '</section>';
  },
};

export const menores = {
  path: '/guia/menores',
  id: 'guia-menores',
  kind: 'guide',
  title: 'Menores y apuestas online: la regla de los 18 en Argentina',
  description: 'Qué dicen los reguladores argentinos sobre menores y apuestas online: citas oficiales de los 18 años, qué muestran los sitios y el proyecto de ley federal.',
  h1: 'Menores y apuestas online: qué dicen las provincias sobre los 18 años',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/guia/menores', 'Menores y apuestas']])],
  render(h) {
    const P = provData(h);
    const rows = [];
    for (const x of P.all) {
      if (x.j.age) rows.push({ x, html: rgQuote(h, x.j.age, x.j.regulator ? x.j.regulator.name : x.name), text: x.j.age.quote });
      else if (x.reg && x.reg.quotes.age) rows.push({ x, html: quote(h, x.reg.quotes.age, x.reg.regulator.name), text: x.reg.quotes.age.text });
    }
    const with18 = rows.filter(r => /\b18\b/.test(r.text));
    const ids = new Set(rows.map(r => r.x.id));
    const map = relief(h, P, null, { cls: x => ids.has(x.id) ? 'rl-s-list' : 'rl-s-none', tip: x => ids.has(x.id) ? 'cita oficial sobre la edad' : 'sin cita oficial guardada' });
    const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">Guía · citas oficiales con fecha</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">En Argentina cada provincia regula su juego, pero en las páginas oficiales que guardamos la edad mínima es la misma: 18 años. Acá están esas citas textuales, lo que muestran algunos sitios con licencia y lo que propone el proyecto de ley federal.</p></div>' +
      '<div class="rl-pvv">' + map + '<p class="rl-pvn"><b>' + with18.length + '</b><span>jurisdicciones con una cita oficial que nombra los 18 años</span></p><p class="rl-pvcap">en verde, las que tienen una cita guardada sobre la edad</p></div></section>';
    const list = '<section class="rl-sec">' + sectionHead(h, 'Lo que dice cada regulador', rows.length + ' citas de ' + P.all.length + ' jurisdicciones') +
      '<div class="rl-law rl-ages">' + rows.map(r => '<article><span class="rl-tag">' + h.esc(r.x.code) + '</span>' + r.html + '</article>').join('') + '</div>' +
      '<p class="rl-note">Las demás jurisdicciones no tienen acá una cita sobre la edad porque no la encontramos en una página oficial que hayamos copiado; no quiere decir que permitan otra cosa.</p></section>';
    const D = opData(h.today);
    const ops = Object.keys(D.data.brands).flatMap(b => quotesOf(D, b, 'rg-age'));
    const sites = ops.length ? '<section class="rl-sec">' + sectionHead(h, 'Lo que muestran los sitios con licencia', 'capturas y copias propias de páginas públicas') +
      '<div class="rl-law">' + ops.map(q => '<article><span class="rl-tag">' + brandLink(h, q.brand) + '</span>' + opQuote(h, D, q, q.label) + '</article>').join('') + '</div></section>' : '';
    const fed = (h.rg.pack.law || []).find(l => l.id === 'diputados-media-sancion');
    const fedQ = fed && (fed.also || []).find(a => /menores de 18/.test(a.quote));
    const law = fedQ ? '<section class="rl-sec">' + sectionHead(h, 'El proyecto de ley federal', 'media sanción, todavía no es ley') + '<div class="rl-two"><div class="rl-box"><h3>Qué aprobó Diputados</h3>' + rgQuote(h, { doc: fedQ.doc, quote: fedQ.quote }, 'Cámara de Diputados') +
      '<p>Es un proyecto con media sanción: para ser ley le falta el Senado. Mientras tanto rigen las normas de cada provincia.</p></div>' +
      '<div class="rl-box"><h3>Para madres, padres y docentes</h3>' + (h.reg('cordoba').quotes.nova ? quote(h, h.reg('cordoba').quotes.nova, h.reg('cordoba').regulator.name) : '') +
      '<p>Las herramientas de control parental del teléfono y los bloqueos de la red de la casa o la escuela también sirven para sitios sin licencia.</p></div></div></section>' : '';
    return hero + list + sites + law + '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + go(h, [['/juego-responsable', 'Líneas de ayuda de cada provincia'], ['/juego-responsable/autoexclusion', 'Cómo pedir la autoexclusión'], ['/guia/como-verificar', 'Cómo verificar un sitio']]) + '</section>';
  },
};

const EX = { odds: ['2,10', '3,20', '3,60'], two: ['1,85', '1,95'] };

export const calcMargen = {
  path: '/calculadora/margen',
  id: 'calculadora-margen',
  kind: 'tool',
  title: 'Calculadora de margen de cuotas: cuánto se queda la casa',
  description: 'Calculadora de margen: escribí las cuotas decimales de un mercado y mirá cuánto se queda la casa, la probabilidad implícita y la cuota sin margen.',
  h1: 'Calculadora de margen: cuánto cobra la casa en cada cuota',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/calculadora/margen', 'Calculadora de margen']])],
  render(h) {
    const m = margin(EX.odds), m2 = margin(EX.two);
    const names = ['Local', 'Empate', 'Visitante'];
    const bar = (mm, labels) => '<div class="rl-mbar" role="img" aria-label="' + h.esc('Las probabilidades implícitas suman ' + pct(mm.sum)) + '">' +
      mm.implied.map((p, i) => '<i style="--w:' + (100 * p / Math.max(mm.sum, 1)).toFixed(2) + '%"><span>' + h.esc(labels[i]) + ' ' + pct(p, 1) + '</span></i>').join('') + '</div>' +
      '<p class="rl-mcap"><b>' + pct(mm.sum) + '</b> en total · lo que pasa del 100 % es el margen: <b>' + pct(mm.margin) + '</b></p>';
    const inputs = names.map((n, i) => '<label><span>' + n + '</span><input inputmode="decimal" autocomplete="off" name="o' + i + '" value="' + EX.odds[i] + '" aria-label="Cuota decimal: ' + n + '"' + (i === 2 ? ' data-third' : '') + '></label>').join('');
    const out = '<div class="rl-mout rl-cout" data-rl-mout aria-live="polite"><div><b data-k="margin">' + pct(m.margin) + '</b><span>margen (lo que pasa del 100 %)</span></div><div><b data-k="keep">' + pct(1 - m.payout) + '</b><span>se queda la casa de lo apostado</span></div><div><b data-k="payout">' + pct(m.payout) + '</b><span>devolución teórica</span></div><div><b data-k="sum">' + pct(m.sum) + '</b><span>suma de probabilidades</span></div></div>' +
      '<table class="rl-reg rl-mtbl"><thead><tr><th scope="col">Resultado</th><th scope="col">Cuota</th><th scope="col">Prob. implícita</th><th scope="col">Cuota sin margen</th></tr></thead><tbody data-rl-mrows>' +
      m.odds.map((o, i) => '<tr><th scope="row">' + names[i] + '</th><td>' + dec(o) + '</td><td>' + pct(m.implied[i]) + '</td><td>' + dec(m.fairOdds[i]) + '</td></tr>').join('') + '</tbody></table>';
    const tool = '<form class="rl-calc" data-rl-margin novalidate><fieldset><legend>Mercado</legend><label class="rl-rad"><input type="radio" name="k" value="3" checked> Tres resultados (1X2)</label><label class="rl-rad"><input type="radio" name="k" value="2"> Dos resultados</label></fieldset>' +
      '<div class="rl-oin">' + inputs + '</div><p class="rl-merr" data-rl-merr hidden>Escribí cuotas decimales mayores que 1, por ejemplo 1,85.</p>' + out + '</form>';
    const hero = '<section class="rl-hero rl-hero-calc"><div><p class="rl-kick">Calculadora · sin datos de operadores</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Las cuotas de un mercado esconden una comisión: si sumás la probabilidad que implica cada cuota, el total pasa del 100 %. Esa diferencia es el margen. Escribí las cuotas decimales de un partido y la calculadora hace la cuenta.</p></div></section>';
    const formula = '<div class="rl-box"><h3>La cuenta</h3><p class="rl-form">suma = 1/cuota₁ + 1/cuota₂ + …</p><p class="rl-form">margen = suma − 1</p><p class="rl-form">devolución = 1 / suma · se queda la casa = 1 − devolución</p><p>Cuota sin margen = cuota × suma. Es la cuota que pagaría una casa que no cobra nada.</p></div>';
    const steps = '<details class="rl-box"><summary>Cómo se calcula, paso a paso</summary><ol>' +
      m.odds.map((o, i) => '<li>' + names[i] + ': 1 / ' + dec(o) + ' = ' + dec(m.implied[i], 4) + '</li>').join('') +
      '<li>Suma: ' + m.implied.map(p => dec(p, 4)).join(' + ') + ' = ' + dec(m.sum, 4) + ', o sea ' + pct(m.sum) + '</li>' +
      '<li>Margen: ' + dec(m.sum, 4) + ' − 1 = ' + pct(m.margin) + '</li>' +
      '<li>Devolución: 1 / ' + dec(m.sum, 4) + ' = ' + pct(m.payout) + '; la casa se queda ' + pct(1 - m.payout) + '</li>' +
      '<li>Cuota sin margen del local: ' + dec(m.odds[0]) + ' × ' + dec(m.sum, 4) + ' = ' + dec(m.fairOdds[0]) + '</li></ol></details>';
    const how = '<section class="rl-sec">' + sectionHead(h, 'Calculá el margen', 'acepta coma o punto: 1,85 o 1.85') + '<div class="rl-calcw"><div class="rl-card">' + tool + '</div>' + formula + '</div>' + steps + '</section>';
    const exs = '<section class="rl-sec">' + sectionHead(h, 'Dos ejemplos, calculados', 'cuotas de ejemplo, no de un sitio real') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Un partido de la Liga Profesional, 1X2</h3><p>Cuotas ' + EX.odds.join(' · ') + ' para local, empate y visitante.</p>' + bar(m, names) + '</div>' +
      '<div class="rl-box"><h3>Más o menos de 2,5 goles</h3><p>Cuotas ' + EX.two.join(' · ') + '.</p>' + bar(m2, ['Más', 'Menos']) + '</div></div></section>';
    const read = '<section class="rl-sec">' + sectionHead(h, 'Cómo leer el resultado') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Qué te dice</h3><p>Cuánto se queda la casa, en promedio, de todo lo apostado en ese mercado si el dinero se reparte según sus cuotas. Con el ejemplo 1X2, de cada $ 1.000 apostados vuelven $ ' + fmtInt(Math.round(1000 * m.payout)) + ' y la casa se queda $ ' + fmtInt(1000 - Math.round(1000 * m.payout)) + ' (' + pct(1 - m.payout) + ').</p>' +
        '<p>El margen (' + pct(m.margin) + ') es otra forma de decir lo mismo: se mide sobre la suma de probabilidades y no sobre lo apostado, por eso da un poco más. Los sitios y las notas suelen usar el margen; para comparar dos mercados, usá siempre la misma de las dos cifras.</p></div>' +
      '<div class="rl-box"><h3>Qué no te dice</h3><p>Quién va a ganar el partido ni si una apuesta conviene. Un margen más bajo no cambia que, a la larga, la casa cobra su parte. Si sentís que el juego dejó de ser un juego, la línea de ayuda está abajo.</p></div></div></section>';
    return hero + how + exs + read + otherCalcs(h, '/calculadora/margen') + '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + go(h, [['/guia/apuestas-deportivas', 'Cómo funcionan las apuestas deportivas'], ['/guia/como-verificar', 'Cómo verificar un sitio'], ['/juego-responsable', 'Ayuda en tu provincia']]) + '</section>';
  },
};

const LINES = [-1.5, -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 1];
const SCORES = [[3, 0], [2, 0], [2, 1], [1, 1], [0, 1], [0, 2]];
const WORD = { win: 'gana', 'half-win': 'mitad gana, mitad vuelve', push: 'se devuelve', 'half-lose': 'mitad pierde, mitad vuelve', lose: 'pierde' };
const SHORT = { win: 'G', 'half-win': '½G', push: 'D', 'half-lose': '½P', lose: 'P' };
const lineTxt = l => (l > 0 ? '+' : l < 0 ? '−' : '') + dec(Math.abs(l), Number.isInteger(l * 2) ? 1 : 2).replace(/,0$/, '');

export const handicap = {
  path: '/guia/handicap',
  id: 'guia-handicap',
  kind: 'guide',
  title: 'Hándicap asiático en apuestas: qué es y cómo se resuelve',
  description: 'Qué es el hándicap asiático en apuestas y cómo se resuelve cada línea, entera, media o cuarto, con un clásico de Avellaneda; y qué cambia en el europeo.',
  h1: 'Hándicap asiático en apuestas: qué es y cómo se resuelve cada línea',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/guia/handicap', 'Hándicap']])],
  render(h) {
    const team = 'Racing', rival = 'Independiente';
    const head = '<thead><tr><th scope="col"><abbr title="Línea de ' + team + '">Línea</abbr></th>' + SCORES.map(([a, b]) => '<th scope="col">' + a + '-' + b + '</th>').join('') + '</tr></thead>';
    const body = LINES.map(l => '<tr><th scope="row">' + lineTxt(l) + '</th>' + SCORES.map(([a, b]) => {
      const k = handicapLabel(settleHandicap(l, a - b));
      return '<td class="rl-hc-' + k + '" title="' + h.esc(WORD[k]) + '"><b aria-hidden="true">' + SHORT[k] + '</b><span class="rl-vh">' + h.esc(WORD[k]) + '</span></td>';
    }).join('') + '</tr>').join('');
    const grid = '<div class="rl-card" data-nosnippet><div class="rl-scroll"><table class="rl-hc">' + head + '<tbody>' + body + '</tbody></table></div>' +
      '<ul class="rl-hcleg">' + Object.keys(WORD).map(k => '<li><i class="rl-hc-' + k + '">' + SHORT[k] + '</i>' + h.esc(WORD[k]) + '</li>').join('') + '</ul>' +
      '<p class="rl-cap">Resultado final ' + team + '-' + rival + ' en las columnas; la línea se suma a los goles de ' + team + '. Cada celda la calcula el programa.</p></div>';
    const stake = 1000, odd = 1.9;
    const rows = [-0.75, -0.25].map(l => '<div class="rl-box"><h3>' + team + ' ' + lineTxt(l) + ' a cuota ' + dec(odd) + '</h3><ul class="rl-hcr">' +
      SCORES.slice(1, 5).map(([a, b]) => { const r = handicapReturn(l, a - b, odd, stake); const k = handicapLabel(settleHandicap(l, a - b)); return '<li><span>' + a + '-' + b + '</span><i class="rl-hc-' + k + '">' + SHORT[k] + '</i><b>$ ' + fmtInt(Math.round(r)) + '</b></li>'; }).join('') +
      '</ul><p class="rl-src">Vuelve de $ ' + fmtInt(stake) + ' apostados, con lo apostado incluido</p></div>').join('');
    const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">Guía · ejemplo calculado</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">El hándicap le suma o le resta goles a un equipo antes de mirar el resultado. Así una apuesta entre un favorito y un rival más débil queda más pareja. Lo explicamos con un clásico de Avellaneda imaginario: ' + team + ' contra ' + rival + '.</p></div>' +
      '<div class="rl-box"><h3>' + team + ' −1</h3><p>Si ' + team + ' gana 2-0, con la línea queda 1-0: <b>gana</b>. Si gana 2-1, queda 1-1: <b>se devuelve</b>. Si empata 1-1, queda 0-1: <b>pierde</b>.</p></div></section>';
    const kinds = '<section class="rl-sec">' + sectionHead(h, 'Tres tipos de línea') + '<div class="rl-law">' +
      '<article><h3>Entera: −1, 0, +1</h3><p>Puede haber empate después de sumar la línea. En ese caso te devuelven lo apostado.</p></article>' +
      '<article><h3>Media: −0,5, −1,5</h3><p>Nunca hay empate con la línea: la apuesta se gana o se pierde entera.</p></article>' +
      '<article><h3>Cuarto: −0,25, −0,75</h3><p>Es media apuesta en cada una de las dos líneas vecinas. −0,75 es la mitad en −0,5 y la mitad en −1.</p></article></div></section>';
    const opts = [];
    for (let l = -3; l <= 3.0001; l += 0.25) opts.push(Math.round(l * 100) / 100);
    const ex = { line: -0.75, a: 2, b: 1 };
    const exS = settleHandicap(ex.line, ex.a - ex.b), exK = handicapLabel(exS);
    const calc = '<form class="rl-calc" data-rl-hcp novalidate><div class="rl-oin">' +
      '<label><span>Línea de tu equipo</span><select name="l" aria-label="Línea de hándicap">' + opts.map(l => '<option value="' + l + '"' + (l === ex.line ? ' selected' : '') + '>' + lineTxt(l) + '</option>').join('') + '</select></label>' +
      '<label><span>Goles de tu equipo</span><input name="a" inputmode="numeric" autocomplete="off" value="' + ex.a + '"></label>' +
      '<label><span>Goles del rival</span><input name="b" inputmode="numeric" autocomplete="off" value="' + ex.b + '"></label>' +
      '<label><span>Cuota decimal</span><input name="o" inputmode="decimal" autocomplete="off" value="' + dec(odd) + '"></label>' +
      '<label><span>Monto en $</span><input name="s" inputmode="numeric" autocomplete="off" value="' + stake + '"></label></div>' +
      '<p class="rl-merr" data-rl-herr hidden>Escribí goles enteros (0 a 20), una cuota decimal mayor que 1 y un monto.</p>' +
      '<div class="rl-mout rl-cout" aria-live="polite"><div class="rl-hres"><b data-k="res">' + h.esc(WORD[exK]) + '</b><span>resultado de la apuesta</span></div>' +
      '<div><b data-k="adj">' + dec(ex.a + ex.line, 2).replace(/0+$/, '').replace(/,$/, '') + (h.lang === 'en' ? ' to ' : ' a ') + ex.b + '</b><span>marcador con la línea</span></div>' +
      '<div><b data-k="ret">$ ' + fmtInt(Math.round(handicapReturn(ex.line, ex.a - ex.b, odd, stake))) + '</b><span>vuelve, con lo apostado</span></div>' +
      '<div><b data-k="net">' + (handicapReturn(ex.line, ex.a - ex.b, odd, stake) - stake >= 0 ? '+' : '−') + '$ ' + fmtInt(Math.abs(Math.round(handicapReturn(ex.line, ex.a - ex.b, odd, stake) - stake))) + '</b><span>ganancia o pérdida</span></div></div></form>';
    const euro = '<section class="rl-sec">' + sectionHead(h, 'Hándicap europeo: otra apuesta', 'no confundir con el asiático') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Asiático (esta página)</h3><p>Dos resultados: tu equipo o el rival. Si con la línea queda empate, te devuelven lo apostado. Las líneas pueden ser enteras, medias o cuartos.</p></div>' +
      '<div class="rl-box"><h3>Europeo o de 3 vías</h3><p>Tres resultados, como un 1X2: local, empate con el hándicap y visitante. Con ' + team + ' (−1) y un 2-1, gana la opción «empate (−1)»: no hay devolución. Las líneas son siempre enteras.</p></div></div></section>';
    return hero + '<section class="rl-sec">' + sectionHead(h, 'Cada línea, cada resultado', 'G gana · D se devuelve · P pierde') + grid + '</section>' + kinds +
      '<section class="rl-sec">' + sectionHead(h, 'Calculá tu hándicap', 'cualquier línea de −3 a +3, en cuartos') + '<div class="rl-card">' + calc + '</div></section>' +
      '<section class="rl-sec">' + sectionHead(h, 'Cuánto vuelve en los cuartos', 'cuota de ejemplo, no de un sitio real') + '<div class="rl-two">' + rows + '</div>' +
      '<p class="rl-note">El hándicap cambia cómo se reparte el resultado, no el margen de la casa: las cuotas de cada línea también lo traen.' + (h.built('/calculadora/margen') ? ' Podés medirlo con la <a href="' + h.href('/calculadora/margen') + '">calculadora de margen</a>.' : '') + '</p></section>' + euro + otherCalcs(h, '/guia/handicap');
  },
};
