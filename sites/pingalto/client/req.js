import { $, $$, data, out, num, fmt } from './kit.js';

const D = data();
const f = $('#pa-rq');
if (D && D.req && f) {
  const R = D.req;
  const mark = (k, st) => {
    const li = $('[data-rq="' + k + '"]');
    if (!li) return;
    li.dataset.st = st;
    li.querySelector('b').textContent = st === 'ok' ? 'Sí' : st === 'no' ? 'No' : '?';
  };
  const run = () => {
    const os = $('#rq-os').value, cpu = Number($('#rq-cpu').value), ram = Number($('#rq-ram').value), gpu = Number($('#rq-gpu').value), disk = num($('#rq-disk')), net = num($('#rq-net'));
    const st = {
      os: os === 'win' || os === 'linux' ? 'ok' : 'no',
      cpu: cpu === 0 ? 'q' : cpu >= R.threads ? 'ok' : 'no',
      ram: ram >= R.ram ? 'ok' : 'no',
      gpu: gpu === 0 ? 'q' : gpu >= R.vram ? 'ok' : 'no',
      disk: !(disk >= 0) ? 'q' : disk >= R.disk ? 'ok' : 'no',
    };
    Object.entries(st).forEach(([k, v]) => mark(k, v));
    const no = Object.keys(st).filter(k => st[k] === 'no'), q = Object.keys(st).filter(k => st[k] === 'q');
    const and = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1] : a.join('');
    const name = { os: 'el sistema', cpu: 'el procesador', ram: 'la RAM', gpu: 'la placa de video', disk: 'el disco' };
    if (no.length) {
      out('rq', 'No llega');
      let say = 'Te falta en ' + and(no.map(k => name[k])) + '.';
      if (st.os === 'no') say += os === 'mac' ? ' CS2 no tiene versión para Mac.' : ' Steam pide Windows 10 o más nuevo.';
      if (st.disk === 'no') say += ' Liberá ' + fmt(R.disk - disk, 0) + ' GB.';
      out('rqsay', say);
    } else if (q.length) {
      out('rq', 'Casi seguro');
      out('rqsay', 'Lo demás llega. Fijate ' + and(q.map(k => name[k])) + ' para estar seguro.');
    } else {
      out('rq', 'Sí, llega');
      out('rqsay', 'Llegar al mínimo quiere decir que el juego arranca; para jugar fluido conviene tener más.');
    }
    if (net > 0) {
      const hrs = (R.disk * 8000) / net / 3600;
      out('dl', hrs < 1 ? fmt(hrs * 60, 0) + ' <small>minutos</small>' : fmt(hrs, 1) + ' <small>horas</small>');
      out('dlsay', 'A ' + fmt(net, net < 10 ? 1 : 0) + ' Mbps, si la conexión va todo el tiempo a esa velocidad.');
    } else {
      out('dl', '-');
      out('dlsay', 'Poné la velocidad de tu internet en Mbps.');
    }
  };
  f.addEventListener('input', run);
  f.addEventListener('change', run);
  f.addEventListener('submit', e => e.preventDefault());
  run();
}
