import { FastifyPluginAsync } from 'fastify';
import { UserPreferenceRepository } from '@repositories/user-preference/UserPreferenceRepository';
import { CustomerRepository } from '@repositories/customer/CustomerRepository';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { userSchemas } from '../schema/user.schemas';

interface FindByPreferenceParams {
  categoryId: string;
}

interface FindByPreferenceQuery {
  page?: string;
  pageSize?: string;
}

const findByPreferenceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: FindByPreferenceParams; Querystring: FindByPreferenceQuery }>(
    '/users/by-preference/:categoryId',
    {
      schema: userSchemas.findByPreference(),
      handler: async (request, reply) => {
        try {
          const categoryId = parseInt(request.params.categoryId, 10);
          const page = parseInt(request.query.page || '1', 10);
          const pageSize = Math.min(parseInt(request.query.pageSize || '20', 10), 100);

          if (isNaN(categoryId) || categoryId <= 0) {
            return reply.status(400).send({
              success: false,
              error: 'O ID da categoria deve ser um número inteiro positivo.',
            });
          }

          // Opcional: Verificar se a categoria realmente existe no PostgreSQL
          const categoryRepository = new CategoryRepository(fastify);
          const categoryExists = await categoryRepository.exists(categoryId);
          if (!categoryExists) {
            return reply.status(404).send({
              success: false,
              error: `Categoria com ID ${categoryId} não encontrada.`,
            });
          }

          const skip = (page - 1) * pageSize;
          const userPreferenceRepo = new UserPreferenceRepository(fastify);

          // 1. Buscar IDs de clientes com a preferência no MongoDB
          const { clientIds, total } = await userPreferenceRepo.findClientIdsByPreference(
            categoryId,
            pageSize,
            skip,
          );

          if (clientIds.length === 0) {
            return reply.send({
              success: true,
              data: [],
              pagination: { page, pageSize, totalItems: 0, totalPages: 0, hasMore: false },
            });
          }

          // 2. Buscar dados completos dos clientes no PostgreSQL
          const customerRepo = new CustomerRepository(fastify);
          const customers = await customerRepo.findByIds(clientIds);

          // Opcional: Manter a ordem retornada pelo MongoDB
          const orderedCustomers = clientIds
            .map((id) => customers.find((c) => c.id_cliente === id))
            .filter((c): c is NonNullable<typeof c> => c !== undefined);

          const totalPages = Math.ceil(total / pageSize);
          const hasMore = page < totalPages;

          return reply.send({
            success: true,
            data: orderedCustomers,
            pagination: {
              page,
              pageSize: orderedCustomers.length,
              totalItems: total,
              totalPages,
              hasMore,
            },
          });
        } catch (error) {
          fastify.log.error(error, 'Erro ao buscar usuários por preferência');
          return reply.status(500).send({
            success: false,
            error: 'Erro interno do servidor ao processar a solicitação.',
          });
        }
      },
    },
  );
};

export default findByPreferenceRoutes;
