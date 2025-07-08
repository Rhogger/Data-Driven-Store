import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AddressRepository } from '@repositories/address/AddressRepository';
import { UpdateAddressInput } from '@repositories/address/AddressInterfaces';
import { addressSchemas } from '@routes/addresses/schema/address.schemas';

const updateAddressRoute = async (fastify: FastifyInstance) => {
  fastify.put<{
    Params: { id: number };
    Body: UpdateAddressInput;
  }>('/addresses/:id', {
    schema: addressSchemas.update(),
    preHandler: fastify.authenticate,
    handler: async (
      request: FastifyRequest<{ Params: { id: number }; Body: UpdateAddressInput }>,
      reply: FastifyReply,
    ) => {
      const addressRepository = new AddressRepository(fastify);

      const { id } = request.params;

      const belongs = await addressRepository.belongsToClient(id, request.user?.id_cliente);

      if (!belongs) return reply.status(403).send({ success: false, message: 'Acesso negado.' });

      try {
        const updated = await addressRepository.update(id, request.body);

        if (!updated)
          return reply.status(404).send({ success: false, message: 'Endereço não encontrado.' });

        return reply.send({ success: true, data: updated });
      } catch (error) {
        fastify.log.error(error, 'Erro ao atualizar endereço');

        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

        return reply.status(400).send({ success: false, message: errorMessage });
      }
    },
  });
};

export default updateAddressRoute;
