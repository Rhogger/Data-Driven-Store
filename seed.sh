#!/bin/bash

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Carregar variáveis do .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Função para aguardar um container ficar saudável
wait_for_healthy_container() {
    local container_name=$1
    local max_wait=${2:-240} # Padrão de 240 segundos (4 minutos)
    local interval=5
    local elapsed_time=0

    echo -e "${YELLOW}⏳ Aguardando o serviço '${container_name}' ficar saudável... (até ${max_wait}s)${NC}"

    while [ $elapsed_time -lt $max_wait ]; do
        local status=$(docker inspect --format '{{.State.Health.Status}}' "${container_name}" 2>/dev/null)

        if [ "$status" == "healthy" ]; then
            echo -e "${GREEN}✅ Serviço '${container_name}' está saudável e pronto!${NC}"
            return 0
        fi

        sleep $interval
        elapsed_time=$((elapsed_time + interval))
        echo -n "."
    done

    echo -e "\n${RED}❌ O serviço '${container_name}' não ficou saudável dentro do tempo limite de ${max_wait} segundos.${NC}"
    echo -e "${RED}   Logs do container:"
    docker logs "${container_name}" --tail 50
    return 1
}

# 1. Aguardar todos os serviços de banco de dados ficarem saudáveis
wait_for_healthy_container "postgres_db" || exit 1
wait_for_healthy_container "mongo_db" || exit 1
wait_for_healthy_container "redis" || exit 1
wait_for_healthy_container "neo4j_db" || exit 1
wait_for_healthy_container "cassandra_db" || exit 1

# Aguardar a API ficar saudável antes de executar comandos nela
# Usamos o nome do container 'datadriven_api' que foi definido no docker-compose.yml
echo -e "\n${YELLOW}⏳ Aguardando a API 'datadriven_api' ficar saudável...${NC}"
wait_for_healthy_container "datadriven_api" || exit 1

# Adiciona uma pequena pausa. A API pode se tornar 'healthy' (responder a pings HTTP)
# um pouco antes de estar 100% pronta para operações de banco de dados intensas como o seeding.
echo -e "${CYAN}API está saudável. Aguardando 5 segundos extras para garantir a estabilização...${NC}"
sleep 5

# 2. Executar o script de seed orquestrado via pnpm
echo -e "\n${CYAN}📦 Executando o script de seed principal (seed-all.ts) no serviço 'dds_api'...${NC}"
docker compose exec -T dds_api pnpm seed:all
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha ao executar o script de seed 'pnpm seed:all' no serviço 'dds_api'.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Processo de seeding concluído.${NC}"
