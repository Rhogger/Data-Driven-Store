import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { healthCheckSchemas } from '@/routes/health_check/schema/health_check.schemas';

async function healthCheckHandler(
  this: FastifyInstance,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    let mongoStatus = 'connected';
    let postgresStatus = 'connected';
    let redisStatus = 'connected';
    let neo4jStatus = 'connected';
    let cassandraStatus = 'connected';

    try {
      await this.mongodb.client.db().admin().ping();
    } catch {
      mongoStatus = 'disconnected';
    }

    try {
      await this.pg.query('SELECT 1');
    } catch {
      postgresStatus = 'disconnected';
    }

    try {
      await this.redis.ping();
    } catch {
      redisStatus = 'disconnected';
    }

    try {
      await this.neo4j.getServerInfo();
    } catch {
      neo4jStatus = 'disconnected';
    }

    try {
      await this.cassandra.execute('SELECT now() FROM system.local');
    } catch {
      cassandraStatus = 'disconnected';
    }

    reply.code(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongodb: mongoStatus,
      postgres: postgresStatus,
      redis: redisStatus,
      neo4j: neo4jStatus,
      cassandra: cassandraStatus,
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
