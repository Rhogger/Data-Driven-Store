import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { databaseTestsSchemas } from '@/routes/database_tests/schema/database_tests.schemas';

const mongodbPingRoute = async (fastify: FastifyInstance) => {
  fastify.get('/mongodb/ping', {
    schema: databaseTestsSchemas.mongodbPing(),
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        await fastify.mongodb.client.db().admin().ping();
        return reply.send({ ping: 'pong', status: 'ok' });
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  });
};

export default mongodbPingRoute;
