#!/usr/bin/env bash
# Live data of jugadadeldia.com, pingalto.com and casaslegales.com on our server (docs/FEEDS.md). The server is SHARED with other sites: for a site
# this script only creates/changes /opt/web/<site>-feeds/, /etc/cron.d/<site>-feeds and files in /opt/web/sites/<site>.com/data/feeds/.
# Each site has its own folder, cron file, minute, uid, image tag and User-Agent (the sites must not look like a network).
# Feeds run from cron inside a throwaway container (nothing installed on the host), as an unprivileged uid, code read-only.
#
# Usage (from the repository on the development machine; host and key from .env, values are never printed):
#   bash tools/feeds-server.sh <site> install       idempotent: dirs, image, runner script, cron file
#   bash tools/feeds-server.sh <site> secrets       copy this site's keys from .env to the server (chmod 600, root only)
#   bash tools/feeds-server.sh <site> sync          copy what the feeds need (tools/feeds, engine, source JSON) from the last COMMIT (git
#                                                   archive HEAD, like deploy.sh: uncommitted files of other agents never ship)
#   bash tools/feeds-server.sh <site> stage <dir>   write that same file set into <dir> (no server; used by the tests)
#   bash tools/feeds-server.sh casaslegales pull [--write]   copies the server rechecked -> repository (pull-apply.mjs; dry run without --write)
#   bash tools/feeds-server.sh <site> run [names] [--force]   run now (--once; waits up to 60 s for a running job) and show the log
#   bash tools/feeds-server.sh <site> run --test-alert        one "[test]" Telegram message of this site from the server (no feeds run)
#   bash tools/feeds-server.sh <site> status        cron, image, synced version, _health.json summary, last log lines
#   bash tools/feeds-server.sh <site> logs [lines]  tail of the runner log
#   bash tools/feeds-server.sh <site> uninstall     remove the cron file only (code, keys and data stay)
#
# Server layout (per site):
#   /opt/web/<site>-feeds/app/        synced code (read-only in the container)
#   /opt/web/<site>-feeds/cache/      HTTP cache of the feed client
#   /opt/web/<site>-feeds/state/      _log.json (attempts), _alerts.json (alert de-duplication), last-exit, app-version, image-built
#   /opt/web/<site>-feeds/logs/       runner.log (rotated by size: 1 MB x 4)
#   /opt/web/<site>-feeds/secrets.env keys for the container (root, 600); Telegram alerts start when TG_BOT_TOKEN and TG_CHAT_ID are in it
#   /opt/web/<site>-feeds/bin/run.sh  what cron calls (flock, timeout, docker run)
#   /opt/web/sites/<site>.com/data/feeds/   <name>.json + _health.json (served by the site; protected from deploy --delete)
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
SITE="${1:-}"; shift || true
case "$SITE" in
  jugadadeldia)
    CRON_SPEC='4,19,34,49 * * * *'; RUN_UID=47210; IMAGE=jugadadeldia-feeds:node24; APK='poppler-utils'
    KEYS=(TG_BOT_TOKEN TG_CHAT_ID)
    # the feed "fuentes" reads the descriptions of the saved sources (JSON only, never the saved documents) for their expiry dates
    SRC_SETS=(lottery rg truco generala chinchon escoba burako)
    # how long a copy stays fresh (owner copy or downloaded): one dependency-free file
    EXTRA_RULES=(--include='/tools/lib/' --include='/tools/lib/copyage.mjs') ;;
  pingalto)
    CRON_SPEC='23 * * * *'; RUN_UID=47220; IMAGE=pingalto-feeds:node24; APK=''
    KEYS=(PANDASCORE_TOKEN CR_API_KEY BS_API_KEY TG_BOT_TOKEN TG_CHAT_ID)
    SRC_SETS=() ;;
  casaslegales)
    # daily; the feed listas goes to the network about once a month (tools/feeds/casaslegales/listas.mjs)
    CRON_SPEC='37 6 * * *'; RUN_UID=47230; IMAGE=casaslegales-feeds:node24; APK='poppler-utils'
    KEYS=(TG_BOT_TOKEN TG_CHAT_ID)
    SRC_SETS=(registries provinces rg operators reviews)
    EXTRA_RULES=(--include='/data/sources/brands.json' --include='/data/shots/' --include='/data/shots/shots.json'
      --include='/tools/env.mjs' --include='/tools/verify-rg.mjs' --include='/tools/lib/' --include='/tools/lib/*.mjs')
    HEALTH_MAX_H=26 ;;
  *) sed -n '2,28p' "$0"; exit 2 ;;
esac
: "${HEALTH_MAX_H:=2}"; EXTRA_RULES=("${EXTRA_RULES[@]+"${EXTRA_RULES[@]}"}")
BASE=/opt/web/$SITE-feeds
OUT=/opt/web/sites/$SITE.com/data/feeds
CRON=/etc/cron.d/$SITE-feeds

MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || echo "$ROOT/.git")")
server() {
  if [ -z "${DEPLOY_HOST:-}" ]; then for f in .env "$MAIN/.env"; do if [ -f "$f" ]; then set -a; . "$f"; set +a; break; fi; done; fi
  : "${DEPLOY_HOST:?DEPLOY_HOST missing in .env}" "${DEPLOY_KEY:?DEPLOY_KEY missing in .env}"
  HOST="${DEPLOY_USER:-root}@${DEPLOY_HOST}"
  SSH=(ssh -i "${DEPLOY_KEY/#\~/$HOME}" -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=20)
}

SRC_RULES=()
if [ "${#SRC_SETS[@]}" -gt 0 ]; then
  SRC_RULES=(--include='/data/' --include='/data/sources/')
  for s in "${SRC_SETS[@]}"; do SRC_RULES+=(--include="/data/sources/$s/" --include="/data/sources/$s/*.json"); done
fi
SYNC_RULES=(
  --exclude='test/' --exclude='fixtures/' --exclude='*.test.mjs' --exclude='.DS_Store'
  --include='/package.json'
  "${SRC_RULES[@]+"${SRC_RULES[@]}"}" "${EXTRA_RULES[@]+"${EXTRA_RULES[@]}"}"
  --include='/data/' --include='/data/alerts/' --include='/data/alerts/ru.json'
  --include='/tools/' --include='/tools/feeds/' --include='/tools/feeds/lib.mjs' --include='/tools/feeds/run.mjs'
  --include='/tools/feeds/alerts.mjs' --include='/tools/feeds/notify.mjs'
  --include="/tools/feeds/$SITE/***"
  --include='/engine/***'
  --exclude='*'
)

remote() {
  { printf 'SITE=%q BASE=%q OUT=%q CRON=%q CRON_SPEC=%q IMAGE=%q RUN_UID=%q APK=%q HEALTH_MAX_H=%q\n' "$SITE" "$BASE" "$OUT" "$CRON" "$CRON_SPEC" "$IMAGE" "$RUN_UID" "$APK" "$HEALTH_MAX_H"; cat; } \
    | "${SSH[@]}" "$HOST" bash -s -- "$@"
}

cmd_install() {
  server
  remote <<'REMOTE'
set -euo pipefail
command -v docker >/dev/null || { echo "docker not found on the server" >&2; exit 1; }
command -v flock >/dev/null && command -v timeout >/dev/null || { echo "flock/timeout not found" >&2; exit 1; }
mkdir -p "$BASE"/{app,cache,state,logs,bin,image} "$OUT"
chown "$RUN_UID:$RUN_UID" "$BASE/cache" "$BASE/state" "$OUT"
chmod 755 "$BASE" "$BASE"/{app,cache,state,logs,bin,image} "$OUT"
[ -f "$BASE/secrets.env" ] || { install -m 600 /dev/null "$BASE/secrets.env"; }
tmp=$(mktemp "$BASE/image/.Dockerfile.XXXXXX")
{ echo "FROM node:24-alpine"; [ -n "$APK" ] && echo "RUN apk add --no-cache $APK"; echo 'ENV NODE_OPTIONS=--dns-result-order=ipv4first'; } >"$tmp"
mv -f "$tmp" "$BASE/image/Dockerfile"; chmod 644 "$BASE/image/Dockerfile"
tmp=$(mktemp "$BASE/bin/.run.sh.XXXXXX")
{ printf '#!/usr/bin/env bash\n'
  printf 'SITE=%q BASE=%q OUT=%q IMAGE=%q RUN_UID=%q\n' "$SITE" "$BASE" "$OUT" "$IMAGE" "$RUN_UID"
  cat <<'RUNSH'
# Feeds runner of one site (written by tools/feeds-server.sh install; edit there, not here). Args go to tools/feeds/run.mjs
# (feed names, --force). FEEDS_LOCK_WAIT=<s> waits for a running job (cron: 0 = skip).
set -uo pipefail
NAME=$SITE-feeds-run
LOG=$BASE/logs/runner.log
ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
exec 9>"$BASE/run.lock"
if ! flock -w "${FEEDS_LOCK_WAIT:-0}" 9; then echo "$(ts) skip: previous run still active" >>"$LOG"; exit 0; fi
if [ -f "$LOG" ] && [ "$(stat -c %s "$LOG")" -gt 1048576 ]; then
  for i in 2 1; do [ -f "$LOG.$i" ] && mv -f "$LOG.$i" "$LOG.$((i + 1))"; done
  mv -f "$LOG" "$LOG.1"
fi
if [ ! -f "$BASE/app/tools/feeds/run.mjs" ]; then echo "$(ts) not synced yet" >>"$LOG"; echo "3 $(ts)" >"$BASE/state/last-exit"; exit 3; fi
stamp=$BASE/state/image-built
# rebuild our image monthly (Node and poppler security fixes); on failure the current image stays; only our old image is removed
if ! docker image inspect "$IMAGE" >/dev/null 2>&1 || [ -z "$(find "$stamp" -mtime -30 2>/dev/null)" ]; then
  old=$(docker image inspect -f '{{.Id}}' "$IMAGE" 2>/dev/null || true)
  if docker build -q --pull -t "$IMAGE" "$BASE/image" >/dev/null 2>&1; then
    date -u +%FT%TZ >"$stamp"; echo "$(ts) image $IMAGE built" >>"$LOG"
    new=$(docker image inspect -f '{{.Id}}' "$IMAGE" 2>/dev/null || true)
    [ -n "$old" ] && [ "$old" != "$new" ] && docker rmi "$old" >/dev/null 2>&1
  else echo "$(ts) image build failed, keeping the current one" >>"$LOG"; fi
fi
# a site deploy (rsync -a as root) may hand data/feeds back to the deploy user: the container writes as RUN_UID
mkdir -p "$OUT" "$BASE/cache" "$BASE/state" && chown "$RUN_UID:$RUN_UID" "$OUT" "$BASE/cache" "$BASE/state" && chmod 755 "$OUT"
find "$OUT" "$BASE/state" -maxdepth 1 -type f -name '*.json' ! -user "$RUN_UID" -exec chown "$RUN_UID:$RUN_UID" {} + 2>/dev/null
docker rm -f "$NAME" >/dev/null 2>&1
echo "$(ts) start $*" >>"$LOG"
timeout -k 30 900 docker run --rm --name "$NAME" \
  --user "$RUN_UID:$RUN_UID" --read-only --tmpfs /tmp:size=96m --cap-drop ALL --security-opt no-new-privileges \
  --memory 512m --cpus 0.5 --pids-limit 128 -e HOME=/tmp -e TZ=UTC --env-file "$BASE/secrets.env" \
  -v "$BASE/app:/app:ro" -v "$BASE/cache:/cache" -v "$BASE/state:/state" -v "$OUT:/out" -w /app \
  "$IMAGE" timeout 840 node tools/feeds/run.mjs --site "$SITE" --out /out --cache /cache --log /state/_log.json "$@" >>"$LOG" 2>&1
rc=$?
docker rm -f "$NAME" >/dev/null 2>&1
echo "$(ts) end exit=$rc" >>"$LOG"
echo "$rc $(ts)" >"$BASE/state/last-exit"
exit $rc
RUNSH
} >"$tmp"
chmod 755 "$tmp"; mv -f "$tmp" "$BASE/bin/run.sh"
tmp=$(mktemp "/etc/cron.d/.$SITE-feeds.XXXXXX")
cat >"$tmp" <<CRONF
# $SITE.com live data (repo tools/feeds-server.sh). Touches only $BASE and $OUT.
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
$CRON_SPEC root $BASE/bin/run.sh >/dev/null 2>&1
CRONF
chmod 644 "$tmp"; chown root:root "$tmp"; mv -f "$tmp" "$CRON"
docker build -q --pull -t "$IMAGE" "$BASE/image" >/dev/null && date -u +%FT%TZ >"$BASE/state/image-built" && echo "image $IMAGE built"
echo "node in image: $(docker run --rm --user "$RUN_UID:$RUN_UID" "$IMAGE" node -v)"
[ -n "$APK" ] && echo "pdftotext in image: $(docker run --rm --user "$RUN_UID:$RUN_UID" "$IMAGE" sh -c 'pdftotext -v 2>&1 | head -1')"
echo "installed: $BASE/bin/run.sh, $CRON ($CRON_SPEC UTC)"
REMOTE
}

# keys of this site only, from the local .env to the server; values never printed (only names and whether they are set)
cmd_secrets() {
  server
  local body="" set=() unset=()
  for k in "${KEYS[@]}"; do
    v="${!k:-}"
    if [ -n "$v" ]; then body+="$k=$v"$'\n'; set+=("$k"); else unset+=("$k"); fi
  done
  printf '%s' "$body" | "${SSH[@]}" "$HOST" "umask 077; mkdir -p $BASE; cat > $BASE/secrets.env.tmp && chmod 600 $BASE/secrets.env.tmp && mv -f $BASE/secrets.env.tmp $BASE/secrets.env"
  echo "secrets: set ${set[*]:-none}; not in .env: ${unset[*]:-none}"
}

# the committed file set (git archive HEAD, filtered by SYNC_RULES) in a directory; nothing from the working tree
cmd_stage() {
  local dir="$1"; [ -n "$dir" ] || { echo "usage: stage <dir>" >&2; exit 2; }
  local tmp; tmp=$(mktemp -d "${TMPDIR:-/tmp}/feeds-stage.XXXXXX")
  git -C "$ROOT" archive HEAD -- package.json tools engine data/sources data/shots/shots.json data/alerts 2>/dev/null | tar -x -C "$tmp" \
    || { rm -rf "$tmp"; echo "feeds-server: git archive HEAD failed" >&2; exit 1; }
  mkdir -p "$dir"
  rsync -rlt --delete --delete-excluded --chmod=D755,F644 "${SYNC_RULES[@]}" "$tmp/" "$dir/"
  rm -rf "$tmp"
}

cmd_sync() {
  server
  "${SSH[@]}" "$HOST" "test -x $BASE/bin/run.sh" || { echo "feeds-server: not installed (bash tools/feeds-server.sh $SITE install)" >&2; exit 1; }
  local stage; stage=$(mktemp -d "${TMPDIR:-/tmp}/feeds-sync.XXXXXX")
  cmd_stage "$stage/app"
  rsync -rlt --delete --chmod=D755,F644 --rsync-path="flock -w 120 $BASE/run.lock rsync" -e "${SSH[*]}" "$stage/app/" "$HOST:$BASE/app/"
  local ver; ver="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  "${SSH[@]}" "$HOST" "echo '$ver $(date -u +%FT%TZ)' > $BASE/state/app-version"
  echo "feeds-server $SITE: synced commit $ver ($(find "$stage/app/tools/feeds/$SITE" -maxdepth 1 -name '*.mjs' | wc -l) feed files, $(find "$stage/app" -type f | wc -l) files)"
  rm -rf "$stage"
  git -C "$ROOT" diff --quiet HEAD -- tools/feeds tools/lib engine data/sources data/alerts 2>/dev/null \
    || echo "note: uncommitted changes in tools/feeds, tools/lib, engine or data/sources were NOT synced (commit first)"
}

# casaslegales: the copies the server rechecked (state/docs/listas) and listas.json -> .cache/feeds-pull/ -> pull-apply.mjs
cmd_pull() {
  [ "$SITE" = casaslegales ] || { echo "pull: only casaslegales keeps rechecked copies" >&2; exit 2; }
  server
  local dir="$ROOT/.cache/feeds-pull/$SITE"
  rm -rf "$dir"; mkdir -p "$dir/docs"
  rsync -rt -e "${SSH[*]}" "$HOST:$BASE/state/docs/listas" "$dir/docs/" 2>/dev/null || { echo "pull: no rechecked copies on the server yet" >&2; exit 1; }
  rsync -t -e "${SSH[*]}" "$HOST:$OUT/listas.json" "$dir/listas.json"
  node "$ROOT/tools/feeds/casaslegales/pull-apply.mjs" "$dir" "$@"
}

cmd_run() {
  server
  for a in "$@"; do [[ "$a" =~ ^([a-z0-9]+|--force|--test-alert)$ ]] || { echo "bad argument: $a" >&2; exit 2; }; done
  remote "$@" <<'REMOTE'
LOG=$BASE/logs/runner.log
s=$(stat -c %s "$LOG" 2>/dev/null || echo 0)
FEEDS_LOCK_WAIT=60 "$BASE/bin/run.sh" "$@"; rc=$?
n=$(stat -c %s "$LOG" 2>/dev/null || echo 0)
if [ "$n" -ge "$s" ]; then tail -c +$((s + 1)) "$LOG"; else cat "$LOG"; fi
exit $rc
REMOTE
}

cmd_status() {
  server
  remote <<'REMOTE'
echo "== cron: $( [ -f "$CRON" ] && grep -v '^#' "$CRON" | grep run.sh || echo 'MISSING')"
echo "== image: $(docker image inspect -f '{{.Created}}' "$IMAGE" 2>/dev/null || echo MISSING), built $(cat "$BASE/state/image-built" 2>/dev/null || echo '?')"
echo "== code: $(cat "$BASE/state/app-version" 2>/dev/null || echo 'not synced')"
echo "== keys: $(sed -n 's/=.*//p' "$BASE/secrets.env" 2>/dev/null | tr '\n' ' ')"
echo "== last exit: $(cat "$BASE/state/last-exit" 2>/dev/null || echo 'never ran') (0 ok, 1 stale/broken feed, 3 not synced, 124 timeout)"
H="$OUT/_health.json"
if [ -f "$H" ]; then
  python3 - "$H" "$HEALTH_MAX_H" <<'PY'
import json, sys, datetime
h = json.load(open(sys.argv[1]))
limit = float(sys.argv[2])
gen = datetime.datetime.fromisoformat(h['generated'].replace('Z', '+00:00'))
age = (datetime.datetime.now(datetime.timezone.utc) - gen).total_seconds() / 3600
print('== health: %s, generated %s (%.1f h ago)%s' % ('OK' if h['ok'] else 'PROBLEMS', h['generated'], age, '  <-- scheduler stopped?' if age > limit else ''))
for p in h.get('problems', []): print('   ! ' + p)
print('   %-12s %-7s %8s %6s %-5s %-5s %s' % ('feed', 'cadence', 'age h', 'max h', 'stale', 'fails', 'last error'))
for n, f in sorted(h['feeds'].items()):
    err = f['lastError']['at'] + ' ' + f['lastError']['message'][:70] if f.get('lastError') else '-'
    a = '-' if f['ageHours'] is None else '%.1f' % f['ageHours']
    print('   %-12s %-7s %8s %6s %-5s %-5s %s' % (n, f['cadence'] + ('' if f['enabled'] else '/off'), a, f['maxAgeHours'], 'YES' if f['stale'] else 'no', f['consecutiveFailures'], err))
ex = h.get('expiries') or []
if ex:
    print('== expiries (%d; warn = days before the alert, 0 = alert only once expired):' % len(ex))
    for x in ex: print('   %-10s %5s d  %-7s warn %-2s %-28s %s' % (x['until'], x['daysLeft'], x['state'].upper() if x['state'] != 'ok' else 'ok', x['warnDays'], x['id'][:28], x['what'][:90]))
PY
else echo "== health: no _health.json yet"; fi
echo "== files in $OUT:"; ls -la --time-style=+%FT%TZ "$OUT" | tail -n +4 | awk '{print "   " $5 "\t" $6 "\t" $7}'
echo "== last log lines:"; tail -n 12 "$BASE/logs/runner.log" 2>/dev/null | sed 's/^/   /' || echo "   (no log)"
REMOTE
}

cmd_logs() {
  server
  local n="${1:-80}"; [[ "$n" =~ ^[0-9]+$ ]] || n=80
  remote "$n" <<'REMOTE'
tail -n "$1" "$BASE/logs/runner.log" 2>/dev/null || echo "(no log)"
REMOTE
}

cmd_uninstall() {
  server
  remote <<'REMOTE'
rm -f "$CRON" && echo "removed $CRON; $BASE and $OUT are kept"
REMOTE
}

case "${1:-}" in
  install) cmd_install ;;
  secrets) cmd_secrets ;;
  sync) cmd_sync ;;
  stage) shift; cmd_stage "${1:-}" ;;
  pull) shift; cmd_pull "$@" ;;
  run) shift; cmd_run "$@" ;;
  status) cmd_status ;;
  logs) shift; cmd_logs "$@" ;;
  uninstall) cmd_uninstall ;;
  *) sed -n '2,28p' "$0"; exit 2 ;;
esac
