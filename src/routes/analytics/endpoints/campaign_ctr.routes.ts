import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { AnalyticsRepository } from '@/repositories/analytics/AnalyticsRepository';

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
        const analyticsRepo = new AnalyticsRepository(fastify);
        const { origemCampanha } = request.params;
        const ctrData = await analyticsRepo.getCampaignCTR(origemCampanha);
        return reply.code(200).send({
          success: true,
          data: ctrData,
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
