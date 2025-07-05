import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import neo4j, { Driver } from 'neo4j-driver';
import { databaseConfig } from '@config/database';

declare module 'fastify' {
  interface FastifyInstance {
    neo4j: Driver;
  }
}

async function neo4jConnector(fastify: FastifyInstance) {
  const driver = neo4j.driver(
    databaseConfig.neo4j.uri,
    neo4j.auth.basic(databaseConfig.neo4j.user, databaseConfig.neo4j.password),
    {
      disableLosslessIntegers: true,
      encrypted: false, // Para desenvolvimento local
      trust: 'TRUST_ALL_CERTIFICATES',
    },
  );

  // Verificar conexão com retry
  let connectionAttempts = 0;
  const maxAttempts = 5;

  while (connectionAttempts < maxAttempts) {
    try {
      const serverInfo = await driver.getServerInfo();
      fastify.log.info(`Conectado ao Neo4j: ${serverInfo.address}`);
      break;
    } catch (error) {
      connectionAttempts++;
      fastify.log.warn(`Tentativa ${connectionAttempts}/${maxAttempts} de conexão ao Neo4j falhou`);

      if (connectionAttempts >= maxAttempts) {
        fastify.log.error('Erro ao conectar ao Neo4j:', error);
        throw error;
      }

      // Aguardar 2 segundos antes da próxima tentativa
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Registrar o driver Neo4j na instância do Fastify
  fastify.decorate('neo4j', driver);

  // Fechar conexão quando o servidor for fechado
  fastify.addHook('onClose', async () => {
    await driver.close();
  });
}

export default fp(neo4jConnector, {
  name: 'neo4j-connector',
});
