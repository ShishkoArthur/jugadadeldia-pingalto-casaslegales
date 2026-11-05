// Beginner tutorials of the rules guides (owner 2026-11-05, docs/DECISIONS.md "guias de reglas: detalladas y visuales"): a table of
// contents with anchors, numbered sections, steps with pictures, worked examples from the engine, common mistakes, the FAQ and the
// tool or the game at the end. Shared pieces only; the text of each game lives in curso-juegos.mjs and curso-loterias.mjs.
// Styles: css/curso.css (classes jg-cu-*).

import { cite } from './parts.mjs';

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

export function toc(items, skip = '') {
  return '<nav class="jg-c jg-cu-toc" aria-label="En esta guía"><span class="jg-sm">En esta guía</span><ol>' +
    items.map(([id, t]) => '<li><a href="#' + id + '">' + t + '</a></li>').join('') + '</ol>' + (skip ? '<p class="jg-cu-skip">' + skip + '</p>' : '') + '</nav>';
}

export function sec(id, n, kicker, title, body, cls = '') {
  return '<section class="jg-c jg-cu-s' + (cls ? ' ' + cls : '') + '" id="' + id + '"><span class="jg-sm">' + kicker + '</span><h2><i aria-hidden="true">' + n + '</i>' + title + '</h2>' + body + '</section>';
}

export const tip = (label, html, kind = '') => '<div class="jg-cu-tip' + (kind ? ' ' + kind : '') + '"><b>' + label + '</b><p>' + html + '</p></div>';

export const steps = list => '<ol class="jg-cu-st">' + list.map(([t, b, fig]) => '<li><div><b>' + t + '</b>' + b + '</div>' + (fig ? '<div class="jg-cu-fx">' + fig + '</div>' : '') + '</li>').join('') + '</ol>';

export const errs = list => '<ul class="jg-cu-err">' + list.map(([bad, good]) => '<li><p class="no">' + bad + '</p><p class="ok">' + good + '</p></li>').join('') + '</ul>';

export const fig = (inner, caption, cls = '') => '<figure class="jg-cu-fig' + (cls ? ' ' + cls : '') + '">' + inner + (caption ? '<figcaption>' + caption + '</figcaption>' : '') + '</figure>';

export function die(v, kept = false) {
  return '<span class="jg-die jg-cu-d' + (kept ? ' kept' : '') + '" role="img" aria-label="dado ' + v + (kept ? ', guardado' : '') + '"><span class="jg-pips">' +
    Array.from({ length: 9 }, (_, k) => (PIPS[v].includes(k) ? '<i></i>' : '<span></span>')).join('') + '</span></span>';
}
// Five dice; `keep` lists the values kept (each value once per kept die).
export function dice(vals, keep = []) {
  const k = keep.slice();
  return '<span class="jg-cu-dice">' + vals.map(v => { const i = k.indexOf(v); if (i >= 0) k.splice(i, 1); return die(v, i >= 0); }).join('') + '</span>';
}

export const ball = (n, cls = '') => '<span class="jg-cu-ball' + (cls ? ' ' + cls : '') + '">' + n + '</span>';

export const go = (title, body, buttons) => '<section class="jg-c jg-cu-go"><span class="jg-sm">Ya sabés lo básico</span><h2>' + title + '</h2>' + body + (buttons ? '<div class="jg-r">' + buttons + '</div>' : '') + '</section>';

export const wrap = html => '<div class="jg-cu">' + html + '</div>';

// FAQ of a tutorial (same markup as parts.mjs faq, as a numbered section); the list also feeds the FAQPage schema (faqLd).
export function faqSec(h, n, title, list, ids) {
  return sec('preguntas', n, 'Preguntas', h.esc(title), '<div class="jg-q">' + list.map(([q, a]) => '<details><summary>' + h.esc(q) + '</summary><div>' + a + '</div></details>').join('') + '</div>' + (ids && ids.length ? cite(h, ids) : ''));
}
