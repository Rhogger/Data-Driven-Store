import { FastifyPluginAsync } from 'fastify';
import { TopCustomersReportRepository } from '@repositories/postgres/top-costumers/TopCustomersReportRepository';
import { reportSchemas } from '@routes/reports/schema/report.schemas';

const topCustomersReportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/reports/top-customers', {
    schema: reportSchemas.topCustomers(),
    handler: async (request, reply) => {
      try {
        const repository = new TopCustomersReportRepository(fastify.pg);
        const reportData = await repository.generate();
        return reply.send(reportData);
      } catch (error) {
        fastify.log.error(error, 'Erro ao gerar relatório de melhores clientes');
        return reply.status(500).send({ message: 'Erro interno do servidor' });
      }
    },
  });
};

export default topCustomersReportRoutes;
