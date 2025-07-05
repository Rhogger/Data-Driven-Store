import { FastifyPluginAsync } from 'fastify';
import { TopCustomersReportRepository } from '@repositories/postgres/top-costumers/TopCustomersReportRepository';

const topCustomersReportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/reports/top-customers', {
    schema: {
      tags: ['Reports'],
      summary: 'Top 5 clientes com maior faturamento nos últimos 6 meses',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id_cliente: { type: 'integer' },
                  nome: { type: 'string' },
                  email: { type: 'string' },
                  faturamento_total: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const repo = new TopCustomersReportRepository(fastify.pg);
      const data = await repo.generate();
      return reply.send({ success: true, data });
    },
  });
};

export default topCustomersReportRoutes;
