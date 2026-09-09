#!/bin/sh
set -e

# default UID/GIDs
PUID=${PUID:-1000}
PGID=${PGID:-1000}

# create group/user
addgroup -g "$PGID" appgroup 2>/dev/null || true
adduser -u "$PUID" -G appgroup -D -s /bin/sh appuser 2>/dev/null || true

# ensure permissions
chown -R "$PUID":"$PGID" /app

# run as specified user
exec su-exec appuser "$@"
