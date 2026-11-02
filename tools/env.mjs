// The only place keys are read. Values live only in .env (git-ignored).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let cache = null;

export function envKey(name) {
  if (process.env[name]) return process.env[name];
  if (!cache) {
    cache = {};
    try {
      for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) cache[m[1]] = m[2];
      }
    } catch { /* no .env — explicit failure below */ }
  }
  const v = cache[name];
  if (!v) throw new Error(`Missing key ${name} in .env`);
  return v;
}
export { ROOT };
