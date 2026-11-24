#!/usr/bin/env bash
# Server setup for our three sites: one Caddy block per site, each between its own markers
# ("# >>> <site>" / "# <<< <site>") in the SHARED Caddyfile. Other blocks are never edited;
# the file is re-read on the server right before writing.
#   bash tools/server-setup.sh <jugadadeldia|pingalto|casaslegales|all> [install|update]
#     install  append the block if it is missing (no-op when present)
#     update   replace ONLY the text between our markers (idempotent: no change -> no reload)
# Every write: backup -> validate -> reload -> every neighbour that answered 200 before must answer 200 after,
# otherwise roll back to the backup.
set -euo pipefail
cd "$(dirname "$0")/.."
SITE="${1:-}"; MODE="${2:-install}"
case "$MODE" in install|update) ;; *) echo "usage: bash tools/server-setup.sh <site|all> [install|update]"; exit 2 ;; esac
case "$SITE" in
  jugadadeldia|pingalto|casaslegales) SITES=("$SITE") ;;
  all) SITES=(jugadadeldia pingalto casaslegales) ;;
  *) echo "usage: bash tools/server-setup.sh <jugadadeldia|pingalto|casaslegales|all> [install|update]"; exit 2 ;;
esac
set -a; . ./.env; set +a
HOST="${DEPLOY_USER:-root}@${DEPLOY_HOST:?}"
SSHK=(-i "${DEPLOY_KEY/#\~/$HOME}" -o IdentitiesOnly=yes)
# stats intake addresses in order of priority (Domlink, 2026-10-19) and the key file of our three sites in /opt/web/caddy
INTAKE="https://larchway.net https://millbrookhub.net https://hollyquay.net"
KEYFILE="jpc-intake.key"
if [ -n "${TRAFFIC_KEY:-}" ]; then
  printf 'header_up x-key "%s"\n' "$TRAFFIC_KEY" | ssh "${SSHK[@]}" "$HOST" "umask 077; cat > /opt/web/caddy/$KEYFILE.new && mv /opt/web/caddy/$KEYFILE.new /opt/web/caddy/$KEYFILE"
  echo "intake key file written (value not shown)"
fi

block() {
  local name="$1" domain="$1.com" assets="/assets/*"
  # each site keeps its own asset folder (casaslegales: /_r/); hashed names there are cached for a year, everything else is revalidated
  # pingalto: own asset folder /s/, a 301 from any path ending in "/" (except the root) to the same path without it, and /api/fn/* to
  # the Fortnite stats proxy container (tools/fnapi-server.sh) on the shared Docker network
  # jugadadeldia: own asset folder /v/ and a 301 from a folder path without the trailing slash to the folder (/truco -> /truco/)
  local extra=""
  case "$name" in
    casaslegales) assets="/_r/*" ;;
    pingalto) assets="/s/*"; extra=$'\t@slash path_regexp slash ^(.+)/$\n\tredir @slash {re.slash.1} permanent\n\thandle /api/fn/* {\n\t\treverse_proxy pingalto-fnapi:8787\n\t}\n' ;;
    jugadadeldia) assets="/v/*"; extra=$'\t@noslash {\n\t\tnot path */\n\t\tnot path /v/*\n\t\tfile {path}/index.html\n\t}\n\tredir @noslash {path}/ permanent\n' ;;
  esac
  # visit counter (data/counter/map.json, owner 2026-11-24): the page posts to its own path; with TRAFFIC_KEY in .env the body goes on
  # as is to the stats intake (first address that answers), with the visitor's address and country from Cloudflare and the key from a
  # root-only file next to the Caddyfile (never in the Caddyfile or in git); without the key the path only answers 204
  local cpath; cpath=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('data/counter/map.json','utf8'))['$domain'].path)")
  local fwd=""
  if [ -n "${TRAFFIC_KEY:-}" ]; then
    fwd=$'\t\t@post method POST\n\t\thandle @post {\n\t\t\trequest_body {\n\t\t\t\tmax_size 4KB\n\t\t\t}\n\t\t\trewrite * /i\n\t\t\treverse_proxy '"$INTAKE"$' {\n\t\t\t\tlb_policy first\n\t\t\t\tlb_try_duration 5s\n\t\t\t\theader_up Content-Type text/plain\n\t\t\t\theader_up -Cookie\n\t\t\t\theader_up -Referer\n\t\t\t\theader_up x-site '"$domain"$'\n\t\t\t\theader_up x-ip {http.request.header.CF-Connecting-IP}\n\t\t\t\theader_up x-ua {http.request.header.User-Agent}\n\t\t\t\theader_up x-al {http.request.header.Accept-Language}\n\t\t\t\theader_up x-cc {http.request.header.CF-IPCountry}\n\t\t\t\timport /etc/caddy/'"$KEYFILE"$'\n\t\t\t}\n\t\t}\n'
  fi
  extra+=$'\thandle '"$cpath"$' {\n\t\theader Cache-Control no-store\n\t\theader X-Robots-Tag noindex\n'"$fwd"$'\t\trespond 204\n\t}\n'
  cat <<EOF
# >>> $name - $domain (repo ShishkoArthur/jugadadeldia-pingalto-casaslegales). Does not touch other blocks.
$domain {
	root * /srv/$domain
	encode gzip
	@assets path $assets
	header @assets Cache-Control "public, max-age=31536000, immutable"
	@fresh not path $assets
	header @fresh Cache-Control "no-cache"
	header X-Content-Type-Options nosniff
${extra}	try_files {path} {path}.html {path}/index.html
	file_server
	handle_errors {
		rewrite * /404.html
		file_server
	}
}
www.$domain {
	redir https://$domain{uri} permanent
}
# <<< $name
EOF
}

for name in "${SITES[@]}"; do
  B64=$(block "$name" | base64 -w0)
  echo "== $name"
  ssh "${SSHK[@]}" "$HOST" "NAME=$name MODE=$MODE B64=$B64 bash -s" <<'REMOTE'
set -euo pipefail
CF=/opt/web/caddy/Caddyfile
DOMAIN="$NAME.com"
NEIGHBOURS="gambeteo.com blackjack.cab simsinohub.com rinkmath.com kenomath.com atlassinoar.com atlassinoca.com casinovictoriargentina.com jugadadeldia.com pingalto.com casaslegales.com"
NEW=$(mktemp); printf '%s' "$B64" | base64 -d > "$NEW"
mkdir -p "/opt/web/sites/$DOMAIN/data/feeds"
[ -f "/opt/web/sites/$DOMAIN/index.html" ] || printf '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>%s</title><p>%s</p>\n' "$NAME" "$NAME" > "/opt/web/sites/$DOMAIN/index.html"
has=$(grep -c "^# >>> $NAME " "$CF" || true); ends=$(grep -c "^# <<< $NAME\$" "$CF" || true)
if [ "$MODE" = install ] && [ "$has" != 0 ]; then echo "block already present (use: update)"; rm -f "$NEW"; exit 0; fi
if [ "$MODE" = update ] && { [ "$has" != 1 ] || [ "$ends" != 1 ]; }; then echo "ERROR: expected exactly one $NAME block (start $has, end $ends) - nothing changed"; rm -f "$NEW"; exit 1; fi
if [ "$MODE" = install ] && grep -qE "^(www\.)?$DOMAIN *\{" "$CF"; then echo "ERROR: $DOMAIN already has a site block outside our markers - nothing changed"; rm -f "$NEW"; exit 1; fi
OUT=$(mktemp)
if [ "$MODE" = install ]; then { cat "$CF"; printf '\n'; cat "$NEW"; } > "$OUT"
else awk -v nf="$NEW" -v s="^# >>> $NAME " -v e="^# <<< $NAME\$" '$0~s{while((getline l < nf)>0) print l; skip=1; next} $0~e{skip=0; next} !skip{print}' "$CF" > "$OUT"; fi
if cmp -s "$OUT" "$CF"; then echo "caddy block unchanged"; rm -f "$NEW" "$OUT"; exit 0; fi
declare -A BEFORE
for d in $NEIGHBOURS; do [ "$d" = "$DOMAIN" ] && continue; BEFORE[$d]=$(curl -s -o /dev/null -w '%{http_code}' -m 10 --resolve "$d:443:127.0.0.1" "https://$d/" || true); done
BAK="$CF.bak-$NAME-$(date +%Y%m%d-%H%M%S)"
cp -p "$CF" "$BAK"
cat "$OUT" > "$CF"; rm -f "$NEW" "$OUT"
rollback() { echo "ROLLBACK: $1"; cat "$BAK" > "$CF"; docker exec web-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true; exit 1; }
docker exec web-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 || rollback "validate failed"
docker exec web-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || rollback "reload failed"
sleep 3
for d in "${!BEFORE[@]}"; do
  c=$(curl -s -o /dev/null -w '%{http_code}' -m 10 --resolve "$d:443:127.0.0.1" "https://$d/" || true)
  echo "$d -> ${BEFORE[$d]} / $c"
  [ "${BEFORE[$d]}" != "200" ] || [ "$c" = "200" ] || rollback "site $d answered $c (was 200)"
done
sleep 5
echo "$DOMAIN (certificate may take a minute) -> $(curl -sk -o /dev/null -w '%{http_code}' -m 15 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" || true)"
echo "caddy block written ($MODE), backup $BAK"
REMOTE
done
