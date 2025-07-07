#!/bin/bash

# Carregar variáveis do .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Determinar modo (Produção/Desenvolvimento)
if [ "${NODE_ENV}" = "development" ]; then
    MODE_NAME="DESENVOLVIMENTO"
else
    MODE_NAME="PRODUÇÃO"
fi

echo "=========================================="
echo "   DATA-DRIVEN STORE - START DOCKER"
echo "=========================================="
echo "🎯 MODO ATIVO: $MODE_NAME"
echo "=========================================="
echo ""

API_SERVICE_NAME="dds_api"
DB_SERVICES="postgres mongo redis neo4j cassandra"

# 1. Limpeza seletiva (preserva dados do banco)
echo "🧹 1. Parando e removendo container da API..."
docker compose stop "$API_SERVICE_NAME"
docker compose rm -f "$API_SERVICE_NAME"
echo "✅ Limpeza seletiva finalizada."

# 2. Compilar o projeto TypeScript
echo "📦 2. Compilando o projeto TypeScript..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao compilar o projeto."
    exit 1
fi
echo "✅ Projeto compilado."

# 3. Iniciar todos os serviços
echo "🚀 3. Iniciando serviços e reconstruindo a API..."
docker compose up -d --build --force-recreate "$API_SERVICE_NAME" $DB_SERVICES
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao subir os serviços."
    exit 1
fi
echo "✅ Serviços iniciados."

# 4. Popular os bancos de dados
echo "🌱 4. Populando bancos de dados..."
./seed.sh
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao popular os bancos de dados."
    exit 1
fi

# --- MENSAGEM FINAL ---
echo ""
echo "🎉 AMBIENTE INICIADO COM SUCESSO! 🎉"
echo "📋 Verificando logs da API... (Pressione Ctrl+C para parar)"
echo ""
docker compose logs -f "$API_SERVICE_NAME"
#!/bin/bash

# Carregar variáveis do .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Determinar modo (Produção/Desenvolvimento)
if [ "${NODE_ENV}" = "development" ]; then
    MODE_NAME="DESENVOLVIMENTO"
else
    MODE_NAME="PRODUÇÃO"
fi

echo "=========================================="
echo "   DATA-DRIVEN STORE - START DOCKER"
echo "=========================================="
echo "🎯 MODO ATIVO: $MODE_NAME"
echo "=========================================="
echo ""

API_SERVICE_NAME="dds_api"
DB_SERVICES="postgres mongo redis neo4j cassandra"

# 1. Limpeza seletiva (preserva dados do banco)
echo "🧹 1. Parando e removendo container da API..."
docker compose stop "$API_SERVICE_NAME"
docker compose rm -f "$API_SERVICE_NAME"
echo "✅ Limpeza seletiva finalizada."

# 2. Compilar o projeto TypeScript
echo "📦 2. Compilando o projeto TypeScript..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao compilar o projeto."
    exit 1
fi
echo "✅ Projeto compilado."

# 3. Iniciar todos os serviços
echo "🚀 3. Iniciando serviços e reconstruindo a API..."
docker compose up -d --build --force-recreate "$API_SERVICE_NAME" $DB_SERVICES
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao subir os serviços."
    exit 1
fi
echo "✅ Serviços iniciados."

# 4. Popular os bancos de dados
echo "🌱 4. Populando bancos de dados..."
./seed.sh
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao popular os bancos de dados."
    exit 1
fi

# --- MENSAGEM FINAL ---
echo ""
echo "🎉 AMBIENTE INICIADO COM SUCESSO! 🎉"
echo "📋 Verificando logs da API... (Pressione Ctrl+C para parar)"
echo ""
docker compose logs -f "$API_SERVICE_NAME"
#!/bin/bash

# Carregar variáveis do .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Determinar modo (Produção/Desenvolvimento)
if [ "${NODE_ENV}" = "development" ]; then
    MODE_NAME="DESENVOLVIMENTO"
else
    MODE_NAME="PRODUÇÃO"
fi

echo "=========================================="
echo "   DATA-DRIVEN STORE - START DOCKER"
echo "=========================================="
echo "🎯 MODO ATIVO: $MODE_NAME"
echo "=========================================="
echo ""

API_SERVICE_NAME="dds_api"
DB_SERVICES="postgres mongo redis neo4j cassandra"

# 1. Limpeza seletiva (preserva dados do banco)
echo "🧹 1. Parando e removendo container da API..."
docker compose stop "$API_SERVICE_NAME"
docker compose rm -f "$API_SERVICE_NAME"
echo "✅ Limpeza seletiva finalizada."

# 2. Compilar o projeto TypeScript
echo "📦 2. Compilando o projeto TypeScript..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao compilar o projeto."
    exit 1
fi
echo "✅ Projeto compilado."

# 3. Iniciar todos os serviços
echo "🚀 3. Iniciando serviços e reconstruindo a API..."
docker compose up -d --build --force-recreate "$API_SERVICE_NAME" $DB_SERVICES
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao subir os serviços."
    exit 1
fi
echo "✅ Serviços iniciados."

# 4. Popular os bancos de dados
echo "🌱 4. Populando bancos de dados..."
./seed.sh
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao popular os bancos de dados."
    exit 1
fi

# --- MENSAGEM FINAL ---
echo ""
echo "🎉 AMBIENTE INICIADO COM SUCESSO! 🎉"
echo "📋 Verificando logs da API... (Pressione Ctrl+C para parar)"
echo ""
docker compose logs -f "$API_SERVICE_NAME"
