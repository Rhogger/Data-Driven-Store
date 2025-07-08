FROM node:24-alpine

WORKDIR /app

# Instalar ferramentas de diagnóstico e conectividade
RUN apk add --no-cache curl netcat-openbsd bash

# Copiar arquivos de configuração
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY run.sh wait-for-databases.sh ./

# Tornar scripts executáveis
RUN chmod +x run.sh wait-for-databases.sh

# Instalar pnpm e dependências
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Em modo desenvolvimento, src será montado como volume
# Em modo produção, src será copiado na imagem
ARG MODE=production
COPY src ./src

EXPOSE 3000

CMD ["/bin/sh", "./run.sh"]
