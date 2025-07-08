import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import neo4j from 'neo4j-driver';
import { databaseConfig } from '@config/database';
import { promises as fs } from 'fs';
import { join } from 'path';

const neo4jConnector: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const driver = neo4j.driver(
    databaseConfig.neo4j.uri,
    neo4j.auth.basic(databaseConfig.neo4j.user, databaseConfig.neo4j.password),
    {
      disableLosslessIntegers: true,
      encrypted: false,
      trust: 'TRUST_ALL_CERTIFICATES',
    },
  );

  try {
    const serverInfo = await driver.getServerInfo();
    fastify.log.info(`Conectado ao Neo4j: ${serverInfo.address}`);
  } catch (error) {
    fastify.log.error('Erro ao conectar ao Neo4j:', error);
    throw error;
  }

  try {
    const initScriptPath = join(process.cwd(), 'db', 'neo4j', 'init.cypher');
    const initScript = await fs.readFile(initScriptPath, 'utf-8');

    const commands = initScript
      .split(';')
      .map((cmd: string) => cmd.trim())
      .filter((cmd: string) => cmd.length > 0 && !cmd.startsWith('//'));

    if (commands.length > 0) {
      const session = driver.session();
      try {
        for (const command of commands) {
          if (command.trim()) {
            await session.run(command);
          }
        }
        fastify.log.info('Script de inicialização do Neo4j executado com sucesso');
      } finally {
        await session.close();
      }
    }
  } catch (error) {
    fastify.log.warn(
      'Não foi possível executar o script de inicialização do Neo4j:',
      error instanceof Error ? error.message : 'Erro desconhecido',
    );
  }

  fastify.decorate('neo4j', driver);

  fastify.addHook('onClose', async () => {
    await driver.close();
  });
};

export default fp(neo4jConnector, {
  name: 'neo4j-connector',
});
