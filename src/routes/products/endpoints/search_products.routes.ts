import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface SearchProductsBody {
  atributos?: Record<string, any>;
  preco_min?: number;
  preco_max?: number;
}

const searchProductsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: SearchProductsBody }>('/products/search', {
    schema: productSchemas.search(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const { atributos, preco_min, preco_max } = request.body;

        if (preco_min !== undefined && preco_max !== undefined && preco_min > preco_max) {
          return reply.status(400).send({
            success: false,
            error: 'O preço mínimo não pode ser maior que o preço máximo.',
          });
        }

        const productRepository = new ProductRepository(fastify, fastify.neo4j, fastify.redis);
        const products = await productRepository.findByAttributesAndPriceRange({
          atributos,
          preco_min,
          preco_max,
        });

        return reply.send({
          success: true,
          data: products,
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
