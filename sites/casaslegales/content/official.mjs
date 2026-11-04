// Official links (owner 2026-11-04): a button "Ir al sitio oficial (<province>)" goes to the address a verified official list
// names for the brand, exactly as the regulator links it (host as written in its list, path "/", https, no query, no tracking),
// with rel="nofollow noopener". The gate "operator" of tools/check-dist.mjs allows only these hosts (SITE.gate.officialLinks).
import { hostKey } from '../../../engine/registry.mjs';

export function officialUrl(l) {
  const m = /href="\s*(https?:\/\/[^"\s]+)/.exec((l.evidence || {}).html || '');
  if (!m) throw new Error('official link: no href in the evidence of ' + l.host);
  const host = new URL(m[1]).hostname.toLowerCase().replace(/\.$/, '');
  if (hostKey(host) !== l.host) throw new Error('official link: the list links ' + host + ' but names ' + l.host);
  return 'https://' + host + '/';
}
// listed addresses whose name did not resolve when we checked (DNS lookup): no button, an honest line instead
export const DEAD = { 'arbet.bet.ar': '2026-11-04' };
export const officialHost = l => new URL(officialUrl(l)).hostname;
export function officialHosts(regs) {
  return new Set(regs.flatMap(r => r.licensees.map(officialHost)));
}
