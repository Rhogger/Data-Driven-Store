import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

const averagePriceByBrandRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/products/reports/average-price-by-brand', {
    schema: productSchemas.getAveragePriceByBrand(),
    handler: async (request, reply) => {
      try {
        const productRepository = new ProductRepository(fastify, fastify.neo4j, fastify.redis);
        const reportData = await productRepository.getAveragePriceByBrand();

        return reply.send({
          success: true,
          data: reportData,
        });
      } catch (error) {
        fastify.log.error(error, 'Erro ao calcular média de preço por marca');
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao gerar relatório',
        });
      }
    },
  });
};

export default averagePriceByBrandRoutes;
