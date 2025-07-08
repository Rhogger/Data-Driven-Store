import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { categorySchemas } from '@routes/categories/schema/category.schemas';

const createCategoryRoutes = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: { nome: string } }>('/categories', {
    schema: categorySchemas.create(),
    preHandler: fastify.authenticate,
    handler: async (
      request: FastifyRequest<{
        Body: {
          nome: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const { nome } = request.body;

      if (!nome || nome.trim().length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Nome da categoria é obrigatório.',
        });
      }

      try {
        const categoryRepository = new CategoryRepository(fastify);
        const newCategory = await categoryRepository.create({ nome: nome.trim() });

        reply.code(201).send({
          success: true,
          data: newCategory,
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          error: 'Erro interno do servidor ao criar categoria.',
        });
      }
    },
  });
};

export default createCategoryRoutes;
