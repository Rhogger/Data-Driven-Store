import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/mongodb/ProductRepository';

interface UpdateProductInput {
  nome?: string;
  descricao?: string;
  marca?: string;
  preco?: number;
  id_categoria?: number;
  estoque?: number;
  reservado?: number;
  atributos?: Record<string, any>;
  avaliacoes?: Record<string, any>;
}

const updateProductRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.put<{
    Params: { id: string };
    Body: UpdateProductInput;
  }>('/products/:id', async (request, reply) => {
    try {
      const { preco, estoque, reservado } = request.body;

      // Validações diretas na rota
      if (preco !== undefined && preco <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Preço deve ser maior que zero',
        });
      }

      if (estoque !== undefined && estoque < 0) {
        return reply.status(400).send({
          success: false,
          error: 'Estoque não pode ser negativo',
        });
      }

      if (reservado !== undefined && reservado < 0) {
        return reply.status(400).send({
          success: false,
          error: 'Quantidade reservada não pode ser negativa',
        });
      }

      // Se ambos forem fornecidos, validar se reservado não é maior que estoque
      if (estoque !== undefined && reservado !== undefined && reservado > estoque) {
        return reply.status(400).send({
          success: false,
          error: 'Quantidade reservada não pode ser maior que o estoque',
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
