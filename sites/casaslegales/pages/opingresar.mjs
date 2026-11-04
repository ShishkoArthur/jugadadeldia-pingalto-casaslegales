// /operador/<slug>/ingresar (owner 2026-11-04, keyword audit: «betsson iniciar sesión», «bet365 login», «betano casino iniciar sesión»):
// the honest answer to «how do I log in to X?». The address that the verified list of your province names (a button per list, nofollow),
// why each province has its own site (the operator's own geography clause, quoted from the review copies, and the regulator's words),
// how to tell the official site from a copy, the official app (store link only when the operator's own page links it), and what to do
// with a forgotten password (the official site's own recovery). No login page is linked, no form, nothing is asked of the visitor.
import { normalize } from '../../../engine/text.mjs';
import { anatomy } from '../../../engine/hostcheck.mjs';
import { docText } from '../../../tools/lib/revsources.mjs';
import { ROOT } from '../../../tools/env.mjs';
import { brandNames, loadRegistries, loadRg } from '../../../tools/lib/sources.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPS } from '../content/operators.mjs';
import { review } from '../content/reviews.mjs';
import { rowOf } from './operador.mjs';
import { quote, sectionHead, officialLink, brandLink } from './parts.mjs';
import { cite, storeLinks } from './review.mjs';
import { codeOf } from './opparts.mjs';
import { SITE } from '../config.mjs';

// per brand: the search phrase the title answers, and notes on the copies that the page relies on (each text is checked in its copy)
const ING = {
  betsson: {
    title: 'Betsson iniciar sesión: el sitio oficial de tu provincia',
    h1: 'Cómo ingresar a Betsson: el sitio oficial de tu provincia',
    chooser: { doc: 'entrada-www', text: 'Elegí desde dónde querés jugar:', must: ['Reached from https://www.betsson.com.ar/', 'https://caba.betsson.bet.ar/'] },
    caba: { doc: 'caba-home', host: 'caba.betsson.bet.ar', act: '1166' },
    password: { doc: 'pba-help-pagos', text: 'Olvidé mi contraseña' },
  },
  bet365: {
    title: 'bet365 login: cómo ingresar al sitio oficial en Argentina',
    h1: 'bet365 login: cómo ingresar al sitio oficial en Argentina',
    footer: { doc: 'home', texts: ['tiene licencia del Instituto Provincial de Lotería y Casinos de la Provincia de Buenos Aires.', 'tiene licencia de la Lotería de la Ciudad de Buenos Aires y permiso de operaciones DI-2022-103-GCABA-LOTBA.'] },
  },
  betano: {
    title: 'Betano iniciar sesión: el sitio oficial de tu provincia',
    h1: 'Cómo ingresar a Betano y Betano Casino: el sitio de tu provincia',
    chooser: { doc: 'pba-home-footer', text: 'Seleccioná la provincia que figura en tu DNI', must: ['Provincia de Mendoza'] },
  },
};
export const ING_BRANDS = Object.keys(ING);
const joinY = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a.at(-1);
const joinO = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' o ' + a.at(-1);
const SHORT = { 'buenos-aires': 'PBA', caba: 'CABA' };

// a sentence of a saved review copy, shown verbatim: the build stops when it is not in the copy
function copyText(R, slug, text) {
  const d = R.doc(slug);
  if (!d) throw new Error('ingresar ' + R.brand + ': no copy ' + slug);
  const t = normalize(docText(readFileSync(join(ROOT, d.file))).parts.join(' '));
  if (!t.includes(normalize(text))) throw new Error('ingresar ' + R.brand + ': "' + text + '" is not in the copy ' + slug);
  return d;
}
function copyQuote(h, R, slug, text) {
  const d = copyText(R, slug, text), u = new URL(d.url);
  return '<blockquote class="rl-q">«' + h.esc(text) + '»<cite><span class="rl-host">' + h.esc(u.hostname.replace(/^www\./, '') + (u.pathname === '/' ? '' : u.pathname.replace(/\/$/, ''))) + '</span> · copia del ' + h.fmtDate(d.date) + '</cite></blockquote>';
}

// the addresses of the lists, one browser bar each, read part by part (the visual of the page: its rows come from the registries)
const CW = 11, FS = 18;
function addrSvg(h, groups) {
  const maxC = Math.max(...groups.map(g => g.host.length));
  const W = Math.max(340, 52 + maxC * CW + 20), RH = 112;
  const rows = groups.map((g, i) => {
    const a = anatomy(g.host), y = i * RH;
    const segs = [[a.sub ? a.sub + '.' : '', 'ia-sub', /^(pba|caba|cba|mza|mdz|cordoba|mendoza)$/.test(a.sub) ? 'provincia' : 'subdominio'], [a.name, 'ia-name', 'marca'], ['.' + a.ending, a.betAr ? 'ia-bet' : 'ia-end', a.betAr ? '.bet.ar' : 'otra terminación']].filter(s => s[0]);
    let x = 52;
    const lines = [0, 0];
    const parts = segs.map(([txt, cls, lab]) => {
      const w = txt.length * CW, x0 = x;
      x += w;
      const lw = lab.length * 6.4, cx = x0 + w / 2;
      let lx = Math.max(4, Math.min(W - lw - 4, cx - lw / 2)), line = lx < lines[0] + 6 ? 1 : 0;
      if (line === 1 && lx < lines[1] + 6) lx = lines[1] + 6;
      lines[line] = lx + lw;
      return '<text class="' + cls + '" x="' + x0 + '" y="' + (y + 52) + '" textLength="' + w + '" lengthAdjust="spacingAndGlyphs">' + h.esc(txt) + '</text>' +
        '<path class="ia-br" d="M' + (x0 + 2) + ' ' + (y + 66) + 'v5h' + (w - 4) + 'v-5M' + cx + ' ' + (y + 71) + 'v' + (line ? 19 : 5) + '"/>' +
        '<text class="ia-lab" x="' + lx + '" y="' + (y + (line ? 101 : 87)) + '">' + h.esc(lab) + '</text>';
    }).join('');
    return '<text class="ia-tag" x="0" y="' + (y + 13) + '">' + h.esc(g.jurs.map(r => codeOf(r.id)).join(' · ') + ' — ' + joinY(g.jurs.map(r => r.regulator.short))) + '</text>' +
      '<rect class="ia-bar" x="0" y="' + (y + 24) + '" width="' + W + '" height="40" rx="12"/>' +
      '<path class="ia-lock" d="M18 ' + (y + 42) + 'v-4a6 6 0 0 1 12 0v4M15 ' + (y + 42) + 'h18v12h-18z"/>' + parts;
  }).join('');
  const H = groups.length * RH;
  return '<svg class="rl-ia" viewBox="-2 0 ' + (W + 4) + ' ' + H + '" role="img" aria-label="' + h.esc('Las direcciones oficiales, parte por parte: ' + groups.map(g => g.host + ' (' + g.jurs.map(r => codeOf(r.id)).join(', ') + ')').join('; ')) + '" style="max-width:' + Math.round((W + 4) * 1.3) + 'px">' + rows + '</svg>';
}

function copyOf(brand) {
  const name = brandNames()[brand];
  const regs = loadRegistries().filter(r => SITE.registries.includes(r.id)).filter(r => r.licensees.some(l => l.brand === brand));
  const provName = Object.fromEntries(loadRg().provinces.map(p => [p.id, p.name]));
  const where = joinO(regs.map(r => SHORT[r.id] || provName[r.id]));
  const hosts = new Set(regs.map(r => r.licensees.find(l => l.brand === brand).host));
  const fit = (...xs) => xs.find(x => x.length >= 115 && x.length <= 155) || xs.at(-1);
  const description = fit(
    'Para iniciar sesión en ' + name + ' entrá al sitio oficial de tu provincia (' + where + '): ' + (hosts.size > 1 ? 'cada lista nombra su dirección' : 'la dirección es una sola') + '. Cómo reconocerlo, la app y la contraseña.',
    'Cómo iniciar sesión en ' + name + ': el sitio oficial que nombra la lista de tu provincia (' + where + '), cómo no caer en copias, la app y la contraseña.',
    'Cómo iniciar sesión en ' + name + ' en Argentina: la dirección oficial de tu provincia, cómo evitar copias, la app oficial y qué hacer si olvidaste la contraseña.');
  return { name, description, where, hosts };
}

function faq(h, brand, name, groups) {
  const one = groups.length === 1;
  const addr = groups.map(g => g.host + ' (' + joinY(g.jurs.map(r => SHORT[r.id] || h.rg.prov(r.id).name)) + ')').join(', ');
  return [
    ['¿Cómo ingreso a ' + name + '?', 'Entrá a la dirección que nombra la lista oficial de la provincia donde estás: ' + addr + '. El botón para iniciar sesión está en ese sitio. Escribí la dirección o usá un enlace oficial; no entres desde anuncios ni mensajes.'],
    ['¿Por qué ' + name + ' tiene ' + (one ? 'una dirección para varias provincias' : 'un sitio por provincia') + '?', 'En Argentina cada provincia autoriza el juego online por su cuenta: la licencia de una no vale en otra. ' + (one ? 'La dirección es la misma, pero cada lista lo autoriza aparte.' : 'Por eso cada lista nombra su propia dirección.')],
    ['Olvidé mi contraseña de ' + name + ', ¿qué hago?', 'Usá la opción para recuperar la contraseña del sitio oficial de tu provincia, en la pantalla de ingreso. No le pases tu contraseña a nadie por chat, WhatsApp o redes sociales.'],
  ];
}

export function ingresarPage(o) {
  const C = copyOf(o.brand), X = ING[o.brand];
  const path = '/operador/' + o.slug + '/ingresar';
  return {
    path, id: 'operador-' + o.slug + '-ingresar', kind: 'operator', brand: o.brand,
    title: X.title, h1: X.h1, description: C.description,
    ld: h => {
      const row = rowOf(h, o.brand), groups = groupsOf(h, row);
      return [h.webPage(), h.crumbs([['/', 'Inicio'], ...(h.built('/operadores') ? [['/operadores', 'Operadores']] : []), ['/operador/' + o.slug, C.name], [path, 'Cómo ingresar']]),
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq(h, o.brand, C.name, groups).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
    },
    render(h) {
      const R = review(h.today, o.brand), row = rowOf(h, o.brand), name = C.name;
      if (!R || !R.r.facts.length) throw new Error(path + ': no review data for ' + o.brand);
      const jurs = h.regs.filter(r => row.cells[r.id]), groups = groupsOf(h, row);
      const pn = r => SHORT[r.id] || h.rg.prov(r.id).name;
      const one = groups.length === 1;
      const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">' + brandLink(h, o.brand, name) + h.esc(' · cómo ingresar · listas copiadas el ' + h.fmtDate(jurs.map(r => r.checked).sort()[0])) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
        '<p class="rl-lead">' + h.esc(one
          ? 'Para iniciar sesión en ' + name + ' hay una sola dirección: ' + groups[0].host + ', la que nombran las listas de ' + joinY(groups[0].jurs.map(pn)) + '. Entrá ahí, escribiendo la dirección o con el botón, y usá el botón para ingresar de ese sitio.'
          : 'No hay un solo sitio de ' + name + ' en Argentina: cada provincia autoriza por su cuenta y cada lista oficial nombra la dirección que vale ahí. Para iniciar sesión, entrá a la de la provincia donde estás y usá el botón para ingresar de ese sitio.') + '</p>' +
        '<div class="rl-offs">' + jurs.map(r => officialLink(h, r.id, o.brand)).join('') + '</div>' +
        '<p class="rl-offn">Cada botón lleva a la dirección que publica la lista oficial de esa provincia, sin códigos de afiliado. No enlazamos páginas de acceso, no tenemos formularios y no te pedimos ningún dato. Solo mayores de 18.</p></div>' +
        '<div class="rl-big"><b>' + groups.length + '</b><span>' + (one ? 'dirección oficial para ' + jurs.length + ' listas' : groups.length === jurs.length ? 'direcciones oficiales, una por lista' : 'direcciones oficiales en ' + jurs.length + ' listas') + '</span><small>' + h.esc(joinY(jurs.map(r => r.regulator.short))) + '</small></div></section>';

      // 1. your province: the address, part by part
      const cards = jurs.map(r => {
        const c = row.cells[r.id];
        const extra = r.id === 'caba' && X.caba ? cabaNote(h, R, X, c) : '';
        return '<article class="rl-ingc"><div class="rl-jr"><span class="rl-tag">' + h.esc(codeOf(r.id)) + '</span><b>' + h.esc(h.rg.prov(r.id).name) + '</b></div>' +
          '<p class="rl-host rl-ingh">' + h.esc(c.host) + '</p>' + (c.ref ? '<p class="rl-ref">Autorizado por ' + h.esc(c.ref) + ' · ' + h.esc(r.regulator.short) + '</p>' : '<p class="rl-ref">Lista de ' + h.esc(r.regulator.short) + ', copia del ' + h.fmtDate(h.doc(r.list.doc).fetched) + '</p>') +
          officialLink(h, r.id, o.brand, { small: true }) + extra +
          (h.built('/operador/' + o.slug + '/' + r.id) ? '<p><a href="' + h.href('/operador/' + o.slug + '/' + r.id) + '">' + h.esc(name + ' en ' + h.rg.prov(r.id).name) + '</a></p>' : '') + '</article>';
      }).join('');
      const where = '<section class="rl-sec" id="tu-provincia">' + sectionHead(h, 'El sitio oficial de tu provincia', one ? 'la misma dirección en ' + jurs.length + ' listas' : groups.length === jurs.length ? groups.length + ' direcciones, una por lista' : groups.length + ' direcciones en ' + jurs.length + ' listas') +
        '<div class="rl-ingv"><figure class="rl-card rl-iaf">' + addrSvg(h, groups) + '<figcaption>' + (one ? 'Una sola dirección: lo que cambia entre provincias es quién la autoriza.' : groups.every(g => /^(pba|caba|cba|mza|mdz)$/.test(anatomy(g.host).sub)) ? 'La primera parte de la dirección indica la provincia: compará la barra de tu navegador con la de tu lista.' : 'Compará la barra de tu navegador con la dirección de tu lista, parte por parte: una letra o una terminación distinta es otro sitio.') + ' Los sitios pueden abrir con «www.» delante.</figcaption></figure>' +
        '<div class="rl-ings">' + cards + '</div></div></section>';

      // 2. why each province has its own site: the operator's clause, the chooser of its entry page, the regulator
      const clauses = R.all('account.provinceRestriction').filter(f => f.quote);
      const regQ = jurs.map(r => ({ r, q: Object.values(r.quotes).find(q => /^(list|licences)$/.test(q.role) && /ámbito|territorio|Ciudad|Córdoba|licencias/.test(q.text)) || Object.values(r.quotes).find(q => q.role === 'regulator' && /territorio|ámbito/.test(q.text)) })).filter(x => x.q);
      const why = '<section class="rl-sec" id="por-que">' + sectionHead(h, one ? 'Una dirección, ' + jurs.length + ' licencias' : 'Por qué cada provincia tiene su propio sitio', 'citas del propio sitio y de los reguladores') +
        '<p class="rl-note">En Argentina no hay una licencia nacional de juego online: cada provincia autoriza por su cuenta y la licencia de una no vale en otra. ' + h.esc(one ? 'Por eso ' + name + ' figura en ' + jurs.length + ' listas con la misma dirección, cada una con su autorización.' : groups.length === jurs.length ? 'Por eso ' + name + ' tiene una dirección por lista.' : 'Por eso ' + name + ' figura en ' + jurs.length + ' listas, con ' + groups.length + ' direcciones: ' + groups.map(g => g.host + ' (' + joinY(g.jurs.map(pn)) + ')').join(', ') + '.') + '</p>' +
        '<div class="rl-two"><div class="rl-box"><h3>Lo que dice ' + h.esc(name) + '</h3>' +
        (clauses.length ? clauses.map(f => cite(h, R, f)).join('') : '') +
        (X.chooser ? (copyText(R, X.chooser.doc, X.chooser.text), X.chooser.must.forEach(t => copyText(R, X.chooser.doc, t)), '<p>Su página de entrada te pide elegir la provincia antes de seguir:</p>' + copyQuote(h, R, X.chooser.doc, X.chooser.text)) : '') +
        (X.footer ? '<p>En las páginas de ' + h.esc(name) + ' que guardamos no encontramos una cláusula sobre dónde tenés que estar. Su pie de página nombra dos licencias, una por provincia:</p>' + X.footer.texts.map(t => copyQuote(h, R, X.footer.doc, t)).join('') : '') +
        '</div><div class="rl-box"><h3>Lo que dicen los reguladores</h3>' + (regQ.length ? regQ.map(x => quote(h, x.q, x.r.regulator.name)).join('') : '') +
        '<p>' + h.esc(joinY(jurs.map(r => r.regulator.short))) + (jurs.length > 1 ? ' publican cada uno su lista' : ' publica su lista') + ' de sitios autorizados.</p>' +
        (h.built('/licencias') ? '<p><a href="' + h.href('/licencias') + '">Todas las listas oficiales, con fecha</a></p>' : '') + '</div></div></section>';

      // 3. how not to land on a copy
      const sample = groups[0].host;
      const fake = '<p class="rl-note">Las copias suelen cambiar una letra (<span class="rl-host">' + h.esc(swap(sample)) + '</span>), agregar un guion o una palabra, o usar otra terminación (.com, .net, .site). Ninguna de esas variantes figura en las listas.</p>';
      const safe = '<section class="rl-sec" id="copias">' + sectionHead(h, 'Cómo saber que es el sitio oficial', 'antes de escribir tu usuario y contraseña') +
        '<div class="rl-two"><div class="rl-box"><ol class="rl-chk rl-ingk">' +
        '<li><b>Letra por letra.</b> Compará la barra del navegador con la dirección de tu lista: ' + groups.map(g => '<span class="rl-host">' + h.esc(g.host) + '</span>').join(', ') + '.</li>' +
        '<li><b>Nunca desde un anuncio o un mensaje.</b> No entres con enlaces de publicidades, WhatsApp, Telegram, Instagram o perfiles que «te pasan el link». Escribí la dirección o usá un botón oficial.</li>' +
        '<li><b>Nada de cuentas personales.</b> Si te piden depositar a la cuenta o al alias de una persona, o cargar saldo por chat, no es el sitio de la lista.</li>' +
        '<li><b>El candado no alcanza.</b> Cualquier sitio, también una copia, puede tener conexión segura.</li>' +
        (h.built('/verificador') ? '<li><b>¿Dudás?</b> Pegá la dirección en el <a href="' + h.href('/verificador') + '">verificador</a>: la compara con las ' + h.regs.length + ' listas oficiales en tu navegador.</li>' : '') + '</ol></div>' +
        '<div class="rl-box"><h3>Si ya entraste a una copia</h3><p>No pongas tu contraseña ni tus datos. Si ya los pusiste, cambiá la contraseña desde el sitio oficial de tu provincia y avisá a su atención al cliente.</p>' + fake +
        (groups.some(g => !anatomy(g.host).betAr) ? '<p class="rl-note">' + h.esc(groups.filter(g => !anatomy(g.host).betAr).map(g => g.host).join(', ')) + ' no termina en .bet.ar y aun así figura en una lista oficial: la terminación sola no alcanza, manda la lista.</p>' : '') + '</div></div></section>';

      // 4. the app: store listings only as the operator's own page links them
      const st = storeLinks(h, R), appF = R.pre('app').filter(f => f.quote);
      const app = '<section class="rl-sec" id="app">' + sectionHead(h, 'La app oficial', st ? 'enlaces tomados de la página del operador' : 'sin enlace a tiendas en sus páginas') +
        '<div class="rl-box">' + (st ? st + '<p>Esos enlaces salen de la página de ' + h.esc(name) + ' que copiamos, con fecha. Una app con otro nombre o de otro desarrollador puede ser una copia: buscala siempre desde el sitio oficial, no desde un anuncio.</p>'
          : '<p>En las páginas de ' + h.esc(name) + ' que guardamos no encontramos un enlace a App Store ni a Google Play. Para bajar la app oficial, entrá primero al sitio de tu provincia (botones de arriba) y seguí el enlace que publica el propio sitio; no la busques por anuncios.</p>') +
        (appF.length && !st ? appF.map(f => cite(h, R, f)).join('') : '') +
        (R.pre('app').length ? '<p class="rl-note"><a href="' + h.href('/operador/' + o.slug) + '#app">Lo que dice su sitio sobre la app</a></p>' : '') + '</div></section>';

      // 5. forgotten password: the official site's own recovery
      const pw = X.password ? (copyText(R, X.password.doc, X.password.text), true) : false;
      const sup = R.pre('support').length > 0;
      const pass = '<section class="rl-sec" id="contrasena">' + sectionHead(h, '¿Olvidaste la contraseña?', 'se recupera solo en el sitio oficial') +
        '<div class="rl-box"><ol class="rl-chk"><li>Entrá al sitio oficial de tu provincia (botones de arriba) y abrí la pantalla para ingresar.</li><li>Usá la opción para recuperar la contraseña de esa pantalla y seguí los pasos que indique el propio sitio.</li><li>No le pases tu contraseña a nadie por chat, WhatsApp, redes o teléfono, aunque diga ser del operador: el sitio oficial no la necesita para ayudarte.</li></ol>' +
        (pw ? '<p>El centro de ayuda de ' + h.esc(name) + ' para la Provincia de Buenos Aires tiene una pregunta sobre esto:</p>' + copyQuote(h, R, X.password.doc, X.password.text) : '') +
        (sup ? '<p>Si la cuenta quedó bloqueada, escribí a su atención al cliente: los canales que publica están en la <a href="' + h.href('/operador/' + o.slug) + '#atencion">reseña de ' + h.esc(name) + '</a>.</p>' : '') + '</div></section>';

      // 6. if what you want is to stop
      const stop = '<section class="rl-sec" id="pausa">' + sectionHead(h, 'Si lo que querés es dejar de entrar') +
        '<div class="rl-box"><p>Si querés dejar de jugar, podés pedir la autoexclusión: cada provincia tiene su programa.' + (R.pre('rg').length ? ' Las herramientas de pausa y límites que cita ' + h.esc(name) + ' en sus páginas están en su <a href="' + h.href('/operador/' + o.slug) + '#juego-responsable">reseña</a>.' : '') + '</p>' +
        (h.built('/juego-responsable/autoexclusion') ? '<p><a href="' + h.href('/juego-responsable/autoexclusion') + '">Cómo autoexcluirte en tu provincia</a></p>' : '') + '</div></section>';

      const links = [['/operador/' + o.slug, 'Reseña de ' + name], ['/operador/' + o.slug + '/casino', name + ' Casino'], ...jurs.map(r => ['/operador/' + o.slug + '/' + r.id, name + ' en ' + h.rg.prov(r.id).name]), ['/verificador', 'Verificá la dirección que tenés abierta'], ['/guia/bet-ar', 'Qué garantiza el dominio .bet.ar y qué no']].filter(([u]) => h.built(u));
      const next = '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + '<div class="rl-gd">' + links.map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div></section>';
      const toc = '<nav class="rl-toc" aria-label="En esta página">' + [['tu-provincia', 'Tu provincia'], ['por-que', one ? 'Una dirección' : 'Por qué un sitio por provincia'], ['copias', 'Copias'], ['app', 'App'], ['contrasena', 'Contraseña']].map(([id, t]) => '<a href="#' + id + '">' + h.esc(t) + '</a>').join('') + '</nav>';
      return hero + toc + where + why + safe + app + pass + stop + next;
    },
  };
}
function groupsOf(h, row) {
  const jurs = h.regs.filter(r => row.cells[r.id]);
  return [...new Set(jurs.map(r => row.cells[r.id].host))].map(host => ({ host, jurs: jurs.filter(r => row.cells[r.id].host === host) }));
}
// the CABA list names betsson.com.ar; its entry page sends to the province chooser, whose CABA site cites the same LOTBA act
function cabaNote(h, R, X, c) {
  const f = R.all('licence.footer').find(x => x.doc === X.caba.doc);
  if (!f || !f.quote.includes(X.caba.host) || !f.quote.includes(X.caba.act) || !(c.ref || '').includes(X.caba.act)) throw new Error('ingresar: the CABA footer does not match the LOTBA act');
  return '<p class="rl-note">Cuando abrimos ' + h.esc(c.host) + ' el ' + h.fmtDate(R.doc(X.chooser.doc).date) + ', nos llevó a la página de entrada para elegir provincia; para la Ciudad enlaza <span class="rl-host">' + h.esc(X.caba.host) + '</span>, cuyo pie cita la misma disposición de LOTBA:</p>' + cite(h, R, f);
}
// one swapped pair of letters in the brand name, to show what a copy looks like (never a link)
function swap(host) {
  const a = anatomy(host), n = a.name, d = /\d\d$/.test(n), i = d ? n.length - 2 : Math.max(1, Math.floor(n.length / 2) - 1);
  const s = n.slice(0, i) + n[i + 1] + n[i] + n.slice(i + 2);
  return (a.sub ? a.sub + '.' : '') + (s === n ? n + n.at(-1) : s) + '.' + a.ending;
}
export const ingresarPages = OPS.filter(o => ING[o.brand]).map(ingresarPage);
