FROM node:24-alpine AS builder

RUN npm -g i pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml /app/

ENV NPM_CONFIG_STORE_DIR=/pnpm
ENV NPM_CONFIG_PACKAGE_IMPORT_METHOD=copy
ENV NODE_ENV=production

RUN --mount=type=cache,id=pnmcache,target=/pnpm \
    pnpm install --prefer-offline --ignore-scripts --frozen-lockfile

COPY . /app/

RUN pnpm run build

FROM node:24-alpine AS runner

WORKDIR /app
COPY --from=builder /app .

VOLUME [ "/app/data" ]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT [ "node", "/app/dist/server.js" ]
