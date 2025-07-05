import { FastifyInstance } from 'fastify';
import createCategoryRoutes from './endpoints/create_category.routes';
import listCategoriesRoutes from './endpoints/list_categories.routes';
import getCategoryByIdRoutes from './endpoints/get_category_by_id.routes';

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.register(listCategoriesRoutes);
  fastify.register(getCategoryByIdRoutes);
  fastify.register(createCategoryRoutes);
}
