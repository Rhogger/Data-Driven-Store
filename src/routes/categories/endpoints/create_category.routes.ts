import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { categorySchemas } from '@routes/categories/schema/category.schemas';

interface CreateCategoryBody {
  nome: string;
}

async function createCategoryHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Body: CreateCategoryBody }>,
  reply: FastifyReply,
) {
  const { nome } = request.body;

  // Validações básicas
  if (!nome || nome.trim().length === 0) {
    return reply.code(400).send({
      success: false,
      error: 'Nome da categoria é obrigatório.',
    });
  }

  try {
    const categoryRepository = new CategoryRepository(this);
    const newCategory = await categoryRepository.create({ nome: nome.trim() });

    reply.code(201).send({
      success: true,
      data: newCategory,
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor ao criar categoria.',
    });
  }
}

export default async function createCategoryRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateCategoryBody }>('/categories', {
    schema: categorySchemas.create(),
    handler: createCategoryHandler,
  });
}
