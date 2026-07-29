# syntax=docker/dockerfile:1

# The builder must share a libc with the runner: Temporal's native
# @temporalio/core-bridge addon is libc-specific, and there is no musl build.
# Both stages are therefore Debian (bookworm).
FROM node:22-bookworm-slim AS builder

WORKDIR /build

COPY package.json package-lock.json .npmrc ./
# npm runs the preinstall/postinstall hooks as part of `npm ci`, and both are
# `node scripts/...` — so the scripts have to be in the layer before the
# install, not just in the `COPY . .` below.
COPY scripts scripts

# The full install, devDependencies included, so the TypeScript Temporal layer
# can be compiled and the workflow bundle produced. `npm ci` installs exactly
# what package-lock.json pins — the previous `bun install --no-frozen-lockfile`
# resolved fresh versions on every build.
# CI=true stops preinstall from trying to mint an encryption key here.
RUN CI=true npm ci --include=dev --no-audit --no-fund

COPY --link . .

RUN chmod +x ./scripts/start.sh

# Compile src/temporal/*.ts -> dist/temporal and pre-bundle the workflow code.
RUN npm run temporal.build

# Pre-download the Prisma query engines and validate the schema at build time.
# The install above runs postinstall with DB_PROVIDER unset, which exits early,
# so the image previously shipped an un-generated stub client and every
# container start paid the full generate cost — with any failure surfacing only
# at runtime. postinstall regenerates for the configured provider on boot; this
# step exists so the engine binaries are already in the image. The URL is a
# placeholder, `prisma generate` never connects.
RUN DB_CONNECTION_URL="postgresql://build:build@127.0.0.1:5432/build" \
	npx prisma generate --schema db/postgresql/schema.prisma

# 6-char git SHA identifying this worker build (Temporal Worker Deployments).
ARG GIT_SHA=dev
RUN mkdir -p dist/temporal && printf "%s" "${GIT_SHA}" > dist/temporal/build-id.txt

# devDependencies have done their job; the runtime does not need a compiler.
RUN npm prune --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim AS runner
LABEL org.opencontainers.image.source=https://github.com/Gelhaus-Solutions/discordtickets-revamped \
	org.opencontainers.image.description="A fork of Discord Tickets, the open-source ticket bot for Discord, with more features and fewer bugs." \
	org.opencontainers.image.licenses="GPL-3.0-or-later"

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --home-dir /home/container --shell /bin/sh container
RUN mkdir /app && chown container:container /app

RUN mkdir -p /home/container/user /home/container/logs \
	&& chown -R container:container /home/container

USER container
ARG GIT_SHA=dev
# HTTP_PORT is defaulted here so the HEALTHCHECK below still resolves a URL when
# the container is run without one being passed in. Override it as needed.
#
# DT_DATA_DIR is what makes /home/container (the volume) hold .env, user/ and
# logs/, while the code stays in /app. Nothing branches on "am I in Docker".
ENV USER=container \
	HOME=/home/container \
	NODE_ENV=production \
	HTTP_HOST=0.0.0.0 \
	HTTP_PORT=8169 \
	DOCKER=true \
	DT_APP_DIR=/app \
	DT_DATA_DIR=/home/container \
	TEMPORAL_WORKER_BUILD_ID=${GIT_SHA}

WORKDIR /home/container

# Not --chmod=777: world-writable application code in an image is indefensible,
# and the container user owns it anyway.
COPY --from=builder --chown=container:container /build /app

ENTRYPOINT [ "/app/scripts/start.sh" ]
# Node rather than curl, so the runtime image needs no extra package.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s \
	CMD node /app/scripts/healthcheck.js || exit 1
