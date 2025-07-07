#!/bin/bash

# --- Configurações ---
API_SERVICE_NAME="dds_api"
# Lista de serviços de banco de dados
DB_SERVICES="postgres mongo redis neo4j cassandra"

echo "--- Iniciando ambiente de desenvolvimento Docker com HOT RELOAD ---"

# 0. Corrigir permissões dos diretórios de banco de dados
echo "0. Corrigindo permissões dos diretórios de banco de dados..."
./fix-permissions.sh

# 1. Limpeza seletiva do ambiente anterior (preservando dados do banco)
echo "1. Realizando limpeza seletiva do ambiente anterior (preservando dados)..."
# Para apenas o container da API, mantendo os bancos
docker compose -f docker-compose.yml -f docker-compose.dev.yml stop "$API_SERVICE_NAME"
docker compose -f docker-compose.yml -f docker-compose.dev.yml rm -f "$API_SERVICE_NAME"
# Remove apenas imagens órfãs e build cache (não remove volumes)
docker system prune -f --filter "label!=com.docker.compose.project"
echo "Limpeza seletiva finalizada (dados dos bancos preservados)."

# 2. Iniciar serviços de banco de dados (se não estiverem rodando)
echo "2. Verificando e iniciando serviços de banco de dados..."
docker compose up -d $DB_SERVICES

if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao verificar/iniciar um ou mais serviços de banco de dados."
    exit 1
fi

# 3. Reconstruir e subir o serviço da API em modo desenvolvimento
echo "3. Reconstruindo a imagem da API para desenvolvimento sem usar cache..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache --force-rm "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao reconstruir a imagem da API ($API_SERVICE_NAME). Verifique os logs do build."
    exit 1
fi

echo "4. Subindo o serviço da API em modo desenvolvimento (HOT RELOAD ATIVO)..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao subir o serviço da API. Verifique os logs."
    exit 1
fi

echo "--- Ambiente de desenvolvimento com HOT RELOAD iniciado! ---"
echo "✅ Agora você pode editar arquivos em src/ e as mudanças serão refletidas automaticamente no container!"
echo "📝 Para ver os logs da API em tempo real, execute: docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f dds_api"
echo "🛑 Para parar o ambiente: docker compose -f docker-compose.yml -f docker-compose.dev.yml down"
echo ""
echo "--- Verificando logs da API... ---"
echo "Para parar os logs, pressione Ctrl+C"
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f "$API_SERVICE_NAME"

echo "--- Script concluído. ---"
