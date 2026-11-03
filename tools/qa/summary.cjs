// Group live-pass findings: node tools/qa/summary.cjs dist/qa/<site>/results.json [kind]
const r = require(require('path').resolve(process.argv[2]));
const only = process.argv[3];
const groups = {};
const add = (k, msg, x) => { const g = groups[k] = groups[k] || {}; const m = msg.replace(/\d+(\.\d+)?px/g, 'Npx').replace(/\[\-?\d+\.\.\d+\]/, '[..]').replace(/ \d+x\d+ /g, ' WxH ').replace(/\d+>\d+/g, 'a>b').replace(/natural \d+|file \d+w < \d+x\d/, 'up'); (g[m] = g[m] || new Set()).add(x.path + '@' + x.combo); };
for (const x of r) {
  if (x.fatal) add('fatal', x.fatal, x);
  if (x.status !== 200 && !/no-existe/.test(x.path)) add('status', String(x.status), x);
  if (x.sw > x.cw + 1) add('hscroll', (x.overflowCulprits || []).join(' | ') || 'sw ' + x.sw, x);
  for (const k of ['escape', 'overlap', 'clip', 'wordOverflow', 'junk', 'img', 'lowContrast', 'tapSmall', 'errs', 'failed']) for (const m of x[k] || []) add(k, m, x);
  if (x.smallTable) add('smallTable', x.smallTable.replace(/^\d+ /, ''), x);
  if (x.scroll) { if (x.scroll.header) add('header', x.scroll.header.replace(/\d+/g, 'N'), x); for (const m of x.scroll.covered) add('covered', m, x); for (const m of x.scroll.headerCovered) add('headerCovered', m, x); }
  if (x.menu) for (const m of x.menu.bad) add('menu', m, x);
  if (x.focus) for (const m of x.focus.bad) add('focus', m, x);
  if (x.tools) { for (const a of x.tools.bad) add('tools', a.c + ' ' + (a.v || '') + (a.junk ? ' JUNK ' + a.junk : '') + (a.ov ? ' OVERFLOW ' + a.ov : '') + (a.errs ? ' ERR ' + a.errs.join(';') : '') + (a.err ? ' ACTERR ' + a.err : '') + (a.nav ? ' NAV ' + a.nav : ''), x); if (x.tools.n && !x.tools.changed) add('toolsNoChange', 'controls ' + x.tools.n + ' but no text change', x); }
}
for (const [k, g] of Object.entries(groups)) {
  if (only && k !== only) continue;
  const n = Object.values(g).reduce((a, s) => a + s.size, 0);
  console.log('## ' + k + ' (' + Object.keys(g).length + ' kinds, ' + n + ' hits)');
  for (const [m, s] of Object.entries(g).sort((a, b) => b[1].size - a[1].size).slice(0, only ? 200 : 14)) { const a = [...s]; const paths = [...new Set(a.map(z => z.split('@')[0]))]; console.log('  ' + s.size + 'x ' + m.slice(0, 230) + '\n      ' + paths.slice(0, 6).join(' ') + (paths.length > 6 ? ' +' + (paths.length - 6) : '') + '  [' + [...new Set(a.map(z => z.split('@')[1]))].join(',') + ']'); }
}
