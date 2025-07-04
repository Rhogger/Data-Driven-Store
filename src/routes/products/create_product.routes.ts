import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/mongodb/ProductRepository';

interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  stock: number;
  tags?: string[];
}

const createProductRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: CreateProductInput;
  }>('/products', async (request, reply) => {
    try {
      const { price, stock } = request.body;

      if (price <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Preço deve ser maior que zero',
        });
      }

      if (stock < 0) {
        return reply.status(400).send({
          success: false,
          error: 'Estoque não pode ser negativo',
        });
      }

      const productRepository = new ProductRepository(fastify);
      const product = await productRepository.create(request.body);

      return reply.status(201).send({
        success: true,
        data: product,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar produto',
      });
    }
  });
};

export default createProductRoutes;
