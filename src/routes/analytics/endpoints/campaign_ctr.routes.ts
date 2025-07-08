import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { PurchasesByUtmRepository } from '@/repositories/purchases-by-utm/PurchasesByUtmRepository';
import { EventsByDateRepository } from '@/repositories/events-by-date/EventsByDateRepository';

interface CampaignCTRParams {
  origemCampanha: string;
}

const getCampaignCTRRoute = async (fastify: FastifyInstance) => {
  fastify.get('/analytics/campaign-ctr/:origemCampanha', {
    schema: cassandraAnalyticsSchemas.getCampaignCTR(),
    preHandler: fastify.authenticate,
    handler: async (
      request: FastifyRequest<{ Params: CampaignCTRParams }>,
      reply: FastifyReply,
    ) => {
      try {
        const cassandraClient = request.server.cassandra;
        const purchasesRepo = new PurchasesByUtmRepository(cassandraClient);
        const eventsRepo = new EventsByDateRepository(cassandraClient);

        const { origemCampanha } = request.params;
        const compras = await purchasesRepo.findByCampaignSource(origemCampanha);
        const totalCliques = compras.length;
        let totalVisualizacoes = 0;
        const hoje = new Date();

        for (let i = 0; i < 30; i++) {
          const data = new Date();

          data.setDate(hoje.getDate() - i);

          const eventosDia = await eventsRepo.findByDate(data);

          const visualizacoesCampanha = eventosDia.filter(
            (evento) =>
              evento.origem_campanha === origemCampanha && evento.tipo_evento === 'visualizacao',
          );

          totalVisualizacoes += visualizacoesCampanha.length;
        }

        const ctr = totalVisualizacoes > 0 ? (totalCliques / totalVisualizacoes) * 100 : 0;

        return reply.code(200).send({
          success: true,
          data: {
            origem_campanha: origemCampanha,
            total_cliques: totalCliques,
            total_visualizacoes: totalVisualizacoes,
            ctr: ctr.toFixed(2),
          },
        });
      } catch (error: any) {
        request.log.error('Erro ao calcular CTR da campanha:', error);

        return reply.code(500).send({
          success: false,
          error: {
            message: 'Erro interno do servidor ao calcular CTR da campanha',
            details: error.message,
          },
        });
      }
    },
  });
};

export default getCampaignCTRRoute;
