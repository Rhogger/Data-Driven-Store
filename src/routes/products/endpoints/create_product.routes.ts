import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/mongodb/ProductRepository';
import { CategoryRepository } from '@repositories/postgres/CategoryRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface CreateProductInput {
  nome: string;
  descricao?: string;
  marca?: string;
  preco: number;
  id_categoria: number;
  estoque: number;
  atributos?: Record<string, any>;
}

const createProductRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: CreateProductInput;
  }>('/products', {
    schema: productSchemas.create(),
    handler: async (request, reply) => {
      try {
        const requestBody = request.body as any; // Permitir detecção de campos extras

        // Validar se campos não permitidos foram enviados
        if ('reservado' in requestBody) {
          return reply.status(400).send({
            success: false,
            error: 'Campo "reservado" não é permitido na criação. É calculado automaticamente.',
          });
        }

        if ('avaliacoes' in requestBody) {
          return reply.status(400).send({
            success: false,
            error: 'Campo "avaliacoes" não é permitido na criação. É gerenciado automaticamente.',
          });
        }

        const { preco, estoque, id_categoria } = request.body;

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

        // Validar se a categoria existe
        const categoryRepository = new CategoryRepository(fastify);
        const categoryExists = await categoryRepository.exists(id_categoria);
        if (!categoryExists) {
          return reply.status(400).send({
            success: false,
            error: `Categoria com ID ${id_categoria} não existe`,
          });
        }

        const productRepository = new ProductRepository(fastify);

        // Debug: log dos dados sendo enviados
        fastify.log.info({ body: request.body }, 'Dados para criar produto');

        const product = await productRepository.create(request.body);

        // Debug: log do produto criado
        fastify.log.info({ product }, 'Produto criado');

        return reply.status(201).send({
          success: true,
          data: product,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao criar produto',
        });
      }
    },
  });
};

export default createProductRoutes;
