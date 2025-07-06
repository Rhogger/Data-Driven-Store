FROM node:24-alpine

WORKDIR /app

# Instalar netcat para teste de conectividade
RUN apk add --no-cache netcat-openbsd bash

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY run.sh wait-for-databases.sh ./
COPY src ./src

# Tornar scripts executáveis
RUN chmod +x run.sh wait-for-databases.sh

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["/bin/sh", "./run.sh"]
