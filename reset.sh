#!/bin/bash

# --- Configurações ---
API_SERVICE_NAME="dds_api" 
# A imagem da API não precisa ser explicitamente nomeada aqui, o compose vai inferir


echo "--- Iniciando limpeza total do ambiente Docker para o projeto ---"

echo "1. Derrubando e removendo todos os contêineres e volumes do Docker Compose..."
# Remove contêineres, volumes e imagens construídas pelo Compose
docker compose down -v --rmi all

if [ $? -ne 0 ]; then
    echo "Erro ao derrubar Docker Compose. Tentando continuar a limpeza."
fi

echo "2. Removendo contêineres parados restantes (se houver)..."
docker container prune -f

echo "3. Removendo volumes não utilizados (globais, não gerenciados pelo Compose explicitamente)..."
docker volume prune -f

echo "4. Removendo redes não utilizadas..."
docker network prune -f

echo "5. Removendo cache de build do Docker para garantir um build limpo..."
docker builder prune -f

echo "--- Limpeza concluída. Iniciando a reconstrução do ambiente ---"

echo "1. Reconstruindo a imagem da API sem usar cache..."
# Comando correto para construir a imagem sem cache
docker compose build --no-cache "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao reconstruir a imagem da API. Verifique os logs do build."
    exit 1
fi

echo "2. Subindo todos os serviços com a nova imagem da API..."
# Comando correto para subir os serviços (SEM --no-cache aqui)
docker compose up -d "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao subir o ambiente Docker. Verifique os logs."
    exit 1
fi

echo "--- Ambiente Docker reconstruído e iniciado. Verificando logs da API... ---"
echo "Para parar os logs, pressione Ctrl+C"
docker compose logs -f "$API_SERVICE_NAME"

echo "--- Script concluído. ---"