# 🚀 Data-Driven Store

Um projeto de e-commerce moderno construído com TypeScript e Fastify, demonstrando uma arquitetura de persistência poliglota. O objetivo é aplicar o banco de dados mais adequado para cada requisito de negócio, utilizando cinco tecnologias diferentes em uma única solução.

---

## 🏛️ Arquitetura e Tecnologias

Este projeto utiliza o padrão de Persistência Poliglota, onde cada banco de dados tem uma responsabilidade específica:

- **PostgreSQL**: Armazena dados críticos e transacionais que exigem consistência (ACID), como clientes, pedidos e transações financeiras.
- **MongoDB**: Gerencia o catálogo de produtos com atributos flexíveis e semiestruturados, além de perfis de usuário estendidos.
- **Redis**: Utilizado para dados voláteis que exigem acesso de baixíssima latência, como sessões de usuário, cache de produtos e rankings em tempo real.
- **Cassandra**: Responsável pela ingestão de grandes volumes de dados de eventos (logs) para consultas analíticas (OLAP), como funil de conversão e comportamento do usuário.
- **Neo4j**: Mapeia e consulta relacionamentos complexos entre as entidades, servindo como motor para o sistema de recomendação.

O ambiente é totalmente containerizado com Docker e Docker Compose.

---

## 📋 Pré-requisitos

Antes de começar, garanta que você tenha as seguintes ferramentas instaladas:

- **Git**: Para clonar o repositório.
- **Docker e Docker Compose**: Para orquestração dos contêineres.
- **Node.js e PNPM**: Para gerenciamento de dependências.

> **Para Linux/macOS**: Recomenda-se o uso do ASDF para gerenciar as versões.
>
> **Para Windows**: Recomenda-se o uso do Git Bash como terminal.

---

## ⚙️ Como Instalar e Iniciar o Projeto

Siga os passos abaixo para ter o ambiente completo rodando em sua máquina.

### 1. Clone o Repositório

```bash
git clone https://github.com/rhogger/data-driven-store.git
cd data-driven-store
```

### 2. Instale as Ferramentas de Desenvolvimento

**Opção A: Linux/macOS (com ASDF)**

O ASDF garante que você utilize as mesmas versões de ferramentas do projeto.

```bash
# Adiciona os plugins necessários (caso não os tenha)
asdf plugin-add nodejs
asdf plugin-add pnpm

# Instala as versões definidas no arquivo .tool-versions
asdf install
```

**Opção B: Windows (Instalação Manual)**

Instale as versões exatas para garantir a compatibilidade.

- **Node.js**: Baixe e instale a versão `24.3.0` a partir do site oficial.
- **PNPM**: Após instalar o Node.js, abra o terminal (Git Bash) e instale o PNPM globalmente:

```bash
npm install -g pnpm@10.12.4
```

### 3. Instale as Dependências

Com as ferramentas prontas, instale as dependências do projeto:

```bash
pnpm install
```

### 4. Configure as Variáveis de Ambiente

Crie um arquivo chamado `.env` na raiz do projeto com o seguinte conteúdo:

```env
NODE_ENV=development
APP_PORT=3000

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_DB=datadriven_store
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_PORT=5433

# MongoDB
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=root_password
MONGO_INITDB_DATABASE=datadriven_store
MONGODB_URI=mongodb://app_user:app_password123@mongo:27017/datadriven_store?authSource=admin
MONGODB_DATABASE=datadriven_store

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Neo4j
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=admin

# Cassandra
CASSANDRA_HOST=cassandra
CASSANDRA_PORT=9042
CASSANDRA_USER=cassandra
CASSANDRA_PASSWORD=cassandra
CASSANDRA_KEYSPACE=datadriven_store
CASSANDRA_DC=datacenter1
```

### 5. Inicie o Ambiente Docker

Para a primeira inicialização, utilize o script de reset. Ele irá construir as imagens, iniciar todos os contêineres e popular os bancos de dados com dados de exemplo.

```bash
./reset.sh
```

O terminal exibirá os logs da API.

### 6. Acesse a Aplicação

Com os contêineres em execução, a API estará disponível e a documentação interativa do Swagger pode ser acessada em:

[http://localhost:3000/docs](http://localhost:3000/docs)

---

## 📜 Scripts Disponíveis

- `pnpm dev`: Inicia o ambiente completo em modo de produção (build + start).
- `pnpm start`: Inicia o servidor a partir dos arquivos já compilados em `dist/`.
- `pnpm dev:watch`: Inicia o servidor em modo de desenvolvimento com hot-reload.
- `pnpm build`: Compila o código TypeScript do projeto.
- `pnpm reset`: Executa o script `./reset.sh` para reconstruir todo o ambiente Docker.
- `pnpm lint`: Executa o linter para verificar a qualidade do código.
- `pnpm format`: Formata todo o código do projeto usando Prettier.
- `pnpm clean`: Remove o diretório `dist/` gerado pelo build.
- `pnpm seed:all`: Executa os scripts para popular todos os bancos de dados com dados de exemplo.

---
