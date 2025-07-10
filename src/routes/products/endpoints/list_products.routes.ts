import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

const listProductsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/products', {
    schema: productSchemas.list(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const productRepository = new ProductRepository(fastify);
        const products = await productRepository.findAll();
        return reply.send({
          success: true,
          data: products,
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
