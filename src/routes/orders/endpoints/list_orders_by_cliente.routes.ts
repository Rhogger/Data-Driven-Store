import { FastifyPluginAsync } from 'fastify';
import { OrderRepository } from '@repositories/postgres/orders/OrderRepository';
import { orderSchemas } from '../schema/order.schemas';

const listOrdersByClienteRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { id_cliente: string };
  }>('/orders/by-client/:id_cliente', {
    schema: orderSchemas.listByCliente(),
    handler: async (request, reply) => {
      const id_cliente = Number(request.params.id_cliente);
      const orderRepository = new OrderRepository(fastify.pg);
      const orders = await orderRepository.findByClienteId(id_cliente);
      return reply.send(orders);
    },
  });
};

export default listOrdersByClienteRoutes;
