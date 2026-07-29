#!/usr/bin/env sh
#
# The entrypoint for every install method: Docker, bare metal, Pterodactyl and
# Pelican. It resolves where the application is, checks the environment, makes
# sure the Temporal layer is built and the database is migrated, and then
# replaces itself with the bot.
#
# There is no per-platform branch any more. Where state is written is decided
# by DT_DATA_DIR alone (see scripts/lib/paths.js), which the image and the eggs
# set to their persistent directory.

# Abort on the first failure. Without this a failed environment check or a
# failed `prisma migrate deploy` was ignored and the bot started anyway,
# against a stale or half-migrated schema.
set -e

# New files (notably .env) are owner-only: this file holds the bot token and
# the encryption key.
umask 077

die() {
    printf '\033[31m%s\033[0m\n' "$*" >&2
    exit 1
}

# POSIX self-location. `${BASH_SOURCE}` used to be read under `#!/usr/bin/env
# sh`, where it is bash-only: under dash it expands to nothing, so the app
# directory collapsed to "." and every path below silently depended on the
# working directory.
case $0 in
    */*) script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P) ;;
    *)   script_dir=$(CDPATH= cd -- "$(dirname -- "$(command -v -- "$0")")" && pwd -P) ;;
esac

if [ -n "${DT_APP_DIR}" ]; then
    app_dir="${DT_APP_DIR}"
else
    app_dir=$(CDPATH= cd -- "$script_dir/.." && pwd -P)
fi
export DT_APP_DIR="$app_dir"

[ -f "$app_dir/package.json" ] || die "Cannot find the application (looked in $app_dir)."

# Pterodactyl/Pelican hand the allocation over in SERVER_IP/SERVER_PORT. Only
# fill in what the operator has not set themselves — this shell cannot see
# .env, so "unset here" does not mean "unset for the bot", and these are all
# defaulted again in src/env.js.
if [ -n "${SERVER_PORT:-}" ] && [ -z "${HTTP_PORT:-}" ]; then
    HTTP_PORT="$SERVER_PORT"
    export HTTP_PORT
fi
if [ -n "${SERVER_PORT:-}" ] && [ -z "${HTTP_HOST:-}" ]; then
    # Bind to the wildcard rather than SERVER_IP: which address wings reports
    # varies, and the port is the part that has to match the allocation.
    HTTP_HOST="0.0.0.0"
    export HTTP_HOST
fi
if [ -n "${SERVER_PORT:-}" ] && [ -z "${HTTP_EXTERNAL:-}" ]; then
    # The dashboard URL, and the OAuth redirect target. A panel user who has
    # not put a domain in front of the bot yet gets the working default.
    HTTP_EXTERNAL="http://${SERVER_IP:-127.0.0.1}:${SERVER_PORT}"
    export HTTP_EXTERNAL
    echo "    HTTP_EXTERNAL is empty; using ${HTTP_EXTERNAL}"
fi

echo "==> Checking the environment"
node "$app_dir/scripts/preinstall.js" || die "Environment check failed."

echo "==> Checking the Temporal layer"
node "$app_dir/scripts/ensure-temporal.js" || die "The Temporal layer is unavailable."

echo "==> Preparing the database"
node "$app_dir/scripts/postinstall.js" --required || die "Database preparation failed."

echo "==> Starting"
cd "$app_dir"
# `exec` so the bot becomes this process: without it the shell stays as PID 1
# in Docker, takes the SIGTERM on `docker stop`, exits without passing it on,
# and the bot is SIGKILLed 10 seconds later — so the Temporal worker drain and
# the graceful shutdown in src/index.js never ran, in any deployment.
exec node "$app_dir/src"
