import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import neo4j, { Driver } from 'neo4j-driver';
import { databaseConfig } from '@config/database';
import { promises as fs } from 'fs';
import { join } from 'path';

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

  // Verificar conexão
  try {
    const serverInfo = await driver.getServerInfo();
    fastify.log.info(`Conectado ao Neo4j: ${serverInfo.address}`);
  } catch (error) {
    fastify.log.error('Erro ao conectar ao Neo4j:', error);
    throw error;
  }

  // Executar script de inicialização se existir
  try {
    const initScriptPath = join(process.cwd(), 'db', 'neo4j', 'init.cypher');
    const initScript = await fs.readFile(initScriptPath, 'utf-8');

    // Dividir o script em comandos individuais (separados por ponto e vírgula)
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
    // Se não conseguir executar o script, apenas loggar o aviso (não quebrar a aplicação)
    fastify.log.warn(
      'Não foi possível executar o script de inicialização do Neo4j:',
      error instanceof Error ? error.message : 'Erro desconhecido',
    );
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
