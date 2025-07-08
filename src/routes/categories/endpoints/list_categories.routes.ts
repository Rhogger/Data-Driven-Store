import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { categorySchemas } from '@routes/categories/schema/category.schemas';

const listCategoriesRoutes = (fastify: FastifyInstance) => {
  fastify.get('/categories', {
    schema: categorySchemas.list(),
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const categoryRepository = new CategoryRepository(fastify);
        const categories = await categoryRepository.findAll();

        reply.code(200).send({
          success: true,
          data: categories,
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          error: 'Erro interno do servidor ao listar categorias.',
        });
      }
    },
  });
};

export default listCategoriesRoutes;
