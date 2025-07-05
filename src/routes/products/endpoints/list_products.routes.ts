import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/mongodb/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface ListProductsQuery {
  page?: string;
  pageSize?: string;
}

const listProductsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Querystring: ListProductsQuery;
  }>('/products', {
    schema: productSchemas.list(),
    handler: async (request, reply) => {
      try {
        const page = parseInt(request.query.page || '1', 10);
        const pageSize = Math.min(parseInt(request.query.pageSize || '20', 10), 100);

        // Validações de paginação
        if (page < 1) {
          return reply.status(400).send({
            success: false,
            error: 'Número da página deve ser maior que zero',
          });
        }

        if (pageSize < 1) {
          return reply.status(400).send({
            success: false,
            error: 'Tamanho da página deve ser maior que zero',
          });
        }

        const skip = (page - 1) * pageSize;
        const productRepository = new ProductRepository(fastify);
        const products = await productRepository.findAll(pageSize + 1, skip);

        // Verificar se há mais páginas
        const hasMore = products.length > pageSize;
        if (hasMore) {
          products.pop(); // Remover o item extra
        }

        return reply.send({
          success: true,
          data: products,
          pagination: {
            page,
            pageSize,
            hasMore,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao listar produtos',
        });
      }
    },
  });
};

export default listProductsRoutes;
