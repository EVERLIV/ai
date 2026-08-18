# Timeweb App Platform's default Frontend/React builder always runs:
#   apt-get update && apt-get install curl
# against deb.debian.org. Their build network often cannot reach that
# mirror (IPv6 unreachable, IPv4 timeout), so deploy fails before npm.
#
# This image never calls apt-get. It uses official Alpine Node/nginx
# images from Docker Hub and serves the Vite SPA on port 8080.
#
# Timeweb: set the app type to "Dockerfile" (not Frontend / React),
# then redeploy. Keep EXPOSE 8080 — that is the port App Platform probes.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Vite reads .env.production on its own; generate-seo.mjs only sees process.env.
RUN set -a && . ./.env.production && set +a && npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx-frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
