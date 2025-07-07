import { FastifyInstance } from 'fastify';
import healthCheckRoutes from '@routes/health-check/health-check.routes';
import productRoutes from '@routes/products/product.routes';
import categoryRoutes from '@routes/categories/category.routes';
import topCustomersReportRoutes from '@routes/reports/top-customers-report.routes';
import orderRoutes from '@routes/orders/order.routes';
import databaseTestRoutes from '@routes/database-tests/database-tests.routes';
import recommendationRoutes from '@routes/recommendations/recommendation.routes';

export default async function apiRoutes(fastify: FastifyInstance) {
  fastify.register(healthCheckRoutes);
  fastify.register(productRoutes);
  fastify.register(categoryRoutes);
  fastify.register(topCustomersReportRoutes);
  fastify.register(orderRoutes);
  fastify.register(databaseTestRoutes);
  fastify.register(recommendationRoutes);
}
