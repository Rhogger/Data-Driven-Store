import { FastifyInstance } from 'fastify';
import healthCheckRoutes from '@routes/health-check/health-check.routes';
import categoryRoutes from '@routes/categories/category.routes';
import productRoutes from '@routes/products/product.routes';

export default async function apiRoutes(fastify: FastifyInstance) {
  fastify.register(healthCheckRoutes);
  fastify.register(categoryRoutes);
  fastify.register(productRoutes);
}
