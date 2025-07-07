#!/bin/bash

# Carregar variáveis do .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "=========================================="
echo "   DATA-DRIVEN STORE - RESET DOCKER"
echo "=========================================="
echo "📁 Diretório: $(pwd)"
echo "🕒 Data/Hora: $(date)"
echo ""

# --- Usar APENAS NODE_ENV para determinar o modo ---
if [ "${NODE_ENV}" = "development" ]; then
    echo "🔥 CONFIGURANDO MODO DESENVOLVIMENTO (HOT RELOAD)"
    MODE_NAME="DESENVOLVIMENTO"
    MODE_EMOJI="🔥"
else
    echo "🏗️ CONFIGURANDO MODO PRODUÇÃO (BUILD)"
    MODE_NAME="PRODUÇÃO"
    MODE_EMOJI="🏗️"
fi

echo ""
echo "🎯 MODO ATIVO: $MODE_NAME $MODE_EMOJI"
echo "🌍 NODE_ENV: $NODE_ENV"
echo "=========================================="
echo ""

# --- Configurações ---
API_SERVICE_NAME="dds_api"

echo "🔥 === RESET COMPLETO DO AMBIENTE DOCKER === 🔥"
echo "📦 Projeto: Data-Driven Store"
echo "⚠️  Este script irá remover TODOS os containers, volumes e imagens do projeto"
echo ""

echo "🔧 0. Corrigindo permissões dos diretórios de banco de dados..."
./fix-permissions.sh
echo "✅ Permissões corrigidas"

echo "🧹 1. Derrubando e removendo containers e volumes do Docker Compose..."
docker compose down -v --rmi all

if [ $? -ne 0 ]; then
    echo "⚠️  Erro ao derrubar Docker Compose. Tentando continuar a limpeza..."
fi
echo "✅ Containers do Compose removidos"

echo "🧹 2. Removendo containers parados restantes..."
docker container prune -f
echo "✅ Containers parados removidos"

echo "🧹 3. Removendo volumes não utilizados..."
docker volume prune -f
echo "✅ Volumes não utilizados removidos"

echo "🧹 4. Removendo redes não utilizadas..."
docker network prune -f
echo "✅ Redes não utilizadas removidas"

echo "🧹 5. Removendo cache de build do Docker..."
docker builder prune -f
echo "✅ Cache de build removido"

echo ""
echo "🔧 === RECONSTRUINDO AMBIENTE EM MODO $MODE_NAME === 🔧"

if [ "$NODE_ENV" = "development" ]; then
    echo "🏗️  1. Reconstruindo a imagem da API sem cache (MODO DESENVOLVIMENTO)..."
else
    echo "🏗️  1. Reconstruindo a imagem da API sem cache (MODO PRODUÇÃO)..."
fi

docker compose build --no-cache "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao reconstruir a imagem da API"
    exit 1
fi
echo "✅ Imagem da API reconstruída"

echo "🚀 2. Subindo todos os serviços em modo $MODE_NAME..."
docker compose up -d "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao subir o ambiente Docker"
    exit 1
fi
echo "✅ Serviços iniciados"

echo ""
echo "🎉 RESET CONCLUÍDO COM SUCESSO! 🎉"
if [ "$NODE_ENV" = "development" ]; then
    echo "✅ Ambiente de desenvolvimento com HOT RELOAD pronto!"
    echo "📝 Agora você pode editar arquivos em src/ e as mudanças serão refletidas automaticamente!"
else
    echo "✅ Ambiente de produção pronto!"
    echo "📝 Aplicação rodando em modo produção (build compilado)"
fi
echo "📋 Verificando logs da API..."
echo "💡 Pressione Ctrl+C para parar os logs"
echo ""

docker compose logs -f "$API_SERVICE_NAME"
