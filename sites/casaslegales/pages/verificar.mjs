// /verificar/<brand>: a brand people search for that is not in the verified lists. The page states only the search result
// (computed here from the saved copies: occurrences of the brand name in each official list) and quotes regulators on illegal
// sites. No address of the brand, no link, no claim beyond the quotes. The build stops if the brand appears in a list.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../../tools/env.mjs';
import { UNLISTED } from '../content/operators.mjs';
import { opData, quoteById } from '../content/opdata.mjs';
import { opSrcQuote, listsDate } from './opparts.mjs';
import { src, sectionHead } from './parts.mjs';
import { CODE } from '../content/map.mjs';

export function searchLists(h, tokens) {
  return h.regs.map(r => {
    const d = h.doc(r.list.doc);
    const raw = fs.readFileSync(path.join(ROOT, d.file), 'utf8').toLowerCase();
    const hits = tokens.reduce((n, t) => n + raw.split(t.toLowerCase()).length - 1, 0);
    return { r, d, hits, size: r.licensees.length };
  });
}

function page(b) {
  return {
    path: '/verificar/' + b.slug,
    id: 'verificar-' + b.slug,
    kind: 'check',
    title: b.title,
    description: b.description,
    h1: b.h1,
    ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ...(h.built('/verificador') ? [['/verificador', 'Verificador']] : []), ['/verificar/' + b.slug, b.name]])],
    render(h) {
      const D = opData(h.today);
      const res = searchLists(h, b.tokens);
      const found = res.filter(x => x.hits > 0);
      if (found.length) throw new Error('/verificar/' + b.slug + ': "' + b.tokens.join('/') + '" appears in ' + found.map(x => x.r.id).join(', ') + ' - this page must not say it is not listed');
      const names = h.regs.map(r => CODE[r.id]);
      const verdict = 'No figura en las listas oficiales de ' + names.slice(0, -1).join(', ') + ' y ' + names.at(-1) + ' revisadas el ' + listsDate(h) + '.';
      const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">Búsqueda en listas oficiales · ' + listsDate(h) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
        '<p class="rl-lead">' + h.esc(b.name) + ' es una marca que mucha gente busca en Argentina («' + h.esc(b.keyword) + '»). Buscamos su nombre, letra por letra, en las copias de las listas oficiales que guardamos.</p></div>' +
        '<div class="rl-big rl-big-no"><b>' + res.reduce((n, x) => n + x.hits, 0) + '</b><span>apariciones de «' + h.esc(b.tokens[0]) + '» en ' + res.length + ' listas oficiales</span><small>' + h.esc(verdict) + '</small></div></section>';
      const cards = '<section class="rl-sec">' + sectionHead(h, 'Lista por lista', 'qué buscamos y dónde') + '<div class="rl-search">' + res.map(x =>
        '<article><span class="rl-tag">' + h.esc(CODE[x.r.id]) + '</span><h3>' + h.esc(h.rg.prov(x.r.id).name) + '</h3><p class="rl-hits"><b>' + x.hits + '</b> resultados para «' + h.esc(b.tokens.join('» o «')) + '»</p>' +
        '<p>La lista tiene ' + x.size + ' sitios. Ninguno se llama así ni tiene una dirección con ese nombre.</p>' + src(h, x.r.list.doc, x.r.regulator.short) + '</article>').join('') + '</div>' +
        '<p class="rl-cap">Buscamos en el código completo de cada copia, no solo en el texto visible: así también contaríamos un nombre escondido en un enlace o una imagen.</p></section>';
      const meaning = '<section class="rl-sec">' + sectionHead(h, 'Qué quiere decir «no figura»') + '<div class="rl-two">' +
        '<div class="rl-box"><h3>Lo que sí sabemos</h3><p>' + h.esc(verdict) + ' Si un sitio quiere operar con licencia en esas jurisdicciones, el regulador lo publica en esa lista.</p></div>' +
        '<div class="rl-box"><h3>Lo que no sabemos</h3><p>' + h.t('Argentina tiene {{jur_total}} jurisdicciones y acá verificamos {{reg_total}} listas.') + ' No afirmamos nada sobre las demás. Esto no es asesoramiento legal: depende de la ley de tu provincia.</p></div></div></section>';
      const reg = ['caba-ilegal', 'cba-estafa', 'cba-manipulados', 'cba-respaldo'].map(id => quoteById(D, id));
      const say = '<section class="rl-sec">' + sectionHead(h, 'Qué dicen los reguladores sobre los sitios sin licencia', 'citas textuales') + '<div class="rl-law">' +
        reg.map(q => '<article>' + opSrcQuote(h, D, q, q.label) + '</article>').join('') + '</div></section>';
      const bill = quoteById(D, 'nac-direcciones');
      const why = '<section class="rl-sec">' + sectionHead(h, 'Por qué no mostramos su dirección') + '<div class="rl-box"><p>Las direcciones de sitios que no figuran en ninguna lista cambian seguido y no queremos difundirlas. Un proyecto de ley nacional, todavía no aprobado, va en la misma línea:</p>' +
        opSrcQuote(h, D, bill, bill.label) + '</div></section>';
      const links = [['/verificador', 'Verificá cualquier dirección en el verificador'], ['/guia/sitios-ilegales', 'Cómo reconocer y denunciar un sitio sin licencia'], ['/licencias', 'Todas las licencias, sitio por sitio']].filter(([u]) => h.built(u));
      const next = '<section class="rl-sec">' + sectionHead(h, 'Para verificar vos') + '<div class="rl-gd">' + links.map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div></section>';
      return hero + cards + meaning + say + why + next;
    },
  };
}
export const checkPages = UNLISTED.map(page);
