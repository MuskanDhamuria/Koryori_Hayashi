FROM node:20-bookworm AS deps
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci

FROM node:20-bookworm AS build
WORKDIR /app

COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend/package.json backend/package-lock.json backend/tsconfig.json ./backend/
COPY backend/src ./backend/src
COPY backend/prisma ./backend/prisma
COPY backend/scripts ./backend/scripts
COPY backend/data ./backend/data
COPY Marketing ./Marketing

RUN cd backend && npm run prisma:generate && npm run build

FROM node:20-bookworm AS runtime
WORKDIR /app/backend

ENV NODE_ENV=production

COPY --from=deps /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/data ./data
COPY --from=build /app/Marketing ../Marketing

COPY backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/src/index.js"]
