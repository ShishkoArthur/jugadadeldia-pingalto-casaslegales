// How long a saved copy of an official page stays fresh (owner 2026-11-04, docs/DECISIONS.md). The single source of truth for every
// check that dates a copy: verify-sources (registries, provinces, lottery files), verify-rg, verify-operators, the reviews, the gate
// "fresh" of tools/check-dist.mjs, the sites (casaslegales {{max_age}} / {{owner_max_age}} / {{next_check}}, the jugadadeldia sources
// table) and the server feeds (casaslegales listas and plazos, jugadadeldia fuentes). No imports: the feed servers sync this file alone.
//   - an owner copy: the owner saves the page from his own browser because the site keeps AI crawlers out in robots.txt
//     (AI_BLOCKED_HOSTS) or is geo-blocked outside Argentina (Santa Fe, Mendoza): copiedBy "owner", pendingOwnerCopy (an old copy
//     waiting for his), refresh "manual" -> OWNER_COPY_MAX_AGE days, whatever maxAgeDays its set has (one visit every half year);
//   - a copy our tools download (the casaslegales server rechecks it every month) -> maxAgeDays of its set, AUTO_MAX_AGE if none.
export const OWNER_COPY_MAX_AGE = 180, AUTO_MAX_AGE = 100;
export const AI_BLOCKED_HOSTS = ['loteriadecordoba.com.ar', 'ijan-neuquen.com', 'loteriaderionegro.gob.ar', 'enrejasalta.com.ar', 'hcdn.gob.ar'];
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
export const isAiBlocked = url => AI_BLOCKED_HOSTS.some(h => hostOf(url) === h || hostOf(url).endsWith('.' + h));
// copiedBy "owner": saved by the owner himself; "owner-browser": taken by the agent in the owner's own Chrome (Argentine VPN exit) while
// he watches, only from sites whose robots.txt does not disallow Claude-User or Claude-Code (owner 2026-11-04). Both are owner copies.
export const OWNER_COPIERS = ['owner', 'owner-browser'];
export const isOwnerCopied = d => !!d && OWNER_COPIERS.includes(d.copiedBy);
export const isOwnerDoc = d => !!d && !!(d.pendingOwnerCopy || isOwnerCopied(d) || isAiBlocked(d.url) || d.refresh === 'manual');
export const docMaxAge = (d, setMaxAge) => isOwnerDoc(d) ? OWNER_COPY_MAX_AGE : (setMaxAge || AUTO_MAX_AGE);
const plus = (day, n) => new Date(Date.parse(day + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
// the last day a copy is valid
export const docUntil = (d, setMaxAge) => plus(d.fetched, docMaxAge(d, setMaxAge));
