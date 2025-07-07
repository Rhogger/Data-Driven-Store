import { FastifyPluginAsync } from 'fastify';
import { OrderRepository } from '@repositories/order/OrderRepository';
import { OrderItemInput } from '@repositories/order/OrderInterfaces';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { orderSchemas } from '@routes/orders/schema/order.schemas';

interface CreateOrderInput {
  id_cliente: number;
  id_endereco: number;
  itens: Array<{
    id_produto: string;
    quantidade: number;
  }>;
}

const createOrderRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: CreateOrderInput;
  }>('/orders', {
    schema: orderSchemas.create(),
    handler: async (request, reply) => {
      const { id_cliente, itens } = request.body;

      if (!itens || itens.length === 0) {
        return reply.status(400).send({ message: 'O pedido deve conter pelo menos um item.' });
      }

      const productRepository = new ProductRepository(fastify, fastify.neo4j, fastify.redis);
      const orderRepository = new OrderRepository(fastify);

      try {
        // --- ETAPA 1: Validação e Coleta de Dados (MongoDB) ---
        let totalValue = 0;
        const orderItemsForPg: OrderItemInput[] = [];
        const stockUpdates: Array<{ id: string; newStock: number }> = [];

        for (const item of itens) {
          const product = await productRepository.findById(item.id_produto);

          if (!product) {
            throw new Error(`Produto com ID ${item.id_produto} não encontrado.`);
          }
          if (!product.estoque || product.estoque < item.quantidade) {
            throw new Error(`Estoque insuficiente para o produto "${product.nome}".`);
          }

          const subtotal = product.preco * item.quantidade;
          totalValue += subtotal;

          orderItemsForPg.push({
            id_produto: item.id_produto,
            preco_unitario: product.preco,
            quantidade: item.quantidade,
            subtotal: subtotal,
          });

          stockUpdates.push({
            id: item.id_produto,
            newStock: product.estoque - item.quantidade,
          });
        }

        // --- ETAPA 2: Transação Atômica (PostgreSQL) ---
        const createdOrder = await orderRepository.create({
          id_cliente,
          valor_total: totalValue,
          status_pedido: 'Pendente',
          itens: orderItemsForPg,
        });

        // --- ETAPA 3: Atualização de Estoque (MongoDB) ---
        await Promise.all(
          stockUpdates.map((update) =>
            productRepository.update(update.id, { estoque: update.newStock }),
          ),
        );

        return reply.status(201).send({ success: true, data: createdOrder });
      } catch (error) {
        fastify.log.error(error, 'Erro ao processar criação de pedido');
        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
        return reply.status(400).send({ success: false, message: errorMessage });
      }
    },
  });
};

export default createOrderRoutes;
