import { FastifyPluginAsync } from 'fastify';
import { OrderRepository } from '@repositories/order/OrderRepository';
import { reportSchemas } from '@routes/reports/schema/report.schemas';

const billingByCategoryReportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/reports/billing-by-category', {
    schema: reportSchemas.billingByCategory(),
    handler: async (request, reply) => {
      const repo = new OrderRepository(fastify);
      const data = await repo.getBillingByCategory();
      return reply.send(data);
    },
  });
};

export default billingByCategoryReportRoutes;
