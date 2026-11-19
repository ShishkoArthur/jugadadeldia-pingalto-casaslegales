// Store names written the way pingalto writes them: "EA SPORTS FC™ 27" -> "EA Sports FC 27" (trademark signs dropped, words of
// four or more capital letters in title case, short acronyms kept). The build (saved Steam copy) and the steam feed use it.
export function gameName(name) {
  const s = String(name || '').replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim();
  if (!s || s.length > 80) throw new Error('steam: bad game name ' + JSON.stringify(name));
  return s.split(' ').map(w => /^[A-Z]{4,}$/.test(w) ? w[0] + w.slice(1).toLowerCase() : w).join(' ');
}
// The name without the publisher label in front: "EA Sports FC 27" -> "FC 27".
export const shortName = full => String(full).replace(/^EA Sports /, '');
