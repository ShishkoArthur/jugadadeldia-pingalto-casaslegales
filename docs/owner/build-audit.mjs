// Builds the owner's audit summary page and converts the three full audit reports (Markdown) to standalone HTML pages.
// node docs/owner/build-audit.mjs -> docs/owner/audit.html + docs/owner/audit-<site>.html
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');

function md2html(md) {
  const out = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      i--;
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const body = rows.filter(r => !/^\|\s*:?-{2,}/.test(r));
      out.push('<div class="tw"><table>' + body.map((r, k) => '<tr>' + cells(r).map(c => k ? `<td>${inline(c)}</td>` : `<th>${inline(c)}</th>`).join('') + '</tr>').join('') + '</table></div>');
      continue;
    }
    let m;
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) { out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
    if ((m = l.match(/^\s*[-*]\s+(.*)/))) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        let t = lines[i].replace(/^\s*[-*]\s+/, '');
        while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1]) && !/^\s*[-*]\s/.test(lines[i + 1])) t += ' ' + lines[++i].trim();
        items.push(t); i++;
      }
      i--; out.push('<ul>' + items.map(t => `<li>${inline(t)}</li>`).join('') + '</ul>'); continue;
    }
    if ((m = l.match(/^\s*\d+\.\s+(.*)/))) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        let t = lines[i].replace(/^\s*\d+\.\s+/, '');
        while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1]) && !/^\s*\d+\.\s/.test(lines[i + 1])) t += ' ' + lines[++i].trim();
        items.push(t); i++;
      }
      i--; out.push('<ol>' + items.map(t => `<li>${inline(t)}</li>`).join('') + '</ol>'); continue;
    }
    if (l.trim() === '') continue;
    let p = l;
    while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#|\||\s*[-*]\s|\s*\d+\.\s)/.test(lines[i + 1])) p += ' ' + lines[++i].trim();
    out.push(`<p>${inline(p)}</p>`);
  }
  return out.join('\n');
}

const CSS = `:root{--bg:#f7f6f2;--card:#fff;--ink:#1c1e23;--mute:#5b5f6b;--line:#dcdad3;--acc:#2f5bd3;--ok:#1f7a3c;--warn:#8a5a00;--bad:#b3261e;
--f:"Golos Text",system-ui,-apple-system,"Segoe UI",sans-serif;--m:ui-monospace,Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15171c;--card:#1d2027;--ink:#e8e7e3;--mute:#a4a8b3;--line:#333743;--acc:#8fb0ff;--ok:#6fd58f;--warn:#e5c24a;--bad:#ff8a80;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#15171c;--card:#1d2027;--ink:#e8e7e3;--mute:#a4a8b3;--line:#333743;--acc:#8fb0ff;--ok:#6fd58f;--warn:#e5c24a;--bad:#ff8a80;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font:400 16px/1.55 var(--f)}
.wrap{max-width:900px;margin:0 auto;padding-inline:16px;padding-block:24px 64px}
h1{font-size:clamp(24px,6vw,34px);line-height:1.15;margin:0 0 12px;text-wrap:balance}h2{font-size:21px;margin:30px 0 10px}h3{font-size:17px;margin:20px 0 8px}
p,li{max-width:70ch}a{color:var(--acc)}code{font:500 .86em var(--m);overflow-wrap:anywhere}
.tw{overflow-x:auto;margin:10px 0}table{border-collapse:collapse;font-size:14px;min-width:100%}th,td{border:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}th{background:var(--card)}
.card{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:14px 16px;margin:12px 0}
.lead{color:var(--mute)}.ok{color:var(--ok)}.warn{color:var(--warn)}.bad{color:var(--bad)}
.links{display:flex;flex-wrap:wrap;gap:10px}.links a{display:inline-block;padding:10px 14px;border:1px solid var(--acc);border-radius:6px;text-decoration:none;min-height:44px;box-sizing:border-box}`;

const page = (title, body) => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>${CSS}</style></head><body><main class="wrap">${body}</main></body></html>`;

for (const s of ['JUGADADELDIA', 'PINGALTO', 'CASASLEGALES']) {
  const md = readFileSync(join(ROOT, `docs/AUDIT-${s}-2026-11-04.md`), 'utf8');
  writeFileSync(join(ROOT, `docs/owner/audit-${s.toLowerCase()}.html`), page('Аудит ' + s.toLowerCase(), '<p><a href="audit.html">← Сводка</a></p>' + md2html(md)));
}
const summary = readFileSync(join(ROOT, 'docs/owner/audit-summary.md'), 'utf8');
writeFileSync(join(ROOT, 'docs/owner/audit.html'), `<title>Аудит трёх сайтов</title><style>${CSS}</style><main class="wrap">${md2html(summary)}
<div class="links"><a href="audit-jugadadeldia.html">Полный отчёт jugadadeldia</a><a href="audit-pingalto.html">Полный отчёт pingalto</a><a href="audit-casaslegales.html">Полный отчёт casaslegales</a></div></main>`);
console.log('audit pages built');
