import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CartRepository } from '@/repositories/cart/CartRepository';
import { cartSchemas } from '@routes/cart/schema/cart.schemas';
import { ProductRepository } from '@/repositories/product/ProductRepository';

interface AddItemToCartBody {
  id_produto: string;
  quantidade?: number;
}

const addItemToCartRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/cart/add', {
    schema: cartSchemas.addItem(),
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Body: AddItemToCartBody }>, reply: FastifyReply) => {
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

      fastify.log.info({ product }, 'Produto retornado do repositório');

      if (!product)
        return reply.status(404).send({ success: false, message: 'Produto não encontrado.' });

      const cartRepo = new CartRepository(fastify);
      const cart = await cartRepo.findByClientId(id_cliente);

      const quantidadeNoCarrinho = cart?.produtos?.[id_produto] ?? 0;
      const totalDesejado = quantidadeNoCarrinho + quantidade;

      fastify.log.info(
        {
          quantidadeNoCarrinho,
          quantidade,
          totalDesejado,
          estoque: product.estoque,
          reservado: product.reservado,
          disponivel: product.disponivel,
        },
        'Debug estoque/disponível ao adicionar item ao carrinho',
      );

      if ((product.disponivel ?? 0) < totalDesejado) {
        return reply.status(400).send({
          success: false,
          message: `Estoque insuficiente. Já possui ${quantidadeNoCarrinho} no carrinho, disponível: ${product.disponivel}`,
        });
      }

      await cartRepo.addProduct(id_cliente, id_produto, quantidade);
      return reply.send({ success: true, message: 'Item adicionado ao carrinho.' });
    },
  });
};

export default addItemToCartRoutes;
