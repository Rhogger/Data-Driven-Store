import { FastifyInstance } from 'fastify';
import { TopCustomersReportRepository } from '@/repositories/postgres/top-costumers/TopCustomersReportRepository';

export default async function topCustomersReportRoutes(fastify: FastifyInstance) {
  /**
   * Endpoint para gerar o relatório de 5 melhores clientes por faturamento.
   */
  fastify.get('/reports/top-customers', async (request, reply) => {
    try {
      const repository = new TopCustomersReportRepository(fastify.pg);
      const reportData = await repository.generate();
      return reply.send(reportData);
    } catch (error) {
      fastify.log.error(error, 'Erro ao gerar relatório de melhores clientes');
      return reply.status(500).send({ message: 'Erro interno do servidor' });
    }
  });
}
