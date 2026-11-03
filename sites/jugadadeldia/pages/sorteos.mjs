// Draw games: Quini 6, Loto Plus, Brinco, Telekino, Poceada de la Ciudad, Quiniela Plus. Odds from engine/lottery/games.mjs
// (exact hypergeometric counts), prize shares from the cited regulations, and a manual checker (client/sorteo.js): the
// visitor types the numbers of the draw - the site does not fetch or show results.
import { odds, prizeShare, quini6PremioExtra, lotoPlusMultiplicador, quinielaPlusOdds } from '../../../engine/lottery/games.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';
import { hero, cite, crumbs, webPage, fmt, oneIn, money } from './parts.mjs';

const n = q => toNumber(q);
const two = x => String(x).padStart(2, '0');

function oddsTable(o, { prizeLabel = r => (r.prize ? 'premio' : ''), only } = {}) {
  const rows = o.rows.filter(r => r.oneIn !== null && (!only || only(r)));
  const max = Math.log10(Math.max(...rows.map(r => r.oneIn)));
  return '<div class="jg-tw"><table class="jg-tbl jg-od" data-nosnippet><thead><tr><th>Aciertos</th><th class="n">Chance por jugada</th><th>Qué tan difícil</th><th></th></tr></thead><tbody>' +
    rows.map(r => '<tr' + (r.prize ? ' class="on"' : '') + '><td>' + r.hits + '</td><td class="n">' + oneIn(r.oneIn) + '</td><td><span class="jg-bar"><i style="width:' + Math.max(3, Math.round(100 * Math.log10(r.oneIn) / max)) + '%"></i></span></td><td>' + prizeLabel(r) + '</td></tr>').join('') + '</tbody></table></div>';
}
const shareCard = (title, per100, srcIds, h, note = '') => '<section class="jg-c"><span class="jg-sm">De cada $ 100</span><h2>' + title + '</h2><p class="jg-win"><span>Van a premios</span><b>' + money(per100) + '</b></p>' +
  '<div class="jg-ret" aria-hidden="true"><div><span>Pagás</span><i style="--w:100%"></i><b>$ 100</b></div><div><span>A premios</span><i style="--w:' + Math.round(per100) + '%"></i><b>' + money(per100) + '</b></div></div>' +
  '<p class="jg-hon">El resto se va en comisiones, fondos de reserva y lo que se queda la lotería, según el reglamento.' + note + '</p>' + cite(h, srcIds) + '</section>';

function checker(h, { game, title, pick, min, max, sets, plus, notes = '' }) {
  const balls = (name, k, cls = '') => '<div class="jg-six jg-n' + k + cls + '" data-balls="' + name + '">' + Array.from({ length: k }, (_, i) => '<input type="text" inputmode="numeric" maxlength="' + String(max).length + '" autocomplete="off" aria-label="' + (name === 'mine' ? 'Tu número ' : 'Número sorteado ') + (i + 1) + '">').join('') + '</div>';
  const setHtml = s => '<fieldset class="jg-fl jg-set" data-set="' + s.id + '"><legend>' + s.name + '</legend>' + (s.drawn > 15 ? '<textarea class="jg-in jg-ta" rows="3" inputmode="numeric" data-many="' + s.id + '" placeholder="Pegá o escribí los ' + s.drawn + ' números, separados por espacios"></textarea>' : balls(s.id, s.drawn)) + '<p class="jg-res" data-res="' + s.id + '"></p></fieldset>';
  return '<section class="jg-c w3 jg-chk" id="controlar"><span class="jg-tag">Control manual</span><h2>' + title + '</h2>' +
    '<p class="jg-mu">Cargá tu jugada y los números que salieron (los copiás del extracto oficial). Comparamos acá, en tu teléfono: tus números no se mandan a ningún lado.</p>' +
    '<form class="jg-f" data-sorteo="' + game + '"><fieldset class="jg-fl"><legend>Tu jugada (' + pick + ' números del ' + two(min) + ' al ' + two(max) + ')</legend>' + balls('mine', pick, ' jg-mine') + '</fieldset>' +
    (plus ? '<label class="jg-fl jg-plus"><span>Tu número Plus (0 a 9)</span><input class="jg-in" name="plus" type="text" inputmode="numeric" maxlength="1" autocomplete="off"></label>' : '') +
    sets.map(setHtml).join('') + (plus ? '<label class="jg-fl jg-plus"><span>Número Plus que salió</span><input class="jg-in" name="plusOut" type="text" inputmode="numeric" maxlength="1" autocomplete="off"></label>' : '') +
    '<div class="jg-r"><button class="jg-b p" type="submit">Controlar</button><button class="jg-b s" type="reset">Borrar todo</button></div><div class="jg-sum" data-sum aria-live="polite"></div></form>' + notes + '</section>';
}

const q6 = () => odds('cas-quini6-tradicional');
export const quini6 = {
  path: '/quini-6/', kind: 'lottery', section: 'loterias', js: ['sorteo.js'],
  title: 'Quini 6: chances de cada modalidad y control de tu boleta',
  h1: 'Quini 6: chances y control de tu boleta',
  description: 'El Quini 6 modalidad por modalidad: Tradicional, La Segunda, Revancha, Siempre Sale y Premio Extra, la chance exacta de cada premio y tu boleta.',
  ld: h => [webPage(h), crumbs(h, [])],
  data: () => ({ game: 'quini6', min: 0, max: 45, pick: 6, sets: [{ id: 'tr', name: 'Tradicional', drawn: 6, win: [6, 5, 4] }, { id: 'se', name: 'La Segunda', drawn: 6, win: [6, 5, 4] }, { id: 're', name: 'Revancha', drawn: 6, win: [6] }, { id: 'ss', name: 'Siempre Sale', drawn: 6, win: 'most' }], extra: 'quini6' }),
  render(h) {
    const o = q6(), ex = quini6PremioExtra();
    const mod = (name, sub, body, c) => '<article class="jg-c jg-mod"><i class="jg-ba ' + c + '" aria-hidden="true">6</i><h3>' + name + '</h3><p class="jg-mu">' + sub + '</p>' + body + '</article>';
    const rowsWin = o.rows.filter(r => r.prize).map(r => '<li><b>' + r.hits + ' aciertos</b> ' + oneIn(r.oneIn) + '</li>').join('');
    return hero(h, { kicker: 'Quini 6 · Lotería de Santa Fe', scene: 'quini-6', lede: 'Elegís ' + o.pick + ' números del 00 al ' + two(o.pool - 1) + ' y jugás varios sorteos con la misma boleta. Acá está la chance exacta de cada premio, calculada sobre las ' + fmt(Number(o.combinations), 0) + ' combinaciones posibles.', actions: '<a class="jg-b p" href="#controlar">Controlar mi boleta</a>' }) +
      '<div class="jg-mn jg-mods">' +
      mod('Tradicional', 'Primer Sorteo, 6 números', '<ul class="jg-ul">' + rowsWin + '</ul>', '') +
      mod('La Segunda', 'Otro sorteo con la misma boleta', '<ul class="jg-ul">' + rowsWin + '</ul><p class="jg-note">Con los dos sorteos, la chance de algún premio es ' + oneIn(o.oneInAnyPrizeTicket) + ' (en uno solo, ' + oneIn(o.oneInAnyPrize) + ').</p>', 'c2') +
      mod('Revancha', 'Solo paga con 6 aciertos', '<ul class="jg-ul"><li><b>6 aciertos</b> ' + oneIn(o.rows[0].oneIn) + '</li></ul>', 'c3') +
      mod('Siempre Sale', 'Gana quien tenga más aciertos', '<p>Si nadie hace 6, cobran los de 5; si no, los de 4, y así. La chance depende de cuántas boletas se vendan: no se puede calcular de antemano.</p>', 'c4') +
      mod('Premio Extra', '6 aciertos entre los 18 números', '<p>Se juntan los números de Tradicional, La Segunda y Revancha. Chance: <b>' + oneIn(ex.oneIn) + '</b>, sin contar a quien ya hizo 6 en un sorteo.</p>', 'c5') +
      '<section class="jg-c w3"><span class="jg-sm">Por cantidad de aciertos</span><h2>Chance en un sorteo de 6 números</h2>' + oddsTable(o) +
      '<p class="jg-hon">Para tener una chance pareja de sacar los 6 en un sorteo harían falta unas <b>' + fmt(Math.ceil(Math.log(0.5) / Math.log(1 - 1 / o.rows[0].oneIn)), 0) + '</b> jugadas distintas.</p></section>' +
      shareCard('Tradicional', n(prizeShare('cas-quini6-tradicional').per100), ['cas.quini6.nominal', 'cas.quini6.half', 'cas.quini6.pool', 'cas.quini6.split'], h, ' Cada sorteo (Primer Sorteo y La Segunda) tiene su propio pozo.') +
      shareCard('Revancha', n(prizeShare('cas-quini6-revancha').per100), ['cas.revancha.nominal', 'cas.revancha.pool', 'cas.revancha.share'], h) +
      shareCard('Siempre Sale', n(prizeShare('cas-quini6-siempresale').per100), ['cas.siempresale.nominal', 'cas.siempresale.pool', 'cas.siempresale.share'], h) +
      checker(h, { game: 'quini6', title: 'Controlá tu boleta', pick: 6, min: 0, max: 45, sets: [{ id: 'tr', name: 'Tradicional', drawn: 6 }, { id: 'se', name: 'La Segunda', drawn: 6 }, { id: 're', name: 'Revancha', drawn: 6 }, { id: 'ss', name: 'Siempre Sale', drawn: 6 }], notes: cite(h, ['cas.quini6.max', 'cas.quini6.tradicional-draws', 'cas.quini6.tiers', 'cas.revancha.six-only', 'cas.siempresale.rule', 'cas.extra.rule', 'cas.quini6.four-min'], 'Las reglas, del reglamento') }) +
      '</div>';
  },
};

export const lotoPlus = {
  path: '/loto-plus/', kind: 'lottery', section: 'loterias', js: ['sorteo.js'],
  title: 'Loto Plus: modalidades, número Plus y chances',
  h1: 'Loto Plus: modalidades y chances',
  description: 'Loto Plus: Tradicional, Match, Desquite, Sale o Sale y el Multiplicador con el número Plus, la chance de cada premio y el control de tu jugada.',
  ld: h => [webPage(h), crumbs(h, [])],
  data: () => ({ game: 'loto', min: 0, max: 45, pick: 6, sets: [{ id: 'tr', name: 'Tradicional', drawn: 6, win: [6, 5, 4] }, { id: 'ma', name: 'Match', drawn: 6, win: [6, 5, 4] }, { id: 'de', name: 'Desquite', drawn: 6, win: [6] }, { id: 'so', name: 'Sale o Sale', drawn: 6, win: 'most' }], extra: 'loto' }),
  render(h) {
    const o = odds('lotba-loto-plus-tradicional'), m = lotoPlusMultiplicador();
    const tiers = '<ul class="jg-ul">' + o.rows.filter(r => r.prize).map(r => '<li><b>' + r.hits + ' aciertos</b> ' + oneIn(r.oneIn) + '</li>').join('') + '</ul>';
    const plusDial = '<div class="jg-dial" aria-hidden="true">' + Array.from({ length: 10 }, (_, i) => '<i class="jg-ba' + (i === 7 ? ' c4' : ' c2') + '">' + i + '</i>').join('') + '</div>';
    return hero(h, { kicker: 'Loto Plus · Lotería de la Ciudad', scene: 'loto-plus', lede: o.pick + ' números del 00 al ' + two(o.pool - 1) + ' y un número Plus del 0 al ' + (m.pPlus.d - 1n) + '. Cada modalidad tiene su propio sorteo y sus propios premios.', actions: '<a class="jg-b p" href="#controlar">Controlar mi jugada</a>' }) +
      '<div class="jg-mn">' +
      '<article class="jg-c"><span class="jg-sm">Tradicional y Match</span><h2>6, 5 o 4 aciertos</h2>' + tiers + '<p class="jg-note">Cada una con su sorteo de 6 números.</p></article>' +
      '<article class="jg-c"><span class="jg-sm">Desquite</span><h2>Solo los 6</h2><p class="jg-win"><span>Chance</span><b>' + oneIn(o.rows[0].oneIn) + '</b></p></article>' +
      '<article class="jg-c"><span class="jg-sm">Sale o Sale</span><h2>Gana quien más acierta</h2><p>Si nadie hace 6, cobran los de 5; si no, los de 4. Depende de las boletas vendidas, así que no tiene una chance fija.</p></article>' +
      '<section class="jg-c w2"><span class="jg-sm">Multiplicador</span><h2>El número Plus</h2>' + plusDial + '<p>Si hacés 6 aciertos en Tradicional, Match o Desquite <b>y</b> acertás el número Plus, cobrás ' + m.extraTimes + ' veces ese premio. Chance de que pase: <b>' + oneIn(m.oneIn) + '</b>.</p>' + cite(h, ['lotba.loto.plus-universe', 'lotba.loto.multiplicador-rule', 'lotba.loto.multiplicador-pay']) + '</section>' +
      shareCard('Loto Plus', n(prizeShare('lotba-loto-plus').per100), ['lotba.loto.fund', 'lotba.loto.modality-share', 'lotba.loto.tradicional-split', 'lotba.loto.match-split', 'lotba.loto.desquite-split', 'lotba.loto.saleosale-split', 'lotba.loto.multiplicador-fund'], h, ' La parte del Multiplicador va al fondo de reserva, por eso no cuenta.') +
      '<section class="jg-c w3"><span class="jg-sm">Por aciertos</span><h2>Chance en un sorteo de 6 números</h2>' + oddsTable(o) + '<p class="jg-note">Según el programa oficial de noviembre de 2026, la jugada cuesta ' + money(h.src.value('lotba.loto.price')) + '.</p>' + cite(h, ['lotba.loto.price', 'lotba.loto.universe', 'lotba.loto.draws']) + '</section>' +
      checker(h, { game: 'loto', title: 'Controlá tu jugada', pick: 6, min: 0, max: 45, plus: true, sets: [{ id: 'tr', name: 'Tradicional', drawn: 6 }, { id: 'ma', name: 'Match', drawn: 6 }, { id: 'de', name: 'Desquite', drawn: 6 }, { id: 'so', name: 'Sale o Sale', drawn: 6 }], notes: cite(h, ['lotba.loto.tradicional-split', 'lotba.loto.desquite-split', 'lotba.loto.saleosale-rule'], 'Las reglas, del reglamento') }) +
      '</div>';
  },
};

export const brinco = {
  path: '/brinco/', kind: 'lottery', section: 'loterias', js: ['sorteo.js'],
  title: 'Brinco: chances por aciertos y control de tu jugada',
  h1: 'Brinco: chances y control',
  description: 'Brinco: seis números del 00 al 39, premios de 6 a 3 aciertos con su chance exacta, la comparación con el Quini 6 y el control de tu jugada con el extracto.',
  ld: h => [webPage(h), crumbs(h, [])],
  data: () => ({ game: 'brinco', min: 0, max: 39, pick: 6, sets: [{ id: 'br', name: 'Sorteo del Brinco', drawn: 6, win: [6, 5, 4, 3] }] }),
  render(h) {
    const b = odds('cas-brinco'), q = q6();
    const ratio = Number(q.combinations) / Number(b.combinations);
    return hero(h, { kicker: 'Brinco · Lotería de Santa Fe', scene: 'brinco', lede: 'Como el Quini 6, pero con ' + b.pool + ' números en vez de ' + q.pool + '. Parece poco, y cambia mucho la chance.', actions: '<a class="jg-b p" href="#controlar">Controlar mi jugada</a>' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w2"><span class="jg-sm">Brinco contra Quini 6</span><h2>Los 6 aciertos</h2><div class="jg-vs"><div><b>' + oneIn(b.rows[0].oneIn) + '</b><span class="jg-bar"><i style="width:' + Math.round(100 / ratio) + '%"></i></span><small>Brinco, ' + b.pool + ' números</small></div><div><b>' + oneIn(q.rows[0].oneIn) + '</b><span class="jg-bar"><i style="width:100%"></i></span><small>Quini 6, ' + q.pool + ' números</small></div></div>' +
      '<p class="jg-hon">Sacar los 6 en el Brinco es unas <b>' + fmt(ratio, 1) + '</b> veces más fácil que en un sorteo del Quini 6. Y con 3 aciertos ya recuperás lo que pagaste.</p></section>' +
      shareCard('Brinco', n(prizeShare('cas-brinco').per100), ['cas.brinco.nominal', 'cas.brinco.pool', 'cas.brinco.split'], h) +
      '<section class="jg-c w3"><span class="jg-sm">Por aciertos</span><h2>Chance en el sorteo</h2>' + oddsTable(b, { prizeLabel: r => (r.hits === 3 ? 'te devuelven la jugada' : r.prize ? 'premio' : '') }) + cite(h, ['cas.brinco.universe', 'cas.brinco.draw', 'cas.brinco.three-price']) + '</section>' +
      checker(h, { game: 'brinco', title: 'Controlá tu jugada', pick: 6, min: 0, max: 39, sets: [{ id: 'br', name: 'Números del sorteo', drawn: 6 }] }) + '</div>';
  },
};

export const telekino = {
  path: '/telekino/', kind: 'lottery', section: 'loterias', js: ['sorteo.js'],
  title: 'Telekino: premios de 15 a 11 aciertos y chances',
  h1: 'Telekino: premios y chances',
  description: 'Telekino: tu cartón tiene 15 números del 1 al 25 y salen 15. La chance exacta de 15 a 11 aciertos, el Rekino y el control de tu cartón con el sorteo.',
  ld: h => [webPage(h), crumbs(h, [])],
  data: () => ({ game: 'telekino', min: 1, max: 25, pick: 15, sets: [{ id: 'tk', name: 'Telekino', drawn: 15, win: [15, 14, 13, 12, 11] }, { id: 'rk', name: 'Rekino', drawn: 15, win: 'most' }] }),
  render(h) {
    const o = odds('pba-telekino');
    const board = '<div class="jg-board b5" aria-hidden="true">' + Array.from({ length: 25 }, (_, i) => '<i' + ([1, 3, 4, 6, 8, 9, 11, 12, 14, 15, 17, 19, 21, 22, 24].includes(i + 1) ? ' class="on"' : '') + '>' + (i + 1) + '</i>').join('') + '</div>';
    return hero(h, { kicker: 'Telekino · Lotería de la Provincia', scene: 'telekino', lede: 'Un bingo televisado: tu cartón trae ' + o.pick + ' de los ' + o.pool + ' números, y del bolillero salen ' + o.drawn + '. Con ' + Math.min(...o.rows.filter(r => r.prize).map(r => r.hits)) + ' aciertos o más hay premio.', actions: '<a class="jg-b p" href="#controlar">Controlar mi cartón</a>' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c"><span class="jg-sm">Un cartón de ejemplo</span><h2>' + o.pick + ' de ' + o.pool + '</h2>' + board + '<p class="jg-note">Cada cartón ya viene con sus 15 números.</p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Por aciertos</span><h2>Chance de cada categoría</h2>' + oddsTable(o, { only: r => r.hits >= 8 }) + '<p class="jg-hon">Chance de cobrar algo (11 aciertos o más): <b>' + oneIn(o.oneInAnyPrize) + '</b>. Con 10 o menos no hay premio.</p></section>' +
      shareCard('Telekino', n(prizeShare('pba-telekino').per100), ['pba.telekino.fund', 'pba.telekino.split'], h, ' Incluye los premios en especie del primer premio.') +
      '<section class="jg-c w2"><span class="jg-sm">Rekino</span><h2>15 bolillas nuevas</h2><p>Después del sorteo principal salen otras 15 bolillas y gana el cartón con más aciertos. Como depende de los cartones vendidos, no tiene una chance fija.</p>' + cite(h, ['pba.telekino.universe', 'pba.telekino.drawn', 'pba.telekino.ticket', 'pba.telekino.lowest', 'pba.telekino.none-below', 'pba.telekino.rekino', 'pba.telekino.operator']) + '</section>' +
      checker(h, { game: 'telekino', title: 'Controlá tu cartón', pick: 15, min: 1, max: 25, sets: [{ id: 'tk', name: 'Sorteo Telekino', drawn: 15 }, { id: 'rk', name: 'Rekino', drawn: 15 }] }) + '</div>';
  },
};

export const poceada = {
  path: '/poceada/', kind: 'lottery', section: 'loterias', js: ['sorteo.js'],
  title: 'Poceada de la Ciudad: cómo funciona y qué chance tiene',
  h1: 'La Poceada',
  description: 'Cómo funciona la Poceada de la Ciudad: 8 números del 00 al 99 contra 20 sorteados. La chance exacta de 8, 7, 6 o 5 aciertos y el control de tu jugada.',
  ld: h => [webPage(h), crumbs(h, [])],
  data: () => ({ game: 'poceada', min: 0, max: 99, pick: 8, sets: [{ id: 'pc', name: 'Los 20 números', drawn: 20, win: [8, 7, 6, 5] }] }),
  render(h) {
    const o = odds('lotba-poceada');
    const board = '<div class="jg-board b10" aria-hidden="true">' + Array.from({ length: 100 }, (_, i) => '<i' + ([3, 7, 12, 18, 22, 27, 31, 38, 41, 46, 50, 55, 61, 64, 70, 77, 83, 88, 92, 96].includes(i) ? ' class="on"' : [7, 18, 33, 46, 59, 70, 84, 99].includes(i) ? ' class="me"' : '') + '></i>').join('') + '</div>';
    return hero(h, { kicker: 'Poceada · Lotería de la Ciudad', scene: 'poceada', lede: 'Elegís ' + o.pick + ' números de dos cifras. Se toman ' + o.drawn + ' números distintos del sorteo: si acertás los ' + o.pick + ' te llevás el pozo grande.', actions: '<a class="jg-b p" href="#controlar">Controlar mi jugada</a>' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c"><span class="jg-sm">Del 00 al 99</span><h2>Tus ' + o.pick + ' contra ' + o.drawn + '</h2>' + board + '<p class="jg-note"><span class="jg-key on"></span> salieron · <span class="jg-key me"></span> tus números (ejemplo)</p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Por aciertos</span><h2>Chance de cada premio</h2>' + oddsTable(o, { prizeLabel: r => (r.hits === 5 ? 'te devuelven la jugada' : r.prize ? 'premio' : '') }) + '<p class="jg-hon">Hay ' + fmt(Number(o.combinations), 0) + ' jugadas posibles de 8 números. Chance de cobrar algo: <b>' + oneIn(o.oneInAnyPrize) + '</b>.</p></section>' +
      shareCard('Poceada', n(prizeShare('lotba-poceada').per100), ['lotba.poceada.fund', 'lotba.poceada.split', 'lotba.poceada.split-agent', 'lotba.poceada.split-reserve'], h) +
      '<section class="jg-c w2"><span class="jg-sm">Del reglamento</span><h2>Cómo se juega</h2><ul><li>Elegís 8 números distintos del 00 al 99.</li><li>Se toman 20 números distintos del sorteo.</li><li>Con 5 aciertos te devuelven lo que pagaste.</li><li>La apuesta simple cuesta ' + money(h.src.value('lotba.poceada.price')) + '.</li></ul>' + cite(h, ['lotba.poceada.pick', 'lotba.poceada.distinct', 'lotba.poceada.five-refund', 'lotba.poceada.price']) + '</section>' +
      checker(h, { game: 'poceada', title: 'Controlá tu Poceada', pick: 8, min: 0, max: 99, sets: [{ id: 'pc', name: 'Los 20 números del sorteo', drawn: 20 }] }) + '</div>';
  },
};

export const quinielaPlus = {
  path: '/quiniela-plus/', kind: 'lottery', section: 'loterias', js: ['sorteo.js'],
  title: 'Quiniela Plus: chances por aciertos y control de tu jugada',
  h1: 'Quiniela Plus',
  description: 'Quiniela Plus de la Provincia: 8 números contra los 20 de la Nocturna. La chance exacta de 8 a 5 aciertos, Súper Plus, Chance Plus y tu control.',
  ld: h => [webPage(h), crumbs(h, [])],
  jurisdiction: 'buenos-aires',
  data: () => ({ game: 'qplus', min: 0, max: 99, pick: 8, sets: [{ id: 'np', name: 'Los 20 números de la Nocturna', drawn: 20, win: [8, 7, 6, 5], four: true }] }),
  render(h) {
    const o = quinielaPlusOdds('pba-quiniela-plus');
    const strip = '<ol class="jg-strip" aria-hidden="true">' + ['4721', '0938', '6154', '2307', '8862', '1495', '7030', '3618', '5276', '9143'].map(x => '<li><b>' + x.slice(0, 2) + '</b><i>' + x.slice(2) + '</i></li>').join('') + '</ol>';
    return hero(h, { kicker: 'Quiniela Plus · Lotería de la Provincia', scene: 'quiniela-plus', lede: 'Elegís 8 números de dos cifras y se comparan con los 20 números de la Quiniela Nocturna de la Provincia. Cada número que aparece es un punto.', actions: '<a class="jg-b p" href="#controlar">Controlar mi jugada</a>' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c"><span class="jg-sm">Tres juegos en uno</span><h2>Qué cifras cuentan</h2>' + strip + '<ul class="jg-ul"><li><b>Plus</b> las dos últimas cifras</li><li><b>Súper Plus</b> las dos primeras</li><li><b>Chance Plus</b> las dos del medio</li></ul><p class="jg-note">Extracto de ejemplo.</p></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Plus, por aciertos</span><h2>Chance de cada premio</h2>' + oddsTable(o) + '<p class="jg-hon">Chance de cobrar algo en el Plus: <b>' + oneIn(o.oneInAnyPrize) + '</b>. Si un número sale dos veces en el extracto, lo contamos como un solo acierto.</p></section>' +
      shareCard('Quiniela Plus', n(prizeShare('pba-quiniela-plus').per100), ['pba.qplus.fund', 'pba.qplus.split', 'pba.qplus.split-reserve'], h) +
      '<section class="jg-c w2"><span class="jg-sm">Del reglamento</span><h2>Cómo se juega</h2><ul><li>Elegís 8 números distintos del 00 al 99.</li><li>Con una apuesta fija de ' + money(h.src.value('pba.qplus.price')) + ' jugás las tres modalidades.</li><li>Se sortea de lunes a sábados con la Nocturna, a las ' + h.src.value('pba.qplus.nocturna') + '.</li><li>En el Súper Plus gana quien tenga más aciertos.</li></ul>' + cite(h, ['pba.qplus.pick', 'pba.qplus.distinct-pick', 'pba.qplus.points', 'pba.qplus.price', 'pba.qplus.nocturna', 'pba.qplus.superplus-rule']) + '</section>' +
      checker(h, { game: 'qplus', title: 'Controlá tu jugada', pick: 8, min: 0, max: 99, sets: [{ id: 'np', name: 'Los 20 números de la Nocturna (de cuatro cifras)', drawn: 20 }] }) + '</div>';
  },
};
