#!/bin/bash

# Script para reset completo do ambiente Docker
# Logs com cores e emojis para melhor visualização

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# --- Configurações ---
API_SERVICE_NAME="dds_api"

echo -e "${RED}🔥 === RESET DOCKER ENVIRONMENT === ${NC}"
echo -e "${CYAN}📦 Projeto: Data-Driven Store${NC}"
echo -e "${CYAN}📅 $(date)${NC}"
echo -e "${YELLOW}⚠️  Este script irá remover TODOS os containers, volumes e imagens do projeto${NC}"
echo ""

echo -e "${YELLOW}🔧 0. Corrigindo permissões dos diretórios de banco de dados...${NC}"
./fix-permissions.sh
echo -e "${GREEN}✅ Permissões corrigidas${NC}"

echo -e "${YELLOW}🧹 1. Derrubando e removendo containers e volumes do Docker Compose...${NC}"
docker compose down -v --rmi all

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Erro ao derrubar Docker Compose. Tentando continuar a limpeza...${NC}"
fi
echo -e "${GREEN}✅ Containers do Compose removidos${NC}"

echo -e "${YELLOW}🧹 2. Removendo containers parados restantes...${NC}"
docker container prune -f
echo -e "${GREEN}✅ Containers parados removidos${NC}"

echo -e "${YELLOW}🧹 3. Removendo volumes não utilizados...${NC}"
docker volume prune -f
echo -e "${GREEN}✅ Volumes não utilizados removidos${NC}"

echo -e "${YELLOW}🧹 4. Removendo redes não utilizadas...${NC}"
docker network prune -f
echo -e "${GREEN}✅ Redes não utilizadas removidas${NC}"

echo -e "${YELLOW}🧹 5. Removendo cache de build do Docker...${NC}"
docker builder prune -f
echo -e "${GREEN}✅ Cache de build removido${NC}"

echo ""
echo -e "${BLUE}🔧 === RECONSTRUINDO AMBIENTE === ${NC}"

echo -e "${YELLOW}🏗️  1. Reconstruindo a imagem da API sem cache...${NC}"
docker compose build --no-cache "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ERRO: Falha ao reconstruir a imagem da API${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Imagem da API reconstruída${NC}"

echo -e "${YELLOW}🚀 2. Subindo todos os serviços...${NC}"
docker compose up -d "$API_SERVICE_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ERRO: Falha ao subir o ambiente Docker${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Serviços iniciados${NC}"

echo ""
echo -e "${GREEN}🎉 RESET CONCLUÍDO COM SUCESSO! 🎉${NC}"
echo -e "${PURPLE}📋 Verificando logs da API...${NC}"
echo -e "${CYAN}💡 Pressione Ctrl+C para parar os logs${NC}"
echo ""

docker compose logs -f "$API_SERVICE_NAME"
