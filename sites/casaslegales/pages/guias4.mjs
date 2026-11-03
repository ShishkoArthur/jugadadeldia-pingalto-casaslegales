// Wave 4 tools and guides: /calculadora/cuotas (odds formats, implied probability and margin removal, engine/odds.mjs also in
// the browser), /calculadora/combinada (parlay: paid odd, chance of hitting every pick, expected return; every number by
// engine/odds.mjs) and /guia/ley-federal (status of the federal bill and what it says about advertising, from the saved
// official pages of Diputados, Senado and the national Government in the help package).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { convertOdd, margin, parlay, toFractional, toAmerican } from '../../../engine/odds.mjs';
import { visibleText } from '../../../engine/text.mjs';
import { fmtInt, daysBetween } from '../../../engine/format.mjs';
import { provData } from '../content/provdata.mjs';
import { rgQuote, sectionHead } from './parts.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const go = (h, list) => '<div class="rl-gd">' + list.filter(([u]) => h.built(u)).map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div>';
const dec = (x, d = 2) => x.toFixed(d).replace('.', ',');
const pct = (x, d = 1) => dec(x * 100, d) + ' %';
const am = v => (v > 0 ? '+' : String.fromCharCode(0x2212)) + dec(Math.abs(v), Number.isInteger(Math.round(Math.abs(v) * 100) / 100) ? 0 : 2);
const frac = f => (f.exact ? '' : '≈ ') + f.text;

const LADDER = [1.2, 1.5, 1.8, 2, 2.5, 3, 4, 5, 10];
const TWO = ['1,85', '1,95'];

export const calcCuotas = {
  path: '/calculadora/cuotas',
  id: 'calculadora-cuotas',
  kind: 'tool',
  title: 'Conversor de cuotas: decimal, fraccional y americana',
  description: 'Pasá una cuota de decimal a fraccional o americana, mirá su probabilidad implícita y sacale el margen de la casa a un mercado de dos o tres resultados.',
  h1: 'Conversor de cuotas: decimal, fraccional, americana y probabilidad',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/calculadora/cuotas', 'Conversor de cuotas']])],
  render(h) {
    const c0 = convertOdd('2,50');
    const tiles = '<div class="rl-mout rl-cout" data-rl-cout aria-live="polite"><div><b data-k="dec">' + dec(c0.decimal) + '</b><span>decimal</span></div><div><b data-k="frac">' + frac(c0.fractional) + '</b><span>fraccional</span></div><div><b data-k="am">' + am(c0.american) + '</b><span>americana</span></div><div><b data-k="imp">' + pct(c0.implied) + '</b><span>probabilidad implícita</span></div></div>' +
      '<div class="rl-pbar" aria-hidden="true"><i data-k="bar" style="--w:' + (100 * c0.implied).toFixed(2) + '%"></i></div>';
    const fmt = '<fieldset><legend>La cuota que tenés está en formato</legend><label class="rl-rad"><input type="radio" name="f" value="decimal" checked> Decimal (2,50)</label><label class="rl-rad"><input type="radio" name="f" value="fractional"> Fraccional (3/2)</label><label class="rl-rad"><input type="radio" name="f" value="american"> Americana (+150)</label></fieldset>';
    const conv = '<form class="rl-calc" data-rl-conv novalidate>' + fmt + '<div class="rl-oin rl-oin-1"><label><span>Cuota</span><input name="q" inputmode="text" autocomplete="off" value="2,50" aria-label="Cuota"></label></div>' +
      '<p class="rl-merr" data-rl-cerr hidden>No reconocemos esa cuota en el formato elegido. Ejemplos: 2,50 · 3/2 · +150 · −200.</p>' + tiles + '</form>';
    const m = margin(TWO);
    const rowsNv = m.odds.map((o, i) => '<tr><th scope="row">' + ['Más de 2,5', 'Menos de 2,5'][i] + '</th><td>' + dec(o) + '</td><td>' + pct(m.implied[i]) + '</td><td>' + pct(m.fairProb[i]) + '</td><td>' + dec(m.fairOdds[i]) + ' · ' + frac(toFractional(m.fairOdds[i])) + ' · ' + am(toAmerican(m.fairOdds[i])) + '</td></tr>').join('');
    const nv = '<form class="rl-calc" data-rl-novig novalidate><fieldset><legend>Formato de las cuotas</legend><label class="rl-rad"><input type="radio" name="f" value="decimal" checked> Decimal</label><label class="rl-rad"><input type="radio" name="f" value="fractional"> Fraccional</label><label class="rl-rad"><input type="radio" name="f" value="american"> Americana</label></fieldset>' +
      '<div class="rl-oin">' + [0, 1, 2].map(i => '<label' + (i === 2 ? ' data-opt' : '') + '><span>Resultado ' + (i + 1) + (i === 2 ? ' (opcional)' : '') + '</span><input name="o' + i + '" autocomplete="off" value="' + (TWO[i] || '') + '" aria-label="Cuota del resultado ' + (i + 1) + '"></label>').join('') + '</div>' +
      '<p class="rl-merr" data-rl-nerr hidden>Escribí al menos dos cuotas válidas en el formato elegido.</p>' +
      '<p class="rl-mcap" data-rl-nsum aria-live="polite">Suma de probabilidades <b>' + pct(m.sum, 2) + '</b> · margen <b>' + pct(m.margin, 2) + '</b></p>' +
      '<div class="rl-scroll"><table class="rl-reg rl-mtbl"><thead><tr><th scope="col">Resultado</th><th scope="col">Cuota</th><th scope="col">Prob. implícita</th><th scope="col">Prob. sin margen</th><th scope="col">Cuota justa (dec · frac · amer)</th></tr></thead><tbody data-rl-nrows>' + rowsNv + '</tbody></table></div></form>';
    const ladder = '<div class="rl-card rl-osc" data-nosnippet><ul>' + LADDER.map(d => { const c = convertOdd(d); return '<li style="--w:' + (100 * c.implied).toFixed(2) + '%"><b>' + dec(d) + '</b><span>' + frac(c.fractional) + '</span><span>' + am(c.american) + '</span><i aria-hidden="true"></i><em>' + pct(c.implied) + '</em></li>'; }).join('') + '</ul>' +
      '<p class="rl-cap">Cada fila es la misma cuota en los tres formatos; la barra es su probabilidad implícita (1 / cuota decimal). Calculado por el programa.</p></div>';
    const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">Calculadora · sin datos de operadores</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Los sitios argentinos muestran cuotas decimales, pero en notas y en sitios de otros países aparecen la fraccional (3/2) y la americana (+150). Son la misma cuota escrita de otra forma. El conversor las pasa de una a otra y muestra qué probabilidad implica cada una.</p></div>' +
      '<div class="rl-box"><h3>Las cuentas</h3><p class="rl-form">decimal = 1 + a/b</p><p class="rl-form">+x → 1 + x/100 · −x → 1 + 100/x</p><p class="rl-form">prob. implícita = 1 / decimal</p></div></section>';
    const read = '<section class="rl-sec">' + sectionHead(h, 'Qué es la probabilidad implícita') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Lo que dice</h3><p>Una cuota de ' + dec(c0.decimal) + ' paga $ ' + fmtInt(Math.round(1000 * c0.decimal)) + ' por $ 1.000 apostados, lo apostado incluido. Para que esa apuesta fuera pareja, el resultado tendría que darse ' + pct(c0.implied) + ' de las veces.</p></div>' +
      '<div class="rl-box"><h3>Lo que no dice</h3><p>No es la probabilidad real: trae el margen de la casa adentro, por eso las probabilidades de un mismo mercado suman más del 100 %. Y ninguna cuota dice quién va a ganar.</p></div></div></section>';
    return hero + '<section class="rl-sec">' + sectionHead(h, 'Convertí una cuota', 'acepta 2,50 o 2.50 · 3/2 · +150 o −200') + '<div class="rl-card">' + conv + '</div></section>' +
      '<section class="rl-sec">' + sectionHead(h, 'Las cuotas más comunes, en los tres formatos') + ladder + '</section>' + read +
      '<section class="rl-sec">' + sectionHead(h, 'Sacale el margen a un mercado', 'cuotas de ejemplo: más o menos de 2,5 goles') + '<div class="rl-card">' + nv + '</div>' +
      '<p class="rl-note">La cuota justa reparte el margen en proporción a cada probabilidad (el método más simple; hay otros). Es la cuota que pagaría una casa que no cobra nada, no una predicción.</p></section>' +
      '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + go(h, [['/calculadora/margen', 'Calculadora de margen de un mercado'], ['/calculadora/combinada', 'Qué pasa con el margen en una combinada'], ['/guia/handicap', 'Qué es el hándicap'], ['/juego-responsable', 'Ayuda en tu provincia']]) + '</section>';
  },
};

const LEGS = [
  ['River', 'Talleres', ['1,72', '3,60', '5,00'], 0],
  ['Boca', 'Lanús', ['1,95', '3,25', '4,10'], 0],
  ['Estudiantes', 'Vélez', ['2,30', '3,10', '3,20'], 0],
  ['Rosario Central', 'Newell\'s', ['2,40', '3,00', '3,10'], 1],
  ['San Lorenzo', 'Huracán', ['2,60', '2,90', '2,95'], 2],
  ['Belgrano', 'Instituto', ['2,05', '3,10', '3,90'], 0],
];
const PICK = ['Local', 'Empate', 'Visitante'];

export const calcCombinada = {
  path: '/calculadora/combinada',
  id: 'calculadora-combinada',
  kind: 'tool',
  title: 'Apuestas combinadas: cómo se multiplica el margen',
  description: 'Por qué el margen crece con cada selección de una combinada: la cuota total, la probabilidad de acertar todas y cuánto vuelve en promedio, calculados.',
  h1: 'Combinadas: por qué el margen crece con cada selección',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/calculadora/combinada', 'Combinadas']])],
  render(h) {
    const legs = LEGS.map(([a, b, odds, pick]) => ({ odds, pick }));
    const P = parlay(legs);
    const stake = 1000;
    const maxEdge = P.steps[P.steps.length - 1].edge;
    const lad = '<div class="rl-card rl-lad" data-nosnippet><ol>' + P.steps.map((s, i) => '<li style="--e:' + (100 * s.edge / maxEdge).toFixed(2) + '%"><span class="rl-lad-n">' + s.legs + '</span>' +
      '<div><p><b>' + h.esc(LEGS[i][0] + ' - ' + LEGS[i][1]) + '</b> · ' + PICK[LEGS[i][3]].toLowerCase() + ' a ' + h.esc(LEGS[i][2][LEGS[i][3]]) + '</p><i aria-hidden="true"></i></div>' +
      '<dl><div><dt>Cuota total</dt><dd>' + dec(s.odd) + '</dd></div><div><dt>Acertar todas</dt><dd>1 en ' + dec(s.oneIn, 1) + '</dd></div><div><dt>Margen</dt><dd>' + pct(s.edge) + '</dd></div><div><dt>Vuelven de $ ' + fmtInt(stake) + '</dt><dd>$ ' + fmtInt(Math.round(stake * s.payout)) + '</dd></div></dl></li>').join('') + '</ol>' +
      '<p class="rl-cap">Seis partidos de ejemplo de la Liga Profesional con cuotas inventadas, no de un sitio real. La barra es el margen acumulado; «vuelven» es el promedio a la larga si las cuotas sin margen fueran las probabilidades reales.</p></div>';
    const legRow = (l, i) => '<fieldset class="rl-leg" data-leg><legend>Selección ' + (i + 1) + '</legend><div class="rl-oin rl-oin-3">' + PICK.map((p, k) => '<label><span>' + p + '</span><input name="l' + i + 'o' + k + '" inputmode="decimal" autocomplete="off" value="' + h.esc(l ? l[2][k] : '') + '" aria-label="Selección ' + (i + 1) + ': cuota ' + p + '"></label>').join('') + '</div>' +
      '<div class="rl-pick">' + PICK.map((p, k) => '<label class="rl-rad"><input type="radio" name="l' + i + 'p" value="' + k + '"' + ((l ? l[3] : 0) === k ? ' checked' : '') + '> ' + p + '</label>').join('') + '</div></fieldset>';
    const P3 = parlay(legs.slice(0, 3));
    const tool = '<form class="rl-calc" data-rl-parlay novalidate><div data-rl-legs>' + LEGS.slice(0, 3).map(legRow).join('') + '</div>' +
      '<template data-rl-legt>' + legRow(null, 99) + '</template>' +
      '<div class="rl-acts"><button type="button" class="rl-b2" data-rl-add>Agregar selección</button><button type="button" class="rl-b2" data-rl-del>Quitar la última</button></div>' +
      '<p class="rl-merr" data-rl-perr hidden>Cada selección necesita tres cuotas decimales mayores que 1.</p>' +
      '<div class="rl-mout rl-cout" data-rl-pout aria-live="polite"><div><b data-k="odd">' + dec(P3.odd) + '</b><span>cuota total</span></div><div><b data-k="one">1 en ' + dec(P3.oneIn, 1) + '</b><span>acertar todas, sin margen</span></div><div><b data-k="edge">' + pct(P3.edge) + '</b><span>margen de la combinada</span></div><div><b data-k="ret">$ ' + fmtInt(Math.round(stake * P3.payout)) + '</b><span>vuelven de $ ' + fmtInt(stake) + ', en promedio</span></div></div></form>';
    const one = parlay(legs.slice(0, 1));
    const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">Calculadora · sin datos de operadores</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">En una combinada las cuotas se multiplican, y con ellas se multiplica lo que se queda la casa. Con una selección el margen del ejemplo es ' + pct(one.edge) + '; con ' + P.legs + ' selecciones llega a ' + pct(P.edge) + '. La cuota total crece mucho más rápido que lo que vuelve en promedio.</p></div>' +
      '<div class="rl-box"><h3>La cuenta</h3><p class="rl-form">cuota total = c₁ × c₂ × … × cₙ</p><p class="rl-form">vuelve = d₁ × d₂ × … × dₙ</p><p>dᵢ es la devolución teórica de cada partido (1 / suma de sus probabilidades implícitas). Margen de la combinada = 1 − vuelve.</p></div></section>';
    const honest = '<section class="rl-sec">' + sectionHead(h, 'Lo que conviene saber') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Una cuota alta no es una oportunidad</h3><p>Con las ' + P.legs + ' selecciones del ejemplo la cuota total es ' + dec(P.odd) + ': $ ' + fmtInt(stake) + ' pagarían $ ' + fmtInt(Math.round(stake * P.odd)) + '. Pero acertar todas pasa 1 vez cada ' + dec(P.oneIn, 0) + ', y a la larga vuelven $ ' + fmtInt(Math.round(stake * P.payout)) + ' de cada $ ' + fmtInt(stake) + '.</p></div>' +
      '<div class="rl-box"><h3>Qué supone la cuenta</h3><p>Que los partidos son independientes y que las cuotas sin margen son las probabilidades reales. Ninguna de las dos se cumple siempre; por eso el resultado es un promedio de largo plazo, no una predicción. Si el juego dejó de ser un juego, la línea de ayuda está abajo.</p></div></div></section>';
    return hero + '<section class="rl-sec">' + sectionHead(h, 'La escalera del margen', 'cada fila suma una selección') + lad + '</section>' +
      '<section class="rl-sec">' + sectionHead(h, 'Calculá tu combinada', 'cuotas decimales, de 1 a 8 selecciones') + '<div class="rl-card">' + tool + '</div></section>' + honest +
      '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + go(h, [['/calculadora/margen', 'Margen de un solo mercado'], ['/calculadora/cuotas', 'Conversor de cuotas'], ['/juego-responsable', 'Ayuda en tu provincia']]) + '</section>';
  },
};

function senateBills(h) {
  const d = h.doc('rg:ar-senado-plenario-2025-10-15');
  const t = visibleText(fs.readFileSync(ROOT + d.file, 'utf8'));
  const all = [...t.matchAll(/el proyecto(?: de ley)?([^;]*?)registrado bajo el expediente ([A-Z]{1,2}-\d+\/\d+)/g)].map(m => ({ about: m[1], exp: m[2] }));
  if (all.length < 10) throw new Error('/guia/ley-federal: the Senate note lists only ' + all.length + ' bills; read the saved copy again');
  const ads = all.filter(b => /publicidad/i.test(b.about) && !/fe de erratas/i.test(b.about));
  return { all, ads, d };
}

export const leyFederal = {
  path: '/guia/ley-federal',
  id: 'guia-ley-federal',
  kind: 'guide',
  title: 'Ley federal de juego online: en qué estado está',
  description: 'En qué estado está la ley federal de juego online y publicidad de apuestas en Argentina: Diputados, Senado y el proyecto del Ejecutivo, con cada fecha.',
  h1: 'Ley federal de apuestas online y publicidad: estado del proyecto',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/guia/ley-federal', 'Ley federal']])],
  render(h) {
    const law = Object.fromEntries((h.rg.pack.law || []).map(l => [l.id, l]));
    const need = ['diputados-media-sancion', 'senado-cd-26-24', 'senado-plenario-2025-10-15', 'proyecto-ejecutivo-2026'];
    for (const id of need) if (!law[id]) throw new Error('/guia/ley-federal: no law entry ' + id + ' in the help package');
    const also = (id, re) => { const a = (law[id].also || []).find(x => re.test(x.quote)); if (!a) throw new Error('/guia/ley-federal: no quote ' + re + ' in ' + id); return a; };
    const q = (a, label) => rgQuote(h, { doc: a.doc, quote: a.quote }, label);
    const moc = also('senado-cd-26-24', /MOCION DE PREFERENCIA/);
    const mm = /(\d{2})-(\d{2})-(\d{4})/.exec(moc.quote);
    const mocDate = mm[3] + '-' + mm[2] + '-' + mm[1];
    const giro = also('senado-cd-26-24', /ORDEN DE GIRO/);
    const gm = /(\d{2})-(\d{2})-(\d{4})/.exec(giro.quote);
    const senDoc = h.doc('rg:' + law['senado-cd-26-24'].doc);
    const S = senateBills(h);
    const days = daysBetween(law['diputados-media-sancion'].date, senDoc.fetched);
    const ev = [
      { date: law['diputados-media-sancion'].date, who: 'Cámara de Diputados', what: 'Media sanción del proyecto de prevención de la ludopatía y regulación de las apuestas en línea.', q: q(law['diputados-media-sancion'], 'Cámara de Diputados') },
      { date: gm[3] + '-' + gm[2] + '-' + gm[1], who: 'Senado', what: 'El expediente CD-26/24 pasa a las comisiones de Salud, Legislación General y Justicia y Asuntos Penales.', q: q(giro, 'Senado, expediente CD-26/24') },
      { date: law['senado-plenario-2025-10-15'].date, who: 'Senado, plenario de comisiones', what: 'Siguen las exposiciones sobre ' + S.all.length + ' proyectos, entre ellos el que vino de Diputados.', q: q(law['senado-plenario-2025-10-15'], 'Senado') },
      { date: law['proyecto-ejecutivo-2026'].date, who: 'Poder Ejecutivo', what: 'El Gobierno nacional envía su propio proyecto al Congreso.', q: q(law['proyecto-ejecutivo-2026'], 'Gobierno nacional') },
      { date: mocDate, who: 'Senado', what: 'Moción de preferencia para tratar el expediente con dictamen de comisión.', q: q(moc, 'Senado, expediente CD-26/24') },
    ].sort((a, b) => a.date.localeCompare(b.date));
    if (ev.some((e, i) => i && e.date < ev[i - 1].date)) throw new Error('timeline order');
    const tl = '<ol class="rl-tl">' + ev.map(e => '<li><time datetime="' + e.date + '">' + h.fmtDate(e.date) + '</time><div><h3>' + h.esc(e.who) + '</h3><p>' + h.esc(e.what) + '</p>' + e.q + '</div></li>').join('') +
      '<li class="rl-tl-open"><time datetime="' + senDoc.fetched + '">' + h.fmtDate(senDoc.fetched) + '</time><div><h3>Sin ley federal</h3><p>En nuestra copia de la página del expediente, el ingreso del dictamen de comisión figura «SIN FECHA»: el Senado todavía no lo votó. Pasaron ' + fmtInt(days) + ' días desde la media sanción.</p></div></li></ol>';
    const P = provData(h);
    const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">Guía · páginas oficiales copiadas con fecha</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Argentina no tiene una ley nacional de apuestas online: cada provincia regula su juego. Desde 2024 hay un proyecto con media sanción de Diputados esperando en el Senado, y en 2026 el Gobierno mandó otro. Los dos cambian las reglas de la publicidad.</p></div>' +
      '<div class="rl-big"><b>' + fmtInt(days) + '</b><span>días entre la media sanción y nuestra última copia del expediente, sin votación en el Senado</span><small>copia del ' + h.fmtDate(senDoc.fetched) + '</small></div></section>';
    const ads = '<section class="rl-sec">' + sectionHead(h, 'Qué proponen sobre publicidad', 'citas textuales; ninguno es ley todavía') + '<div class="rl-two rl-vs">' +
      '<div class="rl-box"><h3>Proyecto de Diputados (2024)</h3>' + q(also('diputados-media-sancion', /bonos de bienvenida/), 'Cámara de Diputados, sobre el artículo 8') + q(also('diputados-media-sancion', /futbol profesional/), 'Cámara de Diputados') + '</div>' +
      '<div class="rl-box"><h3>Proyecto del Ejecutivo (2026)</h3>' + q(also('proyecto-ejecutivo-2026', /^En materia de publicidad/), 'Gobierno nacional') + q(also('proyecto-ejecutivo-2026', /creador de contenido/), 'Gobierno nacional') + q(also('proyecto-ejecutivo-2026', /operadores autorizados no podrá/), 'Gobierno nacional') + '</div></div>' +
      '<p class="rl-note">La diferencia de fondo: el texto de Diputados prohíbe la promoción y el patrocinio de las apuestas en línea; el del Ejecutivo prohíbe la de las plataformas ilegales y pone condiciones a la de los operadores autorizados.</p></section>';
    const bills = '<section class="rl-sec">' + sectionHead(h, 'Los proyectos sobre publicidad en el Senado', S.ads.length + ' de ' + S.all.length + ' en el temario del ' + h.fmtDate(law['senado-plenario-2025-10-15'].date)) +
      '<p class="rl-note">En el plenario de comisiones se trataron ' + S.all.length + ' proyectos juntos. Estos ' + S.ads.length + ' nombran la publicidad en su título (contados por el programa en la página del Senado):</p>' +
      '<ul class="rl-chips rl-exp">' + S.ads.map(b => '<li class="rl-host">' + h.esc(b.exp) + '</li>').join('') + '</ul>' +
      '<p class="rl-src">Fuente: <a href="' + h.esc(S.d.url) + '" rel="noopener">' + h.esc(S.d.host) + '</a> · copia del ' + h.fmtDate(S.d.fetched) + '</p></section>';
    const pay = also('proyecto-ejecutivo-2026', /entidades financieras/);
    const now = '<section class="rl-sec">' + sectionHead(h, 'Mientras tanto, qué rige') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Las leyes de cada provincia</h3><p>Cada jurisdicción decide qué sitios autoriza. De ' + P.all.length + ' jurisdicciones, ' + P.count.list + ' publican una lista oficial que verificamos y ' + P.count.platform + ' enlazan una plataforma provincial.</p>' + (h.built('/provincias') ? '<p><a href="' + h.href('/provincias') + '">Estado de cada provincia</a></p>' : '') + '</div>' +
      '<div class="rl-box"><h3>Pagos a sitios sin licencia</h3>' + q(pay, 'Gobierno nacional, proyecto 2026') + '<p>Es una propuesta, no una regla vigente.</p></div></div></section>';
    return hero + '<section class="rl-sec">' + sectionHead(h, 'Cómo va el proyecto', 'cada paso con su fuente') + tl + '</section>' + ads + bills + now +
      '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + go(h, [['/guia/menores', 'Menores y apuestas: la regla de los 18'], ['/guia/sitios-ilegales', 'Sitios sin licencia y dónde denunciar'], ['/provincias', 'Qué publica cada provincia']]) + '</section>';
  },
};
