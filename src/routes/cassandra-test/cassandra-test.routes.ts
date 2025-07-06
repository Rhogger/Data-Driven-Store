import { FastifyInstance } from 'fastify';
import { Client } from 'cassandra-driver';

declare module 'fastify' {
  interface FastifyInstance {
    cassandra: Client;
  }
}

export default async function cassandraTestRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/cassandra/ping',
    {
      schema: {
        tags: ['Database Tests'],
        summary: 'Testa conexão com Cassandra',
        description: 'Endpoint para verificar se a conexão com Cassandra está funcionando',
        response: {
          200: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'pong' },
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
        // Ping simples para testar a conexão
        await fastify.cassandra.execute('SELECT now() FROM system.local');
        return { ping: 'pong', status: 'ok' };
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  );
}
