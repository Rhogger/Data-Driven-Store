import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { ProductViewsAggregatedRepository } from '@/repositories/product-views-aggregated/ProductViewsAggregatedRepository';

const getWeeklyViewsRoute = async (fastify: FastifyInstance) => {
  fastify.get('/analytics/weekly-views', {
    schema: cassandraAnalyticsSchemas.getWeeklyViews(),
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const cassandraClient = request.server.cassandra;

        const productViewsRepo = new ProductViewsAggregatedRepository(cassandraClient);

        const hoje = new Date();
        const setesDiasAtras = new Date();
        setesDiasAtras.setDate(hoje.getDate() - 7);
        const visualizacoesPorDia = [];
        let totalVisualizacoes = 0;

        for (let i = 0; i < 7; i++) {
          const data = new Date();

          data.setDate(hoje.getDate() - i);

          const visualizacoesDia = await productViewsRepo.findByDate(data);

          const totalDia = visualizacoesDia.reduce(
            (sum, item) => sum + Number(item.total_visualizacoes),
            0,
          );

          visualizacoesPorDia.push({
            data: data.toISOString().split('T')[0],
            total_visualizacoes: totalDia,
          });

          totalVisualizacoes += totalDia;
        }

        return reply.code(200).send({
          success: true,
          data: {
            periodo: `${setesDiasAtras.toISOString().split('T')[0]} até ${hoje.toISOString().split('T')[0]}`,
            total_visualizacoes: totalVisualizacoes,
            visualizacoes_por_dia: visualizacoesPorDia,
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
