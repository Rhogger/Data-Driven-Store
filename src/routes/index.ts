import { FastifyInstance } from 'fastify';
import healthCheckRoutes from '@routes/health-check/health-check.routes';
import productRoutes from '@routes/products/product.routes';
import categoryRoutes from '@routes/categories/category.routes';
import topCustomersReportRoutes from '@routes/reports/top-customers-report.routes';
import orderRoutes from '@routes/orders/order.routes';
import databaseTestRoutes from '@routes/database-tests/database-tests.routes';
import recommendationRoutes from '@routes/recommendations/recommendation.routes';
import analyticsRoutes from '@routes/analytics/analytics.routes';
import authRoutes from '@routes/auth/auth.routes';

export default async function apiRoutes(fastify: FastifyInstance) {
  fastify.register(healthCheckRoutes);
  fastify.register(authRoutes);
  fastify.register(databaseTestRoutes);
  fastify.register(categoryRoutes);
  fastify.register(productRoutes);
  fastify.register(orderRoutes);
  fastify.register(recommendationRoutes);
  fastify.register(topCustomersReportRoutes);
  fastify.register(analyticsRoutes);
}
