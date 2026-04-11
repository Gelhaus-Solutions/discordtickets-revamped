# syntax=docker/dockerfile:1

FROM oven/bun:1 AS builder
WORKDIR /build

COPY --link scripts scripts
RUN chmod +x ./scripts/start.sh

COPY package.json bun.lock ./
RUN CI=true bun install --production --no-frozen-lockfile

COPY --link . .

FROM node:22-alpine3.20 AS runner

LABEL org.opencontainers.image.source="https://github.com/Gelhaus-Solutions/discordtickets-revamped"
LABEL org.opencontainers.image.description="Discord Tickets Revamped"
LABEL org.opencontainers.image.licenses="GPL-3.0-or-later"

RUN apk --no-cache add curl

RUN adduser --disabled-password --home /home/container container

RUN mkdir -p /app /home/container/user /home/container/logs \
    && chown -R container:container /app /home/container \
    && chmod -R 775 /app /home/container

USER container

ENV USER=container \
    HOME=/home/container \
    NODE_ENV=production \
    HTTP_HOST=0.0.0.0 \
    DOCKER=true \
    PTERODACTYL=false

WORKDIR /home/container

COPY --from=builder --chown=container:container /build /app

ENTRYPOINT ["/app/scripts/start.sh"]

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s \
  CMD curl -f "http://localhost:${HTTP_PORT}/status" || exit 1
