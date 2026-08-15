#!/bin/sh
set -e

# default UID/GIDs
PUID=${PUID:-1000}
PGID=${PGID:-1000}

# create group/user
groupadd -g "$PGID" appgroup 2>/dev/null || true
useradd -u "$PUID" -g "$PGID" -m -s /bin/sh appuser 2>/dev/null || true

# ensure permissions
chown -R "$PUID":"$PGID" /app

# run as specified user
exec gosu appuser "$@"
