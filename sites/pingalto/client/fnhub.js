import { $, $$ } from './kit.js';

const box = $('#pa-fn');
if (box) {
  const show = k => {
    $$('[data-dev]', box).forEach(b => b.setAttribute('aria-pressed', b.dataset.dev === k ? 'true' : 'false'));
    $$('[data-how]', box).forEach(d => { d.hidden = d.dataset.how !== k; });
  };
  $$('[data-dev]', box).forEach(b => b.addEventListener('click', () => show(b.dataset.dev)));
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua)) show('iphone');
  else if (/Android/.test(ua)) show('android');
  else if (/Windows|Macintosh|Linux/.test(ua)) show('pc');
}
