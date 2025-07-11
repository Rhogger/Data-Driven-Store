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
            'visualizou',
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
            'comprou',
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
      // Não insere avaliações em eventos_por_data, pois não é tipo permitido
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
    const comprasPorUtm: any[] = [];
    const termosBuscaMap = new Map<string, number>();
    const visualizacoesProdutoMap = new Map<string, number>();
    // Apenas tipos permitidos: visualizou, comprou, adicionou_no_carrinho
    const eventTypes = ['visualizou', 'comprou', 'adicionou_no_carrinho'];
    const utmSources = ['google', 'facebook', 'email', 'direct'];

    // --- Geração de eventos aleatórios (como antes, mas termo_busca só nome de produto cortado aleatório) ---
    for (let i = 0; i < NUM_EVENTS; i++) {
      // const client = clients[Math.floor(Math.random() * clients.length)];
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

      // eventos_por_data: só pode ter as colunas do schema atual
      const baseEventData: any = {
        data_evento: date,
        timestamp_evento: timestamp,
        id_evento: eventId,
        tipo_evento: eventType,
        origem_campanha: Math.random() < 0.3 ? utmSource : null,
      };
      eventosPorData.push(baseEventData);

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

    // --- Visualizações de Produto Agregadas (baseado nos eventos aleatórios) ---
    // Visualizações de Produto Agregadas FIEIS aos dados reais: usa compras e eventos reais
    // Gera visualizações agregadas por produto por dia, baseando-se em compras reais e datas reais
    const dias = 6;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    for (let d = 0; d <= dias; d++) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - d);
      // Para cada produto do Mongo
      for (const product of products) {
        // Busca quantas compras desse produto ocorreram nesse dia
        const comprasNoDia = comprasResult.rows.filter(
          (row) =>
            row.id_produto === product._id.toHexString() &&
            new Date(row.data_pedido).toISOString().slice(0, 10) ===
              data.toISOString().slice(0, 10),
        );
        // Considera cada compra como uma visualização (ou pode somar quantidade)
        let totalVisualizacoes = 0;
        for (const compra of comprasNoDia) {
          totalVisualizacoes += compra.quantidade || 1;
        }
        // Se não houver compra, pode simular visualizações baseadas em outros eventos (opcional)
        // Aqui, se quiser, pode adicionar visualizações "simuladas" para produtos sem compra
        if (totalVisualizacoes > 0) {
          const key = `${data.toISOString()}|${product._id.toHexString()}`;
          visualizacoesProdutoMap.set(key, totalVisualizacoes);
        }
      }
    }

    // compras_por_utm_source compatível com compras reais
    for (const compra of comprasResult.rows) {
      // Só insere se o produto existe no Mongo
      if (!produtosMongoIds.has(compra.id_produto)) continue;
      // Alterna origem_campanha entre as opções disponíveis
      const utmSources = ['google', 'facebook', 'email', 'direct'];
      const origem_campanha = utmSources[Math.floor(Math.random() * utmSources.length)];
      comprasPorUtm.push({
        origem_campanha,
        timestamp_evento: compra.data_pedido,
        id_usuario: compra.id_cliente, // int, conforme schema
        id_produto: compra.id_produto,
      });
    }

    // --- Funil de Conversão realista: dados reais de compra + simulação coerente ---
    // --- Funil de Conversão realista: dados reais de compra + simulação coerente ---
    // Remove qualquer declaração duplicada de funilConversao
    const funilConversaoMap = new Map();
    // 1. Preencher funil com dados reais de compra
    for (const compra of comprasResult.rows) {
      if (!produtosMongoIds.has(compra.id_produto)) continue;
      const key = `${compra.id_cliente}-${compra.id_produto}`;
      funilConversaoMap.set(key, {
        id_usuario: compra.id_cliente,
        id_produto: compra.id_produto,
        visualizou: true,
        adicionou_carrinho: true,
        comprou: true,
      });
    }
    // 2. Simular visualizações e adições ao carrinho para outros clientes/produtos
    for (const client of clients) {
      for (const product of products) {
        const produtoId = product._id.toHexString();
        const key = `${client.id_cliente}-${produtoId}`;
        if (funilConversaoMap.has(key)) continue; // já comprou
        // 60% dos clientes visualizam, 30% adicionam ao carrinho, mas não compram
        if (Math.random() < 0.6) {
          funilConversaoMap.set(key, {
            id_usuario: client.id_cliente,
            id_produto: produtoId,
            visualizou: true,
            adicionou_carrinho: Math.random() < 0.5,
            comprou: false,
          });
        }
      }
    }
    const funilConversao = Array.from(funilConversaoMap.values());

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
