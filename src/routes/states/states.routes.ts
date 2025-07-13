import { FastifyPluginAsync } from 'fastify';
import listStatesRoutes from '@routes/states/endpoints/list_states.routes';

const statesRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(listStatesRoutes);
};

export default statesRoutes;
