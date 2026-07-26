# syntax=docker/dockerfile:1

FROM oven/bun:1 AS builder

WORKDIR /build

COPY --link scripts scripts
RUN chmod +x ./scripts/start.sh

COPY package.json bun.lock ./

# Full install (incl. devDependencies) so the TypeScript Temporal layer can be
# compiled and the workflow bundle produced. If you prefer strict
# reproducibility, update and commit `bun.lock` and re-enable `--frozen-lockfile`.
RUN CI=true bun install --no-frozen-lockfile

COPY --link . .

# Compile src/temporal/*.ts -> dist/temporal and pre-bundle the workflow code.
RUN bun run temporal.build

# Pre-download the Prisma query engines and validate the schema at build time.
# `bun install` above runs postinstall with DB_PROVIDER unset, which exits
# early, so the image previously shipped an un-generated stub client and every
# container start paid the full generate cost — with any failure surfacing only
# at runtime. postinstall regenerates for the configured provider on boot; this
# step exists so the engine binaries are already in the image. The URL is a
# placeholder, `prisma generate` never connects.
RUN DB_CONNECTION_URL="postgresql://build:build@127.0.0.1:5432/build" \
	bunx prisma generate --schema db/postgresql/schema.prisma

# 6-char git SHA identifying this worker build (Temporal Worker Deployments).
ARG GIT_SHA=dev
RUN mkdir -p dist/temporal && printf "%s" "${GIT_SHA}" > dist/temporal/build-id.txt

# NOTE: glibc runner (bookworm) — Temporal's native @temporalio/core-bridge
# addon is libc-specific, so the runtime libc must match the builder's (debian).
FROM node:22-bookworm-slim AS runner
LABEL org.opencontainers.image.source=https://github.com/Gelhaus-Solutions/discordtickets-revamped \
	org.opencontainers.image.description="A fork of Discord Tickets, the open-source ticket bot for Discord, with more features and fewer bugs." \
	org.opencontainers.image.licenses="GPL-3.0-or-later"

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --home-dir /home/container --shell /bin/sh container
RUN mkdir /app \
	&& chown container:container /app \
	&& chmod -R 777 /app

RUN mkdir -p /home/container/user /home/container/logs \
	&& chown -R container:container /home/container

USER container
ARG GIT_SHA=dev
# HTTP_PORT is defaulted here so the HEALTHCHECK below still resolves a URL when
# the container is run without one being passed in. Override it as needed.
ENV USER=container \
	HOME=/home/container \
	NODE_ENV=production \
	HTTP_HOST=0.0.0.0 \
	HTTP_PORT=8169 \
	DOCKER=true \
	TEMPORAL_WORKER_BUILD_ID=${GIT_SHA}

WORKDIR /home/container

COPY --from=builder --chown=container:container --chmod=777 /build /app

ENTRYPOINT [ "/app/scripts/start.sh" ]
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s \
	CMD curl -f http://localhost:${HTTP_PORT}/status || exit 1
