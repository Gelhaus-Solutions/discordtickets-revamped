#!/usr/bin/env sh

if [ "$PTERODACTYL" = "true" ]; then
    rm -rf /home/container/app
    cp -R /app /home/container/
    base_dir="/home/container/app"
elif [ "$DOCKER" = "true" ]; then
    base_dir="/app"
else
    source="${BASH_SOURCE}"
    base_dir=$(dirname $(dirname "$source"))
fi

echo "Checking environment..."
script=scripts/preinstall
node "$base_dir/$script"

echo "Preparing the database..."
script=scripts/postinstall
node "$base_dir/$script"

# Build the Temporal TypeScript layer if it hasn't been built (e.g. local dev).
# In Docker/CI this is already produced during the image build.
if [ ! -f "$base_dir/dist/temporal/index.js" ]; then
    echo "Building Temporal layer..."
    (cd "$base_dir" && npm run temporal.build)
fi

echo "Starting..."
script=src/
node "$base_dir/$script"
