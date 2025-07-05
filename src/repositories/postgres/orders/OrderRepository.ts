import { PoolClient } from 'pg';

// Interface para os dados do pedido que vem da rota
export interface OrderInput {
  customerId: number;
  addressId: number;
  totalValue: number;
  items: OrderItemInput[];
}

// Interface para os itens do pedido que vem da rota
export interface OrderItemInput {
  productId: string; // from MongoDB
  categoryId: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

// Interface para o pedido criado no banco
export interface CreatedOrder {
  id_pedido: number;
  id_cliente: number;
  id_endereco: number;
  valor_total: string; // NUMERIC is returned as string
  data_pedido: Date;
  status_pedido: string;
}

export class OrderRepository {
  async create(client: PoolClient, orderData: OrderInput): Promise<CreatedOrder> {
    try {
      await client.query('BEGIN');

      const orderInsertQuery = `
        INSERT INTO pedidos (id_cliente, id_endereco, status_pedido, valor_total, data_pedido)
        VALUES ($1, $2, 'Processando', $3, NOW())
        RETURNING id_pedido, id_cliente, id_endereco, valor_total, data_pedido, status_pedido;
      `;
      const orderResult = await client.query<CreatedOrder>(orderInsertQuery, [
        orderData.customerId,
        orderData.addressId,
        orderData.totalValue,
      ]);
      const newOrder = orderResult.rows[0];

      const itemInsertQuery = `
        INSERT INTO itens_pedido (id_pedido, id_produto, id_categoria, preco_unitario, quantidade, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6);
      `;
      for (const item of orderData.items) {
        await client.query(itemInsertQuery, [
          newOrder.id_pedido,
          item.productId,
          item.categoryId,
          item.unitPrice,
          item.quantity,
          item.subtotal,
        ]);
      }

      await client.query('COMMIT');
      return newOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      // eslint-disable-next-line no-console
      console.error('Erro na transação de criação de pedido, rollback executado.', error);
      throw new Error('Falha ao criar o pedido no banco de dados relacional.');
    }
  }
}
