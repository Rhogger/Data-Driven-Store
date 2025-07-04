import { FastifyInstance } from 'fastify';
import healthCheckRoutes from './health-check/health-check.routes';
import categoryRoutes from './categories/category.routes';

export default async function apiRoutes(fastify: FastifyInstance) {
  fastify.register(healthCheckRoutes);
  fastify.register(categoryRoutes);
}