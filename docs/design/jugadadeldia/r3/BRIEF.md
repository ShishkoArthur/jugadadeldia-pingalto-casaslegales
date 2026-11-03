# Brief r3: twenty home-page variants for jugadadeldia.com (2026-11-03)

## Owner feedback on r2 (03.11, translated)
«None of the designs fit; the second (02 Golosinas) is more or less OK but too cartoonish. Try 20 more variants.»
So: keep what worked in Golosinas (candy-kiosk colour energy, glossy numbered balls, friendly warmth) and drop the cartoon
(thick black outlines, jelly/wobbly buttons with a lip, sprinkles confetti, bubble display fonts like DynaPuff).
Audience: young adults 20–35. Playful yet adult, product-grade polish. No monetization, no operators, no money rain, no «ganá».

## The four directions (5 variants each, one agent per direction)
- **01–05 Golosinas, grown up** — candy palette + glossy balls with real depth (soft gradients, light, generous spacing), crisp
  type like a top consumer app. 01 Caramelo (bright daylight candy) · 02 Sorbete (pastel sorbet, bento) · 03 Neón dulce (dusk
  neon candy, dark-first) · 04 Cítrico (citrus kiosk, no mint) · 05 Cristal (3D glass/gloss balls on clean white).
  Fonts taken: Fredoka, Plus Jakarta Sans, Quicksand, Instrument Sans, Urbanist, DM Mono, Rethink Sans, Red Hat Display, Red Hat Text.
- **06–10 Modern mobile game UI** — the polish of a current casual/mid-core mobile game (HUD bars, level cards, progress, reward
  states without money), not a kids' cartoon.
- **11–15 Argentine kiosk / street, modern** — kiosco, quiniela agency, street signage and local printed matter, redrawn clean
  and contemporary (avoid gambeteo's worlds: bus plates, fileteado, sticker album, 70s magazine).
- **16–20 TV draw broadcast graphics** — the look of a modern live draw on TV: lower thirds, ball reveal, studio light,
  on-air tickers.
Do not drift into another direction's world. Pick your own fonts; do not reuse the ones listed as taken above.

## Format (same as `../BRIEF.md` and `../r2/BRIEF.md`, with these changes)
- Prefix `.mNN`; file `parts/NN-slug.html`; size ≤ 18 KB (18 432 bytes).
- Header comments exactly: `<!-- name: ... -->`, `<!-- desc: ... -->` (RUSSIAN, 1–2 sentences, how light and dark differ),
  `<!-- fonts: family=...&family=... -->`. No other comments; no Cyrillic outside `desc`.
- Every selector starts with `.mNN`; tokens for light on `.mNN`, dark on `.mNN[data-mode="dark"]`; both themes designed with care.
- Phone layout via `@container (max-width:620px)` only (frame is 1120 px desktop / 390 px phone). No horizontal scroll at 390.
- No JS, no external images, no data-URI bitmaps, no emoji; inline SVG with short paths. No `position:fixed`; `overflow:clip`
  instead of `overflow:hidden` on big containers. Motion only inside `@media (prefers-reduced-motion:no-preference)`, tiny.
- Contrast ≥ 4.5:1 for text in both themes; tap targets ≥ 40 px; visible `:focus-visible`; one `h1`; tab rows with
  `aria-current` / `aria-pressed`.
- Same content blocks and exact numbers as the base `../r2/parts/02-golosinas.html`: header (logo mark + `jugadadeldia`, nav
  Quiniela · Quini 6 · Loterías · Truco · Juegos, theme button, burger on phone) · hero with the exact subtitle and two buttons
  «Ver la quiniela de hoy» / «¿Cuánto paga?» + girl slot `<div class="mNN-girl" role="img" aria-label="Ilustración">` with
  «acá va ella» · «Quiniela de hoy» (Nacional/Provincia/Tucumán/Córdoba/Santa Fe; La Previa/Primera/Matutina/Vespertina/Nocturna;
  20 numbers 4721 … 9681; «Ejemplo ilustrativo»; «La cabeza: 4721»; «Actualizado 21:14 (hora argentina)») · «¿Cuánto paga?»
  ($ 100 · a la cabeza · 2 cifras → «Cobrás $ 7.000»; «Chance: 1 en 100 · por cada $ 100 apostados vuelven en promedio $ 70»;
  «ejemplo») · Quini 6 (04 11 17 26 33 45, four modalities, «Chance del pozo: 1 en 9.366.819», «Controlar») · truco anotador
  (Nosotros 17, Ellos 9, malas/buenas, +1, «Nuevo partido») · 6 tool tiles · footer + 18+ RG strip, no phone numbers.
- Fonts banned: the `../BRIEF.md` ban list, plus M PLUS Rounded 1c, Be Vietnam Pro (pingalto), Gabarito, Ubuntu Sans Mono
  (casaslegales), Inter, Roboto, Poppins, Montserrat, Space Grotesk. Max 2–3 families, only used weights, real fallback stack.

## Assembler
`node docs/design/jugadadeldia/r3/assemble.mjs` globs every `parts/NN-*.html` → `twenty-variants-2026-11-03.html`
(index of numbered names, per-variant light/dark + desktop/phone, «all at once» toggles; phone-friendly).
