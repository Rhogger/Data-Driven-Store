import { FastifyInstance } from 'fastify';
import createOrderRoutes from '@routes/orders/endpoints/create_order.routes';

export default async function orderRoutes(fastify: FastifyInstance) {
  await fastify.register(createOrderRoutes);
}
