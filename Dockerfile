# syntax=docker/dockerfile:1

FROM node:24.21.0-alpine3.24 AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/shell/package.json ./apps/shell/
COPY apps/catalog/package.json ./apps/catalog/
COPY apps/movie/package.json ./apps/movie/
COPY apps/area/package.json ./apps/area/
COPY apps/bff/package.json ./apps/bff/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/http/package.json ./packages/http/
COPY packages/movies/package.json ./packages/movies/
COPY packages/tmdb/package.json ./packages/tmdb/
COPY packages/ui/package.json ./packages/ui/
COPY packages/user-data/package.json ./packages/user-data/
RUN --mount=type=cache,target=/root/.npm npm ci

FROM dependencies AS build
COPY . .
ARG VITE_PORTAL_URL=http://127.0.0.1:4100
ARG VITE_USER_DATA_DELAY_MIN_MS=300
ARG VITE_USER_DATA_DELAY_MAX_MS=1500
ARG VITE_USER_DATA_FAIL_WRITES=true
RUN npm run build

FROM dependencies AS production-dependencies
RUN --mount=type=cache,target=/root/.npm npm prune --omit=dev --ignore-scripts

FROM node:24.21.0-alpine3.24 AS bff
WORKDIR /app
ENV NODE_ENV=production BFF_HOST=0.0.0.0 BFF_PORT=4200
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/dist/bff ./dist/bff
USER node
EXPOSE 4200
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4200/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/bff/server.js"]

FROM nginx:1.30.5-alpine3.24 AS frontend
ARG APP=shell
ENV NGINX_ENVSUBST_TEMPLATE_DIR=/opt/nexo/templates \
    NGINX_ENVSUBST_OUTPUT_DIR=/usr/share/nginx/html \
    NGINX_ENVSUBST_FILTER=^NEXO_ \
    NEXO_CATALOG_REMOTE_URL=http://127.0.0.1:4101/remoteEntry.js \
    NEXO_MOVIE_REMOTE_URL=http://127.0.0.1:4102/remoteEntry.js \
    NEXO_AREA_REMOTE_URL=http://127.0.0.1:4103/remoteEntry.js
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/runtime-config.json.template /opt/nexo/templates/runtime-config.json.template
COPY --from=build /app/dist/${APP}/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
