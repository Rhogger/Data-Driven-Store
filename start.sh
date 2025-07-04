#!/bin/bash

# --- Configurações ---
API_SERVICE_NAME="dds_api"
# Lista de serviços de banco de dados
DB_SERVICES="postgres" # Mantenha todos os bancos aqui, mesmo que desativados

echo "--- Iniciando ambiente de desenvolvimento Docker ---"

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

# --- ADIÇÃO: Limpeza de "sujeira" antiga da API ---
echo "3. Realizando limpeza de imagens e contêineres antigos da API..."
# Remove contêineres da API que saíram (exited)
docker ps -a --filter "name=$API_SERVICE_NAME" --format '{{.ID}}' | xargs docker rm -f 2>/dev/null || true
# Remove imagens "<none>" associadas ao nome da sua imagem do Compose
docker image prune --filter "dangling=true" --filter "label=com.docker.compose.project=${PWD##*/}" -f

if [ $? -ne 0 ]; then
    echo "Aviso: Falha na limpeza de imagens/contêineres antigos da API. Tentando continuar."
fi
# --- FIM DA ADIÇÃO ---

echo "4. Subindo o serviço da API com a nova imagem..."
docker compose up -d "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao subir o serviço da API. Verifique os logs."
    exit 1
fi

echo "--- Ambiente de desenvolvimento iniciado. Verificando logs da API... ---"
echo "Para parar os logs, pressione Ctrl+C"
docker compose logs -f "$API_SERVICE_NAME"

echo "--- Script concluído. ---"