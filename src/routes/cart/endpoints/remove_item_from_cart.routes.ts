import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CartRepository } from '@/repositories/cart/CartRepository';
import { cartSchemas } from '@routes/cart/schema/cart.schemas';
import { ProductRepository } from '@/repositories/product/ProductRepository';

interface RemoveItemFromCartBody {
  id_produto: string;
  quantidade?: number;
}

const removeItemFromCartRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/cart/remove', {
    schema: cartSchemas.removeItem(),
    preHandler: fastify.authenticate,
    handler: async (
      request: FastifyRequest<{ Body: RemoveItemFromCartBody }>,
      reply: FastifyReply,
    ) => {
      const id_cliente = (request.user as any)?.id_cliente;

      if (!id_cliente)
        return reply.status(401).send({ success: false, message: 'Usuário não autenticado.' });

      const { id_produto, quantidade = 1 } = request.body;

      if (!id_produto || quantidade < 1)
        return reply
          .status(400)
          .send({ success: false, message: 'id_produto e quantidade válidos são obrigatórios.' });

      const productRepo = new ProductRepository(fastify);
      const product = await productRepo.findById(id_produto);

      if (!product)
        return reply.status(404).send({ success: false, message: 'Produto não encontrado.' });

      const cartRepo = new CartRepository(fastify);
      const cart = await cartRepo.findByClientId(id_cliente);

      if (!cart || !cart.produtos[id_produto])
        return reply
          .status(404)
          .send({ success: false, message: 'Produto não encontrado no carrinho.' });

      const currentQty = cart.produtos[id_produto];

      if (quantidade >= currentQty) await cartRepo.removeProduct(id_cliente, id_produto);
      else await cartRepo.updateProductQuantity(id_cliente, id_produto, currentQty - quantidade);

      return reply.send({ success: true, message: 'Item removido do carrinho.' });
    },
  });
};

export default removeItemFromCartRoutes;
