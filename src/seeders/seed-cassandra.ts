/* eslint-disable no-console */
import { Client } from 'cassandra-driver';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { databaseConfig } from '@config/database';

const NUM_EVENTS = 1000;

interface Product {
  _id: { toHexString: () => string };
  nome: string;
  preco: number;
  marca: string;
  categorias: number[];
}

interface ProductWithUuid extends Product {
  cassandra_uuid: string;
}

interface ClientData {
  id_cliente: number;
}

interface ClientWithUuid extends ClientData {
  cassandra_uuid: string;
}

async function executeCounterBatch(
  cassandraClient: Client,
  keyspace: string,
  table: string,
  updates: { query: string; params: any[] }[],
) {
  if (updates.length === 0) {
    return;
  }

  console.log(`   -> Atualizando contadores em '${table}'...`);
  const BATCH_SIZE = 100;
  const totalUpdates = updates.length;
  let processedCount = 0;

  for (let i = 0; i < totalUpdates; i += BATCH_SIZE) {
    const chunk = updates.slice(i, i + BATCH_SIZE);
    await cassandraClient.batch(chunk, { prepare: true, logged: false });
    processedCount += chunk.length;
    process.stdout.write(`\r      - Processando ${processedCount}/${totalUpdates} atualizações...`);
  }

  process.stdout.write('\n');
  console.log(`✅ [Cassandra] Atualizados ${totalUpdates} registros de contadores em ${table}.`);
}

async function seedCassandra(cassandraClient: Client, pgPool: Pool, mongoClient: MongoClient) {
  console.log('🌱 [Cassandra] Iniciando seed...');
  const keyspace = databaseConfig.cassandra.keyspace;

  try {
    // 1. Truncate das tabelas para garantir um estado limpo
    const tables = [
      'eventos_por_data',
      'eventos_por_usuario',
      'funil_conversao_por_usuario_produto',
      'termos_busca_agregados_por_dia',
      'visualizacoes_produto_agregadas_por_dia',
      'compras_por_utm_source',
    ];

    for (const table of tables) {
      await cassandraClient.execute(`TRUNCATE ${keyspace}.${table}`);
      console.log(`🧹 [Cassandra] Tabela ${table} limpa.`);
    }

    // 2. Buscar dados de referência do PostgreSQL e MongoDB
    const pgClient = await pgPool.connect();
    const { rows: pgClients }: { rows: ClientData[] } = await pgClient.query(
      'SELECT id_cliente FROM clientes',
    );
    pgClient.release();

    // Associa um UUID a cada cliente para uso no Cassandra, resolvendo o erro de tipo.
    const clients: ClientWithUuid[] = pgClients.map((c) => ({
      ...c,
      cassandra_uuid: randomUUID(),
    }));

    const mongoProducts = await mongoClient
      .db(databaseConfig.mongodb.database)
      .collection<Product>('products')
      .find({})
      .toArray();

    const products: ProductWithUuid[] = mongoProducts.map((p) => ({
      ...p,
      cassandra_uuid: randomUUID(),
    }));

    if (!clients || clients.length === 0) {
      throw new Error('[Cassandra] Nenhum cliente encontrado no PostgreSQL.');
    }
    if (!products || products.length === 0) {
      throw new Error('[Cassandra] Nenhum produto encontrado no MongoDB.');
    }

    // 3. Gerar e inserir eventos aleatórios
    const eventosPorData: any[] = [];
    const eventosPorUsuario: any[] = [];
    const funilConversao: any[] = [];
    const comprasPorUtm: any[] = [];
    // Usar Maps para agregação eficiente de contadores
    const termosBuscaMap = new Map<string, number>();
    const visualizacoesProdutoMap = new Map<string, number>();

    const eventTypes = ['view_product', 'search', 'add_to_cart', 'purchase'];
    const utmSources = ['google', 'facebook', 'email', 'direct'];

    for (let i = 0; i < NUM_EVENTS; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];

      const product = products[Math.floor(Math.random() * products.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const utmSource = utmSources[Math.floor(Math.random() * utmSources.length)];
      const timestamp = new Date(
        Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000,
      ); // Eventos do último ano
      const date = new Date(timestamp);
      date.setHours(0, 0, 0, 0);

      const eventId = randomUUID();
      const userId = client.cassandra_uuid; // Usando o UUID gerado para o cliente

      // Evento base
      const baseEvent = {
        data_evento: date,
        timestamp_evento: timestamp,
        id_evento: eventId,
        id_usuario: userId,
        tipo_evento: eventType,
        id_produto: product.cassandra_uuid,
        termo_busca: Math.random() < 0.2 ? `termo${Math.floor(Math.random() * 10)}` : null,
        url_pagina: Math.random() < 0.5 ? `/produto/${product.cassandra_uuid}` : '/',
        origem_campanha: Math.random() < 0.3 ? utmSource : null,
        detalhes_evento: {
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: `UserAgent${Math.floor(Math.random() * 10)}`,
          nome_produto: product.nome,
          preco_produto: product.preco.toString(),
          marca_produto: product.marca,
          categorias_produto: product.categorias.join(','),
        },
      };

      eventosPorData.push(baseEvent);
      eventosPorUsuario.push(baseEvent);

      // Funil de Conversão
      const funilKey = `${userId}-${product.cassandra_uuid}`;
      const existingFunil = funilConversao.find(
        (f) => `${f.id_usuario}-${f.id_produto}` === funilKey,
      );

      if (eventType === 'view_product') {
        if (!existingFunil) {
          funilConversao.push({
            id_usuario: userId,
            id_produto: product.cassandra_uuid,
            visualizou: true,
            adicionou_carrinho: false,
            comprou: false,
            timestamp_primeira_visualizacao: timestamp,
            timestamp_ultima_atualizacao: timestamp,
          });
        } else {
          existingFunil.timestamp_ultima_atualizacao = timestamp;
          if (!existingFunil.visualizou) {
            existingFunil.visualizou = true;
            existingFunil.timestamp_primeira_visualizacao = timestamp;
          }
        }
      } else if (eventType === 'add_to_cart' && existingFunil) {
        existingFunil.adicionou_carrinho = true;
        existingFunil.timestamp_ultima_atualizacao = timestamp;
      } else if (eventType === 'purchase' && existingFunil) {
        existingFunil.comprou = true;
        existingFunil.timestamp_ultima_atualizacao = timestamp;
      }

      // Termos de Busca Agregados
      if (baseEvent.termo_busca) {
        // A chave do Map combina a data e o termo para garantir unicidade
        const buscaKey = `${date.toISOString()}|${baseEvent.termo_busca}`;
        termosBuscaMap.set(buscaKey, (termosBuscaMap.get(buscaKey) || 0) + 1);
      }

      // Visualizações de Produto Agregadas
      if (eventType === 'view_product') {
        // A chave do Map combina a data e o ID do produto
        const viewKey = `${date.toISOString()}|${baseEvent.id_produto}`;
        visualizacoesProdutoMap.set(viewKey, (visualizacoesProdutoMap.get(viewKey) || 0) + 1);
      }

      // Compras por UTM Source
      if (eventType === 'purchase' && baseEvent.origem_campanha) {
        comprasPorUtm.push({
          origem_campanha: baseEvent.origem_campanha,
          timestamp_evento: timestamp,
          id_usuario: userId,
          id_produto: baseEvent.id_produto,
          id_pedido: randomUUID(), // Simulando ID do pedido
          tipo_evento: eventType,
        });
      }
    }

    // 4. Preparar queries de batch para as tabelas de contador
    const termosBuscaUpdates = Array.from(termosBuscaMap.entries()).map(([key, count]) => {
      const [dateStr, termo] = key.split('|');
      return {
        query: `UPDATE ${keyspace}.termos_busca_agregados_por_dia SET total_contagem = total_contagem + ? WHERE data_evento = ? AND termo_busca = ?`,
        params: [count, new Date(dateStr), termo],
      };
    });

    const visualizacoesProdutoUpdates = Array.from(visualizacoesProdutoMap.entries()).map(
      ([key, count]) => {
        const [dateStr, produtoId] = key.split('|');
        return {
          query: `UPDATE ${keyspace}.visualizacoes_produto_agregadas_por_dia SET total_visualizacoes = total_visualizacoes + ? WHERE data_evento = ? AND id_produto = ?`,
          params: [count, new Date(dateStr), produtoId],
        };
      },
    );

    // 5. Inserir dados no Cassandra (usando batch para melhor performance)
    console.log('⏳ [Cassandra] Inserindo eventos...');
    await insertInBatch(cassandraClient, keyspace, 'eventos_por_data', eventosPorData);
    await insertInBatch(cassandraClient, keyspace, 'eventos_por_usuario', eventosPorUsuario);
    await insertInBatch(
      cassandraClient,
      keyspace,
      'funil_conversao_por_usuario_produto',
      funilConversao,
    );
    await insertInBatch(cassandraClient, keyspace, 'compras_por_utm_source', comprasPorUtm);

    // Executa os batches de atualização para as tabelas de contador
    await executeCounterBatch(
      cassandraClient,
      keyspace,
      'termos_busca_agregados_por_dia',
      termosBuscaUpdates,
    );
    await executeCounterBatch(
      cassandraClient,
      keyspace,
      'visualizacoes_produto_agregadas_por_dia',
      visualizacoesProdutoUpdates,
    );

    console.log(`✅ [Cassandra] Seed concluído com ${NUM_EVENTS} eventos simulados.`);
  } catch (error) {
    console.error('❌ [Cassandra] Erro durante o seeding:', error);
    // Relança o erro para que o processo principal (seed-all) falhe e exiba o erro.
    throw error;
  }
}

/**
 * Insere um array de objetos em uma tabela do Cassandra usando lotes menores para evitar timeouts e erros de "batch too large".
 * Esta função é otimizada para INSERTs.
 */
async function insertInBatch(
  cassandraClient: Client,
  keyspace: string,
  table: string,
  data: any[],
) {
  if (data.length === 0) {
    console.log(`⚠️ [Cassandra] Nenhum dado para inserir na tabela ${table}.`);
    return;
  }

  const BATCH_SIZE = 100; // Tamanho do lote para evitar o erro "Batch too large"
  const totalRows = data.length;
  let insertedCount = 0;

  const firstRow = data[0];
  const columns = Object.keys(firstRow).join(', ');
  const placeholders = Object.keys(firstRow)
    .map(() => '?')
    .join(', ');
  const query = `INSERT INTO ${keyspace}.${table} (${columns}) VALUES (${placeholders})`;

  for (let i = 0; i < totalRows; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);
    const batchQueries = chunk.map((row) => ({ query, params: Object.values(row) }));

    await cassandraClient.batch(batchQueries, { prepare: true, logged: false });

    insertedCount += chunk.length;
    // Usar process.stdout.write para uma linha de progresso que se atualiza
    process.stdout.write(
      `\r   -> Inserindo em '${table}': ${insertedCount}/${totalRows} registros...`,
    );
  }

  process.stdout.write('\n'); // Garante que o próximo log comece em uma nova linha
  console.log(`✅ [Cassandra] Inseridos ${totalRows} registros na tabela ${table}.`);
}

export default seedCassandra;
