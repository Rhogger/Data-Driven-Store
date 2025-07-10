import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { PurchasesByUtmRepository } from '@/repositories/purchases-by-utm/PurchasesByUtmRepository';
// import { EventsByDateRepository } from '@/repositories/events-by-date/EventsByDateRepository';

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
        const purchasesRepo = new PurchasesByUtmRepository(fastify);
        const { origemCampanha } = request.params;
        const compras = await purchasesRepo.findByCampaignSource(origemCampanha);
        const totalCliques = compras.length;

        return reply.code(200).send({
          success: true,
          data: {
            origem_campanha: origemCampanha,
            total_cliques: totalCliques,
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
