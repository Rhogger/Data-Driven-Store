import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { databaseConfig } from '@config/database';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisConnector(fastify: FastifyInstance) {
  const redisClient = new Redis({
    host: databaseConfig.redis.host,
    port: databaseConfig.redis.port,
    password: databaseConfig.redis.password,
    db: databaseConfig.redis.db,
    lazyConnect: true,
  });

  // Eventos de conexão
  redisClient.on('connect', () => {
    fastify.log.info('Conectando ao Redis...');
  });

  redisClient.on('ready', () => {
    fastify.log.info('Conectado ao Redis!');
  });

  redisClient.on('error', (err) => {
    fastify.log.error('Erro na conexão com Redis:', err);
  });

  redisClient.on('close', () => {
    fastify.log.info('Conexão com Redis fechada');
  });

  redisClient.on('reconnecting', () => {
    fastify.log.info('Reconectando ao Redis...');
  });

  // Conectar ao Redis
  try {
    await redisClient.connect();
  } catch (error) {
    fastify.log.error('Falha ao conectar ao Redis:', error);
    throw error;
  }

  // Registrar o cliente Redis na instância do Fastify
  fastify.decorate('redis', redisClient);

  // Fechar conexão quando o servidor for fechado
  fastify.addHook('onClose', async () => {
    await redisClient.quit();
  });
}

export default fp(redisConnector, {
  name: 'redis-connector',
});
