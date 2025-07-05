import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CategoryRepository } from '@repositories/postgres/CategoryRepository';

interface GetCategoryParams {
  id: string;
}

async function getCategoryByIdHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Params: GetCategoryParams }>,
  reply: FastifyReply,
) {
  try {
    const categoryId = parseInt(request.params.id, 10);

    if (isNaN(categoryId) || categoryId < 1) {
      return reply.code(400).send({
        success: false,
        error: 'ID da categoria deve ser um número inteiro positivo',
      });
    }

    const categoryRepository = new CategoryRepository(this);
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      return reply.code(404).send({
        success: false,
        error: 'Categoria não encontrada',
      });
    }

    reply.code(200).send({
      success: true,
      data: category,
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor ao buscar categoria.',
    });
  }
}

export default async function getCategoryByIdRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: GetCategoryParams }>('/categories/:id', {
    schema: {
      tags: ['Categories'],
      summary: 'Buscar categoria por ID',
      description: 'Busca uma categoria específica pelo seu ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[1-9][0-9]*$', description: 'ID da categoria' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: true },
            data: {
              type: 'object',
              properties: {
                id_categoria: { type: 'integer' },
                nome: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
          },
        },
      },
    },
    handler: getCategoryByIdHandler,
  });
}
