import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/mongodb/ProductRepository';

const getProductRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { id: string };
  }>('/products/:id', async (request, reply) => {
    try {
      const productRepository = new ProductRepository(fastify);
      const product = await productRepository.findById(request.params.id);

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: 'Produto não encontrado',
        });
      }

      return reply.send({
        success: true,
        data: product,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar produto',
      });
    }
  });

  fastify.get<{
    Querystring: { page?: string; pageSize?: string };
  }>('/products', async (request, reply) => {
    try {
      const page = parseInt(request.query.page || '1', 10);
      const pageSize = parseInt(request.query.pageSize || '10', 10);
      const skip = (page - 1) * pageSize;

      const productRepository = new ProductRepository(fastify);
      const products = await productRepository.findAll(pageSize, skip);

      return reply.send({
        success: true,
        data: products,
        pagination: {
          page,
          pageSize,
          hasMore: products.length === pageSize,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar produtos',
      });
    }
  });
};

export default getProductRoutes;
