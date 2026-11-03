// Home of jugadadeldia.com: the "Menu principal" layout (design r3/06): HUD chips, hero, quiniela grid explained, cuánto paga,
// Quini 6 odds, truco scorer and the library of tools. No draw results are shown (no official feed yet).
import { directBet } from '../../../engine/lottery/quiniela.mjs';
import { odds } from '../../../engine/lottery/games.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';
import { hero, tiles, ICONS, oneIn, money, webPage, btn } from './parts.mjs';

export const home = {
  path: '/', kind: 'hub',
  title: 'Jugada del Día: quiniela, loterías y truco, con números',
  h1: 'La jugada del día',
  description: 'Cuánto paga cada jugada de la quiniela en pesos, las chances reales del Quini 6 y las loterías argentinas, y truco, generala y chinchón contra la compu.',
  ld: h => [webPage(h), { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Jugada del Día', url: 'https://' + h.site.domain + '/', inLanguage: 'es-AR' }],
  render(h) {
    const c = d => directBet({ rules: 'lotba-quiniela', digits: d, places: 1, stake: 100 });
    const two = c(2), q6 = odds('cas-quini6-tradicional');
    const jur = h.rg.pack.provinces.length;
    const grid = '<div class="jg-g100" aria-hidden="true">' + Array.from({ length: 100 }, (_, i) => '<i' + (i === 47 ? ' class="on"' : '') + '>' + String(i).padStart(2, '0') + '</i>').join('') + '</div>';
    const hud = '<p class="jg-hud"><span><i></i>' + h.t('{{docs}}') + ' documentos oficiales guardados</span><span><i style="--c:var(--b3)"></i>' + jur + ' jurisdicciones con su ayuda</span><span><i style="--c:var(--b2)"></i>Truco, generala, chinchón y escoba</span></p>';
    const stack = '<div class="jg-st" aria-hidden="true"><div></div><div></div><div><small>Ejemplo</small><b>A la cabeza</b><div class="jg-four"><i class="jg-ba">4</i><i class="jg-ba c2">7</i><i class="jg-ba c3">2</i><i class="jg-ba c4">1</i></div><small>2 cifras: 1 en 100</small></div></div>';
    return hud + hero(h, {
      kicker: 'Quiniela · loterías · truco', scene: 'home',
      lede: 'Cuánto paga cada jugada según el reglamento oficial y qué chance real tiene, sin humo. Y para la sobremesa: truco, generala, chinchón y escoba contra la compu.',
      actions: btn(h, '/quiniela/cuanto-paga/', '¿Cuánto paga la quiniela?', true) + btn(h, '/truco/jugar/', 'Jugar al truco'),
    }).replace('<figure class="jg-girl"', stack + '<figure class="jg-girl"').replace('class="jg-hero"', 'class="jg-hero home"') +
      '<div class="jg-mn">' +
      '<section class="jg-c w2 t2 jg-qn"><span class="jg-tag">La grilla</span><h2>La quiniela, del 00 al 99</h2><p>En la quiniela salen 20 números de cuatro cifras. Si jugás a dos cifras, lo que cuenta es la terminación: hay 100, del 00 al 99, y <b>todas tienen la misma chance</b>.</p>' + grid +
      '<p class="jg-hon">A la cabeza, tu terminación sale ' + oneIn(two.oneIn) + ' veces. Ningún número «viene atrasado»: el bolillero no se acuerda de ayer.</p>' +
      '<div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Con $ 100</th><th class="n">Cobrás</th><th class="n">Chance</th><th class="n">Vuelve</th></tr></thead><tbody>' +
      [1, 2, 3, 4].map(d => { const r = c(d); return '<tr><td>' + d + (d === 1 ? ' cifra' : ' cifras') + '</td><td class="n">' + money(toNumber(r.perHit)) + '</td><td class="n">' + oneIn(r.oneIn) + '</td><td class="n">' + money(toNumber(r.evPer100)) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="jg-note">Reglamento de La Quiniela de la Ciudad. En la Provincia paga lo mismo, más 5 cifras.</p>' + btn(h, '/quiniela/cuanto-paga/', 'Calcular mi jugada', true) + '</section>' +
      '<section class="jg-c"><span class="jg-tag">Ejemplo</span><h2>¿Cuánto paga?</h2><p class="jg-ch"><span>Apuesta $ 100</span><span>A la cabeza</span><span>2 cifras</span></p><p class="jg-win">Cobrás <b>' + money(toNumber(two.perHit)) + '</b></p><p class="jg-hon">Chance: ' + oneIn(two.oneIn) + ' · por cada $ 100 apostados vuelven en promedio ' + money(toNumber(two.evPer100)) + '</p>' + btn(h, '/quiniela/redoblona/', '¿Y la redoblona?') + '</section>' +
      '<section class="jg-c"><span class="jg-sm">Quini 6</span><h2>Controlá tu boleta</h2><div class="jg-six jg-demo" aria-hidden="true">' + ['04', '11', '17', '26', '33', '45'].map(n => '<input value="' + n + '" tabindex="-1" readonly>').join('') + '</div><p>Chance de los 6 en un sorteo: <b>' + oneIn(q6.rows[0].oneIn) + '</b></p>' + btn(h, '/quini-6/', 'Ir al Quini 6', true) + '</section>' +
      '<section class="jg-c w3"><span class="jg-sm">Biblioteca</span><h2>Todo para tu jugada</h2>' + tiles(h, [
        ['/quiniela/cuanto-paga/', 'Cuánto paga la quiniela', 'A la cabeza, a los 5, 10 y 20, Ciudad y Provincia', '#16b38a', ICONS.calc],
        ['/quini-6/', 'Quini 6', 'Las cinco modalidades y el control de tu boleta', '#2f7cf6', ICONS.check],
        ['/loto-plus/', 'Loto Plus y Brinco', 'Modalidades, número Plus y chances', '#8b5cf6', ICONS.balls],
        ['/telekino/', 'Telekino y Poceada', 'Cartones, aciertos y lo que va a premios', '#ff5a3c', ICONS.balls],
        ['/truco/jugar/', 'Truco contra la compu', 'Tres niveles, con o sin flor', '#e0447a', ICONS.cards],
        ['/truco/anotador/', 'Anotador de truco', 'Con fósforos, malas y buenas', '#16b38a', ICONS.pencil],
        ['/truco/valores-de-las-cartas/', 'Valores del truco', 'Qué carta mata a cuál, y las señas', '#ff5a3c', ICONS.cards],
        ['/generala/jugar/', 'Generala', 'Contra la compu, anotador y probabilidades', '#e8930c', ICONS.dice],
        ['/chinchon/jugar/', 'Chinchón y escoba', 'Cartas españolas contra la compu', '#2f7cf6', ICONS.hand],
      ]) + '</section></div>';
  },
};
