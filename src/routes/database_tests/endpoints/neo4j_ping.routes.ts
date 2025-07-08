import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { databaseTestsSchemas } from '@/routes/database_tests/schema/database_tests.schemas';

export default async function neo4jPingRoute(fastify: FastifyInstance) {
  fastify.get('/neo4j/ping', {
    schema: databaseTestsSchemas.neo4jPing(),
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        await fastify.neo4j.executeQuery('RETURN 1 as ping');
        return reply.send({ ping: 'pong', status: 'ok' });
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  });
}
