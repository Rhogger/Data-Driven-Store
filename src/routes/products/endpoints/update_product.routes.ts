import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/mongodb/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface UpdateProductInput {
  nome?: string;
  descricao?: string;
  marca?: string;
  preco?: number;
  id_categoria?: number;
  atributos?: Record<string, any>;
}

const updateProductRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.put<{
    Params: { id: string };
    Body: UpdateProductInput;
  }>('/products/:id', {
    schema: productSchemas.update(),
    handler: async (request, reply) => {
      try {
        const requestBody = request.body as any; // Permitir detecção de campos extras

        // Validar se campos não permitidos foram enviados
        if ('estoque' in requestBody) {
          return reply.status(400).send({
            success: false,
            error:
              'Campo "estoque" não é permitido na atualização. Use endpoints específicos para gerenciar estoque.',
          });
        }

        if ('reservado' in requestBody) {
          return reply.status(400).send({
            success: false,
            error:
              'Campo "reservado" não é permitido na atualização. É gerenciado automaticamente.',
          });
        }

        if ('disponivel' in requestBody) {
          return reply.status(400).send({
            success: false,
            error:
              'Campo "disponivel" não é permitido na atualização. É calculado automaticamente.',
          });
        }

        if ('avaliacoes' in requestBody) {
          return reply.status(400).send({
            success: false,
            error:
              'Campo "avaliacoes" não é permitido na atualização. Use endpoints específicos para gerenciar avaliações.',
          });
        }

        const { preco } = request.body;

        // Validações diretas na rota
        if (preco !== undefined && preco <= 0) {
          return reply.status(400).send({
            success: false,
            error: 'Preço deve ser maior que zero',
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
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao atualizar produto',
        });
      }
    },
  });
};

export default updateProductRoutes;
