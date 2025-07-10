import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { RecommendationRepository } from '@repositories/recommendation/RecommendationRepository';
import { productRecommendationSchemas } from '@routes/recommendations/schema/recommendation.schemas';

interface FrequentlyBoughtTogetherParams {
  produtoId: string;
}

interface FrequentlyBoughtTogetherQuery {
  limite?: number;
}

const frequentlyBoughtTogetherRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: FrequentlyBoughtTogetherParams;
    Querystring: FrequentlyBoughtTogetherQuery;
  }>('/recommendations/products/:produtoId/frequently-bought-together', {
    schema: productRecommendationSchemas.frequentlyBoughtTogether(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const { produtoId } = request.params;
        const { limite = 10 } = request.query;

        if (!produtoId || produtoId.trim() === '') {
          return reply.code(400).send({
            success: false,
            error: 'ID do produto é obrigatório',
            details: 'O parâmetro produtoId não pode estar vazio',
          });
        }

        if (limite < 1 || limite > 50) {
          return reply.code(400).send({
            success: false,
            error: 'Limite inválido',
            details: 'O limite deve estar entre 1 e 50',
          });
        }

        const productRepo = new ProductRepository(fastify);
        const produto = await productRepo.findById(produtoId);

        if (!produto)
          return reply.code(404).send({
            success: false,
            error: 'Produto não encontrado',
          });

        const recommendationRepository = new RecommendationRepository(fastify);
        const recomendacoesNeo4j = await recommendationRepository.getFrequentlyBoughtTogether(
          produtoId,
          limite,
        );

        if (recomendacoesNeo4j.length === 0) {
          return reply.code(404).send({
            success: false,
            error: 'Nenhuma recomendação encontrada',
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
            produto_base: produtoId,
            total_recomendacoes: recomendacoes.length,
            algoritmo: 'frequencia',
            recomendacoes,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          error: 'Erro interno do servidor ao processar recomendações',
        });
      }
    },
  });
};

export default frequentlyBoughtTogetherRoutes;
