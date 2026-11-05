// Parsers for the provincial quiniela extracts (feed provincias.mjs, docs/FEEDS.md). Pure functions, Node only; the tests use them
// with real answers (engine/test/fixtures/provincias). Every parser returns place 1 first, twenty 4-digit strings, or throws.
//   Tucumán   Caja Popular de Ahorros: JSON api/extracto/?fecha_sorteo=D (one item per turn) + api/extracto-registro/?id=N
//   San Juan  Caja de Acción Social: server HTML cas.gob.ar/?fecha=D (one block per turn, "SORTEO VESPERTINO N° 7413 03/11/2026")
//   Chaco     Lotería Chaqueña: server HTML /ver_extracto/DD-MM-YYYY/<PRE|PRI|MAT|Ves|NOC> (five columns: Prov. Bs As, Ciudad Bs As,
//             Chaqueña, Correntina, Cordoba); the Ciudad, Provincia and Córdoba columns are checked against our LOTBA/PBA archive
//   Misiones  IPLyC S.E.: server HTML, one page per turn, the latest draw only (columns Misionera, Misionera Plus, LOTBA, Provincia;
//             each cell carries aria-label "Lotería <column>, premio número NN: VVVV")
import { X509Certificate } from 'node:crypto';

export class ProvError extends Error {}
const bad = msg => { throw new ProvError(msg); };
const NUM4 = /^\d{4}$/;
export const isoFromDmy = s => { const m = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(String(s || '').trim()); return m ? m[3] + '-' + m[2] + '-' + m[1] : null; };
export const dmyDash = iso => iso.slice(8, 10) + '-' + iso.slice(5, 7) + '-' + iso.slice(0, 4);

export function checkTwenty(list, where) {
  if (!Array.isArray(list) || list.length !== 20) bad(where + ': expected 20 numbers, got ' + (Array.isArray(list) ? list.length : typeof list));
  for (const v of list) if (typeof v !== 'string' || !NUM4.test(v)) bad(where + ': not a 4-digit number: ' + JSON.stringify(v));
  return list;
}

const ENT = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ntilde: 'ñ', Ntilde: 'Ñ', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', deg: '°', ordm: 'º' };
export const decode = s => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENT[e] !== undefined ? ENT[e] : m));
export const textOf = html => decode(String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

// The certificate of resultadosquiniela.cajapopular.gov.ar is valid (Sectigo DV, *.cajapopular.gov.ar) but the server does not send
// the intermediate CA, so a strict client cannot build the chain. We supply that public intermediate (fetched from the AIA address
// in the certificate, http://crt.sectigo.com/SectigoPublicServerAuthenticationCADVR36.crt) and keep full verification: the chain
// must still end at a root of the normal store (Sectigo Public Server Authentication Root R46), dates and host name are checked.
export const SECTIGO_DV_R36 = `-----BEGIN CERTIFICATE-----
MIIGTDCCBDSgAwIBAgIQOXpmzCdWNi4NqofKbqvjsTANBgkqhkiG9w0BAQwFADBf
MQswCQYDVQQGEwJHQjEYMBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTYwNAYDVQQD
Ey1TZWN0aWdvIFB1YmxpYyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gUm9vdCBSNDYw
HhcNMjEwMzIyMDAwMDAwWhcNMzYwMzIxMjM1OTU5WjBgMQswCQYDVQQGEwJHQjEY
MBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTcwNQYDVQQDEy5TZWN0aWdvIFB1Ymxp
YyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gQ0EgRFYgUjM2MIIBojANBgkqhkiG9w0B
AQEFAAOCAY8AMIIBigKCAYEAljZf2HIz7+SPUPQCQObZYcrxLTHYdf1ZtMRe7Yeq
RPSwygz16qJ9cAWtWNTcuICc++p8Dct7zNGxCpqmEtqifO7NvuB5dEVexXn9RFFH
12Hm+NtPRQgXIFjx6MSJcNWuVO3XGE57L1mHlcQYj+g4hny90aFh2SCZCDEVkAja
EMMfYPKuCjHuuF+bzHFb/9gV8P9+ekcHENF2nR1efGWSKwnfG5RawlkaQDpRtZTm
M64TIsv/r7cyFO4nSjs1jLdXYdz5q3a4L0NoabZfbdxVb+CUEHfB0bpulZQtH1Rv
38e/lIdP7OTTIlZh6OYL6NhxP8So0/sht/4J9mqIGxRFc0/pC8suja+wcIUna0HB
pXKfXTKpzgis+zmXDL06ASJf5E4A2/m+Hp6b84sfPAwQ766rI65mh50S0Di9E3Pn
2WcaJc+PILsBmYpgtmgWTR9eV9otfKRUBfzHUHcVgarub/XluEpRlTtZudU5xbFN
xx/DgMrXLUAPaI60fZ6wA+PTAgMBAAGjggGBMIIBfTAfBgNVHSMEGDAWgBRWc1hk
lfmSGrASKgRieaFAFYghSTAdBgNVHQ4EFgQUaMASFhgOr872h6YyV6NGUV3LBycw
DgYDVR0PAQH/BAQDAgGGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0lBBYwFAYI
KwYBBQUHAwEGCCsGAQUFBwMCMBsGA1UdIAQUMBIwBgYEVR0gADAIBgZngQwBAgEw
VAYDVR0fBE0wSzBJoEegRYZDaHR0cDovL2NybC5zZWN0aWdvLmNvbS9TZWN0aWdv
UHVibGljU2VydmVyQXV0aGVudGljYXRpb25Sb290UjQ2LmNybDCBhAYIKwYBBQUH
AQEEeDB2ME8GCCsGAQUFBzAChkNodHRwOi8vY3J0LnNlY3RpZ28uY29tL1NlY3Rp
Z29QdWJsaWNTZXJ2ZXJBdXRoZW50aWNhdGlvblJvb3RSNDYucDdjMCMGCCsGAQUF
BzABhhdodHRwOi8vb2NzcC5zZWN0aWdvLmNvbTANBgkqhkiG9w0BAQwFAAOCAgEA
YtOC9Fy+TqECFw40IospI92kLGgoSZGPOSQXMBqmsGWZUQ7rux7cj1du6d9rD6C8
ze1B2eQjkrGkIL/OF1s7vSmgYVafsRoZd/IHUrkoQvX8FZwUsmPu7amgBfaY3g+d
q1x0jNGKb6I6Bzdl6LgMD9qxp+3i7GQOnd9J8LFSietY6Z4jUBzVoOoz8iAU84OF
h2HhAuiPw1ai0VnY38RTI+8kepGWVfGxfBWzwH9uIjeooIeaosVFvE8cmYUB4TSH
5dUyD0jHct2+8ceKEtIoFU/FfHq/mDaVnvcDCZXtIgitdMFQdMZaVehmObyhRdDD
4NQCs0gaI9AAgFj4L9QtkARzhQLNyRf87Kln+YU0lgCGr9HLg3rGO8q+Y4ppLsOd
unQZ6ZxPNGIfOApbPVf5hCe58EZwiWdHIMn9lPP6+F404y8NNugbQixBber+x536
WrZhFZLjEkhp7fFXf9r32rNPfb74X/U90Bdy4lzp3+X1ukh1BuMxA/EEhDoTOS3l
7ABvc7BYSQubQ2490OcdkIzUh3ZwDrakMVrbaTxUM2p24N6dB+ns2zptWCva6jzW
r8IWKIMxzxLPv5Kt3ePKcUdvkBU/smqujSczTzzSjIoR5QqQA6lN1ZRSnuHIWCvh
JEltkYnTAH41QJ6SAWO66GrrUESwN/cgZzL4JLEqz1Y=
-----END CERTIFICATE-----
`;
export const SECTIGO_DV_R36_SHA256 = '8C:54:C3:34:B6:6B:A4:E4:26:77:2A:F4:A3:F9:13:6C:19:A1:AE:C7:29:FD:B2:8C:53:5C:07:A5:A4:EF:22:E0';
// Checks the pinned intermediate (fingerprint, subject, still valid at `now`) and returns its PEM; throws on any deviation.
export function tucumanIntermediate(now = new Date()) {
  const c = new X509Certificate(SECTIGO_DV_R36);
  if (c.fingerprint256 !== SECTIGO_DV_R36_SHA256) bad('Tucumán intermediate: fingerprint changed');
  if (!/CN=Sectigo Public Server Authentication CA DV R36/.test(c.subject) || !/CN=Sectigo Public Server Authentication Root R46/.test(c.issuer)) bad('Tucumán intermediate: subject/issuer');
  if (now < new Date(c.validFrom) || now > new Date(c.validTo)) bad('Tucumán intermediate: not valid now (' + c.validTo + ')');
  return SECTIGO_DV_R36;
}

// Tucumán turn types (api/tipo-sorteo/ on 2026-11-04). Type 11 is a second NOCTURNO at 20:00 (created 2024-12-24, special days).
export const TUC_TIPOS = { 1: ['MATU', '11:30'], 2: ['VESP', '14:30'], 3: ['SIES', '17:30'], 4: ['TARD', '19:30'], 5: ['NOCT', '22:00'], 11: ['NOCT', '20:00'] };
const TUC_NAMES = { 1: 'MATUTINO', 2: 'VESPERTINO', 3: 'DE LA SIESTA', 4: 'DE LA TARDE', 5: 'NOCTURNO', 11: 'NOCTURNO' };

// api/extracto/?fecha_sorteo=D -> [{ id, sorteo, date, turno, time }]; items of another date or not published (estado false) are dropped.
export function parseTucumanDay(json, date) {
  if (!Array.isArray(json)) bad('Tucumán ' + date + ': answer is not a list');
  const out = [];
  for (const e of json) {
    if (!e || typeof e !== 'object') bad('Tucumán ' + date + ': bad item');
    if (e.fecha_sorteo !== date) bad('Tucumán ' + date + ': item of another date ' + JSON.stringify(e.fecha_sorteo));
    if (e.estado !== true) continue;
    const tp = TUC_TIPOS[e.tipo];
    if (!tp || fold(e.tipo_detalle || '') !== TUC_NAMES[e.tipo]) bad('Tucumán ' + date + ': unknown turn type ' + e.tipo + ' ' + JSON.stringify(e.tipo_detalle));
    if (!Number.isInteger(e.id) || !Number.isInteger(e.sorteo) || e.sorteo <= 0) bad('Tucumán ' + date + ': bad id/sorteo');
    out.push({ id: e.id, sorteo: e.sorteo, date, turno: tp[0], time: tp[1] });
  }
  if (new Set(out.map(x => x.turno)).size !== out.length) bad('Tucumán ' + date + ': two extracts for one turn');
  return out;
}

// api/extracto-registro/?id=N -> twenty numbers, place 1 first. The official page shows place k = posicion k-1 and reads the list
// in the order it arrives (descending posicion): any other order means the page and we would differ, so it stops.
export function parseTucumanRegistro(json, id) {
  if (!Array.isArray(json) || json.length !== 20) bad('Tucumán extract ' + id + ': expected 20 rows, got ' + (Array.isArray(json) ? json.length : typeof json));
  const list = new Array(20);
  json.forEach((r, i) => {
    if (!r || r.extracto !== id) bad('Tucumán extract ' + id + ': row of another extract');
    if (r.posicion !== 19 - i) bad('Tucumán extract ' + id + ': rows not in descending position order');
    if (!Number.isInteger(r.numero) || r.numero < 0 || r.numero > 9999) bad('Tucumán extract ' + id + ': bad number ' + JSON.stringify(r.numero));
    list[r.posicion] = String(r.numero).padStart(4, '0');
  });
  return checkTwenty(list, 'Tucumán extract ' + id);
}

// San Juan turn names as printed ("SORTEO VESPERTINO N° 7413 03/11/2026").
export const SJ_TURNOS = { PREVIA: 'PREV', PRIMERA: 'PRIM', MATUTINO: 'MATU', VESPERTINO: 'VESP', TARDE: 'TARD', NOCTURNO: 'NOCT' };
// cas.gob.ar/?fecha=D -> { date, shown: date printed by the page, draws: [{ turno, sorteo, numbers }] }; draws of another date are
// not returned (the page may show the nearest day). An unknown turn name or a broken block stops.
export function parseSanJuan(html, date) {
  const t = textOf(html);
  const re = /SORTEO ([A-ZÁÉÍÓÚÑ ]+?) N° ?(\d+) (\d{2}\/\d{2}\/\d{4})((?: \d{1,2}° \d{4})+)/g;
  const draws = [];
  let m, shown = null;
  while ((m = re.exec(t))) {
    const name = fold(m[1]), d = isoFromDmy(m[3]);
    if (!SJ_TURNOS[name]) bad('San Juan ' + date + ': unknown turn ' + JSON.stringify(m[1]));
    shown = shown || d;
    const pairs = [...m[4].matchAll(/(\d{1,2})° (\d{4})/g)];
    const byPos = {};
    for (const p of pairs) { const k = Number(p[1]); if (k < 1 || k > 20 || byPos[k]) bad('San Juan ' + date + ' ' + name + ': bad place ' + p[1]); byPos[k] = p[2]; }
    const list = Array.from({ length: 20 }, (_, i) => byPos[i + 1]);
    checkTwenty(list, 'San Juan ' + date + ' ' + name);
    if (d === date) draws.push({ turno: SJ_TURNOS[name], sorteo: Number(m[2]), numbers: list });
  }
  if (!shown && /SORTEO [A-Z]/.test(t)) bad('San Juan ' + date + ': unknown block layout');
  if (new Set(draws.map(x => x.turno)).size !== draws.length) bad('San Juan ' + date + ': two blocks for one turn');
  return { date, shown, draws };
}

// Chaco day+turn codes used in /ver_extracto/DD-MM-YYYY/<code>.
export const CHACO_CODES = { PREV: 'PRE', PRIM: 'PRI', MATU: 'MAT', VESP: 'Ves', NOCT: 'NOC' };
const CHACO_TITLES = { PREV: ['LA PREVIA'], PRIM: ['LA PRIMERA', 'PRIMERA'], MATU: ['MATUTINA'], VESP: ['VESPERTINA'], NOCT: ['NOCTURNA'] };
export const CHACO_COLS = { 'PROV. BS AS': 'buenos-aires', 'CIUDAD BS AS': 'caba', CHAQUENA: 'chaco', CORRENTINA: 'corrientes', CORDOBA: 'cordoba' };
// -> null when the page has no extract for that turn (no draw that day: Sunday, holiday; or not drawn yet), else
// { date, turno, sorteo, cols: { id: [20] } } (a column without 20 numbers is left out). Unknown column, wrong date/turn, broken
// row -> throws. The empty page (seen 2026-11-05 for Sunday 01-11 and for today's turns before their time) keeps the layout: the
// asked date, an empty "N° de Sorteo:" and a results list with only the "Ubicación" header cell. Anything else without a draw
// number is a changed page and throws.
export function parseChaco(html, date, turno) {
  const h = String(html);
  const sm = /N° de Sorteo:\s*(\d+)/.exec(h), fm = /<h5>\s*Fecha:\s*(\d{2}\/\d{2}\/\d{4})\s*<\/h5>/.exec(h);
  const start = h.indexOf('<ul class="results-list">');
  if (start < 0) { if (sm) bad('Chaco ' + date + ' ' + turno + ': unknown layout'); return null; }
  const end = h.indexOf('</ul>', start);
  const items = h.slice(start, end).split(/<li class="results-list__item[^"]*"/).slice(1).map(li => [...li.matchAll(/<p class="results-number[^"]*"[^>]*>([^<]*)<\/p>/g)].map(x => decode(x[1]).trim()));
  if (!sm && fm && isoFromDmy(fm[1]) === date && /N° de Sorteo:\s*<\/li>/.test(h) && items.length === 1 && items[0].length === 1 && fold(items[0][0]) === 'UBICACION') return null;
  if (!sm || !fm) bad('Chaco ' + date + ' ' + turno + ': no draw number/date');
  if (isoFromDmy(fm[1]) !== date) bad('Chaco ' + date + ' ' + turno + ': page date ' + fm[1]);
  const title = /<h4>\s*Quiniela ([^<]+?)\s*<\/h4>/.exec(h.slice(Math.max(0, start - 800), start));
  if (!title || !CHACO_TITLES[turno].includes(fold(decode(title[1])))) bad('Chaco ' + date + ' ' + turno + ': turn title ' + JSON.stringify(title && title[1]));
  if (items.length !== 21) bad('Chaco ' + date + ' ' + turno + ': expected header + 20 rows, got ' + items.length);
  const head = items[0];
  if (fold(head[0]) !== 'UBICACION') bad('Chaco ' + date + ' ' + turno + ': header');
  const ids = head.slice(1).map(c => CHACO_COLS[fold(c)] || bad('Chaco ' + date + ' ' + turno + ': unknown column ' + JSON.stringify(c)));
  const cols = Object.fromEntries(ids.map(id => [id, []]));
  items.slice(1).forEach((row, i) => {
    if (row[0] !== (i + 1) + '°') bad('Chaco ' + date + ' ' + turno + ': row ' + (i + 1) + ' label ' + JSON.stringify(row[0]));
    if (row.length !== ids.length + 1) bad('Chaco ' + date + ' ' + turno + ': row ' + (i + 1) + ' has ' + (row.length - 1) + ' cells');
    ids.forEach((id, k) => cols[id].push(row[k + 1]));
  });
  for (const id of ids) if (!cols[id].every(v => NUM4.test(v))) delete cols[id];
  return { date, turno, sorteo: Number(sm[1]), cols };
}

// Misiones: one page per turn (latest draw only; robots.txt disallows query strings, so we never ask for another date).
export const MIS_PAGES = { PREV: 'quiniela-la-previa', PRIM: 'quiniela-primera-matutina', MATU: 'quiniela-matutina', VESP: 'quiniela-vespertina', NOCT: 'quiniela-nocturna' };
const MIS_TURN = { PREV: 'LA PREVIA', PRIM: 'PRIMERA MATUTINA', MATU: 'MATUTINA', VESP: 'VESPERTINA', NOCT: 'NOCTURNA' };
// -> { date, turno, sorteo, cols: { misiones, 'misiones-plus'?, caba?, 'buenos-aires'? } }; an unknown column or a broken table throws.
export function parseMisiones(html, turno) {
  const h = String(html);
  const info = /D[ií]a consultado:\s*<strong>(\d{2}\/\d{2}\/\d{4})<\/strong>[\s\S]{0,80}?Sorteo:\s*<strong>(\d+)<\/strong>/.exec(h);
  if (!info) bad('Misiones ' + turno + ': no date/draw line');
  const date = isoFromDmy(info[1]);
  const T = MIS_TURN[turno];
  // columns seen 2026-11-04: "MISIONERA <T>", "MISIONERA <T> PLUS", "de la CIUDAD | LOTBA <T>", "PROVINCIA BS AS <T>" (or "BSAS"),
  // "DE SANTA FÉ <T>"; every column names the turn of the page
  const colId = name => {
    const n = fold(name);
    if (!n.endsWith(' ' + T) && !n.endsWith(' ' + T + ' PLUS')) return bad('Misiones ' + turno + ': column of another turn ' + JSON.stringify(name));
    const base = n.endsWith(' PLUS') ? n.slice(0, -5) : n, plus = n !== base, who = base.slice(0, -T.length).trim();
    const id = who === 'MISIONERA' ? 'misiones' : /^DE LA CIUDAD \| LOTBA$/.test(who) ? 'caba' : /^PROVINCIA BS ?AS$/.test(who) ? 'buenos-aires' : /^DE SANTA FE$/.test(who) ? 'santa-fe' : /^(DE )?CORDOBA$/.test(who) ? 'cordoba' : /^(DE )?ENTRE RIOS$/.test(who) ? 'entre-rios' : null;
    if (!id || (plus && id !== 'misiones')) return bad('Misiones ' + turno + ': unknown column ' + JSON.stringify(name));
    return plus ? 'misiones-plus' : id;
  };
  const cells = [...h.matchAll(/aria-label="Lotería ([^"]+?), premio número (\d{2}): (\d{4})"/g)];
  if (!cells.length) bad('Misiones ' + turno + ': no number cells');
  const cols = {};
  for (const c of cells) {
    const id = colId(decode(c[1])), k = Number(c[2]);
    cols[id] = cols[id] || new Array(20).fill(null);
    if (k < 1 || k > 20 || cols[id][k - 1]) bad('Misiones ' + turno + ': place ' + c[2] + ' of ' + id);
    cols[id][k - 1] = c[3];
  }
  const heads = [...h.matchAll(/<th scope="col">([^<]+)<\/th>/g)].map(x => colId(decode(x[1]).trim()));
  if (heads.length !== Object.keys(cols).length || !heads.every(id => cols[id])) bad('Misiones ' + turno + ': header and cells differ');
  for (const id of Object.keys(cols)) checkTwenty(cols[id], 'Misiones ' + turno + ' ' + id);
  if (!cols.misiones) bad('Misiones ' + turno + ': no Misionera column');
  return { date, turno, sorteo: Number(info[2]), cols };
}
