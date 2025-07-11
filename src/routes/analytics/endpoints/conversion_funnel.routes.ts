import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { AnalyticsRepository } from '@/repositories/analytics/AnalyticsRepository';

const getConversionFunnelRoute = async (fastify: FastifyInstance) => {
  fastify.get('/analytics/conversion-funnel', {
    schema: cassandraAnalyticsSchemas.getConversionFunnel(),
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const analyticsRepo = new AnalyticsRepository(fastify);
        // Usa o método que já faz o agrupamento correto por usuário único
        const stats = await analyticsRepo.getConversionFunnelStats();
        return reply.code(200).send({
          success: true,
          data: {
            visualizou: stats.usuarios_visualizaram,
            adicionou_carrinho: stats.usuarios_adicionaram_carrinho,
            comprou: stats.usuarios_compraram,
            taxa_visualizacao_ate_carrinho: stats.taxa_visualizacao_ate_carrinho,
            taxa_carrinho_ate_compra: stats.taxa_carrinho_ate_compra,
            taxa_visualizacao_ate_compra: stats.taxa_visualizacao_ate_compra,
          },
        });
      } catch (error: any) {
        request.log.error('Erro ao buscar funil de conversão por usuário:', error);
        return reply.code(500).send({
          success: false,
          error: {
            message: 'Erro interno do servidor ao buscar funil de conversão por usuário',
            details: error.message,
          },
        });
      }
    },
  });
};

export default getConversionFunnelRoute;
