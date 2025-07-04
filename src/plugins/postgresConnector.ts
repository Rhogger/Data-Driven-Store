import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { Pool } from 'pg';

import { databaseConfig } from '@config/database';

declare module 'fastify' {
  interface FastifyInstance {
    pg: Pool;
  }
}

const postgresConnector: FastifyPluginAsync = async (fastify, _opts) => {
  const pool = new Pool(databaseConfig.postgres);

  try {
    await pool.query('SELECT NOW()');
    fastify.decorate('pg', pool);
    fastify.log.info('Conectado ao PostgreSQL!');
  } catch (err) {
    fastify.log.error('Erro ao conectar ao PostgreSQL:', err);
    throw err;
  }

  fastify.addHook('onClose', async (instance) => {
    fastify.log.info('Fechando pool de conexões com PostgreSQL...');
    await instance.pg.end();
    fastify.log.info('Pool de conexões com PostgreSQL fechado.');
  });
};

export default fp(postgresConnector);
