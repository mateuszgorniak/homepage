FROM node:24-alpine AS base

WORKDIR /app

ENV ASTRO_TELEMETRY_DISABLED=1 \
    NODE_ENV=development

RUN apk add --no-cache libc6-compat

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

# --- Development: hot reload (docker compose up) ---
FROM base AS dev

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4321

CMD ["npm", "run", "dev:docker"]

# --- Production build: static files for GitHub Pages ---
FROM base AS build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG BASE_PATH=/rubycon-homepage/
ARG SITE_URL=https://example.github.io
ENV BASE_PATH=${BASE_PATH} \
    SITE_URL=${SITE_URL}

RUN npm run build

# --- Preview: serve the production build locally ---
FROM base AS preview

COPY package.json package-lock.json ./
RUN npm ci

COPY --from=build /app/dist ./dist
COPY astro.config.mjs ./

EXPOSE 4321

CMD ["npm", "run", "preview:docker"]
