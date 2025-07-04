import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/mongodb/ProductRepository';

interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  stock?: number;
  tags?: string[];
}

const updateProductRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.put<{
    Params: { id: string };
    Body: UpdateProductInput;
  }>('/products/:id', async (request, reply) => {
    try {
      const { price, stock } = request.body;

      if (price !== undefined && price <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Preço deve ser maior que zero',
        });
      }

      if (stock !== undefined && stock < 0) {
        return reply.status(400).send({
          success: false,
          error: 'Estoque não pode ser negativo',
        });
      }

      const productRepository = new ProductRepository(fastify);
      const product = await productRepository.update(request.params.id, request.body);

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
        error: error instanceof Error ? error.message : 'Erro ao atualizar produto',
      });
    }
  });
};

export default updateProductRoutes;
