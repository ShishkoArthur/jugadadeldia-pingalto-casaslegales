// Tier list state for /tier-list: which item sits in which row, kept in the page address so a list can be shared without an
// account or a server. Format: "<set>~<row>.<row>...", each row the item indexes in base 36 joined by "-", rows in the order of
// ROWS; items not listed stay in the pool. Pure: the build and the browser run the same code.
export const ROWS = ['S', 'A', 'B', 'C', 'D', 'F'];

export function empty(n) {
  return { rows: ROWS.map(() => []), pool: [...Array(n).keys()] };
}
export function move(state, item, row, at) {
  const rows = state.rows.map(r => r.filter(x => x !== item));
  const pool = state.pool.filter(x => x !== item);
  if (row === -1) { pool.push(item); pool.sort((x, y) => x - y); } else {
    const r = rows[row];
    r.splice(at == null || at > r.length ? r.length : Math.max(0, at), 0, item);
  }
  return { rows, pool };
}
export function serialize(set, state) {
  return set + '~' + state.rows.map(r => r.map(i => i.toString(36)).join('-')).join('.');
}
// Address text -> state for a set of n items; anything malformed, unknown or repeated is dropped, never an error.
export function parse(text, n) {
  const m = /^([a-z0-9-]+)~([0-9a-z.-]*)$/.exec(String(text || ''));
  const st = empty(n);
  if (!m) return { set: null, state: st };
  const seen = new Set();
  const rows = m[2].split('.').slice(0, ROWS.length).map(r => r.split('-').filter(Boolean).map(x => parseInt(x, 36)).filter(i => Number.isInteger(i) && i >= 0 && i < n && !seen.has(i) && seen.add(i)));
  while (rows.length < ROWS.length) rows.push([]);
  return { set: m[1], state: { rows, pool: [...Array(n).keys()].filter(i => !seen.has(i)) } };
}
