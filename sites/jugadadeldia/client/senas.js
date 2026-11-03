import { $, page } from './kit.js';

const D = page();
const box = $('[data-senas]');
const out = k => $('[data-o="' + k + '"]', box);
let ok = 0, n = 0, timer = null, cur = null, open = false;
const rand = k => crypto.getRandomValues(new Uint32Array(1))[0] % k;
function next() {
  clearTimeout(timer);
  const list = D.s;
  cur = list[rand(list.length)];
  const opts = [cur];
  while (opts.length < 4) { const x = list[rand(list.length)]; if (!opts.includes(x)) opts.push(x); }
  opts.sort(() => rand(3) - 1);
  out('face').innerHTML = cur.face;
  out('opts').innerHTML = opts.map(o => '<button type="button" class="jg-b s" data-a="' + o.id + '">' + o.what + '</button>').join('');
  out('res').textContent = '';
  open = true;
  timer = setTimeout(() => answer(null), 5000);
}
function answer(id) {
  if (!open) return;
  open = false;
  clearTimeout(timer);
  n++;
  const good = id === cur.id;
  if (good) ok++;
  out('ok').textContent = ok; out('n').textContent = n;
  out('res').className = 'jg-res ' + (good ? 'jg-ok' : 'jg-no');
  out('res').textContent = good ? '¡Bien!' : (id === null ? 'Se acabó el tiempo: ' : 'No: ') + 'era «' + cur.what + '».';
  setTimeout(next, 1200);
}
if (box && D.s) {
  $('[data-start]', box).addEventListener('click', e => { e.target.hidden = true; next(); });
  box.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) answer(b.dataset.a); });
}
