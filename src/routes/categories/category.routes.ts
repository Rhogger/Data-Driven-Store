import { FastifyInstance } from 'fastify';
import createCategoryRoutes from '@routes/categories/endpoints/create_category.routes';
import listCategoriesRoutes from '@routes/categories/endpoints/list_categories.routes';
import getCategoryByIdRoutes from '@routes/categories/endpoints/get_category_by_id.routes';

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.register(listCategoriesRoutes);
  fastify.register(getCategoryByIdRoutes);
  fastify.register(createCategoryRoutes);
}
