import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AddressRepository } from '@repositories/address/AddressRepository';
import { addressSchemas } from '@routes/addresses/schema/address.schemas';

const getAddressesByCustomerIdRoute = async (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: { id_cliente?: number } }>('/addresses/customer/list', {
    schema: addressSchemas.findByClientId(),
    preHandler: fastify.authenticate,
    handler: async (
      request: FastifyRequest<{ Querystring: { id_cliente?: number } }>,
      reply: FastifyReply,
    ) => {
      const id_cliente = request.query.id_cliente ?? request.user?.id_cliente;

      fastify.log.info(
        { id_cliente, user: request.user, query: request.query },
        'Buscando endereços do cliente',
      );

      const addressRepository = new AddressRepository(fastify);

      try {
        const addresses = await addressRepository.findByClientId(id_cliente);

        fastify.log.info({ count: addresses.length }, 'Endereços encontrados');

        return reply.send({ success: true, data: addresses });
      } catch (error) {
        fastify.log.error(error, 'Erro ao buscar endereços do cliente');

        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

        return reply.status(500).send({ success: false, message: errorMessage });
      }
    },
  });
};

export default getAddressesByCustomerIdRoute;
