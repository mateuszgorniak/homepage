#!/bin/sh
set -e

# Install deps when using a bind mount (node_modules lives in a named volume).
if [ ! -d node_modules/astro ]; then
  echo "📦 Installing dependencies..."
  npm ci
fi

# Stale Astro dev lock (host bind mount or previous container) blocks `astro dev`.
rm -f .astro/dev.json .astro/dev.log 2>/dev/null || true

exec "$@"
