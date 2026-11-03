import { $, $$, page, store } from './kit.js';

const D = page();
const form = $('[data-sorteo]');
const two = n => String(n).padStart(2, '0');

function readBalls(box) {
  return $$('input', box).map(i => i.value.trim()).filter(Boolean).map(v => (/^\d+$/.test(v) ? +v : NaN));
}
function readMany(area, four) {
  const raw = (area.value.match(/\d+/g) || []).map(Number);
  return four ? raw.map(x => x % 100) : raw;
}
function line(el, cls, text) {
  el.className = 'jg-res ' + cls;
  el.textContent = text;
}
function check(e) {
  if (e) e.preventDefault();
  const sum = $('[data-sum]', form);
  sum.textContent = '';
  const mine = readBalls($('[data-balls="mine"]', form));
  const bad = mine.some(x => Number.isNaN(x) || x < D.min || x > D.max);
  if (mine.length !== D.pick || bad || new Set(mine).size !== mine.length) {
    sum.className = 'jg-sum jg-no';
    sum.textContent = 'Tu jugada tiene que tener ' + D.pick + ' números distintos, del ' + two(D.min) + ' al ' + two(D.max) + '.';
    return;
  }
  store.set('jg-boleta-' + D.game, mine.join(','));
  const mineSet = new Set(mine);
  const results = {};
  let any = false, anyWin = false;
  for (const s of D.sets) {
    const res = $('[data-res="' + s.id + '"]', form);
    const area = $('[data-many="' + s.id + '"]', form);
    const drawn = area ? readMany(area, s.four) : readBalls($('[data-balls="' + s.id + '"]', form));
    if (!drawn.length) { line(res, '', ''); continue; }
    const need = s.four ? s.drawn : s.drawn;
    if (drawn.length !== need || drawn.some(x => Number.isNaN(x) || x < D.min || x > D.max) || (!s.four && new Set(drawn).size !== drawn.length)) {
      line(res, 'jg-no', 'Faltan números o hay alguno repetido o fuera de rango: tienen que ser ' + need + '.');
      continue;
    }
    any = true;
    const hits = [...new Set(drawn)].filter(x => mineSet.has(x)).length;
    results[s.id] = { hits, drawn };
    let verdict;
    if (s.win === 'most') verdict = hits + (hits === 1 ? ' acierto' : ' aciertos') + '. Acá gana quien tenga más aciertos: depende de las otras boletas.';
    else if (s.win.includes(hits)) { anyWin = true; verdict = hits + ' aciertos: ¡esta categoría tiene premio! Confirmalo con el extracto oficial.'; }
    else verdict = hits + (hits === 1 ? ' acierto' : ' aciertos') + ': sin premio en esta modalidad.';
    line(res, s.win !== 'most' && s.win.includes(hits) ? 'jg-ok' : '', verdict);
  }
  if (D.extra === 'quini6' && results.tr && results.se && results.re) {
    const union = new Set([...results.tr.drawn, ...results.se.drawn, ...results.re.drawn]);
    const inUnion = mine.filter(x => union.has(x)).length;
    const six = [results.tr, results.se, results.re].some(r => r.hits === 6);
    const p = document.createElement('p');
    p.className = inUnion === 6 && !six ? 'jg-ok' : '';
    p.textContent = 'Premio Extra: ' + inUnion + ' de tus 6 números están entre los ' + union.size + ' que salieron en Tradicional, La Segunda y Revancha.' + (inUnion === 6 && !six ? ' Entrás en el Premio Extra.' : '');
    sum.append(p);
  }
  if (D.extra === 'loto') {
    const pl = form.elements.plus.value.trim(), po = form.elements.plusOut.value.trim();
    const six = ['tr', 'ma', 'de'].some(k => results[k] && results[k].hits === 6);
    if (pl !== '' && po !== '') {
      const p = document.createElement('p');
      p.className = six && pl === po ? 'jg-ok' : '';
      p.textContent = pl === po ? (six ? 'Número Plus acertado y 6 aciertos: entrás en el Multiplicador.' : 'Acertaste el número Plus, pero el Multiplicador pide además 6 aciertos.') : 'El número Plus no coincide.';
      sum.append(p);
    }
  }
  if (!any) { sum.className = 'jg-sum'; sum.textContent = 'Cargá los números que salieron en al menos una modalidad.'; return; }
  sum.className = 'jg-sum';
  const p = document.createElement('p');
  p.className = 'jg-note';
  p.textContent = anyWin ? 'El premio en pesos lo publica la lotería con el extracto: depende de cuántos ganadores hubo.' : 'Controlado. Recordá que cada sorteo es independiente: los números de hoy no cambian la chance del próximo.';
  sum.append(p);
}
if (form) {
  const saved = store.get('jg-boleta-' + D.game);
  if (saved) $$('input', $('[data-balls="mine"]', form)).forEach((el, i) => { const v = saved.split(',')[i]; if (v !== undefined) el.value = D.max > 9 ? two(v) : v; });
  form.addEventListener('submit', check);
  form.addEventListener('reset', () => { store.del('jg-boleta-' + D.game); setTimeout(() => { $$('.jg-res', form).forEach(r => { r.textContent = ''; }); $('[data-sum]', form).textContent = ''; }, 0); });
  form.addEventListener('input', e => {
    const el = e.target;
    if (el.closest('[data-balls]') && el.value.length >= el.maxLength) {
      const next = el.nextElementSibling;
      if (next && next.tagName === 'INPUT') next.focus();
    }
  });
}
