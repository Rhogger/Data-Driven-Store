FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./

COPY run.sh ./

COPY src ./src

# Tornar script executável
RUN chmod +x run.sh

RUN npm install -g pnpm

RUN pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["/bin/sh", "./run.sh"]
