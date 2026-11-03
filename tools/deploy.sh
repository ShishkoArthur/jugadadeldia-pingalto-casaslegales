#!/usr/bin/env bash
# Deploy one site: bash tools/deploy.sh <jugadadeldia|pingalto|casaslegales>   (owner 2026-11-03: deploy right away, index open)
# npm test (code language, engine, help package, registries, gate selftests) -> render -> gates -> tar|ssh into a temp dir on the
# server -> rsync -a --delete into /opt/web/sites/<site>.com/ (never mv: the folder is a container bind mount; /_ref/ and
# /data/feeds/ on the server are protected from --delete) -> our Caddy block present -> https checks.
# Builds from a clean export of HEAD (other agents write into the working tree): commit first, then deploy.
set -euo pipefail
cd "$(dirname "$0")/.."
SITE="${1:-}"
case "$SITE" in jugadadeldia|pingalto|casaslegales) ;; *) echo "usage: bash tools/deploy.sh <jugadadeldia|pingalto|casaslegales>"; exit 2 ;; esac
[ -f "sites/$SITE/config.mjs" ] || { echo "ERROR: sites/$SITE does not exist yet"; exit 1; }
MAIN=$(pwd)
set -a; . "$MAIN/.env"; set +a
HOST="${DEPLOY_USER:-root}@${DEPLOY_HOST:?}"
SSHK=(-i "${DEPLOY_KEY/#\~/$HOME}" -o IdentitiesOnly=yes -o BatchMode=yes)
DOMAIN="$SITE.com"
if [ -n "$(git status --porcelain -- tools engine sites "data/sources" package.json)" ]; then
  echo "WARN: uncommitted changes in tools/ engine/ sites/ data/sources/ - deploying the committed HEAD only"
fi
WT="$MAIN/dist/_deploy-$SITE"
rm -rf "$WT"; mkdir -p "$WT"
git archive HEAD | tar -x -C "$WT"
ln -s "$MAIN/node_modules" "$WT/node_modules"
ln -s "$MAIN/.env" "$WT/.env"
cd "$WT"
npm test > test.log 2>&1 || { tail -40 test.log; echo "ERROR: npm test failed"; exit 1; }
grep -E '^check-code-lang|^ℹ (pass|fail)|^verify-|^selftest .*: (every|FAILED)' test.log
node tools/render.mjs "$SITE"
node tools/check-dist.mjs "$SITE"
DIST="$WT/dist/$SITE"
REMOTE=/opt/web/sites/$DOMAIN; TMP=/opt/web/.incoming-$DOMAIN
tar -C "$DIST" -cf - . | ssh "${SSHK[@]}" "$HOST" "rm -rf $TMP && mkdir -p $TMP $REMOTE && tar -C $TMP -xf - && rsync -a --delete --filter='P /_ref/' --filter='P /data/' --exclude=/_ref/ --exclude=/data/feeds/ $TMP/ $REMOTE/ && rm -rf $TMP"
# the shared Caddyfile is edited by other projects too: our block must be there
ssh "${SSHK[@]}" "$HOST" "grep -q '^# >>> $SITE ' /opt/web/caddy/Caddyfile" || { echo "ERROR: the $SITE block is missing from the shared Caddyfile - run: bash tools/server-setup.sh $SITE install"; exit 1; }
[ "$(curl -sk -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:443:$DEPLOY_HOST" "https://$DOMAIN/")" = 200 ] || { echo "ERROR: origin TLS for $DOMAIN is not answering 200"; exit 1; }
CHECK=$(node -e "import('./sites/$SITE/config.mjs').then(m => console.log(m.SITE.deployCheck.join(' ')))")
for u in $CHECK; do
  c=$(curl -s -o check.html -w '%{http_code}' "https://$DOMAIN$u?v=$(date +%s)")
  grep -q 'content="noindex' check.html && ni=noindex || ni=index
  echo "$u -> $c $ni"
done
cd "$MAIN"; rm -rf "$WT"
echo "deployed -> https://$DOMAIN/"
