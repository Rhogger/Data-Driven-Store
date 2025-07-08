import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CartRepository } from '@repositories/cart/CartRepository';
import { cartSchemas } from '../schema/cart.schemas';

const getCartByClientRoute = async (fastify: FastifyInstance) => {
  fastify.get('/cart/me', {
    schema: cartSchemas.getCartByClient(),
    preValidation: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const id_cliente = (request.user as any)?.id_cliente;

      if (!id_cliente) return reply.status(401).send({ success: false, error: 'Token inválido' });

      const cartRepo = new CartRepository(fastify.redis);
      const cart = await cartRepo.findByClientId(id_cliente);

      if (!cart)
        return reply.status(404).send({ success: false, error: 'Carrinho não encontrado' });

      return reply.send({ success: true, data: cart });
    },
  });
};

export default getCartByClientRoute;
