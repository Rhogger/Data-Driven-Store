import { FastifyInstance } from 'fastify';
import createCategoryRoutes from './create_category.routes';

export default async function categoryRoutes(fastify: FastifyInstance) {
  await fastify.register(createCategoryRoutes);
}
