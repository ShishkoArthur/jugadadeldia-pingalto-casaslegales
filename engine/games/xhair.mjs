// CS2 crosshair share code ("CS" + 44 characters, the format of the CS2 update of 2026-09-30): 32 bytes, byte 0 is the sum of
// the others, written as one big number in base 57 with Valve's alphabet, least significant character first. Port of the MIT
// library akiver/csgo-sharecode (src/crosshair.ts, src/share-code.ts at commit 139b9e2), checked against its test codes, two of
// them exported by the game (engine/test/xhair.test.mjs). Pure: the build and the browser run the same code.
export const DICT = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789';
export const PREFIX = 'CS';
export const CHARS = 44;
export const BYTES = 32;
export const STYLES = 10;
const N = BigInt(DICT.length);
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const int = v => Math.round(Number(v) || 0);

export const DEFAULTS = {
  style: 4, followRecoil: false, centerDotEnabled: false, tStyleEnabled: false, outlineMode: 1,
  red: 0, green: 255, blue: 0, alpha: 255, outlineRed: 0, outlineGreen: 0, outlineBlue: 0, outlineAlpha: 255,
  gap: 2, length: 6, thickness: 2, dynamicSpreadLimit: 64, splitDistance: 3, innerSplitAlpha: 1, outerSplitAlpha: 0.5,
  splitSizeRatio: 0.3, screenHeight: 1080, scopeDotScale: 1, scopeDotUseCrosshairColor: false,
};

export function isCode(s) {
  return new RegExp('^' + PREFIX + '[' + DICT + ']{' + CHARS + '}$').test(String(s).trim());
}
function toBytes(chars) {
  let big = 0n;
  for (const c of [...chars].reverse()) big = big * N + BigInt(DICT.indexOf(c));
  const hex = big.toString(16).padStart(BYTES * 2, '0');
  if (hex.length > BYTES * 2) return null;
  const out = [];
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16));
  return out;
}
function toChars(bytes) {
  let big = BigInt('0x' + bytes.map(b => (b & 255).toString(16).padStart(2, '0')).join(''));
  let s = '';
  for (let i = 0; i < CHARS; i++) { s += DICT[Number(big % N)]; big /= N; }
  return s;
}
const sum = a => a.reduce((x, y) => x + y, 0);

// Code -> settings, with the same limits CS2 applies on import; null when the code is not a valid CS2 crosshair code.
export function decode(code) {
  const s = String(code).trim();
  if (!isCode(s)) return null;
  const b = toBytes(s.slice(PREFIX.length));
  if (!b || b[0] !== sum(b.slice(1)) % 256 || b[1] !== 1) return null;
  const h = b[2] | (b[3] << 8);
  if (h === 0) return null;
  const bits = b[18] | (b[19] << 8) | (b[20] << 16) | (b[21] << 24);
  return {
    style: Math.min(b[4] & 0x1f, 9), followRecoil: (b[4] & 0x20) === 0x20, centerDotEnabled: (b[4] & 0x40) === 0x40, tStyleEnabled: (b[4] & 0x80) === 0x80,
    outlineMode: Math.min(b[13] >>> 6, 2), red: b[5], green: b[6], blue: b[7], alpha: b[8],
    outlineRed: b[9], outlineGreen: b[10], outlineBlue: b[11], outlineAlpha: b[12],
    gap: clamp(((b[14] | (b[15] << 8)) << 16) >> 16, -3840, 3840), length: b[16], thickness: Math.min(b[13] & 0x3f, 32), dynamicSpreadLimit: b[17],
    splitDistance: bits & 0x7f, innerSplitAlpha: Math.min((bits >> 7) & 0x7f, 100) / 100,
    outerSplitAlpha: (Math.min((bits >> 14) & 0x7f, 70) + 30) / 100, splitSizeRatio: Math.min((bits >> 21) & 0x7f, 100) / 100,
    screenHeight: Math.max(h, 240), scopeDotScale: Math.min((b[22] + 10) / 100, 2), scopeDotUseCrosshairColor: ((bits >>> 28) & 1) === 1,
  };
}

// Settings -> code. Missing fields take DEFAULTS; every field is clamped to the range the game accepts.
export function encode(x) {
  const c = { ...DEFAULTS, ...x };
  const inner = Math.round(clamp(Number(c.innerSplitAlpha), 0, 1) * 100);
  const outer = Math.round(clamp(Number(c.outerSplitAlpha), 0.3, 1) * 100) - 30;
  const ratio = Math.round(clamp(Number(c.splitSizeRatio), 0, 1) * 100);
  const bits = clamp(int(c.splitDistance), 0, 127) | (inner << 7) | (outer << 14) | (ratio << 21) | (Number(!!c.scopeDotUseCrosshairColor) << 28);
  const h = clamp(int(c.screenHeight), 0, 65535);
  const gap = clamp(int(c.gap), -3840, 3840);
  const b = new Array(BYTES).fill(0);
  b[1] = 1;
  b[2] = h & 255; b[3] = h >> 8;
  b[4] = clamp(int(c.style), 0, 9) | (Number(!!c.followRecoil) << 5) | (Number(!!c.centerDotEnabled) << 6) | (Number(!!c.tStyleEnabled) << 7);
  ['red', 'green', 'blue', 'alpha', 'outlineRed', 'outlineGreen', 'outlineBlue', 'outlineAlpha'].forEach((k, i) => { b[5 + i] = clamp(int(c[k]), 0, 255); });
  b[13] = clamp(int(c.thickness), 0, 32) | (clamp(int(c.outlineMode), 0, 2) << 6);
  b[14] = gap & 255; b[15] = (gap >> 8) & 255;
  b[16] = clamp(int(c.length), 0, 255);
  b[17] = clamp(int(c.dynamicSpreadLimit), 0, 255);
  b[18] = bits & 255; b[19] = (bits >> 8) & 255; b[20] = (bits >> 16) & 255; b[21] = (bits >>> 24) & 255;
  b[22] = Math.round(clamp(Number(c.scopeDotScale), 0.1, 2) * 100) - 10;
  b[0] = sum(b) & 255;
  return PREFIX + toChars(b);
}

// Console commands with the same values (the names CS2 uses; the decimals go with a point, as the console reads them).
export function convars(x) {
  const c = { ...DEFAULTS, ...x };
  const n = v => String(Math.round(Number(v) * 100) / 100);
  return [
    ['cl_crosshairstyle', c.style], ['cl_crosshair_recoil', +!!c.followRecoil], ['cl_crosshairdot', +!!c.centerDotEnabled], ['cl_crosshair_t', +!!c.tStyleEnabled],
    ['cl_crosshair_drawoutline', c.outlineMode], ['cl_crosshaircolor_r', c.red], ['cl_crosshaircolor_g', c.green], ['cl_crosshaircolor_b', c.blue], ['cl_crosshaircolor_a', c.alpha],
    ['cl_crosshairoutline_r', c.outlineRed], ['cl_crosshairoutline_g', c.outlineGreen], ['cl_crosshairoutline_b', c.outlineBlue], ['cl_crosshairoutline_a', c.outlineAlpha],
    ['cl_crosshair_gap', c.gap], ['cl_crosshair_length', c.length], ['cl_crosshair_thickness', c.thickness], ['cl_crosshair_dynamic_spread_limit', c.dynamicSpreadLimit],
    ['cl_crosshair_dynamic_splitdist', c.splitDistance], ['cl_crosshair_dynamic_splitalpha_innermod', c.innerSplitAlpha], ['cl_crosshair_dynamic_splitalpha_outermod', c.outerSplitAlpha],
    ['cl_crosshair_dynamic_maxdist_splitratio', c.splitSizeRatio], ['cl_crosshair_screen_height', c.screenHeight], ['cl_ironsight_dot_scale', c.scopeDotScale],
    ['cl_ironsight_usecrosshaircolor', +!!c.scopeDotUseCrosshairColor],
  ].map(([k, v]) => k + ' "' + n(v) + '"').join('\n');
}

// Approximate still preview (no weapon spread) as SVG in screen pixels around the center; the page scales it up.
export function previewSvg(x, view = 48) {
  const c = { ...DEFAULTS, ...x };
  const t = Math.max(1, c.thickness), L = c.length, g = c.gap, rgba = (r, gg, b, al) => 'rgba(' + r + ',' + gg + ',' + b + ',' + Math.round((al / 255) * 100) / 100 + ')';
  const fill = rgba(c.red, c.green, c.blue, c.alpha), line = rgba(c.outlineRed, c.outlineGreen, c.outlineBlue, c.outlineAlpha);
  const h = t / 2, rects = [];
  const bar = (x0, y0, w, hh) => { if (w > 0 && hh > 0) rects.push([x0, y0, w, hh]); };
  const st = c.style;
  if (st !== 6 && st !== 1 && st !== 3) {
    const off = Math.max(g, -L) + h;
    bar(off, -h, L, t); bar(-off - L, -h, L, t); bar(-h, off, t, L);
    if (!c.tStyleEnabled) bar(-h, -off - L, t, L);
  }
  if (c.centerDotEnabled || st === 6) bar(-h, -h, t, t);
  const out = [];
  if (c.outlineMode > 0) for (const [x0, y0, w, hh] of rects) {
    if (c.outlineMode === 1) out.push('<rect x="' + (x0 - 1) + '" y="' + (y0 - 1) + '" width="' + (w + 2) + '" height="' + (hh + 2) + '" fill="' + line + '"/>');
    else out.push('<path d="M' + (x0 - 1) + ' ' + (y0 + hh) + 'V' + (y0 - 1) + 'H' + (x0 + w) + '" stroke="' + line + '" stroke-width="1" fill="none" transform="translate(.5 .5)"/>');
  }
  const body = rects.map(([x0, y0, w, hh]) => '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + hh + '" fill="' + fill + '"/>');
  if (st === 1 || st === 3) body.push('<circle r="' + Math.max(2, g + L / 2) + '" fill="none" stroke="' + fill + '" stroke-width="' + t + '"/>');
  const v = view / 2;
  return '<svg viewBox="' + -v + ' ' + -v + ' ' + view + ' ' + view + '" shape-rendering="crispEdges" role="img" aria-label="Vista previa de la mira">' + out.join('') + body.join('') + '</svg>';
}
