import { FastifyPluginAsync } from 'fastify';
import listCitiesRoutes from '@routes/cities/endpoints/list_cities.routes';

const citiesRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(listCitiesRoutes);
};

export default citiesRoutes;
