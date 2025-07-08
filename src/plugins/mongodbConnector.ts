import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { MongoClient } from 'mongodb';

import { databaseConfig } from '@config/database';

const mongodbConnector: FastifyPluginAsync = async (fastify: FastifyInstance) => {
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

export default fp(mongodbConnector, {
  name: 'mongodb-connector',
});
