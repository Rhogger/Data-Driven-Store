import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CategoryRepository } from '@repositories/postgres/CategoryRepository';

interface CreateCategoryBody {
  nome: string;
}

async function createCategoryHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Body: CreateCategoryBody }>,
  reply: FastifyReply,
) {
  const { nome } = request.body;

  try {
    // Validação direta na rota
    if (!nome || nome.trim() === '') {
      return reply.code(400).send({
        message: 'O nome da categoria não pode ser vazio.',
      });
    }

    const categoryRepository = new CategoryRepository(this);
    const newCategory = await categoryRepository.create(nome);

    reply.code(201).send(newCategory);
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({ message: 'Erro interno do servidor ao criar categoria.' });
  }
}

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateCategoryBody }>('/categories', createCategoryHandler);
}
