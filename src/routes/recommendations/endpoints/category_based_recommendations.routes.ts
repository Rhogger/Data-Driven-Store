import { FastifyPluginAsync } from 'fastify';
import { RecommendationRepository } from '@repositories/recommendation/RecommendationRepository';
import { CustomerRepository } from '@repositories/customer/CustomerRepository';
import { productRecommendationSchemas } from '@routes/recommendations/schema/recommendation.schemas';

interface CategoryBasedRecommendationParams {
  clienteId: number;
}

interface CategoryBasedRecommendationQuery {
  limite?: number;
  diasAnalise?: number;
}

const categoryBasedRecommendationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: CategoryBasedRecommendationParams;
    Querystring: CategoryBasedRecommendationQuery;
  }>('/recommendations/customers/:clienteId/category-based', {
    schema: productRecommendationSchemas.categoryBasedRecommendations(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      // eslint-disable-next-line no-console
      console.log(
        '[categoryBasedRecommendations endpoint] params:',
        request.params,
        'query:',
        request.query,
      );
      const { clienteId } = request.params;
      const { limite = 10, diasAnalise = 30 } = request.query;

      if (!clienteId) {
        return reply.code(400).send({
          success: false,
          error: 'ID do cliente é obrigatório',
        });
      }

      const customerRepository = new CustomerRepository(fastify);
      const cliente = await customerRepository.findById(Number(clienteId));
      if (!cliente) {
        return reply.code(404).send({
          success: false,
          error: 'Cliente não encontrado',
        });
      }

      if (limite < 1 || limite > 50) {
        return reply.code(400).send({
          success: false,
          error: 'Limite inválido',
          details: 'O limite deve estar entre 1 e 50',
        });
      }

      if (diasAnalise < 7 || diasAnalise > 90) {
        return reply.code(400).send({
          success: false,
          error: 'Período de análise inválido',
          details: 'O período de análise deve estar entre 7 e 90 dias',
        });
      }

      const recommendationRepository = new RecommendationRepository(fastify);

      const recomendacoes = await recommendationRepository.getCategoryBasedRecommendations(
        clienteId,
        limite,
        diasAnalise,
      );

      if (recomendacoes.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Nenhuma recomendação encontrada',
          details: 'Cliente não visualizou categorias recentemente ou não há produtos disponíveis',
        });
      }

      reply.code(200).send({
        success: true,
        data: {
          cliente_id: clienteId,
          total_recomendacoes: recomendacoes.length,
          periodo_analise_dias: diasAnalise,
          algoritmo: 'categoria_visualizada',
          recomendacoes,
        },
      });
    },
  });
};

export default categoryBasedRecommendationsRoutes;
