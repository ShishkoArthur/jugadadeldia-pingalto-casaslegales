// English versions through the Claude API (docs/I18N.md). The build never calls the API; this tool fills what it misses.
//   node tools/translate.mjs <site> --meta [--force]     plan rows of built pages -> urlEn, titleEn, descriptionEn, h1En (Sonnet 5.5)
//   node tools/translate.mjs <site> [--budget=15]        strings the English build misses -> data/i18n/<site>-en.json (Sonnet 5.5)
//   node tools/translate.mjs <site> --review[=6] [--apply]  Opus 5.5 reads a sample of English pages against the Spanish ones
//                                                         -> docs/REVIEW-EN-<site>.md; --apply puts the checked fixes into the memory
// Glossary: data/i18n/<site>-glossary.json. Every answer is checked before it is kept: the same <tN> markers and {N} number slots,
// no digits outside the slots, no Cyrillic; code strings keep their HTML tags and edge spaces. Failures get one repair round, then
// are reported and left out (the build will name them). Spend: data/i18n/_spend.json. Stops on a credit error or the budget.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { ROOT, envKey } from './env.mjs';
import { build, loadSite, LIMITS, decode } from './render.mjs';
import { loadMemory, saveMemory, loadGlossary, markersProblem, placeholdersProblem, codeProblem, sitePath } from './lib/i18n.mjs';

const SONNET = 'claude-sonnet-5-5', OPUS = 'claude-opus-5-5';
const PRICE = { [SONNET]: [2, 10, 0.2, 2.5], [OPUS]: [4, 20, 0.2, 5] };
const args = process.argv.slice(2);
const id = args.find(a => !a.startsWith('--'));
const opt = (k, d) => { const a = args.find(x => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.includes('=') ? a.split('=')[1] : true) : d; };
const BUDGET = Number(opt('budget', 15));
const CYR = /[\u0400-\u04ff]/;
const SPEND = join(ROOT, 'data/i18n/_spend.json');
let spent = 0, client = null;

function costOf(model, u) {
  const [i, o, cr, cw] = PRICE[model];
  return ((u.input_tokens || 0) * i + (u.output_tokens || 0) * o + (u.cache_read_input_tokens || 0) * cr + (u.cache_creation_input_tokens || 0) * cw) / 1e6;
}
function ledger(what, usd) {
  const L = existsSync(SPEND) ? JSON.parse(readFileSync(SPEND, 'utf8')) : { total: 0, runs: [] };
  L.total = +(L.total + usd).toFixed(4);
  L.runs.push({ at: new Date().toISOString(), site: id, what, usd: +usd.toFixed(4) });
  writeFileSync(SPEND, JSON.stringify(L, null, 1) + '\n');
}
async function call({ model, system, user, effort = 'low', max = 32000 }) {
  if (spent >= BUDGET) throw Object.assign(new Error('budget $' + BUDGET + ' reached'), { stop: true });
  client ||= new Anthropic({ apiKey: envKey('ANTHROPIC_API_KEY') });
  let msg;
  try {
    msg = await client.messages.stream({ model, max_tokens: max, output_config: { effort }, system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }], messages: [{ role: 'user', content: user }] }).finalMessage();
  } catch (e) {
    if (/credit balance|billing/i.test(String(e.message))) throw Object.assign(new Error('API credit: ' + e.message), { stop: true });
    throw e;
  }
  const usd = costOf(model, msg.usage);
  spent += usd;
  if (msg.stop_reason === 'refusal') throw new Error('refusal');
  if (msg.stop_reason === 'max_tokens') throw new Error('max_tokens');
  const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return { data: firstJson(text), usd };
}

// the first complete JSON object of an answer (text around it, or a second object after it, is ignored)
function firstJson(text) {
  const a = text.indexOf('{');
  if (a < 0) throw new Error('no JSON in the answer');
  let depth = 0, str = false, esc = false;
  for (let i = a; i < text.length; i++) {
    const c = text[i];
    if (str) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') str = false; continue; }
    if (c === '"') str = true; else if (c === '{') depth++; else if (c === '}' && !--depth) return JSON.parse(text.slice(a, i + 1));
  }
  throw new Error('unfinished JSON in the answer');
}
function system(G, kind) {
  const keep = G.keep.join(', ');
  const terms = Object.entries(G.terms).map(([k, v]) => '- ' + k + ' -> ' + v).join('\n');
  const common = `You translate the Spanish (es-AR) website ${id}.com into English.
AUDIENCE: ${G.audience}
MONEY: ${G.money}
TIME: ${G.time}
NAMES THAT STAY AS WRITTEN (games, draws, institutions, provinces, card terms): ${keep}
TERMS (keep the Argentine word with the short gloss only where a reader needs it; do not repeat glosses in short labels):
${terms}
RULES:
- Translate meaning faithfully. Do not add facts, advice, numbers, promises or marketing. No "bonus", "guaranteed", "win big" style words.
- Keep the register: plain and direct, "you" for vos; imperatives stay imperatives ("Jugá" -> "Play").
- Question marks: drop the Spanish opening "¿" and "¡". Spanish quotes «…» become “…”.
- Keep province and institution names with their accents (Córdoba, Tucumán, Entre Ríos).
- Never answer in Spanish unless the string is only a proper name from the list.`;
  if (kind === 'text') return common + `
INPUT: JSON {"page": "...", "items": [{"i": n, "s": "Spanish"}]} - text pieces of one web page in reading order (headings, labels, paragraphs, table cells, button texts, image descriptions, quoted official rules).
OUTPUT: ONLY JSON {"t": [{"i": n, "s": "English"}]} with every i.
FORMAT RULES (checked by code; a broken item is rejected):
- <t1>…</t1> and <t2/> are markers for HTML tags: keep every marker of the item exactly once, same numbers; you may move them so the English reads naturally; never add other tags.
- {1}, {2}… are numbers or dates filled in later: keep every slot exactly once; NEVER write digits yourself (write "two" if you must add a number word, but prefer keeping the slots).
- Translate short labels as short labels (a menu item stays 1-3 words).`;
  return common + `
INPUT: JSON {"file": "...", "items": [{"i": n, "s": "string literal", "ctx": "the code line around it"}]} - string literals of a browser script. They are glued together with values at run time to make the visible text of a tool (results, buttons, messages).
OUTPUT: ONLY JSON {"t": [{"i": n, "s": "English"}]} with every i.
RULES FOR CODE STRINGS:
- If the literal is code and not visible text (a key, id, CSS class or selector, event or storage name, URL, file name, option value compared elsewhere, a data value), return it UNCHANGED.
- Keep every HTML tag inside the string byte for byte (attributes included) and the leading/trailing spaces exactly.
- Pieces are concatenated with values (look at ctx): choose English for each piece so the joined sentence reads naturally; you may leave a piece empty ("") only if its words moved to a neighbouring piece of the same expression.
- Keep digits that are in the string; add no new digits.
- Weekday and month names: English ("domingo" -> "Sunday").`;
}

// ---------- page meta in the plan ----------
async function meta(S) {
  const G = loadGlossary(id);
  const planFile = join(ROOT, 'data/plan', id + '.json');
  const plan = JSON.parse(readFileSync(planFile, 'utf8'));
  const built = new Set(S.PAGES.map(p => p.path));
  const rows = plan.filter(r => built.has(r.url) && (opt('force') || !r.urlEn || !r.titleEn || !r.descriptionEn || !r.h1En));
  if (!rows.length) { console.log('meta: every built page has its English row'); return; }
  const taken = new Set(plan.filter(r => r.urlEn && !rows.includes(r)).map(r => r.urlEn));
  const sys = system(G, 'text') + `
TASK NOW (overrides INPUT/OUTPUT above): for each page give its English URL and search snippet.
INPUT: JSON {"pages": [{"url", "title", "h1", "description", "kind", "keys"}]}
OUTPUT: ONLY JSON {"pages": [{"url", "urlEn", "titleEn", "h1En", "descriptionEn"}]}
- urlEn: ${G.urlRule || '"/en/" + lowercase ASCII words joined by "-", folders ending in "/", same folder depth as the Spanish url; the home "/" is "/en/". Keep the Argentine names of games and places as the section words (quiniela, quini-6, loto-plus, telekino, truco, generala, chinchon, escoba-de-15, burako, tucuman, santa-fe…); translate the descriptive words (cuanto-paga -> payouts, como-se-juega -> how-to-play, horarios -> draw-times, juego-responsable -> responsible-gambling, quienes-somos -> about-us, glosario -> glossary). Unique.'}
- titleEn: natural English for English search, at most ${LIMITS.title} characters, with the main search words first, e.g. "Quiniela results today (Argentina): Tucumán draws"; site name not needed.
- h1En: the page heading in English (short, may differ from the title).
- descriptionEn: ${LIMITS.descMin}-${LIMITS.descMax} characters (count them), what the page gives, concrete, no hype. Numbers only as in the Spanish.`;
  const out = {};
  for (let i = 0; i < rows.length; i += 30) {
    const part = rows.slice(i, i + 30);
    let todo = part.map(r => ({ url: r.url, title: r.title, h1: r.h1, description: r.description, kind: r.kind, keys: r.keys }));
    for (let round = 0; round < 3 && todo.length; round++) {
      const { data } = await call({ model: SONNET, system: sys, user: JSON.stringify({ pages: todo }), effort: 'medium' });
      const next = [];
      for (const r of todo) {
        const a = (data.pages || []).find(x => x.url === r.url);
        const err = !a ? 'missing' : !sitePath(S.SITE, a.urlEn) || !(a.urlEn === '/en' || a.urlEn.startsWith('/en/')) ? 'urlEn ' + a.urlEn + ' not a valid /en/ path of the site' : (taken.has(a.urlEn) || Object.values(out).some(x => x.urlEn === a.urlEn)) ? 'urlEn ' + a.urlEn + ' already used' :
          a.titleEn.length > LIMITS.title ? 'titleEn has ' + a.titleEn.length + ' characters, max ' + LIMITS.title : a.descriptionEn.length < LIMITS.descMin || a.descriptionEn.length > LIMITS.descMax ? 'descriptionEn has ' + a.descriptionEn.length + ' characters, need ' + LIMITS.descMin + '-' + LIMITS.descMax :
            CYR.test(JSON.stringify(a)) ? 'Cyrillic' : null;
        if (err) next.push({ ...r, fix: err + (a ? ' (your answer: ' + JSON.stringify(a) + ')' : '') }); else out[r.url] = a;
      }
      todo = next;
    }
    for (const r of todo) console.log('meta: no valid English row for ' + r.url + ' - ' + r.fix);
  }
  const fresh = JSON.parse(readFileSync(planFile, 'utf8'));
  for (const r of fresh) if (out[r.url]) Object.assign(r, { urlEn: out[r.url].urlEn, titleEn: out[r.url].titleEn, descriptionEn: out[r.url].descriptionEn, h1En: out[r.url].h1En });
  writeFileSync(planFile, JSON.stringify(fresh, null, 1) + '\n');
  console.log('meta: ' + Object.keys(out).length + ' rows written to data/plan/' + id + '.json');
}

// ---------- strings ----------
const textProblem = (s, t) => (typeof t !== 'string' || !t.trim() ? 'empty' : CYR.test(t) ? 'Cyrillic' : markersProblem(s, t) || placeholdersProblem(s, t));
async function batchRun(kind, label, items, sysText, keep) {
  try { return await batchTry(kind, label, items, sysText, keep); } catch (e) {
    if (e.stop) throw e;
    console.log('  batch failed [' + label + '] ' + items.length + ' items: ' + e.message + ' (left for the next run)');
    return 0;
  }
}
async function batchTry(kind, label, items, sysText, keep) {
  let todo = items.map((x, i) => ({ ...x, i }));
  let ok = 0;
  for (let round = 0; round < 2 && todo.length; round++) {
    const payload = kind === 'text' ? { page: label, items: todo.map(x => ({ i: x.i, s: x.s, ...(x.fix ? { fix: x.fix } : {}) })) }
      : { file: label, items: todo.map(x => ({ i: x.i, s: x.s, ctx: x.ctx, ...(x.fix ? { fix: x.fix } : {}) })) };
    const { data } = await call({ model: SONNET, system: sysText, user: JSON.stringify(payload) + (round ? '\nSome items carry "fix": the reason your previous answer was rejected. Correct exactly that.' : '') });
    const got = new Map((data.t || []).map(x => [x.i, x.s]));
    const next = [];
    for (const x of todo) {
      const t = got.get(x.i);
      const err = kind === 'text' ? textProblem(x.s, t) : (typeof t !== 'string' ? 'missing' : t === x.s ? null : CYR.test(t) ? 'Cyrillic' : codeProblem(x.s, t, x.tpl));
      if (err) next.push({ ...x, fix: err + ' (you wrote: ' + JSON.stringify(t) + ')' }); else { keep(x, t); ok++; }
    }
    todo = next;
  }
  for (const x of todo) console.log('  rejected ' + kind + ' [' + label + ']: ' + x.s.slice(0, 80) + ' - ' + x.fix.slice(0, 160));
  return ok;
}
async function strings(S) {
  const G = loadGlossary(id);
  const tmp = join(ROOT, 'dist', '_translate-' + id);
  const { misses } = await build(id, { collect: true, out: tmp });
  rmSync(tmp, { recursive: true, force: true });
  const text = misses.filter(m => m.kind !== 'code'), code = misses.filter(m => m.kind === 'code');
  console.log('strings: ' + text.length + ' page strings and ' + code.length + ' code strings to translate');
  const mem = loadMemory(id);
  const h1Of = new Map(S.PAGES_EN.map(p => [p.path, p.h1]));
  const byPage = new Map();
  for (const m of text) { const k = m.where || '?'; if (!byPage.has(k)) byPage.set(k, []); byPage.get(k).push(m); }
  const sysT = system(G, 'text'), sysC = system(G, 'code');
  let done = 0;
  try {
    for (const [where, list] of byPage) {
      const page = where + (h1Of.has(where) ? ' - ' + h1Of.get(where) : '');
      for (let i = 0; i < list.length;) {
        let n = 0, chars = 0;
        while (i + n < list.length && n < 60 && chars < 7000) { chars += list[i + n].s.length; n++; }
        const part = list.slice(i, i + n);
        i += n;
        done += await batchRun('text', page, part, sysT, (x, t) => { mem.text[x.s] = t; });
        saveMemory(id, mem);
        console.log('  ' + where + ': ' + done + '/' + text.length + ' · $' + spent.toFixed(3));
      }
    }
    const byFile = new Map();
    for (const m of code) { if (!byFile.has(m.file)) byFile.set(m.file, []); byFile.get(m.file).push(m); }
    let cd = 0;
    for (const [file, list] of byFile) {
      for (let i = 0; i < list.length; i += 50) {
        const part = list.slice(i, i + 50);
        cd += await batchRun('code', file, part, sysC, (x, t) => { mem.code[file + ' :: ' + x.s] = t; });
        saveMemory(id, mem);
        console.log('  ' + file + ': ' + cd + '/' + code.length + ' · $' + spent.toFixed(3));
      }
    }
  } finally { saveMemory(id, mem); }
}

// ---------- review (Opus) ----------
function visible(html) {
  return decode(html.replace(/<head[\s\S]*?<\/head>/i, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<(nav|footer)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|li|h[1-6]|td|th|div|section|figcaption|dt|dd|button|label|option)>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim();
}
async function review(S) {
  const N = Number(opt('review', 6)) || 6;
  const dist = join(ROOT, 'dist', id);
  if (!existsSync(join(dist, 'en'))) throw new Error('build the site first (node tools/render.mjs ' + id + ')');
  const kinds = [...new Set(S.PAGES_EN.map(p => p.kind))];
  const pick = [];
  for (let k = 0; pick.length < N && k < 50; k++) for (const kind of kinds) { const c = S.PAGES_EN.filter(p => p.kind === kind)[k]; if (c && pick.length < N) pick.push(c); }
  const G = loadGlossary(id);
  const sys = `You are a bilingual (Argentine Spanish / English) editor reviewing the English version of ${id}.com, a site for Argentines: ${G.audience}
Glossary kept on purpose: ${G.keep.join(', ')}. Money "${'$'} 1,234" in pesos, 24-hour times, English number separators are intended.
Official quotes are shown in Spanish with an English rendering after them ("In English:"): judge the rendering.
For the pair of pages (Spanish original, English version, visible text only) list real problems only: wrong meaning, Spanish left untranslated (beyond the glossary names), changed numbers, unnatural or confusing English, wrong gambling/game terms, missing text. Ignore style preferences.
OUTPUT ONLY JSON {"score": 1-10, "summary": "one sentence", "issues": [{"severity": "major"|"minor", "en": "exact English substring as it appears", "fix": "replacement for that substring", "why": "short"}]} - at most 12 issues, most important first.`;
  const results = [];
  for (const p of pick) {
    const es = visible(readFileSync(join(dist, S.SITE.fileOf(p.esPath)), 'utf8')).slice(0, 14000);
    const en = visible(readFileSync(join(dist, S.SITE.fileOf(p.path)), 'utf8')).slice(0, 14000);
    const { data } = await call({ model: OPUS, system: sys, user: 'SPANISH ' + p.esPath + '\n' + es + '\n\nENGLISH ' + p.path + '\n' + en, effort: 'medium' });
    results.push({ p, ...data });
    console.log('review ' + p.path + ': ' + data.score + '/10, ' + (data.issues || []).length + ' issues · $' + spent.toFixed(3));
  }
  let applied = 0;
  if (opt('apply')) {
    const mem = loadMemory(id);
    for (const r of results) for (const x of r.issues || []) {
      if (!x.en || !x.fix || x.en === x.fix) continue;
      const hits = Object.entries(mem.text).filter(([, v]) => v.includes(x.en));
      if (hits.length !== 1) { x.applied = hits.length ? 'not applied: in ' + hits.length + ' strings' : 'not applied: not found as one string'; continue; }
      const [k, v] = hits[0], nv = v.replace(x.en, x.fix);
      const err = textProblem(k, nv);
      if (err) { x.applied = 'not applied: ' + err; continue; }
      mem.text[k] = nv; x.applied = 'applied'; applied++;
    }
    saveMemory(id, mem);
  }
  const md = ['# Review of the English version — ' + id + ' (' + new Date().toISOString().slice(0, 10) + ')', '',
    'Reviewer: ' + OPUS + ' (sample of ' + results.length + ' pages, one per page kind). Translator: ' + SONNET + '. Review cost: $' + spent.toFixed(2) + '.' + (opt('apply') ? ' Fixes applied: ' + applied + '.' : ''), ''];
  for (const r of results) {
    md.push('## ' + r.p.path + ' (' + r.p.esPath + ') — ' + r.score + '/10', '', r.summary || '', '');
    for (const x of r.issues || []) md.push('- **' + x.severity + '** «' + x.en + '» → «' + x.fix + '» — ' + x.why + (x.applied ? ' _(' + x.applied + ')_' : ''));
    md.push('');
  }
  writeFileSync(join(ROOT, 'docs/REVIEW-EN-' + id + '.md'), md.join('\n'));
  console.log('review: docs/REVIEW-EN-' + id + '.md' + (opt('apply') ? ', ' + applied + ' fixes applied' : ''));
}

if (!id) { console.error('usage: node tools/translate.mjs <site> [--meta] [--review[=N] [--apply]] [--budget=USD]'); process.exit(2); }
const S = await loadSite(id);
mkdirSync(join(ROOT, 'data/i18n'), { recursive: true });
try {
  if (opt('meta')) await meta(S);
  else if (opt('review')) await review(S);
  else await strings(S);
} catch (e) {
  console.error('translate ' + id + ': ' + e.message);
  process.exitCode = 1;
} finally {
  if (spent) ledger(opt('meta') ? 'meta' : opt('review') ? 'review' : 'strings', spent);
  console.log('translate ' + id + ': spent $' + spent.toFixed(3) + ' this run' + (existsSync(SPEND) ? ', $' + JSON.parse(readFileSync(SPEND, 'utf8')).total.toFixed(2) + ' in total' : ''));
}
