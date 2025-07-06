import { FastifyInstance } from 'fastify';

export default async function redisTestRoutes(fastify: FastifyInstance) {
  fastify.get('/redis/ping', async (request, reply) => {
    try {
      // Ping simples para testar a conexão com Redis
      const result = await fastify.redis.ping();
      return { ping: result, status: 'ok' };
    } catch (err: any) {
      return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
    }
  });
}
