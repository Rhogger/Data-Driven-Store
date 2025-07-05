import { FastifyInstance } from 'fastify';
import { OrderRepository, OrderItemInput } from '@/repositories/postgres/orders/OrderRepository';
import { ProductRepository } from '@/repositories/mongodb/ProductRepository';

interface CreateOrderRequest {
  Body: {
    customerId: number;
    addressId: number;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  };
}

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.post<CreateOrderRequest>('/orders', async (request, reply) => {
    const { customerId, addressId, items } = request.body;

    if (!items || items.length === 0) {
      return reply.status(400).send({ message: 'O pedido deve conter pelo menos um item.' });
    }

    const productRepository = new ProductRepository(fastify);
    const orderRepository = new OrderRepository();

    // É crucial obter um cliente do pool e liberá-lo no final para não esgotar as conexões
    const pgClient = await fastify.pg.connect();

    try {
      // --- ETAPA 1: Validação e Coleta de Dados (MongoDB) ---
      let totalValue = 0;
      const orderItemsForPg: OrderItemInput[] = [];
      const stockUpdates: Array<{ id: string; newStock: number }> = [];

      for (const item of items) {
        const product = await productRepository.findById(item.productId);

        if (!product) {
          throw new Error(`Produto com ID ${item.productId} não encontrado.`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Estoque insuficiente para o produto "${product.name}".`);
        }

        const subtotal = product.price * item.quantity;
        totalValue += subtotal;

        orderItemsForPg.push({
          productId: item.productId,
          // ATENÇÃO: Seu schema no PG espera um INT para categoria, mas no Mongo é string.
          // O ideal seria ter uma tabela de categorias no PG e buscar o ID correspondente.
          // Para este exemplo, faremos uma conversão simples.
          categoryId: parseInt(product.categoryId, 10) || 1,
          unitPrice: product.price,
          quantity: item.quantity,
          subtotal: subtotal,
        });

        stockUpdates.push({
          id: item.productId,
          newStock: product.stock - item.quantity,
        });
      }

      // --- ETAPA 2: Transação Atômica (PostgreSQL) ---
      const createdOrder = await orderRepository.create(pgClient, {
        customerId,
        addressId,
        totalValue,
        items: orderItemsForPg,
      });

      // --- ETAPA 3: Atualização de Estoque (MongoDB) ---
      await Promise.all(
        stockUpdates.map((update) =>
          productRepository.update(update.id, { stock: update.newStock }),
        ),
      );

      return reply.status(201).send({ success: true, data: createdOrder });
    } catch (error) {
      fastify.log.error(error, 'Erro ao processar criação de pedido');
      const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
      return reply.status(400).send({ success: false, message: errorMessage });
    } finally {
      // --- ETAPA FINAL: Liberar o cliente do pool do PostgreSQL ---
      pgClient.release();
    }
  });
}
