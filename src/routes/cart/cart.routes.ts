import { FastifyInstance } from 'fastify';
import addItemToCartRoutes from '@routes/cart/endpoints/add_item_to_cart.routes';
import removeItemFromCartRoutes from '@routes/cart/endpoints/remove_item_from_cart.routes';
import clearCartRoutes from '@routes/cart/endpoints/clear_cart.routes';

export default async function cartRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, message: 'Token inválido ou ausente.' });
    }
  });
  fastify.register(addItemToCartRoutes);
  fastify.register(removeItemFromCartRoutes);
  fastify.register(clearCartRoutes);
}
