import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface SearchProductsBody {
  atributos?: Record<string, any>;
  preco_min?: number;
  preco_max?: number;
  page?: number;
  pageSize?: number;
}

const searchProductsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: SearchProductsBody }>('/products/search', {
    schema: productSchemas.search(),
    handler: async (request, reply) => {
      try {
        const { atributos, preco_min, preco_max, page = 1, pageSize = 20 } = request.body;

        // Validações
        if (preco_min !== undefined && preco_max !== undefined && preco_min > preco_max) {
          return reply.status(400).send({
            success: false,
            error: 'O preço mínimo não pode ser maior que o preço máximo.',
          });
        }

        const limit = Math.min(pageSize, 100);
        const skip = (page - 1) * limit;

        const productRepository = new ProductRepository(fastify, fastify.neo4j, fastify.redis);

        // Adicionamos +1 ao limite para verificar se há mais páginas
        const products = await productRepository.findByAttributesAndPriceRange(
          { atributos, preco_min, preco_max },
          limit + 1,
          skip,
        );

        // Verificar se há mais páginas
        const hasMore = products.length > limit;
        if (hasMore) {
          products.pop(); // Remover o item extra usado para a verificação
        }

        return reply.send({
          success: true,
          data: products,
          pagination: {
            page,
            pageSize: limit,
            hasMore,
          },
        });
      } catch (error) {
        fastify.log.error(error, 'Erro ao buscar produtos');
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao buscar produtos',
        });
      }
    },
  });
};

export default searchProductsRoutes;
