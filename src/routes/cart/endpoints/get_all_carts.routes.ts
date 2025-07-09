import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CartRepository } from '@repositories/cart/CartRepository';
import { cartSchemas } from '../schema/cart.schemas';

const getAllCartsRoute = async (fastify: FastifyInstance) => {
  fastify.get('/cart', {
    schema: cartSchemas.getAllCarts(),
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      const keys = await fastify.redis.keys('carrinho:*');

      const cartRepo = new CartRepository(fastify.redis);
      const carts = [];
      for (const key of keys) {
        const id_cliente = key.replace('carrinho:', '');
        const cart = await cartRepo.findByClientId(id_cliente);
        if (cart) carts.push(cart);
      }

      return reply.send({ success: true, data: carts });
    },
  });
};

export default getAllCartsRoute;
