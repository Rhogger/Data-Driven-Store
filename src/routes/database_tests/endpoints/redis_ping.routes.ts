import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { databaseTestsSchemas } from '@/routes/database_tests/schema/database_tests.schemas';

const redisPingRoute = async (fastify: FastifyInstance) => {
  fastify.get('/redis/ping', {
    schema: databaseTestsSchemas.redisPing(),
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await fastify.ping();
        return reply.send({ ping: result, status: 'ok' });
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  });
};

export default redisPingRoute;
