// Betting operators: no site of this repository links to them (owner 2026-11-02: no monetization, no operator links).
// Used by the gate "operator" of tools/check-dist.mjs. Any host under .bet.ar (licensed Argentine betting domains) counts,
// plus known brand domains, plus every host of the saved official registries (data/sources/registries).
// Adapted from /home/dev/gambeteo/site/operators.mjs.
import { loadRegistries } from './sources.mjs';

const BRANDS = ['bet365', 'codere', 'bplay', 'betsson', 'betano', 'betway', '1xbet', 'betfair', 'betwarrior', 'jugadon', 'rivalo', 'bwin',
  'williamhill', 'pinnacle', 'stake', 'sportingbet', 'novibet', 'betmgm', 'fanduel', 'draftkings', 'pokerstars', 'betsala', 'mercadobet',
  'apuestatotal', 'betcris', 'betplay', 'wplay', 'caliente', 'betboo', 'bodog', 'parimatch', 'melbet', '22bet', 'mostbet', 'pin-up', 'pinup',
  'casinodelrio', 'bingoplay', 'ganamos', 'tiradas', 'betgold', 'sportsbet', 'dafabet', 'leovegas', 'unibet', '888sport', '888casino',
  'super7', 'betfun', 'playuzu', 'playcet', 'casinobuenosairesonline', 'rushbet', 'jugaya', 'casinoclub', '1win', 'betfury', 'roobet'];
const RE = new RegExp('(^|\\.)(' + BRANDS.map(b => b.replace(/[-]/g, '\\-')).join('|') + ')(\\.[a-z]{2,6})+$', 'i');
let REG = null;
export function isOperatorHost(host) {
  const h = String(host).toLowerCase().replace(/\.$/, '').replace(/^www\d?\./, '');
  if (!REG) REG = new Set(loadRegistries().flatMap(r => r.licensees.map(l => l.host)));
  return /(^|\.)bet\.ar$/.test(h) || RE.test(h) || REG.has(h);
}
