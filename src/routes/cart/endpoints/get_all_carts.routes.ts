import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CartRepository } from '@repositories/cart/CartRepository';
import { cartSchemas } from '../schema/cart.schemas';

const getAllCartsRoute = async (fastify: FastifyInstance) => {
  fastify.get('/cart', {
    schema: cartSchemas.getAllCarts(),
    preHandler: fastify.authenticate,
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      const cartRepo = new CartRepository(fastify);
      const carts = await cartRepo.getAllCarts();
      return reply.send({ success: true, data: carts });
    },
  });
};

export default getAllCartsRoute;
