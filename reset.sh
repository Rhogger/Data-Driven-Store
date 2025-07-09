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
echo "   DATA-DRIVEN STORE - RESET DOCKER"
echo "=========================================="
echo "🎯 MODO ATIVO: $MODE_NAME"
echo "=========================================="
echo ""

# --- SEÇÃO DE LIMPEZA ---
echo "🔥 === RESET DO AMBIENTE DOCKER === 🔥"
echo "🔧 Corrigindo permissões..."
./fix-permissions.sh

# Permite resetar serviços específicos: ./reset.sh [servico1 servico2 ...]
if [ $# -gt 0 ]; then
    SERVICES="$@"
    echo "🔄 Resetando apenas os serviços: $SERVICES"
    docker compose stop $SERVICES
    docker compose rm -f $SERVICES
    # Remove volumes dos serviços especificados (se existirem)
    for SVC in $SERVICES; do
        docker volume rm $(docker volume ls -qf "name=${SVC}") 2>/dev/null || true
    done
else
    echo "🔄 Resetando TODOS os serviços"
    docker compose down -v --rmi all
    docker container prune -f
    docker volume prune -f
    docker network prune -f
    docker builder prune -f
fi
echo "✅ Limpeza concluída."
echo ""

# --- SEÇÃO DE RECONSTRUÇÃO ---
echo "🔧 === RECONSTRUINDO AMBIENTE EM MODO $MODE_NAME === 🔧"

# PASSO 1: Compilar o código TypeScript (gera a pasta 'dist')
echo "📦 1. Compilando o projeto TypeScript..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao compilar o projeto. Verifique os logs."
    exit 1
fi
echo "✅ Projeto compilado com sucesso."

# PASSO 2: Reconstruir a imagem e subir o ambiente
echo "🚀 2. Reconstruindo imagem e subindo serviços..."
if [ -z "$SERVICES" ]; then
    docker compose up -d --build --force-recreate
else
    docker compose up -d --build --force-recreate $SERVICES
fi
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao subir o(s) serviço(s) Docker."
    exit 1
fi

echo "✅ Serviços iniciados."

# === INICIALIZA CASSANDRA SE O SERVIÇO FOI SUBIDO ===
if [[ -z "$SERVICES" || "$SERVICES" == *"cassandra"* ]]; then
    ./docker-entrypoint-cassandra.sh
fi

# PASSO 3: Popular os bancos de dados
echo "🌱 3. Populando bancos de dados..."
./seed.sh
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao popular os bancos de dados."
    exit 1
fi

# --- MENSAGEM FINAL ---
echo ""
echo "🎉 RESET CONCLUÍDO COM SUCESSO! 🎉"
echo "📋 Verificando logs da API... (Pressione Ctrl+C para parar)"
echo ""
docker compose logs -f dds_api
