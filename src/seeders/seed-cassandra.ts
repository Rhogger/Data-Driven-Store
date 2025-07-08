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
  // Outras propriedades do produto, se necessário
}

interface ClientData {
  id_cliente: number;
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
    const { rows: clients }: { rows: ClientData[] } = await pgClient.query(
      'SELECT id_cliente FROM clientes',
    );
    pgClient.release();

    const products = await mongoClient
      .db(databaseConfig.mongodb.database)
      .collection<Product>('products')
      .find({})
      .toArray();

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
      const userId = client.id_cliente.toString(); // Usando id_cliente do PostgreSQL como userId

      // Evento base
      const baseEvent = {
        data_evento: date,
        timestamp_evento: timestamp,
        id_evento: eventId,
        id_usuario: userId,
        tipo_evento: eventType,
        id_produto: product._id.toHexString(),
        termo_busca: Math.random() < 0.2 ? `termo${Math.floor(Math.random() * 10)}` : null,
        url_pagina: Math.random() < 0.5 ? `/produto/${product._id.toHexString()}` : '/',
        origem_campanha: Math.random() < 0.3 ? utmSource : null,
        detalhes_evento: {
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: `UserAgent${Math.floor(Math.random() * 10)}`,
        },
      };

      eventosPorData.push(baseEvent);
      eventosPorUsuario.push(baseEvent);

      // Funil de Conversão
      const funilKey = `${userId}-${product._id.toHexString()}`;
      const existingFunil = funilConversao.find(
        (f) => `${f.id_usuario}-${f.id_produto}` === funilKey,
      );

      if (eventType === 'view_product') {
        if (!existingFunil) {
          funilConversao.push({
            id_usuario: userId,
            id_produto: product._id.toHexString(),
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
    if (termosBuscaUpdates.length > 0) {
      await cassandraClient.batch(termosBuscaUpdates, { prepare: true });
      console.log(
        `✅ [Cassandra] Atualizados ${termosBuscaUpdates.length} registros de contadores em termos_busca_agregados_por_dia.`,
      );
    }
    if (visualizacoesProdutoUpdates.length > 0) {
      await cassandraClient.batch(visualizacoesProdutoUpdates, { prepare: true });
      console.log(
        `✅ [Cassandra] Atualizados ${visualizacoesProdutoUpdates.length} registros de contadores em visualizacoes_produto_agregadas_por_dia.`,
      );
    }

    console.log(`✅ [Cassandra] Seed concluído com ${NUM_EVENTS} eventos simulados.`);
  } catch (error) {
    console.error('❌ [Cassandra] Erro durante o seeding:', error);
    // Relança o erro para que o processo principal (seed-all) falhe e exiba o erro.
    throw error;
  }
}

/**
 * Insere um array de objetos em uma tabela do Cassandra usando uma única query preparada em batch.
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

  const firstRow = data[0];
  const columns = Object.keys(firstRow).join(', ');
  const placeholders = Object.keys(firstRow)
    .map(() => '?')
    .join(', ');
  const query = `INSERT INTO ${keyspace}.${table} (${columns}) VALUES (${placeholders})`;

  const batchQueries = data.map((row) => ({ query, params: Object.values(row) }));

  await cassandraClient.batch(batchQueries, { prepare: true, logged: false });
  console.log(`✅ [Cassandra] Inseridos ${data.length} registros na tabela ${table}.`);
}

export default seedCassandra;
