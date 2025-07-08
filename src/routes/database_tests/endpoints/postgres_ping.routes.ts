import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { databaseTestsSchemas } from '@/routes/database_tests/schema/database_tests.schemas';

const postgresPingRoute = async (fastify: FastifyInstance) => {
  fastify.get('/postgres/ping', {
    schema: databaseTestsSchemas.postgresPing(),
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        await fastify.pg.query('SELECT 1');
        return reply.send({ ping: 'pong', status: 'ok' });
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  });
};

export default postgresPingRoute;
