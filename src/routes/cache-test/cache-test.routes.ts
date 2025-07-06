import { FastifyInstance } from 'fastify';

export default async function cacheTestRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/redis/ping',
    {
      schema: {
        tags: ['Database Tests'],
        summary: 'Testa conexão com Redis',
        description: 'Endpoint para verificar se a conexão com Redis está funcionando',
        response: {
          200: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'PONG' },
              status: { type: 'string', example: 'ok' },
            },
          },
          500: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'error' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Ping simples para testar a conexão com Redis
        const result = await fastify.redis.ping();
        return { ping: result, status: 'ok' };
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  );
}
