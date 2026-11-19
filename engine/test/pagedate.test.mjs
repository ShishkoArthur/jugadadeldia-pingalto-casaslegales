import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from '../../tools/env.mjs';
import { parseGitLog, gitDays, copyDays, citedUrls, citedDay, moduleOf, contentImports, pageDater, newest, urlKeys } from '../../tools/lib/pagedate.mjs';

test('git log: the first day a file appears is its last commit', () => {
  const out = '@2026-11-11\nsites/a/pages/x.mjs\n\n@2026-11-05\nsites/a/pages/x.mjs\nsites/a/content/c.mjs\n';
  assert.deepEqual(parseGitLog(out), { 'sites/a/pages/x.mjs': '2026-11-11', 'sites/a/content/c.mjs': '2026-11-05' });
  assert.deepEqual(parseGitLog(out.replace(/\n/g, '\r\n')), parseGitLog(out));
});

test('git days of the repo match git log -1 --format=%cs', () => {
  const f = 'tools/render.mjs';
  const want = execFileSync('git', ['log', '-1', '--format=%cs', '--', f], { cwd: process.env.PAGE_GIT_ROOT || ROOT, encoding: 'utf8' }).trim();
  assert.equal(gitDays(ROOT, ['tools'])[f], want);
  assert.match(want, /^\d{4}-\d{2}-\d{2}$/);
});

test('copy days: url and linkedFrom of saved documents, newest copy wins, slash and fragment ignored', () => {
  const m = copyDays([
    { docs: { a: { url: 'https://x.gob.ar/lista', fetched: '2026-11-01' }, b: { url: 'https://y.gob.ar/', linkedFrom: 'https://y.gob.ar/aviso', fetched: '2026-11-03' } } },
    { docs: { home: { url: 'https://x.gob.ar/lista/', date: '2026-11-04' } }, published: { url: 'https://z.gob.ar/', published: '2020-01-01' } },
    { url: 'mailto:a@b.c', fetched: '2026-11-09' },
  ]);
  assert.equal(m.get('https://x.gob.ar/lista'), '2026-11-04');
  assert.equal(m.get('https://y.gob.ar/aviso'), '2026-11-03');
  assert.equal(m.has('https://z.gob.ar/'), false);
  assert.equal(m.has('mailto:a@b.c'), false);
  assert.deepEqual(urlKeys('https://a.ar/p/#x'), ['https://a.ar/p/', 'https://a.ar/p']);
});

test('cited addresses: href and cite attributes, entities decoded, internal links skipped', () => {
  const html = '<a href="/interno/">x</a><a href="https://a.gob.ar/?p=1&amp;q=2">a</a><blockquote cite="https://b.gob.ar/doc">q</blockquote><img src="https://c.ar/i.png">';
  assert.deepEqual(citedUrls(html), ['https://a.gob.ar/?p=1&q=2', 'https://b.gob.ar/doc']);
  const days = copyDays([{ d: [{ url: 'https://a.gob.ar/?p=1&q=2', fetched: '2026-11-02' }, { url: 'https://b.gob.ar/doc/', fetched: '2026-11-06' }, { url: 'https://c.ar/i.png', fetched: '2026-11-09' }] }]);
  assert.equal(citedDay(html, days), '2026-11-06');
  assert.equal(citedDay('<p>sin fuentes</p>', days), null);
  assert.equal(newest(['2026-11-02', null, 'x', '2026-11-10']), '2026-11-10');
});

test('page date: newest of the module commit, its content imports and the cited copies; deterministic', () => {
  const root = mkdtempSync(join(tmpdir(), 'pagedate-'));
  try {
    const site = join(root, 'sites', 's');
    mkdirSync(join(site, 'pages'), { recursive: true });
    mkdirSync(join(site, 'content'), { recursive: true });
    const ra = h => '<p>A</p><a href="https://doc.gob.ar/a">fuente</a>';
    const rb = h => '<p>B</p>';
    writeFileSync(join(site, 'pages', 'a.mjs'), "import { T } from '../content/t.mjs';\nexport const a = { path: '/a/', render: " + ra.toString() + ' };\n');
    writeFileSync(join(site, 'pages', 'b.mjs'), 'export const b = { path: \'/b/\', render: ' + rb.toString() + ' };\n');
    writeFileSync(join(site, 'pages', 'index.mjs'), 'export const PAGES = [];\n');
    writeFileSync(join(site, 'content', 't.mjs'), 'export const T = 1;\n');
    const git = { 'sites/s/pages/a.mjs': '2026-11-03', 'sites/s/content/t.mjs': '2026-11-05', 'sites/s/pages/b.mjs': '2026-11-02', 'sites/s/pages/index.mjs': '2026-11-01' };
    const copies = copyDays([{ url: 'https://doc.gob.ar/a', fetched: '2026-11-04' }]);
    const date = pageDater({ root, siteDir: site, fallback: '2026-10-01', git, copies });
    const A = { path: '/a/', render: ra }, B = { path: '/b/', render: rb };
    assert.deepEqual(date.filesOf(A), ['sites/s/content/t.mjs', 'sites/s/pages/a.mjs']);
    assert.equal(date(A, A.render()), '2026-11-05');
    assert.equal(date(B, B.render()), '2026-11-02');
    const newer = copyDays([{ url: 'https://doc.gob.ar/a', fetched: '2026-11-09' }]);
    assert.equal(pageDater({ root, siteDir: site, fallback: '2026-10-01', git, copies: newer })(A, A.render()), '2026-11-09');
    const logs = [];
    const C = { path: '/c/', render: h => '<p>C ' + h + '</p>' };
    assert.equal(pageDater({ root, siteDir: site, fallback: '2026-10-01', git, copies, log: m => logs.push(m) })(C, ''), '2026-11-01');
    assert.match(logs[0], /no module holds the render function of \/c\//);
    assert.equal(pageDater({ root, siteDir: site, fallback: '2026-10-01', git: {}, copies })(B, ''), '2026-10-01');
    assert.equal(date(A, A.render()), date(A, A.render()));
    assert.deepEqual(moduleOf(Math.max, { x: 'function max() { [native code] }' }), []);
    assert.deepEqual(contentImports(join(site, 'pages', 'a.mjs'), "import x from '../content/t.mjs'; import y from './b.mjs'; import z from '../../../tools/env.mjs';", join(site, 'content')), [join(site, 'content', 't.mjs')]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
