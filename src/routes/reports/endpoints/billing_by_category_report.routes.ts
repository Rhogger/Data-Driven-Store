import { FastifyPluginAsync } from 'fastify';
import { BillingByCategoryReportRepository } from '@/repositories/reports/BillingByCategoryReportRepository';
import { reportSchemas } from '../schema/report.schemas';

const billingByCategoryReportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/reports/billing-by-category', {
    schema: reportSchemas.billingByCategory(),
    handler: async (request, reply) => {
      const repo = new BillingByCategoryReportRepository(fastify);
      const data = await repo.generate();
      return reply.send(data);
    },
  });
};

export default billingByCategoryReportRoutes;
