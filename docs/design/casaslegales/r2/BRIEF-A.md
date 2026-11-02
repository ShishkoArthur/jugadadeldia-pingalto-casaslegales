# Brief A: casaslegales round 2, concepts 01–03 (2026-11-02)

Direction: **product/tool-first**. The home page behaves like a consumer app you would open on purpose: one big tool in the hero,
a registry that looks alive, strong colour and confident type. Concepts 04–06 (BRIEF-B) take a different direction in parallel.
Round 1 (`../parts/`: boletín, trámite, escribanía, ensayo, mapa, libro, grilla, pasaporte, fichero) was rejected as bureaucratic,
beige and document-like: no paper, no stamps, no rules-and-folios here.

## Research findings (11 lookups, 02/11/2026)
1. Regulator registers (UKGC public register, AGCO → iGaming Ontario directory, Kansspelautoriteit, Spillemyndigheden) are
   directory pages: tiles that lead to a search, then a flat list. Nobody answers the player's real question in one step.
   That gap is our product: one input, one verdict, the source behind it.
2. Ontario and Denmark both teach players to "look for the mark / the URL in the footer"; the useful unit is the **domain**
   (iGO lists operator + each site URL). For Argentina the equivalent is the provincial subdomain under `.bet.ar`.
3. Get Safe Online "Check a website" (with Cifas): paste an address, result in seconds, trust score from 40+ sources, and an
   explicit privacy line ("no information that identifies you is stored"). Copy the pattern: paste → verdict → why.
4. Have I Been Pwned is the gold standard of a one-field hero: giant input, binary coloured verdict, then detail. We need a
   **three-state** verdict, because «no figura» is not «ilegal» (PAGES-CASASLEGALES: honest wording).
5. Consumer Reports / Which? avoid stars: they use labelled verdicts and filled dots. Good model for matrix cells.
6. Mercado Pago moved to Mercado Libre yellow in 2025 (Porto Rocha; heavier, rounded type); Ualá deepened blue + red (2024);
   Naranja X is orange; Fast Company notes "purple is everywhere in fintech". So: **no yellow+blue, no Ualá blue, no purple,
   no pure orange** as brand colour, or we read as a copy of a wallet app.
7. Poncho (argentina.gob.ar design system): blues family, Encode Sans, later Lora + Montserrat, Bootstrap service panels.
   We avoid all of it (fonts, celeste bar, panel look) so we never resemble a government service.
8. Awwwards fintech winners 2026 (Cleo by OddCommon/DEPT, Jeton, Razorpay): "un-bank-y", a single signature colour used big,
   bold sentence-case headlines, product UI shown as hero illustration, motion implied by state changes.
9. Linear / Raycast / Arc: command palette as the main entry, grouped results, keyboard hints, changelog as proof of life.
   A dated "cambios en el registro" feed is our proof that someone checks (hora argentina, dd/mm/aaaa).
10. Trust comes from showing the source in the same glance as the verdict (regulator name, resolution number, date checked),
    not from badges. Every verdict chip carries «LOTBA · 02/11/2026» style provenance.
11. Phone-first: the owner and the audience read on phones; the tool must be usable at 390 px with 44 px targets.

## Three directions
- **01 Semáforo** — the hero IS the verifier: a giant address field with an inline pill inside the headline, and three verdict
  cards (verde «figura en el registro», ámbar «solo prensa, falta confirmar», gris «no figura: no quiere decir ilegal»).
  Matrix cells are traffic-light dots. Light: pale mint-grey, black type, signal colours; dark: street at night, lights glow.
  Fonts: Funnel Display + Funnel Sans.
- **02 Relieve** — an isometric relief of Argentina made of 24 extruded pill tiles (CSS 3D, not the flat square cartogram of
  jugadadeldia): tiles rise by number of licences, the chosen province lifts and opens a side sheet. Data-app feel.
  Light: pale sage, pine extrusions, chartreuse tops, coral for «?»; dark: pine night with lit tops. Fonts: Gabarito + Ubuntu Sans Mono.
- **03 Comando** — Linear/Raycast-style app: command palette hero «Buscá un operador, una provincia o un dominio» with grouped
  live results, app shell with sidebar, a «Cambios en el registro» changelog feed, keyboard hints. Light: porcelain + graphite
  + vermilion; dark: graphite (designed first). Fonts: Host Grotesk + DM Mono.

Fragment rules as round 1 (`../BRIEF.md`) except: prefix `.lNN` / `lNN-`, files `parts/NN-slug.html`, ≤ 18 KB.
Assembler: `assemble.mjs` (globs all of `parts/`, includes 04–06) → `six-concepts-2026-11-02.html`.
