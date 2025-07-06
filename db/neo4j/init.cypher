// Script de modelagem do Neo4j para Data Driven Store
// Baseado no diagrama de relacionamentos Cliente-Produto-Categoria-Marca
// Este script cria apenas a estrutura do grafo (constraints, índices e modelagem)
// ================================
// CRIAÇÃO DE CONSTRAINTS
// ================================
// Constraints para garantir unicidade e integridade referencial
CREATE CONSTRAINT cliente_id_unique IF NOT EXISTS
FOR (c:Cliente)
REQUIRE c.id_cliente IS UNIQUE;
CREATE CONSTRAINT produto_id_unique IF NOT EXISTS
FOR (p:Produto)
REQUIRE p.id_produto IS UNIQUE;
CREATE CONSTRAINT categoria_id_unique IF NOT EXISTS
FOR (cat:Categoria)
REQUIRE cat.id_categoria IS UNIQUE;
CREATE CONSTRAINT marca_nome_unique IF NOT EXISTS
FOR (m:Marca)
REQUIRE m.nome IS UNIQUE;

// ================================
// CRIAÇÃO DE ÍNDICES
// ================================

// Índices para melhorar performance de queries
CREATE INDEX cliente_nome_index IF NOT EXISTS
FOR (c:Cliente)
ON (c.nome);
CREATE INDEX produto_nome_index IF NOT EXISTS
FOR (p:Produto)
ON (p.nome);
CREATE INDEX produto_preco_index IF NOT EXISTS
FOR (p:Produto)
ON (p.preco);
CREATE INDEX categoria_nome_index IF NOT EXISTS
FOR (cat:Categoria)
ON (cat.nome);

// Índices compostos para queries complexas
CREATE INDEX produto_categoria_preco_index IF NOT EXISTS
FOR (p:Produto)
ON (p.preco, p.nome);
CREATE INDEX visualizacao_data_index IF NOT EXISTS
FOR ()-[v:VISUALIZOU]-()
ON (v.data);
CREATE INDEX compra_data_index IF NOT EXISTS
FOR ()-[c:COMPROU]-()
ON (c.data);
CREATE INDEX avaliacao_nota_index IF NOT EXISTS
FOR ()-[a:AVALIOU]-()
ON (a.nota);