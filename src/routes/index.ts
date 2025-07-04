import { FastifyInstance } from 'fastify';
import healthCheckRoutes from '@routes/health-check/health-check.routes';
import productRoutes from '@routes/products/product.routes';
import topCustomersReportRoutes from '@routes/reports/top-customers-report.routes';

export default async function apiRoutes(fastify: FastifyInstance) {
  fastify.register(healthCheckRoutes);
  fastify.register(productRoutes);
  fastify.register(topCustomersReportRoutes);
}
