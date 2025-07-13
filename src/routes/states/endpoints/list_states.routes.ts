import { FastifyPluginAsync } from 'fastify';
import { StateRepository } from '@repositories/state/StateRepository';
import { stateSchemas } from '@routes/states/schema/state.schemas';

const listStatesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/states', {
    schema: stateSchemas.list(),
    handler: async (request, reply) => {
      const stateRepository = new StateRepository(fastify);
      const states = await stateRepository.findAll();
      return reply.send({ success: true, data: states });
    },
  });
};

export default listStatesRoutes;
