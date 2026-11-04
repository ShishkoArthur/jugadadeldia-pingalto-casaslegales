// robots.txt rules for the casaslegales server recheck (RFC 9309: groups by user-agent, longest matching rule wins, Allow wins
// a tie, "*" and "$" in paths). A site that disallows any AI crawler (docs/TRAPS.md 2026-11-03) is never fetched by our programs:
// its pages are saved by the owner from his browser (docs/reference/owner-saves/README.md).
export const AI_AGENTS = ['claudebot', 'claude-user', 'claude-searchbot', 'claude-web', 'anthropic-ai', 'gptbot', 'chatgpt-user', 'oai-searchbot', 'google-extended', 'ccbot'];
export const OUR_AGENT = 'casaslegales';

export function parseRobots(txt) {
  const groups = [];
  let cur = null, lastWasAgent = false;
  for (const raw of String(txt || '').split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase(), val = m[2].trim();
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else if (key === 'allow' || key === 'disallow') {
      lastWasAgent = false;
      if (cur) cur.rules.push({ allow: key === 'allow', path: val });
    } else lastWasAgent = false;
  }
  return groups;
}

const ruleRe = p => new RegExp('^' + p.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$|\$$/, '$'));
// the rules that apply to one agent token: its own groups, or the "*" groups when it has none (null when it has none either)
function rulesFor(groups, token) {
  const own = groups.filter(g => g.agents.includes(token));
  const use = own.length ? own : groups.filter(g => g.agents.includes('*'));
  return { own: own.length > 0, rules: use.flatMap(g => g.rules) };
}
export function allowed(groups, token, path) {
  let best = null;
  for (const r of rulesFor(groups, token).rules) {
    if (!r.path) continue;
    let re; try { re = ruleRe(r.path); } catch { continue; }
    if (!re.test(path)) continue;
    const len = r.path.length;
    if (!best || len > best.len || (len === best.len && r.allow)) best = { len, allow: r.allow };
  }
  return best ? best.allow : true;
}

// -> { ok, why }: ok false when our agent may not fetch the path, or when any AI crawler is named and kept out of it
export function robotsVerdict(txt, path) {
  const groups = parseRobots(txt);
  if (!allowed(groups, OUR_AGENT, path)) return { ok: false, why: 'robots.txt disallows ' + path + ' for us' };
  const ai = AI_AGENTS.filter(a => rulesFor(groups, a).own && !allowed(groups, a, path));
  if (ai.length) return { ok: false, why: 'robots.txt keeps AI crawlers out (' + ai.join(', ') + ')' };
  return { ok: true, why: '' };
}
