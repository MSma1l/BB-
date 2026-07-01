#!/bin/sh
# Generate the HTTP Basic Auth file for /admin-bb from env, then start nginx.
# Edge protection (defense-in-depth) on top of the app's JWT admin login.
set -e

EDGE_AUTH_USER="${EDGE_AUTH_USER:-admin}"
EDGE_AUTH_PASSWORD="${EDGE_AUTH_PASSWORD:-bbreeze-edge}"

# -b: read password from CLI, -c: create file, -B: bcrypt hashing.
htpasswd -bcB /etc/nginx/.htpasswd "$EDGE_AUTH_USER" "$EDGE_AUTH_PASSWORD" >/dev/null 2>&1

echo "[web] /admin-bb protected by HTTP Basic Auth (user: $EDGE_AUTH_USER)"
exec nginx -g 'daemon off;'
