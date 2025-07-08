import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface AddFieldBody {
  field_name: string;
  field_value: any;
}

interface AddFieldParams {
  categoryId: string;
}

const addFieldByCategoryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.put<{ Body: AddFieldBody; Params: AddFieldParams }>(
    '/products/category/:categoryId/add-field',
    {
      schema: productSchemas.addFieldByCategory(),
      preHandler: fastify.authenticate,
      handler: async (request, reply) => {
        try {
          const { categoryId } = request.params;
          const { field_name, field_value } = request.body;
          const categoryIdNum = parseInt(categoryId, 10);

          // Validações
          if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
            return reply.status(400).send({
              success: false,
              error: 'O ID da categoria deve ser um número inteiro positivo.',
            });
          }

          if (!field_name || typeof field_name !== 'string' || field_name.trim() === '') {
            return reply.status(400).send({
              success: false,
              error: 'O nome do campo (field_name) é obrigatório e deve ser uma string.',
            });
          }

          if (field_value === undefined) {
            return reply.status(400).send({
              success: false,
              error: 'O valor do campo (field_value) é obrigatório.',
            });
          }

          // Proteção contra atualização de campos-chave
          const protectedFields = [
            '_id',
            'id_produto',
            'estoque',
            'reservado',
            'disponivel',
            'created_at',
            'updated_at',
            'avaliacoes',
          ];
          if (protectedFields.includes(field_name) || field_name.startsWith('$')) {
            return reply.status(400).send({
              success: false,
              error: `O campo "${field_name}" é protegido e não pode ser modificado em massa.`,
            });
          }

          const categoryRepository = new CategoryRepository(fastify);
          const categoryExists = await categoryRepository.exists(categoryIdNum);
          if (!categoryExists) {
            return reply
              .status(404)
              .send({ success: false, error: `Categoria com ID ${categoryIdNum} não encontrada.` });
          }

          const productRepository = new ProductRepository(fastify, fastify.neo4j, fastify.redis);
          const updatedProducts = await productRepository.addFieldToProductsByCategory(
            categoryIdNum,
            field_name,
            field_value,
          );

          return reply.send({
            success: true,
            updated_count: updatedProducts.length,
            data: updatedProducts,
          });
        } catch (error) {
          fastify.log.error(error, 'Erro ao adicionar campo a produtos por categoria');
          return reply.status(500).send({
            success: false,
            error: 'Erro interno do servidor ao processar a solicitação.',
          });
        }
      },
    },
  );
};

export default addFieldByCategoryRoutes;
