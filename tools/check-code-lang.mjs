// Code language gate (owner decision 2026-10-28): no Cyrillic anywhere in code - comments and strings are in English (copy for
// the sites is es-AR). Checks every text file under tools/, engine/ and sites/ (fonts and images skipped).
// Exits 1 with the offending lines. Part of `npm test`.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './env.mjs';

const ch = String.fromCharCode;
const CYR = new RegExp('[' + ch(0x400) + '-' + ch(0x52f) + ch(0x2de0) + '-' + ch(0x2dff) + ch(0xa640) + '-' + ch(0xa69f) + ']');
const walk = d => readdirSync(join(ROOT, d), { withFileTypes: true }).flatMap(e => e.name === 'node_modules' || e.name.startsWith('.') ? [] : e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name]);
const files = ['tools', 'engine', 'sites'].filter(d => existsSync(join(ROOT, d))).flatMap(walk).filter(f => /\.(mjs|js|cjs|css|json|html|svg|sh|py|txt|md)$/.test(f));
const bad = [];
for (const f of files) {
  let t; try { t = readFileSync(ROOT + '/' + f, 'utf8'); } catch { continue; }
  t.split('\n').forEach((l, i) => { if (CYR.test(l)) bad.push(`${f}:${i + 1}: ${l.trim().slice(0, 100)}`); });
}
if (bad.length) { console.error(`check-code-lang: ${bad.length} line(s) with Cyrillic in code:\n` + bad.slice(0, 40).join('\n')); process.exit(1); }
console.log(`check-code-lang: ${files.length} code files under tools/ engine/ sites/, no Cyrillic`);
