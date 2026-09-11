FROM node:24 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:ts

FROM node:24-bookworm AS production
RUN addgroup --system nonroot \
    && adduser --system backend --ingroup nonroot \
    && mkdir -p /app \
    && chown backend:nonroot /app
WORKDIR /app
COPY migrations ./migrations
COPY package.json package-lock.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER backend
# Use the lockfile-installed CLI. A global `npm install -g fastify-cli` can pull
# 8.0.1+, which depends on ESM pkg-up v5 and crashes with "pkgUp is not a function".
CMD ["./node_modules/.bin/fastify", "start", "--log-level", "info", "dist/app.js"]
