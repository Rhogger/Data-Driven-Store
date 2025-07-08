import { FastifyPluginAsync } from 'fastify';
import { OrderRepository } from '@repositories/order/OrderRepository';
import { orderSchemas } from '@routes/orders/schema/order.schemas';

const listOrdersByCustomerRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { id_cliente: string };
  }>('/orders/by-customer/:id_cliente', {
    schema: orderSchemas.listByCliente(),
    handler: async (request, reply) => {
      const id_cliente = Number(request.params.id_cliente);

      const orderRepository = new OrderRepository(fastify);
      const orders = await orderRepository.findByClienteId(id_cliente);

      return reply.send(orders);
    },
  });
};

export default listOrdersByCustomerRoutes;
