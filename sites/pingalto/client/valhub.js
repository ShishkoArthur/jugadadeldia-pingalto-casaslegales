import { $, $$, data, esc } from './kit.js';
import { feed, newer, isEn, fdate, dayOf, swap, swapAll, num } from './live.js';

const D = data(), box = $('#vh');
if (D && box) {
  feed(box, 'riot-val').then(doc => {
    if (!doc || !Array.isArray(doc.data.agents) || !newer(doc.data.v, D.v)) return;
    const V = doc.data, L = isEn() ? 'en' : 'es', day = fdate(dayOf(doc));
    const roles = V.roles.map(r => ({ id: r.id, name: r[L][0], n: V.agents.filter(x => x.roleId === r.id).length }));
    const pa = $('[data-vf="a"]');
    if (pa) { const t = pa.textContent, i = t.indexOf(':'); if (i > 0) pa.textContent = t.slice(0, i).replace(/\d+/, num(roles.length)) + ': ' + roles.map(r => r.name + ' ' + r.n).join(', ') + '.'; }
    const three = V.maps.filter(m => /A\/B\/C/.test(m.es[1])).length;
    for (const el of $$('[data-vf="m"]')) swap(el, [[num(D.m), num(V.maps.length)], [num(D.t), num(three)]]);
    const nw = V.agents[0], pn = $('[data-vf="nw"]');
    if (nw && pn && nw.id !== D.nw) {
      const s = nw[L], role = (V.roles.find(r => r.id === nw.roleId) || { [L]: [''] })[L][0];
      const a = pn.querySelector('a');
      pn.innerHTML = '<b>' + esc(s.name) + '</b>, ' + esc(role) + (nw.released ? ', llegó el ' + fdate(nw.released) : '') + '. ';
      if (a) { a.href = a.href.replace(/#.*$/, '') + '#' + nw.id; pn.appendChild(a); }
    }
    const ul = $('[data-o="maps"]');
    if (ul) {
      const have = new Map($$('li', ul).map(li => [li.querySelector('b').textContent, li]));
      for (const m of V.maps) {
        const [n, d] = m[L];
        if (have.has(n) || have.has(m.es[0])) continue;
        const li = document.createElement('li');
        li.innerHTML = '<b>' + esc(n) + '</b><span>' + esc(d) + '</span>';
        have.set(n, li);
      }
      [...have].sort((x, y) => x[0].localeCompare(y[0], 'es')).forEach(([, li]) => ul.appendChild(li));
    }
    swapAll('[data-rl]', [[D.v, V.v], [num(D.n), num(V.agents.length)], [fdate(D.md), day], [fdate(D.d), day], [fdate(D.vd), day]]);
  });
}
