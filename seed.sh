#!/bin/bash

# Script para popular os bancos de dados de forma orquestrada.
# Executa o script de seed em TypeScript que lida com as dependências entre bancos.

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🌱 === INICIANDO PROCESSO DE SEEDING ORQUESTRADO === ${NC}"

# Função para verificar se um container está saudável
wait_for_healthy_container() {
  local service_name=$1
  echo -e "${YELLOW}⏳ Aguardando o serviço '${service_name}' ficar saudável...${NC}"
  # Espera até que o status de saúde seja 'healthy'
  while [ "$(docker compose ps -q ${service_name} | xargs docker inspect -f '{{.State.Health.Status}}' 2>/dev/null)" != "healthy" ]; do
    echo -n "."
    sleep 5
  done
  echo -e "\n${GREEN}✅ Serviço '${service_name}' está saudável e pronto!${NC}"
}

# 1. Aguardar os bancos de dados ficarem prontos
# A cláusula depends_on no docker-compose já faz isso, mas uma verificação extra é segura.
wait_for_healthy_container "mongo"
wait_for_healthy_container "postgres"
wait_for_healthy_container "redis"
wait_for_healthy_container "neo4j"

# 2. Executar o script de seed orquestrado via pnpm
echo -e "\n${CYAN}📦 Executando o script de seed principal (seed-all.ts)...${NC}"
# Este script irá limpar as tabelas, popular o MongoDB com produtos e depois o PostgreSQL com pedidos, usando os IDs reais.
docker compose exec -T dds_api pnpm seed:all

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha ao executar o script de seed 'pnpm seed:all'.${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 === SEEDING CONCLUÍDO COM SUCESSO! === ${NC}"
