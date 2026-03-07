FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package.json
RUN npm install

COPY tsconfig.json tsconfig.json
COPY prisma prisma
RUN npx prisma generate

COPY src src
RUN npm run build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && npm run prisma:seed && node dist/src/index.js"]
