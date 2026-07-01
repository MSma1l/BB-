# syntax=docker/dockerfile:1

# ---- Stage 1: build the static export ----
FROM node:20-slim AS build
WORKDIR /app

# Install deps from the lockfile.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source.
COPY . .

# Bake the API base URL into the static bundle so the site calls same-origin (/api).
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Next.js static export -> out/ (next.config has output: "export").
RUN npm run build

# ---- Stage 2: nginx serves the export AND reverse-proxies to the backend ----
FROM nginx:alpine AS runtime
# apache2-utils provides `htpasswd` to build the Basic Auth file at start.
RUN apk add --no-cache apache2-utils
COPY --from=build /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY web-entrypoint.sh /usr/local/bin/web-entrypoint.sh
RUN chmod +x /usr/local/bin/web-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/web-entrypoint.sh"]
