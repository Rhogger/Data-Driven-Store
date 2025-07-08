import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface CreateProductInput {
  nome: string;
  descricao: string;
  marca: string;
  preco: number;
  categorias: number[];
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

        const { preco, estoque, categorias } = request.body;

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

        if (!categorias || categorias.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'Produto deve ter pelo menos uma categoria',
          });
        }

        // Validar se todas as categorias existem
        const categoryRepository = new CategoryRepository(fastify);
        for (const categoryId of categorias) {
          const categoryExists = await categoryRepository.exists(categoryId);
          if (!categoryExists) {
            return reply.status(400).send({
              success: false,
              error: `Categoria com ID ${categoryId} não existe`,
            });
          }
        }

        const productRepository = new ProductRepository(fastify, fastify.neo4j, fastify.redis);

        // Debug: log dos dados sendo enviados
        fastify.log.info({ body: request.body }, 'Dados para criar produto');

        // O ProductRepository agora espera categorias como array de números
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
