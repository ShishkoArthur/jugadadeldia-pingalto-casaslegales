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
