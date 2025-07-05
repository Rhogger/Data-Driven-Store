import { FastifyInstance } from 'fastify';
import topCustomersReportRoutes from '@routes/reports/endpoints/top_customers_report.routes';
import billingByCategoryReportRoutes from '@routes/reports/endpoints/billing_by_category_report.routes';

export default async function reportRoutes(fastify: FastifyInstance) {
  await fastify.register(topCustomersReportRoutes);
  await fastify.register(billingByCategoryReportRoutes);
}
