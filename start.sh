#!/bin/bash

# --- Configurações ---
API_SERVICE_NAME="dds_api"
# Lista de serviços de banco de dados
DB_SERVICES="postgres mongo" # Atualizado para usar 'mongo' em vez de 'mongodb'

echo "--- Iniciando ambiente de desenvolvimento Docker ---"

# 0. Limpeza completa do ambiente anterior
echo "0. Realizando limpeza completa do ambiente anterior..."
# Para todos os containers
docker compose down --volumes --remove-orphans
# Remove imagens órfãs e build cache
docker system prune -f
# Remove volumes órfãos específicos do projeto
docker volume prune -f
echo "Limpeza completa finalizada."

# 1. Iniciar serviços de banco de dados (se não estiverem rodando)
echo "1. Verificando e iniciando serviços de banco de dados..."
docker compose up -d $DB_SERVICES

if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao verificar/iniciar um ou mais serviços de banco de dados."
    exit 1
fi

# 2. Reconstruir e subir o serviço da API
echo "2. Reconstruindo a imagem da API sem usar cache..."
# --force-rm: remove contêineres intermediários após o build (economiza espaço)
docker compose build --no-cache --force-rm "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao reconstruir a imagem da API ($API_SERVICE_NAME). Verifique os logs do build."
    exit 1
fi

echo "3. Subindo o serviço da API com a nova imagem..."
docker compose up -d "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao subir o serviço da API. Verifique os logs."
    exit 1
fi

echo "--- Ambiente de desenvolvimento iniciado. Verificando logs da API... ---"
echo "Para parar os logs, pressione Ctrl+C"
docker compose logs -f "$API_SERVICE_NAME"

echo "--- Script concluído. ---"
