import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CartRepository } from '@/repositories/cart/CartRepository';

const clearCartRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/cart/clear', async (request: FastifyRequest, reply: FastifyReply) => {
    const id_cliente = (request.user as any)?.id_cliente;
    if (!id_cliente) {
      return reply.status(401).send({ success: false, message: 'Usuário não autenticado.' });
    }
    const cartRepo = new CartRepository(fastify.redis);
    await cartRepo.clear(id_cliente);
    return reply.send({ success: true, message: 'Carrinho limpo com sucesso.' });
  });
};

export default clearCartRoutes;
