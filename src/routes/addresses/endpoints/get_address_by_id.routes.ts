import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AddressRepository } from '@repositories/address/AddressRepository';
import { addressSchemas } from '@routes/addresses/schema/address.schemas';

const getAddressByIdRoute = async (fastify: FastifyInstance) => {
  fastify.get<{
    Params: { id: number };
  }>('/addresses/:id', {
    schema: addressSchemas.findById(),
    handler: async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
      const addressRepository = new AddressRepository(fastify);

      const { id } = request.params;

      try {
        const address = await addressRepository.findByIdWithCity(id);

        if (!address)
          return reply.status(404).send({ success: false, message: 'Endereço não encontrado' });

        return reply.send({ success: true, data: address });
      } catch (error) {
        fastify.log.error(error, 'Erro ao buscar endereço');

        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

        return reply.status(500).send({ success: false, message: errorMessage });
      }
    },
  });
};

export default getAddressByIdRoute;
