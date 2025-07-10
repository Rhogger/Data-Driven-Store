import { FastifyPluginAsync } from 'fastify';
import { OrderRepository } from '@/repositories/order/OrderRepository';
import { reportSchemas } from '@/routes/analytics/schema/report.schemas';

const topCustomersReportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/analytics/top-customers', {
    schema: reportSchemas.topCustomerReport(),
    preHandler: fastify.authenticate,
    handler: async (_request, reply) => {
      const repo = new OrderRepository(fastify);
      const data = await repo.getTopCustomers();
      return reply.send({ success: true, data });
    },
  });
};

export default topCustomersReportRoutes;
