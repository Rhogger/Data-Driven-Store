import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { MongoClient, Db } from 'mongodb';

import { databaseConfig } from '@config/database';

declare module 'fastify' {
  interface FastifyInstance {
    mongodb: {
      client: MongoClient;
      db: Db;
    };
  }
}

const mongodbConnector: FastifyPluginAsync = async (fastify, _opts) => {
  const client = new MongoClient(databaseConfig.mongodb.uri);

  try {
    await client.connect();

    const db = client.db(databaseConfig.mongodb.database);

    fastify.decorate('mongodb', {
      client,
      db,
    });

    fastify.log.info('Conectado ao MongoDB!');
  } catch (err) {
    fastify.log.error('Erro ao conectar ao MongoDB:', err);
    throw err;
  }

  fastify.addHook('onClose', async (instance) => {
    fastify.log.info('Fechando conexão com MongoDB...');
    await instance.mongodb.client.close();
    fastify.log.info('Conexão com MongoDB fechada.');
  });
};

export default fp(mongodbConnector);
