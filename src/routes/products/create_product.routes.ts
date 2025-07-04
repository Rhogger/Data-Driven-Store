import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/mongodb/ProductRepository';

interface CreateProductInput {
  nome: string;
  descricao?: string;
  marca?: string;
  preco: number;
  id_categoria: number;
  estoque: number;
  reservado?: number;
  atributos?: Record<string, any>;
  avaliacoes?: Record<string, any>;
}

const createProductRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: CreateProductInput;
  }>('/products', async (request, reply) => {
    try {
      const { preco, estoque, reservado } = request.body;

      // Validações diretas na rota
      if (preco <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Preço deve ser maior que zero',
        });
      }

      if (estoque < 0) {
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

      if (reservado !== undefined && reservado > estoque) {
        return reply.status(400).send({
          success: false,
          error: 'Quantidade reservada não pode ser maior que o estoque',
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
