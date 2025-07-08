import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { databaseTestsSchemas } from '@/routes/database_tests/schema/database_tests.schemas';

const cassandraPingRoute = async (fastify: FastifyInstance) => {
  fastify.get('/cassandra/ping', {
    schema: databaseTestsSchemas.cassandraPing(),
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        await fastify.cassandra.execute('SELECT now() FROM system.local');
        return reply.send({ ping: 'pong', status: 'ok' });
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  });
};

export default cassandraPingRoute;
