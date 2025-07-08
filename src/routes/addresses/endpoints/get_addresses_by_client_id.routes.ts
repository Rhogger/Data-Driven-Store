import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AddressRepository } from '@repositories/address/AddressRepository';
import { addressSchemas } from '@routes/addresses/schema/address.schemas';

const getAddressesByClientIdRoute = async (fastify: FastifyInstance) => {
  fastify.get<{
    Params: { clientId: number };
  }>('/addresses/client/:clientId', {
    schema: addressSchemas.findByClientId(),
    handler: async (
      request: FastifyRequest<{ Params: { clientId: number } }>,
      reply: FastifyReply,
    ) => {
      const addressRepository = new AddressRepository(fastify);

      const { clientId } = request.params;

      try {
        const addresses = await addressRepository.findByClientId(clientId);

        return reply.send({ success: true, data: addresses });
      } catch (error) {
        fastify.log.error(error, 'Erro ao buscar endereços do cliente');

        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

        return reply.status(500).send({ success: false, message: errorMessage });
      }
    },
  });
};

export default getAddressesByClientIdRoute;
