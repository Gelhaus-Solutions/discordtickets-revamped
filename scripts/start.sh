#!/usr/bin/env sh
set -eu

# Pterodactyl:
# - application code is stored in the image at /app
# - persistent data lives under /home/container
# - we refresh /home/container/app from /app on each boot
if [ "${PTERODACTYL:-false}" = "true" ] || [ -d /home/container ]; then
    runtime="pterodactyl"
    image_dir="/app"
    base_dir="/home/container/app"
    home_dir="/home/container"
    user_dir="/home/container/user"
    logs_dir="/home/container/logs"

    mkdir -p "$home_dir" "$user_dir" "$logs_dir"

    rm -rf "$base_dir"
    cp -R "$image_dir" "$base_dir"

    # Keep expected persistent directories present after refresh
    mkdir -p "$user_dir" "$logs_dir"

    export PTERODACTYL=true
    export DOCKER=true
    export HOME="$home_dir"
elif [ "${DOCKER:-false}" = "true" ]; then
    runtime="docker"
    base_dir="/app"
    mkdir -p /home/container/user /home/container/logs || true
else
    runtime="bare"
    base_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
fi

cd "$base_dir"

echo "Runtime: $runtime"
echo "Base directory: $base_dir"
echo "Working directory: $(pwd)"

echo "Checking environment..."
node "$base_dir/scripts/preinstall"

echo "Preparing the database..."
node "$base_dir/scripts/postinstall"

echo "Starting..."
exec node "$base_dir/src/"
