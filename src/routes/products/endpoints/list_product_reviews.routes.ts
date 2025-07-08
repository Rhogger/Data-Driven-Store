import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface ListReviewsParams {
  id: string;
}

interface ListReviewsQuery {
  page?: string;
  pageSize?: string;
}

const listProductReviewsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: ListReviewsParams; Querystring: ListReviewsQuery }>(
    '/products/:id/reviews',
    {
      schema: productSchemas.listReviews(),
      handler: async (request, reply) => {
        try {
          const { id } = request.params;
          const page = parseInt(request.query.page || '1', 10);
          const pageSize = Math.min(parseInt(request.query.pageSize || '10', 10), 50);

          // Validações
          if (page < 1) {
            return reply.status(400).send({
              success: false,
              error: 'O número da página deve ser maior que zero.',
            });
          }

          const productRepository = new ProductRepository(fastify, fastify.neo4j, fastify.redis);
          const result = await productRepository.getProductReviews(id, page, pageSize);

          if (result === null) {
            return reply.status(404).send({
              success: false,
              error: `Produto com ID ${id} não encontrado.`,
            });
          }

          const hasMore = page * pageSize < result.total;

          return reply.send({
            success: true,
            data: result.reviews,
            pagination: {
              page,
              pageSize: result.reviews.length,
              totalItems: result.total,
              totalPages: Math.ceil(result.total / pageSize),
              hasMore,
            },
          });
        } catch (error) {
          fastify.log.error(error, 'Erro ao listar avaliações do produto');
          return reply.status(500).send({
            success: false,
            error: 'Erro interno do servidor ao processar a solicitação.',
          });
        }
      },
    },
  );
};

export default listProductReviewsRoutes;
