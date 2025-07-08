import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CartRepository } from '@/repositories/cart/CartRepository';
import { cartSchemas } from '@routes/cart/schema/cart.schemas';

interface AddItemToCartBody {
  id_produto: string;
  quantidade?: number;
}

const addItemToCartRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/cart/add', {
    schema: cartSchemas.addItem(),
    handler: async (request: FastifyRequest<{ Body: AddItemToCartBody }>, reply: FastifyReply) => {
      const id_cliente = (request.user as any)?.id_cliente;

      if (!id_cliente)
        return reply.status(401).send({ success: false, message: 'Usuário não autenticado.' });

      const { id_produto, quantidade = 1 } = request.body;

      if (!id_produto || quantidade < 1)
        return reply
          .status(400)
          .send({ success: false, message: 'id_produto e quantidade válidos são obrigatórios.' });

      const cartRepo = new CartRepository(fastify.redis);
      await cartRepo.addProduct(id_cliente, id_produto, quantidade);

      return reply.send({ success: true, message: 'Item adicionado ao carrinho.' });
    },
  });
};

export default addItemToCartRoutes;
