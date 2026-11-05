// One Telegram message from a template of data/alerts/ru.json (tools/feeds/alerts.mjs), for shell scripts (the fnapi watchdog) and
// tests of the bot. TG_BOT_TOKEN and TG_CHAT_ID come from the env (the container's secrets.env); nothing secret is printed.
//   node tools/feeds/notify.mjs <site> <template> [--feed <name> | --service <name>] [--dry] [key=value ...]
//   node tools/feeds/notify.mjs <site> --test [--from feeds|fnapi] [--service <name>] [--dry]
// --dry prints the text instead of sending it. Exit 0 sent (or printed), 1 not sent, 2 bad arguments.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderAlert, loadTemplates } from './alerts.mjs';
import { sendTelegram } from './lib.mjs';

export async function main(argv = process.argv.slice(2), env = process.env) {
  const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const [site, tpl] = argv;
  const T = loadTemplates();
  if (!site || !T.sites[site] || !tpl) { console.error('usage: notify.mjs <' + Object.keys(T.sites).join('|') + '> <template>|--test [--feed x|--service x] [--dry] [k=v ...]'); return 2; }
  const test = tpl === '--test';
  if (!test && !(T.templates[tpl] && typeof T.templates[tpl] === 'object')) { console.error('unknown template ' + tpl); return 2; }
  const params = Object.fromEntries(argv.filter(a => /^[a-zA-Z]+=/.test(a)).map(a => [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)]));
  const scope = opt('--feed') ? { feed: opt('--feed') } : opt('--service') ? { service: opt('--service') } : null;
  const r0 = renderAlert(test ? 'test' : tpl, test ? { from: opt('--from') || 'feeds' } : params, { site, scope, test });
  if (argv.includes('--dry')) { console.log(r0.text); return 0; }
  const r = await sendTelegram(r0.text, env);
  console.log(r.log);
  return r.ok ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exit(await main());
