FROM node:24.21.0-bookworm-slim AS build

WORKDIR /app

COPY server/package*.json ./server/
RUN npm ci --prefix server

COPY server/ ./server/

COPY client/package*.json ./client/
RUN npm ci --prefix client

COPY client/ ./client/

ENV VITE_API_URL=

RUN npm --prefix client run build \
  && npm --prefix server run build \
  && mkdir -p server/dist/db/migrations \
  && cp server/src/db/migrations/*.sql server/dist/db/migrations/ \
  && npm prune --prefix server --omit=dev

FROM node:24.21.0-bookworm-slim

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/server

COPY --from=build --chown=node:node /app/server/package*.json ./
COPY --from=build --chown=node:node /app/server/node_modules ./node_modules
COPY --from=build --chown=node:node /app/server/dist ./dist
COPY --from=build --chown=node:node /app/client/dist /app/client/dist

USER node

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
