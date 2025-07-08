import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AddressRepository } from '@repositories/address/AddressRepository';
import { CreateAddressInput } from '@repositories/address/AddressInterfaces';
import { addressSchemas } from '@routes/addresses/schema/address.schemas';

const createAddressRoute = async (fastify: FastifyInstance) => {
  fastify.post<{
    Body: Omit<CreateAddressInput, 'id_cliente'>;
  }>('/addresses', {
    schema: addressSchemas.create(),
    preHandler: fastify.authenticate,
    handler: async (
      request: FastifyRequest<{ Body: Omit<CreateAddressInput, 'id_cliente'> }>,
      reply: FastifyReply,
    ) => {
      const addressRepository = new AddressRepository(fastify);

      try {
        const address = await addressRepository.create({
          ...request.body,
          id_cliente: request.user?.id_cliente,
        });

        return reply.status(201).send({ success: true, data: address });
      } catch (error) {
        fastify.log.error(error, 'Erro ao criar endereço');

        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

        return reply.status(400).send({ success: false, message: errorMessage });
      }
    },
  });
};

export default createAddressRoute;
