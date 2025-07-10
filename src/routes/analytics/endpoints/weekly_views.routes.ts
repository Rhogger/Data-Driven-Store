import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { AnalyticsRepository } from '@/repositories/analytics/AnalyticsRepository';

const getWeeklyViewsRoute = async (fastify: FastifyInstance) => {
  fastify.get('/analytics/weekly-views', {
    schema: cassandraAnalyticsSchemas.getWeeklyViews(),
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const analyticsRepo = new AnalyticsRepository(fastify);
        const result = await analyticsRepo.getWeeklyViews();
        return reply.code(200).send({
          success: true,
          data: {
            periodo: `${result.semana_inicio} até ${result.semana_fim}`,
            total_visualizacoes: result.total_visualizacoes,
            visualizacoes_por_dia: result.visualizacoes_por_dia,
          },
        });
      } catch (error: any) {
        request.log.error('Erro ao buscar visualizações semanais:', error);
        return reply.code(500).send({
          success: false,
          error: {
            message: 'Erro interno do servidor ao buscar visualizações semanais',
            details: error.message,
          },
        });
      }
    },
  });
};

export default getWeeklyViewsRoute;
