import { feed, fdate, dayOf, swap, swapAll, num, isEn } from './live.js';
import { esc, fmt } from './kit.js';

export function vrsNewer(el, date) {
  return feed(el, 'vrs').then(doc => {
    const d = doc && doc.data;
    return d && Array.isArray(d.gl) && Array.isArray(d.am) && d.gl.length >= 10 && /^\d{4}-\d{2}-\d{2}$/.test(d.date || '') && d.date > date ? doc : null;
  });
}
export const top16 = d => d.gl.filter(r => r[1]).slice(0, 16).map(r => [r[1], r[0], r[3]]);
export function dates(doc, D, extra = []) {
  swapAll('[data-rl]', [[fdate(D.date), fdate(doc.data.date)], [fdate(D.copied), fdate(dayOf(doc))], ...extra]);
  const links = doc.data.links || {};
  for (const a of document.querySelectorAll('[data-rl] a[href*="counter-strike_regional_standings"]')) {
    const u = /americas/.test(a.getAttribute('href')) ? links.americas : links.global;
    if (u && /^https:\/\/github\.com\//.test(u)) a.href = u;
  }
}

export function cs2Live(box, D, done) {
  vrsNewer(box, D.date).then(doc => {
    if (!doc) return;
    const V = doc.data, gl = V.gl.map((r, i) => [i + 1, ...r]);
    const label = r => r[2] + ' · ' + (isEn() ? '#' + r[0] + ' in the world' : r[0] + '.º del mundo');
    for (const s of box.parentNode.querySelectorAll('select')) {
      const was = (D.gl[Number(s.value) - 1] || [])[2], keep = was && gl.find(r => r[2] === was);
      s.innerHTML = gl.filter(r => r[2]).map(r => '<option value="' + r[0] + '">' + esc(label(r)) + '</option>').join('');
      if (keep) s.value = String(keep[0]);
    }
    const c = document.querySelector('[data-vc]');
    if (c) {
      const top = gl.slice(0, 40), hi = gl[0][1], old = D.gl.slice(0, 40);
      const bars = c.querySelector('.pa-chart');
      if (bars) bars.innerHTML = top.map(r => '<i' + (r[4] ? ' class="pa-m"' : '') + ' style="height:' + Math.round(((r[1] - 1000) / (hi - 1000)) * 100) + '%" title="' + esc(r[2] || '-') + ' ' + fmt(r[1], 0) + '"></i>').join('');
      swap(c, [[fmt(old[0][1], 0), fmt(hi, 0)], [fmt(old[old.length - 1][1], 0), fmt(top[top.length - 1][1], 0)], [num(old.filter(r => r[4]).length), num(top.filter(r => r[4]).length)]]);
    }
    swapAll('[data-rg]', [[num(D.am.length), num(V.am.length)], [num(D.gl.length), num(V.gl.length)]]);
    dates(doc, D, [[num(D.gl.length), num(V.gl.length)]]);
    D.date = V.date;
    done(V);
  });
}
