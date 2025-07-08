import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface ListReviewsParams {
  id: string;
}

const listProductReviewsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: ListReviewsParams }>('/products/:id/reviews', {
    schema: productSchemas.listReviews(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const productRepository = new ProductRepository(fastify, fastify.neo4j, fastify.redis);
        const result = await productRepository.getProductReviews(id);

        if (result === null) {
          return reply.status(404).send({
            success: false,
            error: `Produto com ID ${id} não encontrado.`,
          });
        }

        return reply.send({
          success: true,
          data: result.reviews,
        });
      } catch (error) {
        fastify.log.error(error, 'Erro ao listar avaliações do produto');
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao processar a solicitação.',
        });
      }
    },
  });
};

export default listProductReviewsRoutes;
