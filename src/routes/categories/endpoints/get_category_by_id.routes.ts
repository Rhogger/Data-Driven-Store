import { FastifyPluginAsync } from 'fastify';
import { CategoryRepository } from '@repositories/postgres/CategoryRepository';
import { categorySchemas } from '@routes/categories/schema/category.schemas';

interface GetCategoryParams {
  id: string;
}

const getCategoryByIdRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: GetCategoryParams }>('/categories/:id', {
    schema: categorySchemas.getById(),
    handler: async (request, reply) => {
      try {
        const categoryId = parseInt(request.params.id, 10);

        if (isNaN(categoryId) || categoryId < 1) {
          return reply.status(400).send({
            success: false,
            error: 'ID da categoria deve ser um número inteiro positivo',
          });
        }

        const categoryRepository = new CategoryRepository(fastify);
        const category = await categoryRepository.findById(categoryId);

        if (!category) {
          return reply.status(404).send({
            success: false,
            error: 'Categoria não encontrada',
          });
        }

        return reply.send({
          success: true,
          data: category,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao buscar categoria',
        });
      }
    },
  });
};

export default getCategoryByIdRoutes;
