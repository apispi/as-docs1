#!/usr/bin/env bash
# Copyright © 2026 ApiSpi
#
# Production deploy for SiteGround (~/www/docs.apispi.com). Run ON the server:
#
#   ./deploy.sh
#
# The docs site is fully static (hand-written HTML/CSS + markdown) — there is
# no build step, no composer/npm install, and no migrations. Deploying is a
# fast-forward git pull; this script exists so the pull is always done safely
# (fetch first, refuse on divergence, show exactly what changed).

set -euo pipefail

SITE_DIR="${SITE_DIR:-$HOME/www/docs.apispi.com}"
BRANCH="${BRANCH:-main}"

cd "$SITE_DIR"

echo "== docs.apispi.com deploy =="
echo "-- directory: $SITE_DIR"
echo "-- branch:    $BRANCH"

# Refuse to deploy over local edits — the server working tree must stay clean.
if [[ -n "$(git status --porcelain)" ]]; then
    echo "ERROR: working tree is not clean. Someone edited files directly on the server:" >&2
    git status --short >&2
    echo "Resolve (commit upstream or discard) before deploying." >&2
    exit 1
fi

echo "-- fetching origin/$BRANCH"
git fetch origin "$BRANCH"

OLD_REF="$(git rev-parse HEAD)"
NEW_REF="$(git rev-parse "origin/$BRANCH")"

if [[ "$OLD_REF" == "$NEW_REF" ]]; then
    echo "-- already up to date ($(git rev-parse --short HEAD)); nothing to deploy."
    exit 0
fi

# The server must be strictly behind origin. If HEAD is not an ancestor of
# origin/$BRANCH, someone committed on the server or origin was force-pushed.
if ! git merge-base --is-ancestor "$OLD_REF" "$NEW_REF"; then
    echo "ERROR: server HEAD ($(git rev-parse --short "$OLD_REF")) is not behind origin/$BRANCH ($(git rev-parse --short "$NEW_REF"))." >&2
    echo "History has diverged — resolve manually; refusing to deploy." >&2
    exit 1
fi

echo "-- incoming commits:"
git log --oneline "HEAD..origin/$BRANCH"

# --ff-only: if history has diverged (e.g. a force-push or server-side commit),
# stop instead of creating a merge commit on the server.
git merge --ff-only "origin/$BRANCH"

echo "-- files changed:"
git diff --stat "$OLD_REF" "$NEW_REF"

# Sanity check: the site entry point must exist after the pull.
if [[ ! -f index.html ]]; then
    echo "ERROR: index.html missing after pull — rolling back to $OLD_REF" >&2
    git reset --hard "$OLD_REF"
    exit 1
fi

echo "-- deployed $(git rev-parse --short "$OLD_REF") -> $(git rev-parse --short "$NEW_REF")"
echo "-- verify: https://docs.apispi.com"
