import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CategoryRepository } from '@repositories/postgres/CategoryRepository';
import { categorySchemas } from '../schema/category.schemas';

async function listCategoriesHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const categoryRepository = new CategoryRepository(this);
    const categories = await categoryRepository.findAll();

    reply.code(200).send({
      success: true,
      data: categories,
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor ao listar categorias.',
    });
  }
}

export default async function listCategoriesRoutes(fastify: FastifyInstance) {
  fastify.get('/categories', {
    schema: categorySchemas.list(),
    handler: listCategoriesHandler,
  });
}
