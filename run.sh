#!/bin/bash

echo "=========================================="
echo "   CONTAINER - DATA-DRIVEN STORE API"
echo "=========================================="
echo "🌍 NODE_ENV: ${NODE_ENV}"
echo "📁 Diretório: $(pwd)"
echo "🕒 Data/Hora: $(date)"
echo "=========================================="
echo ""

# Detectar modo baseado na variável de ambiente NODE_ENV
if [ "${NODE_ENV}" = "development" ]; then
    echo "🔥 INICIANDO EM MODO DESENVOLVIMENTO COM HOT RELOAD"
    echo ""

    # 0. Aguardar bancos de dados estarem prontos
    echo "0. Aguardando bancos de dados ficarem prontos..."
    ./wait-for-databases.sh

    # Iniciar aplicação em modo desenvolvimento com hot reload
    echo "1. Iniciando aplicação com hot reload..."
    pnpm run dev:watch
else
    echo "🏗️ INICIANDO EM MODO PRODUÇÃO (BUILD + EXECUÇÃO)"
    echo ""

    # 0. Aguardar bancos de dados estarem prontos
    echo "0. Aguardando bancos de dados ficarem prontos..."
    ./wait-for-databases.sh

    # 1. Limpar build anterior
    echo "1. Limpando build anterior..."
    rm -rf dist

    # 2. Copiar arquivos SQL e outros assets
    echo "2. Copiando assets..."
    mkdir -p dist
    find src -name "*.sql" -exec cp --parents {} dist \; 2>/dev/null || true
    find src -name "*.json" -exec cp --parents {} dist \; 2>/dev/null || true

    # 3. Compilar TypeScript
    echo "3. Compilando TypeScript..."
    npx tsc

    if [ $? -ne 0 ]; then
        echo "ERRO: Falha na compilação TypeScript"
        exit 1
    fi

    # 4. Resolver aliases de path
    echo "4. Resolvendo aliases de path..."
    npx tsc-alias

    if [ $? -ne 0 ]; then
        echo "ERRO: Falha ao resolver aliases"
        exit 1
    fi

    echo "--- Build concluído com sucesso ---"

    # 5. Iniciar aplicação
    echo "5. Iniciando aplicação..."
    node dist/index.js
fi
