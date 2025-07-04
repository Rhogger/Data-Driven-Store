#!/bin/bash

# Script para iniciar a aplicação em modo desenvolvimento
# Logs com cores e emojis para melhor visualização

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 === START DEV SERVER === ${NC}"
echo -e "${CYAN}📦 Projeto: Data-Driven Store${NC}"
echo -e "${CYAN}📅 $(date)${NC}"
echo ""

# Verificar se existe o diretório dist
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  Diretório dist não encontrado. Executando build...${NC}"
    ./build.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Falha no build. Abortando...${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}🔍 Verificando arquivos de build...${NC}"
if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}❌ Arquivo dist/index.js não encontrado. Execute o build primeiro.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Arquivos de build encontrados${NC}"

echo -e "${YELLOW}🌍 Carregando variáveis de ambiente...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
else
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
fi

echo -e "${YELLOW}🚀 Iniciando servidor...${NC}"
echo -e "${PURPLE}📋 Porta: ${APP_PORT:-3000}${NC}"
echo -e "${PURPLE}🔗 URL: http://localhost:${APP_PORT:-3000}${NC}"
echo ""
echo -e "${CYAN}💡 Pressione Ctrl+C para parar o servidor${NC}"
echo ""

# Iniciar a aplicação
node dist/index.js
