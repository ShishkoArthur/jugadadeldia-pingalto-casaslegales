// Menu engine shared by the three sites (owner 2026-11-04: every page reachable from a section submenu; "the whole list of pages
// in a convenient form"). It only sorts: every built page of the current language goes to the first group of the site's spec
// whose test accepts it (or to spec.rest), hubs first, then the group's explicit order, then the plan wave (P1 < P2 < P3) and
// the plan order (data/plan/<site>.json, ordered by demand). A new page therefore shows up in its submenu by itself. Each site
// renders the tree with its own markup and classes (sites must not look like a network).
//   spec = { sections: [{ id, name, hub?, groups: [{ id, name, test(p, planEntry), head?, order?, sort?: 'label', nest?(p) -> parent path }] }],
//            rest: { section, group }, label(p, h) }
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../env.mjs';

const norm = u => (u.replace(/\/+$/, '') || '/');
const plans = {};
function plan(id) {
  if (!plans[id]) {
    const f = join(ROOT, 'data/plan', id + '.json');
    const list = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : [];
    plans[id] = new Map(list.map((x, i) => [norm(x.url), { wave: +(String(x.wave).match(/\d/) || [9])[0], i, section: x.section }]));
  }
  return plans[id];
}
export const langOf = p => p.lang || 'es';
export const pick = (name, lang) => typeof name === 'string' ? name : name[lang] || name.es;

// "Quiniela de Córdoba: resultados de hoy" -> "Quiniela de Córdoba"
export function shortLabel(s) {
  const t = String(s).replace(/\s+/g, ' ').trim();
  const a = t.split(/:\s|\s[-–—]\s/)[0];
  return a.length >= 3 ? a : t;
}

// The tree is built once per build from the Spanish pages (h.pages); the English pass of tools/render.mjs renders the same markup
// and tools/lib/i18n.mjs translates the labels and maps the links to /en/.
const cache = new WeakMap();
export function navTree(h, spec) {
  let per = cache.get(h);
  if (!per) cache.set(h, (per = new Map()));
  if (per.has(spec)) return per.get(spec);
  const lang = 'es';
  const P = plan(h.site.id);
  const pages = (h.pages || []).filter(p => langOf(p) === lang && !p.is404);
  const label = p => (spec.label && spec.label(p, h)) || p.menu || shortLabel(h.t(p.h1));
  const sections = spec.sections.map(s => ({ id: s.id, name: pick(s.name, lang), spec: s, groups: s.groups.map(g => ({ id: g.id, name: g.name ? pick(g.name, lang) : '', spec: g, list: [] })) }));
  for (const p of pages) {
    let placed = false;
    for (const s of sections) { for (const g of s.groups) if (g.spec.test(p, P.get(norm(p.path)) || {})) { g.list.push(p); placed = true; break; } if (placed) break; }
    if (!placed) {
      const s = sections.find(x => x.id === spec.rest.section), g = s && s.groups.find(x => x.id === spec.rest.group);
      if (!g) throw new Error('menu: no group for ' + p.path + ' and no spec.rest');
      g.list.push(p);
    }
  }
  const rank = (g, p) => {
    const o = (g.spec.order || []).map(norm).indexOf(norm(p.path));
    const pl = P.get(norm(p.path));
    return [norm(p.path) === norm(g.spec.head || '') || p.kind === 'hub' ? 0 : 1, o < 0 ? 999 : o, pl ? pl.wave : 9, pl ? pl.i : 9999, p.path];
  };
  const cmp = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; return 0; };
  for (const s of sections) for (const g of s.groups) {
    g.list.sort((a, b) => cmp(rank(g, a), rank(g, b)));
    const items = g.list.map(p => ({ path: p.path, label: label(p), page: p, kids: [] }));
    if (g.spec.sort === 'label') items.sort((a, b) => (rank(g, a.page)[0] - rank(g, b.page)[0]) || a.label.localeCompare(b.label, 'es'));
    const at = new Map(items.map(x => [x.path, x]));
    g.head = g.spec.head && at.get(g.spec.head) ? at.get(g.spec.head) : null;
    g.items = [];
    for (const it of items) {
      if (it === g.head) continue;
      const parent = g.spec.nest && at.get(g.spec.nest(it.page));
      if (parent && parent !== it) parent.kids.push(it); else g.items.push(it);
    }
    delete g.list;
  }
  const tree = sections.map(s => ({ ...s, groups: s.groups.filter(g => g.head || g.items.length) })).filter(s => s.groups.length);
  per.set(spec, tree);
  return tree;
}

// is the page inside this section / group (for aria-current="true" on the section button)
export const holds = (node, path) => {
  const items = node.groups ? node.groups.flatMap(g => [g.head, ...g.items].filter(Boolean)) : [node.head, ...node.items].filter(Boolean);
  const walk = list => list.some(x => x.path === path || walk(x.kids));
  return walk(items);
};
// breadcrumbs from the tree (owner 2026-11-04: consistent with the menu): home -> section hub -> group head -> parent -> page,
// only pages (a section without a hub page is skipped); returns [[path, label], ...] or null for the home page
export function crumbs(tree, path, home) {
  if (path === '/') return null;
  const find = path => { for (const s of tree) for (const g of s.groups) for (const it of [g.head, ...g.items].filter(Boolean)) { if (it.path === path) return { s, g, it }; const k = it.kids.find(x => x.path === path); if (k) return { s, g, it: k, parent: it }; } return null; };
  const at = find(path);
  const out = [['/', home]];
  if (!at) return [...out, [path, null]];
  const add = x => { if (x && !out.some(o => o[0] === x.path) && x.path !== path) out.push([x.path, x.label]); };
  const hub = at.s.spec.hub && find(at.s.spec.hub);
  if (hub) add(hub.it);
  add(at.g.head);
  add(at.parent);
  out.push([path, at.it.label]);
  return out;
}
