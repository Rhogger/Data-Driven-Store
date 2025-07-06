#!/bin/bash

# Script para aguardar todos os bancos de dados estarem prontos
# Este script verifica a conectividade de rede de cada banco

set -e

echo "🔍 Aguardando todos os bancos de dados ficarem prontos..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para aguardar serviço estar escutando na porta
wait_for_service() {
    local service_name=$1
    local host=$2
    local port=$3

    echo -e "${YELLOW}⏳ Aguardando $service_name ($host:$port)...${NC}"

    local max_attempts=60 # 2 minutos total
    local attempt=0

    while ! nc -z $host $port; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            echo -e "${RED}❌ Timeout aguardando $service_name${NC}"
            exit 1
        fi
        echo "$service_name ainda não está pronto. Tentativa $attempt/$max_attempts..."
        sleep 2
    done

    echo -e "${GREEN}✅ $service_name está escutando na porta $port!${NC}"
}

# Aguardar cada serviço
echo "🚀 Verificando conectividade de rede dos bancos de dados..."

wait_for_service "PostgreSQL" "postgres" "5432"
wait_for_service "MongoDB" "mongo" "27017"
wait_for_service "Redis" "redis" "6379"
wait_for_service "Neo4j" "neo4j" "7687"
wait_for_service "Cassandra" "cassandra" "9042"

# Aguardar um pouco mais para garantir que os serviços estejam totalmente prontos
echo -e "${YELLOW}⏳ Aguardando mais 10 segundos para garantir inicialização completa...${NC}"
sleep 10

echo -e "${GREEN}🎉 Todos os bancos de dados estão prontos!${NC}"
echo "🚀 Iniciando aplicação..."
