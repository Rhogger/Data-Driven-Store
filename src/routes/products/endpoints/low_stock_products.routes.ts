import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface LowStockQuery {
  limiar?: string;
}

const lowStockProductsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Querystring: LowStockQuery;
  }>('/products/low-stock', {
    schema: productSchemas.lowStock(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const repo = new ProductRepository(fastify);

      const limiar = Number(request.query.limiar) || 10;
      const products = await repo.findLowStock(limiar);

      return reply.send(products);
    },
  });
};

export default lowStockProductsRoutes;
