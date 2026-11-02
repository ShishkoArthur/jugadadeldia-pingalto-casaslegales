// Image generation via nanobananaapi.ai (model nano-banana-pro).
// node tools/gen-image.mjs <jobs.json> [id ...]
// jobs.json: [{ id, prompt, aspectRatio, resolution, refs: [url], note }]
// Result: data/img-review/<id>.png + entry in data/img-review/PROVENANCE.json
// (prompt, refs, date, taskId, source URL). Images are reviewed by the owner, not agents.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { envKey, ROOT } from './env.mjs';

const API = 'https://api.nanobananaapi.ai/api/v1/nanobanana';
const LIMIT = 4980; // the API rejects prompts longer than 5000 characters (422) — check before sending
const OUT = join(ROOT, 'data/img-review');
mkdirSync(OUT, { recursive: true });
const PROV = join(OUT, 'PROVENANCE.json');

const [jobsFile, ...only] = process.argv.slice(2);
if (!jobsFile) { console.error('usage: gen-image.mjs jobs.json [id...]'); process.exit(2); }
const ONLYMISSING = only.includes('--missing');
const ids = only.filter(x => !x.startsWith('--'));
const jobs = JSON.parse(readFileSync(jobsFile, 'utf8')).filter(j => (!ids.length || ids.includes(j.id)) && !(ONLYMISSING && existsSync(join(OUT, j.id + '.png'))));
const auth = { Authorization: `Bearer ${envKey('IMAGEGEN_API_KEY')}`, 'Content-Type': 'application/json' };
const prov = existsSync(PROV) ? JSON.parse(readFileSync(PROV, 'utf8')) : {};

for (const j of jobs) {
  if (j.prompt.length > LIMIT) throw new Error(`${j.id}: prompt ${j.prompt.length} > ${LIMIT}`);
}

async function submit(j, attempt = 0) {
  const body = { prompt: j.prompt, resolution: j.resolution || '2K', aspectRatio: j.aspectRatio || '1:1',
    callBackUrl: 'https://example.com/_nb-callback' };
  if (j.refs?.length) body.imageUrls = j.refs;
  const r = await fetch(`${API}/generate-pro`, { method: 'POST', headers: auth, body: JSON.stringify(body) });
  const x = await r.json();
  if (x.code === 429 && attempt < 8) { // "too many requests" — wait and retry (5, 10, 20... s)
    await new Promise(res => setTimeout(res, 5000 * 2 ** Math.min(attempt, 4) + Math.random() * 3000));
    return submit(j, attempt + 1);
  }
  if (x.code !== 200) throw new Error(`${j.id}: submit ${JSON.stringify(x)}`);
  return x.data.taskId;
}
async function poll(taskId) {
  for (let i = 0; i < 120; i++) {
    await new Promise(res => setTimeout(res, 5000));
    const r = await fetch(`${API}/record-info?taskId=${encodeURIComponent(taskId)}`, { headers: auth });
    const x = await r.json();
    const d = x.data || {};
    if (d.successFlag === 1) return d.response?.resultImageUrl || d.response?.originImageUrl;
    if (d.successFlag === 2 || d.successFlag === 3) throw new Error(`${taskId}: ${d.errorCode} ${d.errorMessage}`);
  }
  throw new Error(`${taskId}: timeout`);
}

await Promise.all(jobs.map(async (j, idx) => {
  await new Promise(res => setTimeout(res, idx * 2500)); // do not send everything at once
  try {
    const taskId = await submit(j);
    console.log(`${j.id}: task ${taskId}`);
    const url = await poll(taskId);
    const img = Buffer.from(await (await fetch(url)).arrayBuffer());
    writeFileSync(join(OUT, `${j.id}.png`), img);
    prov[j.id] = { file: `${j.id}.png`, prompt: j.prompt, refs: j.refs || [], aspectRatio: j.aspectRatio,
      resolution: j.resolution || '2K', model: 'nano-banana-pro', taskId, sourceUrl: url,
      created: new Date().toISOString(), note: j.note || '', checked: null };
    console.log(`${j.id}: ok ${img.length} bytes`);
  } catch (e) { console.error(`${j.id}: FAIL ${e.message}`); }
}));
// re-read the log before writing: parallel runs do not overwrite others' entries
const fresh = existsSync(PROV) ? JSON.parse(readFileSync(PROV, 'utf8')) : {};
for (const j of jobs) if (prov[j.id]) fresh[j.id] = prov[j.id];
writeFileSync(PROV, JSON.stringify(fresh, null, 1));
