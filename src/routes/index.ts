import { FastifyInstance } from 'fastify';
import healthCheckRoutes from '@routes/health-check/health-check.routes';
import productRoutes from '@routes/products/product.routes';
import categoryRoutes from '@routes/categories/category.routes';
import topCustomersReportRoutes from '@routes/reports/top-customers-report.routes';
import orderRoutes from '@routes/orders/order.routes';
import cacheTestRoutes from '@routes/cache-test/cache-test.routes';
import neo4jTestRoutes from '@routes/neo4j-test/neo4j-test.routes';

export default async function apiRoutes(fastify: FastifyInstance) {
  fastify.register(healthCheckRoutes);
  fastify.register(productRoutes);
  fastify.register(categoryRoutes);
  fastify.register(topCustomersReportRoutes);
  fastify.register(orderRoutes);
  fastify.register(cacheTestRoutes);
  fastify.register(neo4jTestRoutes);
}
