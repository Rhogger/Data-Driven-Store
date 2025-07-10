/* eslint-disable no-console */
import { Client } from 'cassandra-driver';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
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
  // Permite sobrescrever o keyspace via variável de ambiente, útil para ambientes de seed/teste
  const keyspace = process.env.CASSANDRA_KEYSPACE || databaseConfig.cassandra.keyspace;

  // --- INTEGRAÇÃO COM NEO4J EVENTS JSON ---
  // Se existir o arquivo neo4j_events.json, consome e popula as tabelas de eventos compatíveis
  const eventsPath = path.resolve(__dirname, '../../neo4j_events.json');
  if (fs.existsSync(eventsPath)) {
    console.log('🔄 [Cassandra] Importando eventos do arquivo neo4j_events.json...');
    const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));

    // Visualizações
    if (Array.isArray(eventsData.visualizou)) {
      for (const view of eventsData.visualizou) {
        await cassandraClient.execute(
          `INSERT INTO ${keyspace}.eventos_por_data (id_evento, id_cliente, id_produto, tipo_evento, data_evento, timestamp_evento) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            view.id_cliente,
            view.id_produto,
            'view_product',
            new Date(view.data),
            new Date(view.data),
          ],
          { prepare: true },
        );
      }
      console.log(`   -> ${eventsData.visualizou.length} visualizações importadas.`);
    }

    // Compras
    if (Array.isArray(eventsData.comprou)) {
      for (const compra of eventsData.comprou) {
        await cassandraClient.execute(
          `INSERT INTO ${keyspace}.eventos_por_data (id_evento, id_cliente, id_produto, tipo_evento, data_evento, timestamp_evento, quantidade) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            compra.id_cliente,
            compra.id_produto,
            'purchase',
            new Date(compra.data_pedido),
            new Date(compra.data_pedido),
            compra.quantidade,
          ],
          { prepare: true },
        );
      }
      console.log(`   -> ${eventsData.comprou.length} compras importadas.`);
    }

    // Avaliações (opcional)
    if (Array.isArray(eventsData.avaliou)) {
      for (const review of eventsData.avaliou) {
        await cassandraClient.execute(
          `INSERT INTO ${keyspace}.eventos_por_data (id_evento, id_cliente, id_produto, tipo_evento, data_evento, timestamp_evento, nota, comentario) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            review.id_cliente,
            review.id_produto,
            'review',
            new Date(review.data),
            new Date(review.data),
            review.nota,
            review.comentario,
          ],
          { prepare: true },
        );
      }
      console.log(`   -> ${eventsData.avaliou.length} avaliações importadas.`);
    }
    console.log('✅ [Cassandra] Eventos do Neo4j importados com sucesso!');
    return; // Não gera eventos aleatórios se importar do JSON
  }

  try {
    // 1. Truncate das tabelas para garantir um estado limpo
    const tables = [
      'eventos_por_data',
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

    // 3. Gerar eventos compatíveis com compras reais (Postgres)
    // Busca compras reais do Postgres para garantir compatibilidade de IDs
    const comprasResult = await pgPool.query(
      `SELECT p.id_cliente, ip.id_produto, p.data_pedido, ip.quantidade, p.status_pedido
         FROM itens_pedido ip
         JOIN pedidos p ON ip.id_pedido = p.id_pedido
         WHERE p.status_pedido IN ('Entregue', 'Enviado')`,
    );

    // Map para garantir que só clientes que compraram sejam usados
    // const clientesQueCompraram = new Set(comprasResult.rows.map((row) => row.id_cliente));

    // Map de produtos do Mongo para garantir que o id_produto seja igual ao do Mongo
    const produtosMongoIds = new Set(products.map((p) => p._id.toHexString()));

    // Gerar eventos aleatórios normalmente para outros tipos, mas compras_por_utm_source será compatível
    const eventosPorData: any[] = [];
    const funilConversao: any[] = [];
    const comprasPorUtm: any[] = [];
    const termosBuscaMap = new Map<string, number>();
    const visualizacoesProdutoMap = new Map<string, number>();
    const eventTypes = ['view_product', 'search', 'add_to_cart', 'purchase'];
    const utmSources = ['google', 'facebook', 'email', 'direct'];

    // --- Geração de eventos aleatórios (como antes, mas termo_busca só nome de produto cortado aleatório) ---
    for (let i = 0; i < NUM_EVENTS; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const utmSource = utmSources[Math.floor(Math.random() * utmSources.length)];
      // Gera timestamp entre 6 dias atrás e agora
      const now = Date.now();
      const minDate = now - 6 * 24 * 60 * 60 * 1000;
      const timestamp = new Date(minDate + Math.random() * (now - minDate));
      const date = new Date(timestamp);
      date.setHours(0, 0, 0, 0);
      const eventId = randomUUID();
      const userId = client.id_cliente; // INT!

      // eventos_por_data: só pode ter as colunas do schema atual
      const baseEventData: any = {
        data_evento: date,
        timestamp_evento: timestamp,
        id_evento: eventId,
        tipo_evento: eventType,
        origem_campanha: Math.random() < 0.3 ? utmSource : null,
      };
      eventosPorData.push(baseEventData);

      // Funil de Conversão (ajustado para schema atual)
      const funilKey = `${userId}-${product.cassandra_uuid}`;
      const existingFunil = funilConversao.find(
        (f) => `${f.id_usuario}-${f.id_produto}` === funilKey,
      );
      if (eventType === 'view_product') {
        if (!existingFunil) {
          funilConversao.push({
            id_usuario: userId, // INT!
            id_produto: product.cassandra_uuid,
            visualizou: true,
            adicionou_carrinho: false,
            comprou: false,
            timestamp_ultima_atualizacao: timestamp,
          });
        } else {
          existingFunil.timestamp_ultima_atualizacao = timestamp;
          if (!existingFunil.visualizou) {
            existingFunil.visualizou = true;
          }
        }
      } else if (eventType === 'add_to_cart' && existingFunil) {
        existingFunil.adicionou_carrinho = true;
        existingFunil.timestamp_ultima_atualizacao = timestamp;
      } else if (eventType === 'purchase' && existingFunil) {
        existingFunil.comprou = true;
        existingFunil.timestamp_ultima_atualizacao = timestamp;
      }

      // Termos de Busca Agregados (apenas nome do produto, 50-100% aleatório)
      if (Math.random() < 0.2 && product.nome) {
        const len = product.nome.length;
        const pct = 0.5 + Math.random() * 0.5;
        const cutLen = Math.max(1, Math.floor(len * pct));
        const termo = product.nome.substring(0, cutLen);
        const buscaKey = `${date.toISOString()}|${termo}`;
        termosBuscaMap.set(buscaKey, (termosBuscaMap.get(buscaKey) || 0) + 1);
      }
      // Visualizações de Produto Agregadas (aqui não faz nada, será sobrescrito pelo Neo4j)
    }

    // --- VISUALIZAÇÕES DE PRODUTO AGREGADAS: sobrescreve para usar dados do Neo4j ---
    // Lê o arquivo neo4j_events.json para contar visualizações por produto por dia
    const neo4jEventsPath = path.resolve(__dirname, '../../neo4j_events.json');
    const visualizacoesPorProdutoPorDia: Record<string, number> = {};
    if (fs.existsSync(neo4jEventsPath)) {
      const neo4jEvents = JSON.parse(fs.readFileSync(neo4jEventsPath, 'utf-8'));
      if (Array.isArray(neo4jEvents.visualizou)) {
        // Para cada visualização, conta por produto e por dia (data_evento)
        for (const view of neo4jEvents.visualizou) {
          // Gera data entre 6 dias atrás e hoje
          const now = Date.now();
          const minDate = now - 6 * 24 * 60 * 60 * 1000;
          const timestamp = new Date(minDate + Math.random() * (now - minDate));
          const date = new Date(timestamp);
          date.setHours(0, 0, 0, 0);
          const key = `${date.toISOString()}|${view.id_produto}`;
          visualizacoesPorProdutoPorDia[key] = (visualizacoesPorProdutoPorDia[key] || 0) + 1;
        }
      }
    }
    // Substitui visualizacoesProdutoMap pelo novo
    visualizacoesProdutoMap.clear();
    for (const [key, count] of Object.entries(visualizacoesPorProdutoPorDia)) {
      visualizacoesProdutoMap.set(key, count);
    }

    // compras_por_utm_source compatível com compras reais
    for (const compra of comprasResult.rows) {
      // Só insere se o produto existe no Mongo
      if (!produtosMongoIds.has(compra.id_produto)) continue;
      // utm_source aleatório
      const utmSources = ['google', 'facebook', 'email', 'direct'];
      const origem_campanha = utmSources[Math.floor(Math.random() * utmSources.length)];
      comprasPorUtm.push({
        origem_campanha,
        timestamp_evento: compra.data_pedido,
        id_usuario: compra.id_cliente, // int, conforme schema
        id_produto: compra.id_produto,
      });
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
