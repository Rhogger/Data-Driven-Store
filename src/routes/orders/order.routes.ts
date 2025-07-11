import { FastifyInstance } from 'fastify';
import createOrderRoutes from '@routes/orders/endpoints/create_order.routes';
import listOrdersByClienteRoutes from '@/routes/orders/endpoints/list_orders_by_customer.routes';

const orderRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, message: 'Token inválido ou ausente.' });
    }
  });
  await fastify.register(createOrderRoutes);
  await fastify.register(listOrdersByClienteRoutes);
};

export default orderRoutes;
