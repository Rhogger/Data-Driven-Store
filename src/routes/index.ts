import { FastifyInstance } from 'fastify';
import healthCheckRoutes from '@/routes/health_check/health_check.routes';
import databaseTestRoutes from '@/routes/database_tests/database_tests.routes';
import authRoutes from '@routes/auth/auth.routes';
import addressRoutes from '@routes/addresses/address.routes';
import categoryRoutes from '@routes/categories/category.routes';
import productRoutes from '@routes/products/product.routes';
import orderRoutes from '@routes/orders/order.routes';
import recommendationRoutes from '@routes/recommendations/recommendation.routes';
import topCustomersReportRoutes from '@routes/reports/top-customers-report.routes';
import analyticsRoutes from '@routes/analytics/analytics.routes';
import cartRoutes from '@routes/cart/cart.routes';

export default async function apiRoutes(fastify: FastifyInstance) {
  fastify.register(healthCheckRoutes);
  fastify.register(databaseTestRoutes);
  fastify.register(authRoutes);
  fastify.register(addressRoutes);
  fastify.register(categoryRoutes);
  fastify.register(productRoutes);
  fastify.register(orderRoutes);
  fastify.register(recommendationRoutes);
  fastify.register(topCustomersReportRoutes);
  fastify.register(analyticsRoutes);
  fastify.register(cartRoutes);
}
