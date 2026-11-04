import { $, $$, data, out, num, fmt } from './kit.js';

const D = data();
const box = $('#pa-mx');
if (D && box) {
  let sys = 'android';
  const free = $('#mx-free'), old = $('#mx-old');
  const ios = D.ffIos && D.ffIos.found ? D.ffIos : null;
  const run = () => {
    const gb = num(free), slow = old.checked;
    let v, say;
    if (sys === 'ios') {
      if (D.maxIosAr) { v = slow ? 'Free Fire' : 'Probá MAX'; say = slow ? 'Con un iPhone que se traba, Free Fire anda más liviano. Tu cuenta es la misma.' : 'Free Fire MAX aparece en el App Store de Argentina: si tu iPhone no se traba, probalo.'; }
      else {
        v = 'Free Fire';
        say = 'En el App Store de Argentina la búsqueda oficial de Apple no encuentra Free Fire MAX. Bajá Free Fire: juega con los mismos jugadores y la misma cuenta.';
        if (ios) say += ' Pide iOS ' + String(ios.minOs).replace(/\.0$/, '') + ' o más nuevo y ocupa ' + fmt(ios.gb, 2) + ' GB.';
      }
      if (ios && gb >= 0 && gb < ios.gb) say += ' <b>Con ' + fmt(gb, 1) + (gb === 1 ? ' GB libre' : ' GB libres') + ' no te entra:</b> liberá al menos ' + fmt(ios.gb - gb, 1) + ' GB.';
    } else if (sys === 'pc') {
      v = 'MAX en Windows';
      say = 'Google Play lista Free Fire MAX también para Windows. Instalalo desde Google Play, no desde emuladores o archivos de otras páginas.';
    } else if (D.maxInstall) {
      v = slow ? 'Free Fire' : 'Probá MAX';
      say = slow ? 'Si tu celu se traba con otros juegos, Free Fire anda más liviano. Tu cuenta es la misma en los dos.' : 'MAX tiene gráficos más pesados. Si se traba, pasate a Free Fire sin perder nada.';
    } else {
      v = 'Free Fire';
      say = 'En nuestra copia de Google Play para Argentina, Free Fire MAX no muestra el botón Instalar. Abrí su ficha desde tu celu: si te deja instalar' + (slow ? ' y tu celu es nuevo' : '') + ', probalo; si no, Free Fire, con la misma cuenta.';
    }
    out('mx', v);
    out('mxsay', say);
  };
  $$('[data-sistema]', box).forEach(b => b.addEventListener('click', () => {
    sys = b.dataset.sistema;
    $$('[data-sistema]', box).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    run();
  }));
  free.addEventListener('input', run);
  old.addEventListener('change', run);
  run();
}
