import { Pool, PoolClient } from 'pg';

// Interface para os dados do pedido que vem da rota
export interface OrderInput {
  id_cliente: number;
  id_endereco: number;
  valor_total: number;
  itens: OrderItemInput[];
}

// Interface para os itens do pedido que vem da rota
export interface OrderItemInput {
  id_produto: string; // from MongoDB
  id_categoria: number;
  preco_unitario: number;
  quantidade: number;
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
  constructor(private pg?: Pool) {}

  async create(client: PoolClient, orderData: OrderInput): Promise<CreatedOrder> {
    try {
      await client.query('BEGIN');

      const orderInsertQuery = `
        INSERT INTO pedidos (id_cliente, id_endereco, status_pedido, valor_total, data_pedido)
        VALUES ($1, $2, 'Processando', $3, NOW())
        RETURNING id_pedido, id_cliente, id_endereco, valor_total, data_pedido, status_pedido;
      `;
      const orderResult = await client.query<CreatedOrder>(orderInsertQuery, [
        orderData.id_cliente,
        orderData.id_endereco,
        orderData.valor_total,
      ]);
      const newOrder = orderResult.rows[0];

      const itemInsertQuery = `
        INSERT INTO itens_pedido (id_pedido, id_produto, id_categoria, preco_unitario, quantidade, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6);
      `;
      for (const item of orderData.itens) {
        await client.query(itemInsertQuery, [
          newOrder.id_pedido,
          item.id_produto,
          item.id_categoria,
          item.preco_unitario,
          item.quantidade,
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

  async findByClienteId(id_cliente: number) {
    if (!this.pg) {
      throw new Error('PostgreSQL pool is not initialized.');
    }
    const result = await this.pg.query(
      `
      SELECT
        p.id_pedido,
        p.data_pedido,
        p.valor_total,
        p.status_pedido
      FROM pedidos p
      WHERE p.id_cliente = $1
      ORDER BY p.data_pedido DESC
      `,
      [id_cliente],
    );
    return result.rows;
  }
}
