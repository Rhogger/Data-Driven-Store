import { FastifyPluginAsync } from 'fastify';
import { OrderRepository } from '@repositories/order/OrderRepository';
import { orderSchemas } from '@routes/orders/schema/order.schemas';

const listOrdersByCustomerRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { id_cliente?: number };
  }>('/orders/by-customer/:id_cliente', {
    schema: orderSchemas.listByCustomer(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const id_cliente = !request.params?.id_cliente
        ? request.user?.id_cliente
        : request.params.id_cliente;

      if (!id_cliente) {
        return reply
          .status(400)
          .send({ success: false, message: 'Necessário informar um id_cliente.' });
      }

      const orderRepository = new OrderRepository(fastify);
      const orders = await orderRepository.findByClienteId(id_cliente);
      return reply.status(200).send({ success: true, data: orders });
    },
  });
};

export default listOrdersByCustomerRoutes;
