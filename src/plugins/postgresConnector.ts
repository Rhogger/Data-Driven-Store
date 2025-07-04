import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin'; 

import { Client as PostgresClient } from 'pg';

import { databaseConfig } from '../config/database';

declare module 'fastify' {
  interface FastifyInstance {
    pg: PostgresClient;
  }
}

const postgresConnector: FastifyPluginAsync = async (fastify, opts) => {
  const pgClient = new PostgresClient(databaseConfig.postgres);

  try {
    await pgClient.connect();
    fastify.decorate('pg', pgClient);
    fastify.log.info('Conectado ao PostgreSQL!');
  } catch (err) {
    fastify.log.error('Erro ao conectar ao PostgreSQL:', err);
    throw err;
  }

  fastify.addHook('onClose', async (instance) => {
    fastify.log.info('Fechando conexão com PostgreSQL...');
    await instance.pg.end();
    fastify.log.info('Conexão com PostgreSQL fechada.');
  });
};

export default fp(postgresConnector);