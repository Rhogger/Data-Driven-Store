import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { AnalyticsRepository } from '@/repositories/analytics/AnalyticsRepository';

interface UsersByUtmParams {
  utmSource: string;
}

interface UsersByUtmQuery {
  limite?: number;
}

const getUsersByUtmSourceRoute = async (fastify: FastifyInstance) => {
  fastify.get('/analytics/users-by-utm/:utmSource', {
    schema: cassandraAnalyticsSchemas.getUsersByUtmSource(),
    preHandler: fastify.authenticate,
    handler: async (
      request: FastifyRequest<{ Params: UsersByUtmParams; Querystring: UsersByUtmQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const analyticsRepo = new AnalyticsRepository(fastify);
        const { utmSource } = request.params;
        const { limite = 20 } = request.query;
        const result = await analyticsRepo.getUsersByUtmSource(utmSource, limite);

        // Retorna o objeto completo, compatível com o schema do Swagger
        return reply.code(200).send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        request.log.error('Erro ao buscar usuários por UTM:', error);

        return reply.code(500).send({
          success: false,
          error: {
            message: 'Erro interno do servidor ao buscar usuários por UTM',
            details: error.message,
          },
        });
      }
    },
  });
};

export default getUsersByUtmSourceRoute;
