import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { healthCheckSchemas } from '@routes/health-check/schema/health-check.schemas';

async function healthCheckHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Verificar conexões com bancos de dados
    let mongoStatus = 'connected';
    let postgresStatus = 'connected';
    let redisStatus = 'connected';
    let neo4jStatus = 'connected';

    try {
      // Verificar MongoDB
      await this.mongodb.client.db().admin().ping();
    } catch {
      mongoStatus = 'disconnected';
    }

    try {
      // Verificar PostgreSQL
      await this.pg.query('SELECT 1');
    } catch {
      postgresStatus = 'disconnected';
    }

    try {
      // Verificar Redis
      await this.redis.ping();
    } catch {
      redisStatus = 'disconnected';
    }

    try {
      // Verificar Neo4j
      await this.neo4j.getServerInfo();
    } catch {
      neo4jStatus = 'disconnected';
    }

    reply.code(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongodb: mongoStatus,
      postgres: postgresStatus,
      redis: redisStatus,
      neo4j: neo4jStatus,
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor.',
    });
  }
}

export default async function healthCheckRoutes(fastify: FastifyInstance) {
  fastify.get('/health-check', {
    schema: healthCheckSchemas.check(),
    handler: healthCheckHandler,
  });
}
