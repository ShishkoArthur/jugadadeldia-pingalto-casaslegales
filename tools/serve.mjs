// Local preview of a built site, same lookup as the server's Caddy block: {path}, {path}.html, {path}/index.html, else 404.html.
// node tools/serve.mjs <site> [port]
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { ROOT } from './env.mjs';

const [site = 'casaslegales', port = '4310'] = process.argv.slice(2);
const DIST = join(ROOT, 'dist', site);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp' };
const isFile = f => existsSync(f) && statSync(f).isFile();
createServer((req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const tries = [p, p + '.html', join(p, 'index.html')].map(x => join(DIST, x));
  const f = tries.find(isFile);
  const file = f || join(DIST, '404.html');
  res.writeHead(f ? 200 : 404, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(+port, () => console.log('serving dist/' + site + ' on http://localhost:' + port));
