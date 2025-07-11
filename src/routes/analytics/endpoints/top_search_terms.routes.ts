import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { AnalyticsRepository } from '@/repositories/analytics/AnalyticsRepository';

const getTopSearchTermsRoute = async (fastify: FastifyInstance) => {
  fastify.get('/analytics/top-search-terms', {
    schema: cassandraAnalyticsSchemas.getTopSearchTerms(),
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const analyticsRepo = new AnalyticsRepository(fastify);
        const resultado = await analyticsRepo.getTopSearchTerms(10);
        return reply.code(200).send({
          success: true,
          data: resultado,
        });
      } catch (error: any) {
        request.log.error('Erro ao buscar termos de busca:', error);

        return reply.code(500).send({
          success: false,
          error: {
            message: 'Erro interno do servidor ao buscar termos de busca',
            details: error.message,
          },
        });
      }
    },
  });
};

export default getTopSearchTermsRoute;
