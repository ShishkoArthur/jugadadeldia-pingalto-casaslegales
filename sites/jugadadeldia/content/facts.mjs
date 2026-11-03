// Numbers for the copy of jugadadeldia.com: every {{token}} in a title, description, H1 or text is filled here from the engine
// and the verified sources (tools/render.mjs fails on an unknown token). Also attaches the sources (h.src) for the pages.
import { loadSources } from './sources.mjs';
import { odds, prizeShare, quini6PremioExtra, quinielaPlusOdds } from '../../../engine/lottery/games.mjs';
import { directBet } from '../../../engine/lottery/quiniela.mjs';
import { toNumber, binom } from '../../../engine/lottery/exact.mjs';
import { servida, generalaWithin } from '../../../engine/lottery/dice.mjs';
import { florChance, envidoDistribution } from '../../../engine/truco/probability.mjs';
import { DECK_40 } from '../../../engine/cards/spanish.mjs';
import { fmt } from '../../../engine/games/num.mjs';
import { fmtInt } from '../../../engine/format.mjs';

const big = n => fmtInt(Number(n));
const one = q => { const v = toNumber({ n: q.d, d: q.n }); return fmt(v, v < 100 ? 1 : 0); };

export function facts(h) {
  h.src = loadSources(h.today);
  const q6 = odds('cas-quini6-tradicional'), br = odds('cas-brinco'), tk = odds('pba-telekino'), lp = odds('lotba-loto-plus-tradicional'), pc = odds('lotba-poceada');
  const c2 = directBet({ rules: 'lotba-quiniela', digits: 2, places: 1, stake: 100 });
  const c4 = directBet({ rules: 'lotba-quiniela', digits: 4, places: 1, stake: 100 });
  const sv = servida('escalera-12345-23456');
  const ed = envidoDistribution({ flor: false });
  const f = {
    q6_comb: big(q6.combinations),
    q6_any: one(q6.pAnyPrizeTicket),
    br_comb: big(br.combinations),
    tk_comb: big(tk.combinations),
    lp_comb: big(lp.combinations),
    pc_comb: big(binom(100, 8)),
    q2_pay: fmt(toNumber(c2.perHit), 0),
    q2_ev: fmt(toNumber(c2.evPer100), 0),
    q4_pay: fmt(toNumber(c4.perHit), 0),
    q4_ev: fmt(toNumber(c4.evPer100), 0),
    q6_share: fmt(toNumber(prizeShare('cas-quini6-tradicional').per100), 2),
    extra_one: one(quini6PremioExtra().p),
    qplus_any: one(quinielaPlusOdds('pba-quiniela-plus').pAnyPrize),
    deck: DECK_40.length,
    hands: big(binom(40, 3)),
    flor_one: fmt(1 / florChance().p, 1),
    env_max: Math.max(...Object.keys(ed.counts).map(Number)),
    gen_servida: fmt(sv.generala.oneIn, 0),
    gen_three: fmt(toNumber(generalaWithin(3).p) * 100, 2),
    docs: h.src.docs.length,
    pc_any: one(pc.pAnyPrize),
  };
  return f;
}
