import { FastifyInstance } from 'fastify';
import createOrderRoutes from '@routes/orders/endpoints/create_order.routes';
import listOrdersByClienteRoutes from '@routes/orders/endpoints/list_orders_by_cliente.routes';

export default async function orderRoutes(fastify: FastifyInstance) {
  await fastify.register(createOrderRoutes);
  await fastify.register(listOrdersByClienteRoutes);
}
