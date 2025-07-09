import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

const getProductByIdRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { id: string };
  }>('/products/:id', {
    schema: productSchemas.getById(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const productRepository = new ProductRepository(fastify, fastify.neo4j, fastify.redis);
        const product = await productRepository.findById(request.params.id);

        if (!product) {
          return reply.status(404).send({
            success: false,
            error: 'Produto não encontrado',
          });
        }

        const userId = request.user?.id_cliente || request.user?.id;
        const productId = (product.id_produto || product._id?.toString()) as string;

        await productRepository.incrementView(productId);

        if (userId)
          await productRepository.createCustomerViewedProductRelation(String(userId), productId);

        fastify.log.info({ product }, 'Produto antes de enviar resposta');
        fastify.log.info(
          { atributos: product.atributos },
          'Atributos do produto antes da resposta',
        );

        return reply.send({
          success: true,
          data: product,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao buscar produto',
        });
      }
    },
  });
};

export default getProductByIdRoutes;
