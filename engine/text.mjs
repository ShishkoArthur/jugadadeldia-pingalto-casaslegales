// Text helpers shared by the source verifiers (tools/verify-rg.mjs, tools/verify-sources.mjs) and the gates.
// Pure functions: no file system. Adapted from /home/dev/gambeteo/tools/verify-rg.mjs.

// HTML named entities met on Argentine official pages (Spanish letters included; the Canadian list had only French ones).
export const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ensp: ' ', emsp: ' ', thinsp: ' ',
  ndash: '-', mdash: '-', hyphen: '-', minus: '-', lsquo: "'", rsquo: "'", sbquo: "'", ldquo: '"',
  rdquo: '"', bdquo: '"', hellip: '…', laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', Aacute: 'Á', Eacute: 'É', Iacute: 'Í',
  Oacute: 'Ó', Uacute: 'Ú', ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', iquest: '¿', iexcl: '¡',
  ordm: 'º', ordf: 'ª', deg: '°', egrave: 'è', ecirc: 'ê', agrave: 'à', acirc: 'â', ccedil: 'ç', ocirc: 'ô',
  icirc: 'î', iuml: 'ï', ucirc: 'û', ugrave: 'ù', times: '×', middot: '·', bull: '•', sect: '§', euro: '€',
  zwj: '', zwnj: '', shy: '',
};
// Inline elements do not break words, block elements do.
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'em', 'font',
  'i', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr']);

function decodeOnce(s) {
  return s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(cp); } catch { return m; }
    }
    return Object.hasOwn(NAMED, e) ? NAMED[e] : m;
  });
}
// Some pages are double-encoded ("Fecha Sanci&amp;oacute;n" on senado.gob.ar): decode a second time when entities remain.
export function decodeEntities(s) {
  const once = decodeOnce(s);
  return /&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/i.test(once) ? decodeOnce(once) : once;
}
export function normalize(s) {
  return s
    .replace(/[​-‍⁠﻿­]/g, '')
    .replace(/[  -   　]/g, ' ')
    .replace(/[‘’‚‛′`´]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐-―−﹘﹣－]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
export function visibleText(html) {
  const t = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg|head)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi, (m, tag) => (INLINE.has(tag.toLowerCase()) ? '' : ' '))
    .replace(/<[^>]*>/g, ' ');
  return normalize(decodeEntities(t));
}
// A quote is found when it is a substring of the text; PDF text (pdftotext -layout wraps lines) is compared without whitespace.
export function hasQuote(text, isPdf, q) {
  return isPdf ? text.replace(/\s/g, '').includes(normalize(q).replace(/\s/g, '')) : text.includes(normalize(q));
}
// HTML comments removed (registry pages keep withdrawn entries inside comments: they must never count as listed).
export function stripComments(html) {
  return String(html).replace(/<!--[\s\S]*?-->/g, '');
}
