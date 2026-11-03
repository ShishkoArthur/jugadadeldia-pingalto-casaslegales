import { gbPerHour, hoursFromPlan, gbForPlay } from '../../../engine/games/stream.mjs';
import { $, data, out, num, params, setParams, share, fmt, fmtInput, parseNum } from './kit.js';

const D = data();
const f = $('#pa-nb');
if (D && f) {
  const s = $('#nb-s'), hh = $('#nb-h'), d = $('#nb-d'), p = $('#nb-p');
  const q = params();
  if (D.speeds.includes(Number(q.get('s')))) s.value = q.get('s');
  if (q.get('d') && Number(q.get('d')) >= 1 && Number(q.get('d')) <= 7) d.value = q.get('d');
  const qh = parseNum(q.get('h')), qp = parseNum(q.get('p'), { whole: true });
  if (qh > 0) hh.value = fmtInput(qh, 2);
  if (qp >= 0) p.value = fmtInput(qp, 0);
  const run = (push = true) => {
    const mbps = Number(s.value), hours = num(hh), days = Number(d.value), plan = num(p);
    out('per', fmt(gbPerHour(mbps), 1) + ' <small>GB</small>');
    out('copied', '');
    if (!(hours > 0 && hours <= 24) || !(plan >= 0)) { out('say', 'Poné las horas por día (más de 0 y hasta 24) y los GB de tu plan.'); return; }
    const month = gbForPlay({ hoursPerDay: hours, daysPerWeek: days, mbps }), last = hoursFromPlan({ gb: plan, mbps });
    out('say', 'Jugando ' + fmt(hours, 1) + ' horas ' + days + (days === 1 ? ' día' : ' días') + ' por semana son unos <b>' + fmt(month, 0) + ' GB por mes</b>. Con ' + fmt(plan, 0) + ' GB te alcanzan <b>' + fmt(last, 1) + ' horas</b>.');
    const share100 = Math.min(100, (plan / month) * 100);
    const bar = out('bar', '<i></i><span>' + fmt(share100, 0) + ' % del mes</span>');
    if (bar) bar.style.setProperty('--v', share100.toFixed(1));
    if (push) setParams({ s: mbps, h: hours, d: days, p: plan });
  };
  f.addEventListener('input', () => run());
  f.addEventListener('change', () => run());
  f.addEventListener('submit', e => e.preventDefault());
  share();
  run(false);
}
