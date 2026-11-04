#!/usr/bin/env bash
# Fortnite stats proxy of pingalto.com on our server (/fortnite/tracker, docs/MAINTENANCE.md). The server is SHARED with other sites:
# this script only creates/changes /opt/web/pingalto-fnapi/, /etc/cron.d/pingalto-fnapi and the container pingalto-fnapi.
# The container joins the network of the shared Caddy (web_default) without publishing a port; our Caddy block sends
# /api/fn/* to it (tools/server-setup.sh pingalto update). Code read-only, unprivileged uid, memory/cpu limits, restart unless-stopped.
#
# Usage (from the repository; host and key from .env, values are never printed):
#   bash tools/fnapi-server.sh install    idempotent: dirs, image, watchdog cron, container (needs secrets + sync first for a useful start)
#   bash tools/fnapi-server.sh secrets    FORTNITE_API_KEY (+ TG_BOT_TOKEN, TG_CHAT_ID for alerts) from .env -> secrets.env (root, 600), then restart
#   bash tools/fnapi-server.sh sync       code from the last COMMIT (git archive HEAD) -> app/, then restart
#   bash tools/fnapi-server.sh restart    recreate the container (new code, new key)
#   bash tools/fnapi-server.sh status     container state, health, image, synced version, keys present (names only)
#   bash tools/fnapi-server.sh logs [n]   last container log lines (no names are logged)
#
# Server layout: /opt/web/pingalto-fnapi/{app,image,bin,logs,state}, secrets.env; bin/watch.sh runs every 5 min from cron: a stopped or
# unhealthy container is recreated and a Telegram alert goes out (the service itself alerts on repeated upstream failures).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
BASE=/opt/web/pingalto-fnapi
NAME=pingalto-fnapi
IMAGE=pingalto-fnapi:node24
RUN_UID=47221
NET=web_default
KEYS=(FORTNITE_API_KEY TG_BOT_TOKEN TG_CHAT_ID)
FILES=(engine/games/fnstats.mjs tools/fnapi/core.mjs tools/fnapi/server.mjs tools/feeds/lib.mjs)

MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || echo "$ROOT/.git")")
if [ -z "${DEPLOY_HOST:-}" ]; then for f in .env "$MAIN/.env"; do if [ -f "$f" ]; then set -a; . "$f"; set +a; break; fi; done; fi
: "${DEPLOY_HOST:?DEPLOY_HOST missing in .env}" "${DEPLOY_KEY:?DEPLOY_KEY missing in .env}"
HOST="${DEPLOY_USER:-root}@${DEPLOY_HOST}"
SSH=(ssh -i "${DEPLOY_KEY/#\~/$HOME}" -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=20)

remote() {
  { printf 'BASE=%q NAME=%q IMAGE=%q RUN_UID=%q NET=%q\n' "$BASE" "$NAME" "$IMAGE" "$RUN_UID" "$NET"; cat; } | "${SSH[@]}" "$HOST" bash -s -- "$@"
}

# shared by install/restart and the watchdog: the one way the container is started
UP_SH='docker rm -f "$NAME" >/dev/null 2>&1
docker run -d --name "$NAME" --restart unless-stopped --network "$NET" \
  --user "$RUN_UID:$RUN_UID" --read-only --tmpfs /tmp:size=16m --cap-drop ALL --security-opt no-new-privileges \
  --memory 128m --memory-swap 128m --cpus 0.25 --pids-limit 64 --log-opt max-size=1m --log-opt max-file=3 \
  -e TZ=UTC -e HOME=/tmp -e NODE_OPTIONS=--dns-result-order=ipv4first --env-file "$BASE/secrets.env" \
  -v "$BASE/app:/app:ro" -w /app \
  --health-cmd "wget -qO- http://127.0.0.1:8787/api/fn/health >/dev/null || exit 1" --health-interval 60s --health-timeout 5s --health-retries 3 --health-start-period 10s \
  "$IMAGE" node tools/fnapi/server.mjs >/dev/null'

cmd_install() {
  remote <<REMOTE
set -euo pipefail
command -v docker >/dev/null || { echo "docker not found" >&2; exit 1; }
docker network inspect "\$NET" >/dev/null || { echo "network \$NET missing" >&2; exit 1; }
mkdir -p "\$BASE"/{app,image,bin,logs,state}
chmod 755 "\$BASE" "\$BASE"/{app,image,bin,logs,state}
[ -f "\$BASE/secrets.env" ] || install -m 600 /dev/null "\$BASE/secrets.env"
printf 'FROM node:24-alpine\n' > "\$BASE/image/Dockerfile"
docker build -q --pull -t "\$IMAGE" "\$BASE/image" >/dev/null && date -u +%FT%TZ > "\$BASE/state/image-built" && echo "image \$IMAGE built"
tmp=\$(mktemp "\$BASE/bin/.up.sh.XXXXXX")
{ printf '#!/usr/bin/env bash\n# start/recreate the pingalto Fortnite proxy (written by tools/fnapi-server.sh; edit there)\n'
  printf 'BASE=%q NAME=%q IMAGE=%q RUN_UID=%q NET=%q\n' "\$BASE" "\$NAME" "\$IMAGE" "\$RUN_UID" "\$NET"
  printf '%s\n' '$UP_SH'; } > "\$tmp"
chmod 755 "\$tmp"; mv -f "\$tmp" "\$BASE/bin/up.sh"
tmp=\$(mktemp "\$BASE/bin/.watch.sh.XXXXXX")
cat > "\$tmp" <<'WATCH'
#!/usr/bin/env bash
# watchdog of the pingalto Fortnite proxy (written by tools/fnapi-server.sh; edit there): recreate when stopped or unhealthy, alert
BASE=/opt/web/pingalto-fnapi; NAME=pingalto-fnapi; LOG=\$BASE/logs/watch.log
ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
[ -f "\$BASE/app/tools/fnapi/server.mjs" ] || exit 0
st=\$(docker inspect -f '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "\$NAME" 2>/dev/null || echo missing)
case "\$st" in "running healthy"|"running starting") exit 0 ;; esac
echo "\$(ts) state '\$st' -> recreate" >> "\$LOG"
"\$BASE/bin/up.sh" >> "\$LOG" 2>&1
tg=\$(grep -E '^TG_(BOT_TOKEN|CHAT_ID)=' "\$BASE/secrets.env" 2>/dev/null)
tok=\$(printf '%s\n' "\$tg" | sed -n 's/^TG_BOT_TOKEN=//p'); chat=\$(printf '%s\n' "\$tg" | sed -n 's/^TG_CHAT_ID=//p')
last=\$(cat "\$BASE/state/watch-alert" 2>/dev/null || echo 0); now=\$(date +%s)
if [ -n "\$tok" ] && [ -n "\$chat" ] && [ \$((now - last)) -gt 21600 ]; then
  curl -s -m 20 -o /dev/null "https://api.telegram.org/bot\$tok/sendMessage" --data-urlencode "chat_id=\$chat" --data-urlencode "text=pingalto fortnite proxy was '\$st', recreated (bash tools/fnapi-server.sh status)" && echo "\$now" > "\$BASE/state/watch-alert"
fi
WATCH
chmod 755 "\$tmp"; mv -f "\$tmp" "\$BASE/bin/watch.sh"
tmp=\$(mktemp /etc/cron.d/.pingalto-fnapi.XXXXXX)
printf '# pingalto.com Fortnite proxy watchdog (repo tools/fnapi-server.sh). Touches only %s and the container %s.\nSHELL=/bin/bash\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n*/5 * * * * root %s/bin/watch.sh >/dev/null 2>&1\n' "\$BASE" "\$NAME" "\$BASE" > "\$tmp"
chmod 644 "\$tmp"; chown root:root "\$tmp"; mv -f "\$tmp" /etc/cron.d/pingalto-fnapi
echo "installed: \$BASE/bin/up.sh, \$BASE/bin/watch.sh, /etc/cron.d/pingalto-fnapi (*/5)"
REMOTE
  cmd_restart
}

cmd_secrets() {
  local body="" set=() unset=()
  for k in "${KEYS[@]}"; do
    v="${!k:-}"
    if [ -n "$v" ]; then body+="$k=$v"$'\n'; set+=("$k"); else unset+=("$k"); fi
  done
  printf '%s' "$body" | "${SSH[@]}" "$HOST" "umask 077; mkdir -p $BASE; cat > $BASE/secrets.env.tmp && chmod 600 $BASE/secrets.env.tmp && mv -f $BASE/secrets.env.tmp $BASE/secrets.env"
  echo "secrets: set ${set[*]:-none}; not in .env: ${unset[*]:-none}"
  cmd_restart
}

cmd_sync() {
  local stage; stage=$(mktemp -d "${TMPDIR:-/tmp}/fnapi-sync.XXXXXX")
  git -C "$ROOT" archive HEAD -- "${FILES[@]}" | tar -x -C "$stage"
  for f in "${FILES[@]}"; do [ -f "$stage/$f" ] || { rm -rf "$stage"; echo "fnapi-server: $f is not committed" >&2; exit 1; }; done
  rsync -rlt --delete --chmod=D755,F644 -e "${SSH[*]}" "$stage/" "$HOST:$BASE/app/"
  local ver; ver="$(git -C "$ROOT" rev-parse --short HEAD)"
  "${SSH[@]}" "$HOST" "echo '$ver $(date -u +%FT%TZ)' > $BASE/state/app-version"
  rm -rf "$stage"
  echo "fnapi-server: synced commit $ver (${#FILES[@]} files)"
  git -C "$ROOT" diff --quiet HEAD -- "${FILES[@]}" || echo "note: uncommitted changes in these files were NOT synced (commit first)"
  cmd_restart
}

cmd_restart() {
  remote <<'REMOTE'
set -uo pipefail
[ -x "$BASE/bin/up.sh" ] || { echo "not installed (bash tools/fnapi-server.sh install)" >&2; exit 1; }
[ -f "$BASE/app/tools/fnapi/server.mjs" ] || { echo "code not synced yet (bash tools/fnapi-server.sh sync)"; exit 0; }
"$BASE/bin/up.sh" || exit 1
for i in $(seq 1 20); do
  h=$(docker exec "$NAME" wget -qO- http://127.0.0.1:8787/api/fn/health 2>/dev/null) && break; sleep 1
done
echo "container $NAME: $(docker inspect -f '{{.State.Status}}' "$NAME"), health: ${h:-no answer}"
REMOTE
}

cmd_status() {
  remote <<'REMOTE'
echo "== container: $(docker inspect -f '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}} since {{.State.StartedAt}} restarts={{.RestartCount}}' "$NAME" 2>/dev/null || echo MISSING)"
echo "== limits: $(docker inspect -f 'mem={{.HostConfig.Memory}} cpus={{.HostConfig.NanoCpus}} pids={{.HostConfig.PidsLimit}} restart={{.HostConfig.RestartPolicy.Name}} ro={{.HostConfig.ReadonlyRootfs}}' "$NAME" 2>/dev/null)"
echo "== image: $(docker image inspect -f '{{.Created}}' "$IMAGE" 2>/dev/null || echo MISSING), built $(cat "$BASE/state/image-built" 2>/dev/null || echo '?')"
echo "== code: $(cat "$BASE/state/app-version" 2>/dev/null || echo 'not synced')"
echo "== keys: $(sed -n 's/=.*//p' "$BASE/secrets.env" 2>/dev/null | tr '\n' ' ')"
echo "== cron: $(grep -v '^#' /etc/cron.d/pingalto-fnapi 2>/dev/null | grep watch.sh || echo MISSING)"
echo "== health: $(docker exec "$NAME" wget -qO- http://127.0.0.1:8787/api/fn/health 2>/dev/null || echo 'no answer')"
echo "== watchdog log:"; tail -n 5 "$BASE/logs/watch.log" 2>/dev/null | sed 's/^/   /' || true
REMOTE
}

cmd_logs() {
  local n="${1:-60}"; [[ "$n" =~ ^[0-9]+$ ]] || n=60
  remote "$n" <<'REMOTE'
docker logs --tail "$1" "$NAME" 2>&1
REMOTE
}

case "${1:-}" in
  install) cmd_install ;;
  secrets) cmd_secrets ;;
  sync) cmd_sync ;;
  restart) cmd_restart ;;
  status) cmd_status ;;
  logs) shift; cmd_logs "$@" ;;
  *) sed -n '2,17p' "$0"; exit 2 ;;
esac
