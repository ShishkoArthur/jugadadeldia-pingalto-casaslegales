const PHONE = matchMedia('(max-width: 980px)');
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

for (const tool of document.querySelectorAll('.pa-tool:not(.pa-oo)')) {
  const out = tool.querySelector(':scope > .pa-out'), big = out && out.querySelector('.pa-big');
  const form = tool.querySelector(':scope > .pa-fm, :scope > form');
  if (!big || !form) continue;
  const bar = document.createElement('button');
  bar.type = 'button';
  bar.className = 'pa-pk';
  bar.style.cssText = "position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:6;display:flex;align-items:center;gap:12px;min-height:54px;padding:8px 16px;border:0;border-radius:18px;background:var(--fg);color:var(--bg);box-shadow:0 14px 30px -12px #1d1830b3;font:600 13px/1.25 \"Be Vietnam Pro\",sans-serif;text-align:left;cursor:pointer";
  bar.hidden = true;
  bar.innerHTML = '<span></span><b></b><i aria-hidden="true">↓</i>';
  const [lab, val, ico] = bar.children;
  lab.style.cssText = "flex:1;min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden";
  val.style.cssText = "font:800 24px/1 \"M PLUS Rounded 1c\",sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap;max-width:50%;overflow:hidden;text-overflow:ellipsis";
  ico.style.cssText = "font-style:normal;font-size:18px";
  const head = () => { const x = out.querySelector('.pa-x, h2, h3'); return clean(x && x.textContent) || 'Resultado'; };
  const sync = () => { lab.textContent = head(); val.textContent = clean(big.textContent); bar.setAttribute('aria-label', lab.textContent + ': ' + val.textContent + '. Ir al resultado'); };
  let formIn = false, bigIn = true, touched = false;
  const show = () => { bar.hidden = !(PHONE.matches && touched && formIn && !bigIn); };
  new IntersectionObserver(e => { formIn = e[0].isIntersecting; show(); }).observe(form);
  new IntersectionObserver(e => { bigIn = e[0].isIntersecting; show(); }, { rootMargin: '0px 0px -64px 0px' }).observe(big);
  new MutationObserver(sync).observe(out, { subtree: true, childList: true, characterData: true });
  form.addEventListener('input', () => { touched = true; sync(); show(); });
  form.addEventListener('change', () => { touched = true; sync(); show(); });
  form.addEventListener('click', e => { if (e.target.closest('button')) { touched = true; sync(); show(); } });
  bar.addEventListener('click', () => out.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
  PHONE.addEventListener('change', show);
  sync();
  tool.append(bar);
}
