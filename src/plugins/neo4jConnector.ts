import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import neo4j from 'neo4j-driver';
import { databaseConfig } from '@config/database';

const neo4jConnector: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.log.info(
    {
      NEO4J_URI: databaseConfig.neo4j.uri,
      NEO4J_USER: databaseConfig.neo4j.user,
      NEO4J_PASSWORD: databaseConfig.neo4j.password ? '***' : undefined,
    },
    '[neo4jConnector] Configuração recebida para o driver Neo4j',
  );

  const driver = neo4j.driver(
    databaseConfig.neo4j.uri,
    neo4j.auth.basic(databaseConfig.neo4j.user, databaseConfig.neo4j.password),
  );

  try {
    const serverInfo = await driver.getServerInfo();
    fastify.log.info(
      {
        address: serverInfo.address,
      },
      '[neo4jConnector] Conectado ao Neo4j',
    );
  } catch (error) {
    fastify.log.error({ err: error }, '[neo4jConnector] Erro ao conectar ao Neo4j');
    throw error;
  }

  fastify.decorate('neo4j', driver);
  fastify.log.info('[neo4jConnector] Driver Neo4j decorado no Fastify');

  fastify.addHook('onClose', async () => {
    fastify.log.info('[neo4jConnector] Fechando driver Neo4j...');
    await driver.close();
    fastify.log.info('[neo4jConnector] Driver Neo4j fechado.');
  });
};

export default fp(neo4jConnector, {
  name: 'neo4j-connector',
});
