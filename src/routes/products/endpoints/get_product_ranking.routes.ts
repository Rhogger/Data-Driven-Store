import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@/repositories/product/ProductRepository';
import { productRankingSchemas } from '@routes/products/schema/product-ranking.schemas';

interface RankingQuery {
  limit?: string;
}

const getProductRankingRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Querystring: RankingQuery;
  }>('/products/ranking', {
    schema: productRankingSchemas.getRanking(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const { limit } = request.query;
        let limitNumber = 10;

        if (limit) {
          limitNumber = parseInt(limit, 10);
          if (isNaN(limitNumber) || limitNumber < 1)
            return reply.status(400).send({
              success: false,
              error: 'Limite deve ser um número maior que 0',
            });

          if (limitNumber > 100) limitNumber = 100;
        }

        const productRepo = new ProductRepository(fastify);
        const ranking = await productRepo.getTopViewed(limitNumber);

        return reply.send({
          success: true,
          data: {
            ranking,
            total_produtos: ranking.length,
            limite_aplicado: limitNumber,
          },
        });
      } catch (error: any) {
        request.server.log.error('Erro ao buscar ranking de produtos:', error.message);

        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao buscar ranking',
        });
      }
    },
  });
};

export default getProductRankingRoute;
