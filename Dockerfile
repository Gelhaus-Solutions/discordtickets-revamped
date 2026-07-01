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

# 6-char git SHA identifying this worker build (Temporal Worker Deployments).
ARG GIT_SHA=dev
RUN mkdir -p dist/temporal && printf "%s" "${GIT_SHA}" > dist/temporal/build-id.txt

# NOTE: glibc runner (bookworm) — Temporal's native @temporalio/core-bridge
# addon is libc-specific, so the runtime libc must match the builder's (debian).
FROM node:22-bookworm-slim AS runner
LABEL org.opencontainers.image.source=https://github.com/discord-tickets/bot \
	org.opencontainers.image.description="The most popular open-source ticket bot for Discord." \
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
ENV USER=container \
	HOME=/home/container \
	NODE_ENV=production \
	HTTP_HOST=0.0.0.0 \
	DOCKER=true \
	TEMPORAL_WORKER_BUILD_ID=${GIT_SHA}

WORKDIR /home/container

COPY --from=builder --chown=container:container --chmod=777 /build /app

ENTRYPOINT [ "/app/scripts/start.sh" ]
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s \
	CMD curl -f http://localhost:${HTTP_PORT}/status || exit 1
