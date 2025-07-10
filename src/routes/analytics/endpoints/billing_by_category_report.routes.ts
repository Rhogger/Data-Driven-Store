import { FastifyPluginAsync } from 'fastify';
import { OrderRepository } from '@repositories/order/OrderRepository';
import { reportSchemas } from '@/routes/analytics/schema/report.schemas';

const billingByCategoryReportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/analytics/billing-by-category', {
    schema: reportSchemas.billingByCategory(),
    preHandler: fastify.authenticate,
    handler: async (_request, reply) => {
      const orderRepo = new OrderRepository(fastify);
      const resposta = await orderRepo.getMonthlyBillingByCategory();
      return reply.send(resposta);
    },
  });
};

export default billingByCategoryReportRoutes;
