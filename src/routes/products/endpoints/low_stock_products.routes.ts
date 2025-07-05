import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/mongodb/ProductRepository';
import { productSchemas } from '../schema/product.schemas';

interface LowStockQuery {
  limiar?: string;
}

const lowStockProductsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Querystring: LowStockQuery;
  }>('/products/low-stock', {
    schema: productSchemas.lowStock(),
    handler: async (request, reply) => {
      const limiar = Number(request.query.limiar) || 10;
      const repo = new ProductRepository(fastify);
      const products = await repo.findLowStock(limiar);
      return reply.send(products);
    },
  });
};

export default lowStockProductsRoutes;
