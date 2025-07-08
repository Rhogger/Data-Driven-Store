import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AddressRepository } from '@repositories/address/AddressRepository';
import { addressSchemas } from '@routes/addresses/schema/address.schemas';

const deleteAddressRoute = async (fastify: FastifyInstance) => {
  fastify.delete<{
    Params: { id: number };
  }>('/addresses/:id', {
    schema: addressSchemas.remove(),
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
      const addressRepository = new AddressRepository(fastify);
      const { id } = request.params;
      const id_cliente = request.user?.id_cliente;

      const belongs = await addressRepository.belongsToClient(id, id_cliente);
      if (!belongs) {
        return reply.status(403).send({ success: false, message: 'Acesso negado.' });
      }

      try {
        const deleted = await addressRepository.delete(id);
        if (!deleted) {
          return reply.status(404).send({ success: false, message: 'Endereço não encontrado.' });
        }
        return reply.send({ success: true, message: 'Endereço excluído com sucesso.' });
      } catch (error) {
        fastify.log.error(error, 'Erro ao excluir endereço');
        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
        return reply.status(400).send({ success: false, message: errorMessage });
      }
    },
  });
};

export default deleteAddressRoute;
