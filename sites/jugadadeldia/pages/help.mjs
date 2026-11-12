// Help pages of jugadadeldia.com (help: true): no game menu, no links to quiniela, lottery or game pages (gates helpnav and
// helplink). Every line, term and age comes from the help package data/sources/rg/ (quotes checked by tools/verify-rg.mjs,
// a copy older than its limit stops the build: 100 days, 180 for an owner copy, tools/lib/copyage.mjs).
import { crumbs } from './parts.mjs';

const ld = h => [h.webPage(), crumbs(h, h.page.path === '/juego-responsable/' ? [] : [['/juego-responsable/', 'Juego responsable']])];
const hostOf = u => new URL(u).hostname.replace(/^www\./, '');
function quote(h, e) {
  if (!e || !e.quote) return '';
  const d = h.doc('rg:' + e.doc);
  return '<details class="jg-src" data-nosnippet><summary>De dónde sale</summary><blockquote>' + h.esc(e.quote).replace(/@/g, '<span>@</span>') + '</blockquote><cite>' +
    h.esc(e.name || d.jurName) + ' · <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(hostOf(d.url)) + '</a> · revisado el ' + h.fmtDate(d.fetched) + '</cite></details>';
}
const provinces = h => h.rg.pack.provinces.map(p => ({ ...h.rg.prov(p.id), raw: p })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
const hasPage = j => !!(j.line || j.selfExclusion);
const telA = (h, l) => '<a class="jg-b p" href="tel:' + h.esc(l.phoneTel) + '">Llamar al ' + h.esc(l.phone) + '</a>';

function crisisCard(h) {
  const c = h.rg.crisis;
  return '<section class="jg-c jg-cri"><span class="jg-sm">En todo el país</span><h2>' + h.esc(c.name) + '</h2><p class="jg-big"><a href="tel:' + h.esc(c.phoneTel) + '">' + h.esc(c.phone) + '</a></p>' +
    '<p>Gratuita y confidencial, ' + h.esc(c.hours) + '. Para cualquier urgencia de salud mental, no solo por el juego.</p>' + quote(h, { ...c, doc: c.doc }) + '</section>';
}

export const ayuda = {
  path: '/juego-responsable/', kind: 'help', help: true,
  title: 'Juego responsable: ayuda gratuita en tu provincia',
  h1: 'Ayuda cuando el juego deja de ser un juego',
  description: 'Si el juego dejó de ser un juego, acá está la ayuda gratuita de tu provincia: línea de atención, autoexclusión y quién te atiende, más la línea nacional.',
  ld,
  render(h) {
    const list = provinces(h);
    const rows = list.map(j => '<tr><td>' + (hasPage(j) && h.built('/juego-responsable/' + j.id + '/') ? '<a href="' + h.href('/juego-responsable/' + j.id + '/') + '" data-jg-prov="' + j.id + '">' + h.esc(j.name) + '</a>' : h.esc(j.name)) + '</td><td>' +
      (j.line ? '<a href="tel:' + h.esc(j.line.phoneTel) + '">' + h.esc(j.line.phone) + '</a>' + (j.line.free ? ' <span class="jg-mu">gratuita</span>' : '') : '<span class="jg-mu">sin línea propia verificada</span>') + '</td><td>' +
      (j.selfExclusion ? (j.selfExclusion.terms ? h.esc(j.selfExclusion.terms) : 'sí') : '<span class="jg-mu">sin dato</span>') + '</td></tr>').join('');
    const nLines = list.filter(j => j.line).length;
    return '<section class="jg-hero no-g jg-calm"><div><span class="jg-k">Ayuda · 24 jurisdicciones</span><h1>' + h.esc(h.page.h1) + '</h1><p class="jg-lede">Si jugás más de lo que querés, si escondés lo que gastás o si te cuesta parar, no estás solo: hay ayuda gratuita y sin nombre en cada provincia. Buscá la tuya abajo.</p></div></section>' +
      '<div class="jg-mn">' + crisisCard(h) +
      '<section class="jg-c w2"><span class="jg-sm">Señales para frenar</span><h2>¿Es para preocuparse?</h2><ul><li>Jugás para recuperar lo que perdiste.</li><li>Pedís prestado o vendés cosas para seguir jugando.</li><li>Mentís sobre cuánto jugás o cuánto gastás.</li><li>Te pone de mal humor no poder jugar.</li></ul><p>Con una sola que te pase, vale la pena llamar. La llamada no te compromete a nada.</p></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Provincia por provincia</span><h2>Líneas y autoexclusión</h2><p class="jg-mu">' + nLines + ' de ' + list.length + ' jurisdicciones tienen una línea propia que pudimos verificar en una página oficial. Donde no la hay, usá la línea nacional.</p><div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Jurisdicción</th><th>Línea</th><th>Autoexclusión</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (h.built('/juego-responsable/autoexclusion/') ? '<p><a class="jg-b" href="' + h.href('/juego-responsable/autoexclusion/') + '">Cómo pedir la autoexclusión</a></p>' : '') + '</section></div>';
  },
};

export const autoexclusion = {
  path: '/juego-responsable/autoexclusion/', kind: 'help', help: true,
  title: 'Autoexclusión del juego: cómo pedirla en cada provincia',
  h1: 'Autoexclusión, provincia por provincia',
  description: 'Autoexclusión del juego en cada provincia argentina: cuánto dura, dónde se pide y qué dice la página oficial, en una tabla para comparar con la fuente.',
  ld,
  render(h) {
    const list = provinces(h).filter(j => j.selfExclusion);
    const cards = list.map(j => {
      const s = j.selfExclusion;
      return '<article class="jg-c" id="ax-' + j.id + '"><span class="jg-sm">' + h.esc(j.name) + '</span><h3>' + h.esc(s.name) + '</h3>' + (s.terms ? '<p class="jg-ch"><span>Dura: ' + h.esc(s.terms) + '</span></p>' : '') +
        (s.web ? '<p>Dónde: <a href="' + h.esc(s.web) + '" rel="noopener">' + h.esc(hostOf(s.web)) + '</a></p>' : '') + quote(h, s) + '</article>';
    }).join('');
    return '<section class="jg-hero no-g jg-calm"><div><span class="jg-k">Ayuda · autoexclusión</span><h1>' + h.esc(h.page.h1) + '</h1><p class="jg-lede">La autoexclusión es un pedido voluntario: durante un tiempo no te dejan entrar a las salas (y, en algunas provincias, a las plataformas con licencia). Esto es lo que dice cada página oficial.</p></div></section>' +
      '<div class="jg-mn"><nav class="jg-c w3 jg-jump" aria-label="Elegí tu provincia"><span class="jg-sm">Elegí tu provincia</span><div class="jg-sg">' + list.map(j => '<a href="#ax-' + j.id + '">' + h.esc(j.name) + '</a>').join('') + '</div></nav>' + cards + crisisCard(h) + '</div>';
  },
};

const short = n => n.replace('Ciudad Autónoma de Buenos Aires', 'Ciudad de Buenos Aires');
function provDesc(p) {
  const n = short(p.name), l = (p.gambling || [])[0], s = (p.selfExclusion || [])[0];
  let d = 'Ayuda por juego compulsivo en ' + n + ': ' + (l ? 'línea ' + l.phone : 'línea nacional') + (s ? ', autoexclusión' : '') + ' y quién regula, con la fuente oficial de cada dato.';
  if (d.length < 115) d += ' Sin publicidad.';
  return d;
}
export function provincePages(pack) {
// the cards under the two phone lines fill their row: two cards share it as one and two columns, one card takes it all
const fill = cards => { const c = cards.filter(Boolean), w = ['', 'w3', 'w2'][c.length] || ''; if (w) c[c.length - 1] = c[c.length - 1].replace('class="jg-c"', 'class="jg-c ' + w + '"'); return c.join(''); };
  return pack.provinces.filter(p => (p.gambling || []).length || (p.selfExclusion || []).length).map(p => ({
    path: '/juego-responsable/' + p.id + '/', kind: 'help', help: true, jurisdiction: p.id,
    title: 'Ayuda por juego compulsivo en ' + short(p.name),
    h1: 'Ayuda en ' + short(p.name),
    description: provDesc(p),
    ld,
    render(h) {
      const j = h.rg.prov(p.id);
      const l = j.line, s = j.selfExclusion;
      const lineCard = l
        ? '<section class="jg-c w2"><span class="jg-sm">Línea de ' + h.esc(j.name) + '</span><h2>' + h.esc(l.name) + '</h2><p class="jg-big"><a href="tel:' + h.esc(l.phoneTel) + '">' + h.esc(l.phone) + '</a></p>' +
          '<p class="jg-ch">' + (l.free ? '<span>Gratuita</span>' : '') + (l.hours ? '<span>' + h.esc(l.hours) + '</span>' : '') + (l.whatsapp ? '<span>WhatsApp ' + h.esc(l.whatsapp) + '</span>' : '') + '</p>' +
          '<div class="jg-r">' + telA(h, l) + (l.web ? '<a class="jg-b" href="' + h.esc(l.web) + '" rel="noopener">Página oficial</a>' : '') + '</div>' + quote(h, l) + '</section>'
        : '<section class="jg-c w2"><span class="jg-sm">Línea de ' + h.esc(j.name) + '</span><h2>Sin línea propia verificada</h2><p>No encontramos en una página oficial de ' + h.esc(j.name) + ' un teléfono de ayuda por juego que podamos citar. Usá la línea nacional, que atiende en todo el país.</p><p class="jg-r"><a class="jg-b p" href="tel:' + h.esc(h.rg.crisis.phoneTel) + '">Llamar al ' + h.esc(h.rg.crisis.phone) + '</a></p></section>';
      const seCard = s
        ? '<section class="jg-c"><span class="jg-sm">Autoexclusión</span><h2>' + h.esc(s.name) + '</h2>' + (s.terms ? '<p class="jg-ch"><span>Dura: ' + h.esc(s.terms) + '</span></p>' : '') + (s.web ? '<p><a href="' + h.esc(s.web) + '" rel="noopener">Cómo se pide (página oficial)</a></p>' : '') + quote(h, s) + '</section>'
        : '<section class="jg-c"><span class="jg-sm">Autoexclusión</span><h2>Sin dato verificado</h2><p>No encontramos un programa de autoexclusión de ' + h.esc(j.name) + ' en una página oficial que podamos citar.</p></section>';
      const age = j.age ? '<section class="jg-c"><span class="jg-sm">Edad</span><h2>Solo mayores de ' + j.age.value + '</h2><p>' + h.esc(j.age.scope) + '.</p>' + quote(h, j.age) + '</section>' : '';
      const reg = j.regulator ? '<section class="jg-c"><span class="jg-sm">Quién regula</span><h2>' + h.esc(j.regulator.name) + '</h2>' + quote(h, j.regulator) + '</section>' : '';
      return '<section class="jg-hero no-g jg-calm"><div><span class="jg-k">Ayuda · ' + h.esc(j.name) + '</span><h1>' + h.esc(h.page.h1) + '</h1><p class="jg-lede">Los datos oficiales de ' + h.esc(j.name) + ' para pedir ayuda por el juego, con la fuente de cada uno. Si no es urgente, también podés escribir o pasar por la página oficial.</p></div></section>' +
        '<div class="jg-mn">' + lineCard + crisisCard(h) + fill([seCard, age, reg]) + '</div>';
    },
  }));
}
