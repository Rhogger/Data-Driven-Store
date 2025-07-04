#!/bin/bash

# Script para build seguro sem problemas de permissão
# Logs com cores e emojis para melhor visualização

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 === BUILD PROJECT === ${NC}"
echo -e "${CYAN}📦 Projeto: Data-Driven Store${NC}"
echo -e "${CYAN}📅 $(date)${NC}"
echo ""

echo -e "${YELLOW}🧹 Limpando diretório dist...${NC}"

# Tenta remover normalmente, se falhar usa sudo
if ! rm -rf dist 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Usando sudo para remover arquivos com permissão de root...${NC}"
    sudo rm -rf dist
fi
echo -e "${GREEN}✅ Diretório dist limpo${NC}"

echo -e "${YELLOW}🏗️  Compilando TypeScript...${NC}"
if ! npx tsc; then
    echo -e "${RED}❌ Erro na compilação TypeScript${NC}"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript compilado com sucesso${NC}"

echo -e "${YELLOW}🔗 Resolvendo path aliases...${NC}"
if ! npx tsc-alias; then
    echo -e "${RED}❌ Erro ao resolver aliases${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Path aliases resolvidos${NC}"

echo -e "${YELLOW}🔐 Ajustando permissões...${NC}"
chmod -R 755 dist 2>/dev/null || sudo chmod -R 755 dist
chown -R $USER:$USER dist 2>/dev/null || sudo chown -R $USER:$USER dist
echo -e "${GREEN}✅ Permissões ajustadas${NC}"

echo ""
echo -e "${GREEN}🎉 BUILD CONCLUÍDO COM SUCESSO! 🎉${NC}"
echo -e "${PURPLE}📂 Arquivos gerados em: ./dist/${NC}"
echo -e "${PURPLE}🚀 Para iniciar: pnpm start${NC}"
