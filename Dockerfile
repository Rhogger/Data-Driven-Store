FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./

COPY src ./src

RUN npm install -g pnpm

RUN pnpm install --frozen-lockfile

RUN pnpm run build

EXPOSE 3000