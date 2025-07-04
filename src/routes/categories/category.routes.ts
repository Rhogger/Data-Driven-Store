import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CategoryService } from '../../services/categories/CategoryService';

interface CreateCategoryBody {
  nome: string;
}

async function createCategoryHandler(this: FastifyInstance, request: FastifyRequest<{ Body: CreateCategoryBody }>, reply: FastifyReply) {
  const { nome } = request.body;

  try {
    const categoryService = new CategoryService(this);

    const newCategory = await categoryService.createCategory(nome);

    reply.code(201).send(newCategory);
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({ message: 'Erro interno do servidor ao criar categoria.' });
  }
}

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateCategoryBody }>('/categories', createCategoryHandler);
}