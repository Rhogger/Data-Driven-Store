# 🚀 Data-Driven Store

Um projeto moderno com TypeScript, Fastify e suporte a múltiplos bancos de dados.

## 📋 Scripts Disponíveis

### 🏗️ Build e Desenvolvimento

```bash
# Build do projeto (com logs melhorados)
pnpm run build

# Iniciar servidor de desenvolvimento
pnpm run start:dev

# Iniciar servidor simples (apenas node)
pnpm start

# Desenvolvimento completo (build + start)
pnpm run dev
```

### 🔧 Utilitários

```bash
# Reset completo do ambiente Docker
pnpm run reset

# Limpar diretório de build
pnpm run clean

# Formatar código
pnpm run format

# Verificar formatação
pnpm run check-format

# Lint do código
pnpm run lint
pnpm run lint:fix
```

## 🐳 Docker

```bash
# Iniciar apenas os bancos de dados
docker compose up -d postgres

# Reset completo (remove tudo e reconstrói)
./reset.sh
```

## 🌍 Variáveis de Ambiente

Arquivo `.env`:

```env
NODE_ENV=development
APP_PORT=3000
POSTGRES_HOST=postgres
POSTGRES_DB=datadriven_store
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_PORT=5433
```

##### INSTALAR ASDF > PNPM > NODE
