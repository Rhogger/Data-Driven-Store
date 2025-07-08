import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CartRepository } from '@/repositories/cart/CartRepository';

interface RemoveItemFromCartBody {
  id_produto: string;
  quantidade?: number;
}

const removeItemFromCartRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/cart/remove',
    async (request: FastifyRequest<{ Body: RemoveItemFromCartBody }>, reply: FastifyReply) => {
      const id_cliente = (request.user as any)?.id_cliente;

      if (!id_cliente) {
        return reply.status(401).send({ success: false, message: 'Usuário não autenticado.' });
      }
      const { id_produto, quantidade = 1 } = request.body;
      if (!id_produto || quantidade < 1) {
        return reply
          .status(400)
          .send({ success: false, message: 'id_produto e quantidade válidos são obrigatórios.' });
      }
      const cartRepo = new CartRepository(fastify.redis);
      // Buscar carrinho atual
      const cart = await cartRepo.findByClientId(id_cliente);
      if (!cart || !cart.produtos[id_produto]) {
        return reply
          .status(404)
          .send({ success: false, message: 'Produto não encontrado no carrinho.' });
      }
      const currentQty = cart.produtos[id_produto];
      if (quantidade >= currentQty) {
        await cartRepo.removeProduct(id_cliente, id_produto);
      } else {
        await cartRepo.updateProductQuantity(id_cliente, id_produto, currentQty - quantidade);
      }
      return reply.send({ success: true, message: 'Item removido do carrinho.' });
    },
  );
};

export default removeItemFromCartRoutes;
