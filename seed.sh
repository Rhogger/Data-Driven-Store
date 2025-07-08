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

# 2. Executar o script de seed orquestrado via pnpm
echo -e "\n${CYAN}📦 Executando o script de seed principal (seed-all.ts)...${NC}"
pnpm seed:all
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha ao executar o script de seed 'pnpm seed:all'.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Processo de seeding concluído.${NC}"
