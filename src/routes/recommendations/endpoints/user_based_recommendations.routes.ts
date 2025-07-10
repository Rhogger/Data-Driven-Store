import { FastifyPluginAsync } from 'fastify';
import { RecommendationRepository } from '@repositories/recommendation/RecommendationRepository';
import { productRecommendationSchemas } from '@routes/recommendations/schema/recommendation.schemas';
import { CustomerRepository } from '@/repositories/customer/CustomerRepository';
import { ProductRepository } from '@repositories/product/ProductRepository';

interface UserBasedRecommendationsParams {
  clienteId: number;
}

interface UserBasedRecommendationsQuery {
  limite?: number;
  minSimilaridade?: number;
}

const userBasedRecommendationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: UserBasedRecommendationsParams;
    Querystring: UserBasedRecommendationsQuery;
  }>('/recommendations/customers/:clienteId/user-based', {
    schema: productRecommendationSchemas.userBasedRecommendations(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const { clienteId } = request.params;
        const { limite = 10, minSimilaridade = 0.1 } = request.query;

        if (!clienteId) {
          return reply.code(400).send({
            success: false,
            error: 'ID do cliente é obrigatório',
            details: 'O parâmetro clienteId não pode estar vazio',
          });
        }

        if (limite < 1 || limite > 50) {
          return reply.code(400).send({
            success: false,
            error: 'Limite inválido',
            details: 'O limite deve estar entre 1 e 50',
          });
        }

        if (minSimilaridade < 0 || minSimilaridade > 1) {
          return reply.code(400).send({
            success: false,
            error: 'Similaridade mínima inválida',
            details: 'A similaridade mínima deve estar entre 0 e 1',
          });
        }

        const customerRepo = new CustomerRepository(fastify);
        const cliente = await customerRepo.findById(clienteId);

        if (!cliente)
          return reply.code(404).send({
            success: false,
            error: 'Cliente não encontrado',
          });

        const recommendationRepository = new RecommendationRepository(fastify);
        const productRepo = new ProductRepository(fastify);
        const recomendacoesNeo4j = await recommendationRepository.getUserBasedRecommendations(
          clienteId,
          limite,
          minSimilaridade,
        );

        if (recomendacoesNeo4j.length === 0) {
          return reply.code(404).send({
            success: false,
            error: 'Nenhuma recomendação encontrada para este cliente',
          });
        }

        const idsRecomendados = recomendacoesNeo4j.map((r) => r.id_produto);
        const produtosRecomendados = await Promise.all(
          idsRecomendados.map((id) => productRepo.findById(id)),
        );

        const recomendacoes = recomendacoesNeo4j.map((rec, idx) => ({
          ...rec,
          nome: produtosRecomendados[idx]?.nome || null,
        }));

        reply.code(200).send({
          success: true,
          data: {
            cliente_base: clienteId,
            total_recomendacoes: recomendacoes.length,
            min_similaridade: minSimilaridade,
            recomendacoes,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          error: 'Erro interno do servidor ao processar recomendações user-based',
        });
      }
    },
  });
};

export default userBasedRecommendationsRoutes;
