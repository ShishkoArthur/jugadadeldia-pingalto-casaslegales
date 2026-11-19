import { $, data, out, fmt, fmtPct } from './kit.js';
import { feed, fdate, dayOf, swapAll } from './live.js';
import { stale } from './fdkit.js';

const D = data(), box = $('#fc');
if (D && box) {
  feed(box, 'steam').then(doc => {
    const A = doc && doc.data.apps && doc.data.apps.fc;
    if (!A || stale(doc, 96) || !A.short) return;
    swapAll('[data-fc]', [[D.short, A.short]]);
    if (A.free || !A.price || !Number.isInteger(A.price.cents)) return;
    const p = A.price, cur = p.cur === 'USD' ? 'US$ ' : p.cur === 'ARS' ? '$ ' : '';
    if (!cur) return;
    out('fcp', cur + fmt(p.cents / 100, 2));
    const t = $('[data-o="fct"]');
    if (t) {
      const rest = t.textContent.slice(t.textContent.indexOf('.') + 1);
      t.textContent = 'precio en Steam para Argentina, revisado el ' + fdate(dayOf(doc)) + (p.off > 0 ? ', con ' + fmtPct(p.off / 100, 0) + ' de descuento' : '') + '.' + rest;
    }
  });
}
