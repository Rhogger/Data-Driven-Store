import { Client } from 'cassandra-driver';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

const cassandraConnector = fp(
  async (fastify: FastifyInstance) => {
    const cassandraClient = new Client({
      contactPoints: [process.env.CASSANDRA_HOST || 'cassandra'],
      localDataCenter: 'datacenter1',
      credentials: {
        username: process.env.CASSANDRA_USER || 'cassandra',
        password: process.env.CASSANDRA_PASSWORD || 'cassandra',
      },
      protocolOptions: { port: Number(process.env.CASSANDRA_PORT) || 9042 },
    });

    try {
      fastify.log.info('Conectando ao Cassandra...');
      await cassandraClient.connect();
      fastify.log.info('Cassandra connected successfully');

      // Garantir que o keyspace existe
      const keyspace = process.env.CASSANDRA_KEYSPACE || 'datadriven_store';
      fastify.log.info(`Verificando keyspace: ${keyspace}`);

      const createKeyspaceQuery = `
        CREATE KEYSPACE IF NOT EXISTS ${keyspace}
        WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
      `;

      await cassandraClient.execute(createKeyspaceQuery);
      fastify.log.info(`Keyspace ${keyspace} verificado/criado com sucesso`);

      // Criar tabelas se não existirem
      const createTablesQueries = [
        `
        CREATE TABLE IF NOT EXISTS ${keyspace}.eventos_por_data (
          data_evento DATE,
          timestamp_evento TIMESTAMP,
          id_evento UUID,
          id_usuario UUID,
          tipo_evento TEXT,
          id_produto TEXT,
          termo_busca TEXT,
          url_pagina TEXT,
          origem_campanha TEXT,
          detalhes_evento MAP<TEXT, TEXT>,
          PRIMARY KEY (data_evento, timestamp_evento, id_evento)
        )`,
        `
        CREATE TABLE IF NOT EXISTS ${keyspace}.eventos_por_usuario (
          id_usuario UUID,
          timestamp_evento TIMESTAMP,
          id_evento UUID,
          data_evento DATE,
          tipo_evento TEXT,
          id_produto TEXT,
          termo_busca TEXT,
          url_pagina TEXT,
          origem_campanha TEXT,
          detalhes_evento MAP<TEXT, TEXT>,
          PRIMARY KEY (id_usuario, timestamp_evento, id_evento)
        )`,
        `
        CREATE TABLE IF NOT EXISTS ${keyspace}.funil_conversao_por_usuario_produto (
          id_usuario UUID,
          id_produto TEXT,
          visualizou BOOLEAN,
          adicionou_carrinho BOOLEAN,
          comprou BOOLEAN,
          timestamp_primeira_visualizacao TIMESTAMP,
          timestamp_ultima_atualizacao TIMESTAMP,
          PRIMARY KEY (id_usuario, id_produto)
        )`,
        `
        CREATE TABLE IF NOT EXISTS ${keyspace}.termos_busca_agregados_por_dia (
          data_evento DATE,
          termo_busca TEXT,
          total_contagem COUNTER,
          PRIMARY KEY (data_evento, termo_busca)
        )`,
        `
        CREATE TABLE IF NOT EXISTS ${keyspace}.visualizacoes_produto_agregadas_por_dia (
          data_evento DATE,
          id_produto TEXT,
          total_visualizacoes COUNTER,
          PRIMARY KEY (data_evento, id_produto)
        )`,
        `
        CREATE TABLE IF NOT EXISTS ${keyspace}.compras_por_utm_source (
          origem_campanha TEXT,
          timestamp_evento TIMESTAMP,
          id_usuario UUID,
          id_produto TEXT,
          id_pedido UUID,
          tipo_evento TEXT,
          PRIMARY KEY (origem_campanha, timestamp_evento, id_usuario)
        )`,
      ];

      for (const query of createTablesQueries) {
        await cassandraClient.execute(query);
      }
      fastify.log.info('Tabelas do Cassandra verificadas/criadas com sucesso');
    } catch (error: any) {
      fastify.log.error('Failed to connect to Cassandra:', error?.message || 'Unknown error');
      throw error;
    }

    fastify.decorate('cassandra', cassandraClient);

    fastify.addHook('onClose', async () => {
      await cassandraClient.shutdown();
    });
  },
  {
    name: 'cassandra-connector',
    fastify: '>=5.0.0',
  },
);

export default cassandraConnector;
