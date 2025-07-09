import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@/repositories/product/ProductRepository';
import { productRankingSchemas } from '@routes/products/schema/product-ranking.schemas';

const incrementProductViewRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Params: { id_produto: string } }>('/products/:id_produto/view', {
    schema: productRankingSchemas.incrementView(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const { id_produto } = request.params;

        if (!id_produto)
          return reply.status(400).send({
            success: false,
            error: 'ID do produto é obrigatório',
          });

        const productRepo = new ProductRepository(fastify, fastify.neo4j, fastify.redis);
        await productRepo.incrementView(id_produto);
        const totalVisualizacoes = await productRepo.getViews(id_produto);

        return reply.send({
          success: true,
          data: {
            id_produto,
            total_visualizacoes: totalVisualizacoes,
          },
        });
      } catch (error: any) {
        request.server.log.error('Erro ao incrementar visualização:', error.message);

        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor',
        });
      }
    },
  });
};

export default incrementProductViewRoute;
