// Numbers and dates for the copy: every {{token}} in a title, description, H1 or text is filled here from the verified data.
// Nothing is typed by hand: counts come from the registries, the tile map and the help package (tools/render.mjs fails on an
// unknown token).
import { TILES } from './map.mjs';
import { provDocRows } from './provdata.mjs';
import { total, countBy, brands, brandMatrix, multiJurisdiction, splitAddress } from '../../../engine/registry.mjs';
import { fmtDate, fmtInt } from '../../../engine/format.mjs';
import { OWNER_COPY_MAX_AGE, docUntil } from '../../../tools/lib/copyage.mjs';

export function facts(h) {
  const regs = h.regs, by = countBy(regs);
  const docs = [...h.docs(), ...provDocRows(h)];
  const maxAge = Math.min(...regs.map(r => r.maxAgeDays), h.rg.pack.maxAgeDays);
  const firstExpiry = docs.map(d => docUntil(d, maxAge)).sort()[0];
  const f = {
    jur_total: TILES.length,
    reg_total: regs.length,
    lic_total: total(regs),
    brand_total: brands(regs).length,
    multi_total: multiJurisdiction(brandMatrix(regs, h.names)).length,
    split_total: splitAddress(brandMatrix(regs, h.names)).length,
    pba_n: by['buenos-aires'],
    caba_n: by.caba,
    cba_n: by.cordoba,
    lri_n: by['la-rioja'],
    neu_n: by.neuquen,
    rne_n: by['rio-negro'],
    sfe_n: by['santa-fe'],
    mza_n: by.mendoza,
    doc_total: docs.length,
    quote_total: docs.reduce((n, d) => n + d.quotes, 0),
    rg_lines: Object.values(h.rg.disp.provinces).filter(x => x.line).length,
    max_age: maxAge,
    owner_max_age: OWNER_COPY_MAX_AGE,
    checked: fmtDate(h.checked),
    next_check: fmtDate(firstExpiry),
  };
  for (const [k, v] of Object.entries(f)) if (typeof v === 'number') f[k] = fmtInt(v);
  return f;
}
