import { FastifyPluginAsync } from 'fastify';
import { CityRepository } from '@repositories/city/CityRepository';
import { citySchemas } from '@routes/cities/schema/city.schemas';

const listCitiesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/cities', {
    schema: citySchemas.list(),
    handler: async (request, reply) => {
      const cityRepository = new CityRepository(fastify);
      const cities = await cityRepository.findAll();
      return reply.send({ success: true, data: cities });
    },
  });
};

export default listCitiesRoutes;
