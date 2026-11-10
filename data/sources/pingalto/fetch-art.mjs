// Official game art that pingalto hosts itself (owner 2026-11-10), listed in data/sources/pingalto/assets.json.
//   node data/sources/pingalto/fetch-art.mjs riot-lol [--write]
// riot-lol: the square portrait of every League of Legends champion from Riot's Data Dragon, the version of the saved champion
// list (sources.json "ddragon-champs"), file names as Riot gives them in image.full. robots.txt of the host is read first; a 4xx
// answer means no rules (RFC 9309), a 5xx or a rule against us or AI agents stops the run. Bytes are stored unmodified
// (PNG signature checked). Without --write nothing is saved. Clash Royale card art is copied on the server by the clash feed.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { robotsAllow, isPng } from '../../../tools/feeds/pingalto/card-art.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const LIST = join(ROOT, 'data/sources/pingalto/assets.json');
const UA = 'Pingalto/1.0 (pingalto.com)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = b => createHash('sha256').update(b).digest('hex');

const SETS = {
  'riot-lol': () => {
    const src = JSON.parse(readFileSync(join(ROOT, 'data/sources/pingalto/sources.json'), 'utf8')).docs['ddragon-champs'];
    const champs = JSON.parse(readFileSync(join(ROOT, src.file), 'utf8'));
    return Object.values(champs.data).map(c => ({ file: c.image.full, url: 'https://ddragon.leagueoflegends.com/cdn/' + champs.version + '/img/champion/' + c.image.full, of: c.id }));
  },
};

async function main() {
  const id = process.argv[2], write = process.argv.includes('--write');
  if (!SETS[id]) { console.error('set must be one of ' + Object.keys(SETS).join(', ')); return 2; }
  const A = JSON.parse(readFileSync(LIST, 'utf8'));
  const set = A.sets.find(s => s.id === id);
  if (!set) { console.error('no set ' + id + ' in assets.json'); return 2; }
  const want = SETS[id]();
  const host = new URL(want[0].url).origin;
  const rb = await fetch(host + '/robots.txt', { headers: { 'User-Agent': UA } });
  if (rb.status >= 500) { console.error('robots.txt answers ' + rb.status + ': stop'); return 1; }
  if (rb.ok && !robotsAllow(await rb.text(), new URL(want[0].url).pathname)) { console.error('robots.txt keeps us or AI agents out: stop'); return 1; }
  console.log('robots.txt ' + rb.status + (rb.ok ? ' (rules allow us)' : ' (no rules)'));
  const dir = join(ROOT, set.dir), day = new Date().toISOString().slice(0, 10), files = [];
  if (write) mkdirSync(dir, { recursive: true });
  for (const w of want) {
    if (!/^[\w.-]+\.png$/.test(w.file)) throw new Error('file name ' + w.file);
    const old = (set.files || []).find(f => f.file === w.file && f.url === w.url);
    if (old && existsSync(join(dir, w.file))) { files.push(old); continue; }
    await sleep(300);
    const r = await fetch(w.url, { headers: { 'User-Agent': UA } });
    if (r.status === 403) throw new Error('403 for ' + w.url + ': not bypassed, stop');
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + w.url);
    const b = Buffer.from(await r.arrayBuffer());
    if (!isPng(b)) throw new Error('not a PNG ' + w.url);
    if (write) writeFileSync(join(dir, w.file), b);
    files.push({ file: w.file, of: w.of, url: w.url, fetched: day, bytes: b.length, sha256: sha(b) });
  }
  files.sort((a, b) => a.file < b.file ? -1 : 1);
  console.log(id + ': ' + files.length + ' files, ' + Math.round(files.reduce((t, f) => t + f.bytes, 0) / 1024) + ' KB');
  if (write) { set.files = files; set.fetched = day; writeFileSync(LIST, JSON.stringify(A, null, 1) + '\n'); console.log('assets.json updated'); }
  return 0;
}
process.exit(await main());
