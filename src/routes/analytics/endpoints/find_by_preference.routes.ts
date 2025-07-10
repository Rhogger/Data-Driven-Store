import { FastifyPluginAsync } from 'fastify';
import { UserPreferenceRepository } from '@repositories/user-preference/UserPreferenceRepository';
import { CustomerRepository } from '@repositories/customer/CustomerRepository';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { reportSchemas } from '@/routes/analytics/schema/report.schemas';

interface FindByPreferenceParams {
  categoryId: string;
}

const findByPreferenceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: FindByPreferenceParams }>('/analytics/by-preference/:categoryId', {
    schema: reportSchemas.findByPreference(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const categoryId = parseInt(request.params.categoryId, 10);

        if (isNaN(categoryId) || categoryId <= 0) {
          return reply.status(400).send({
            success: false,
            error: 'O ID da categoria deve ser um número inteiro positivo.',
          });
        }

        const categoryRepository = new CategoryRepository(fastify);
        const categoryExists = await categoryRepository.exists(categoryId);
        if (!categoryExists) {
          return reply.status(404).send({
            success: false,
            error: `Categoria com ID ${categoryId} não encontrada.`,
          });
        }

        const userPreferenceRepo = new UserPreferenceRepository(fastify);

        const clientIds: number[] = await userPreferenceRepo.findClientIdsByPreference(categoryId);

        if (clientIds.length === 0) {
          return reply.send({
            success: true,
            data: [],
          });
        }

        const customerRepo = new CustomerRepository(fastify);
        const customers = await customerRepo.findByIds(clientIds);

        const orderedCustomers = clientIds
          .map((id: number) => customers.find((c) => c.id_cliente === id))
          .filter((c): c is NonNullable<typeof c> => c !== undefined);

        return reply.send({
          success: true,
          data: orderedCustomers,
        });
      } catch (error) {
        fastify.log.error(error, 'Erro ao buscar usuários por preferência');
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao processar a solicitação.',
        });
      }
    },
  });
};

export default findByPreferenceRoutes;
