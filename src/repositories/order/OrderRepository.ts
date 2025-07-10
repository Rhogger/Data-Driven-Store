import { FastifyInstance } from 'fastify';
import { Pool, PoolClient } from 'pg';
import {
  OrderInput,
  CreatedOrder,
  OrderRow,
  OrderItemRow,
  OrderWithItems,
} from './OrderInterfaces';

export class OrderRepository {
  private pg: Pool;

  constructor(fastify: FastifyInstance) {
    this.pg = fastify.pg;
  }

  async create(orderData: OrderInput): Promise<CreatedOrder> {
    const client: PoolClient = await this.pg.connect();

    try {
      await client.query('BEGIN');

      const orderQuery = `
        INSERT INTO pedidos (id_cliente, id_endereco, valor_total, status_pedido, data_pedido)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;

      const orderResult = await client.query<CreatedOrder>(orderQuery, [
        orderData.id_cliente,
        orderData.id_endereco,
        orderData.valor_total,
        orderData.status_pedido,
      ]);

      const createdOrder = orderResult.rows[0];

      for (const item of orderData.itens) {
        const itemQuery = `
          INSERT INTO itens_pedido (id_pedido, id_produto, id_categoria, quantidade, preco_unitario, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(itemQuery, [
          createdOrder.id_pedido,
          item.id_produto,
          item.id_categoria,
          item.quantidade,
          item.preco_unitario,
          item.subtotal,
        ]);
      }

      await client.query('COMMIT');
      return createdOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findByClienteId(id_cliente: number): Promise<OrderRow[]> {
    const result = await this.pg.query<OrderRow>(
      `
      SELECT
        p.id_pedido,
        p.id_cliente,
        p.data_pedido,
        p.valor_total,
        p.status_pedido,
        p.created_at,
        p.updated_at
      FROM pedidos p
      WHERE p.id_cliente = $1
      ORDER BY p.data_pedido DESC
      `,
      [id_cliente],
    );
    return result.rows;
  }

  async findById(id_pedido: number): Promise<OrderRow | null> {
    const result = await this.pg.query<OrderRow>('SELECT * FROM pedidos WHERE id_pedido = $1', [
      id_pedido,
    ]);
    return result.rows[0] || null;
  }

  async findByIdWithItems(id_pedido: number): Promise<OrderWithItems | null> {
    const order = await this.findById(id_pedido);
    if (!order) return null;

    const itemsResult = await this.pg.query<OrderItemRow>(
      'SELECT * FROM itens_pedido WHERE id_pedido = $1',
      [id_pedido],
    );

    return {
      order,
      items: itemsResult.rows,
    };
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<OrderRow[]> {
    const result = await this.pg.query<OrderRow>(
      `
      SELECT * FROM pedidos
      ORDER BY data_pedido DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset],
    );
    return result.rows;
  }

  async updateStatus(id_pedido: number, status_pedido: string): Promise<OrderRow | null> {
    const result = await this.pg.query<OrderRow>(
      `
      UPDATE pedidos
      SET status_pedido = $1, updated_at = NOW()
      WHERE id_pedido = $2
      RETURNING *
      `,
      [status_pedido, id_pedido],
    );
    return result.rows[0] || null;
  }

  async findByStatus(status_pedido: string): Promise<OrderRow[]> {
    const result = await this.pg.query<OrderRow>(
      'SELECT * FROM pedidos WHERE status_pedido = $1 ORDER BY data_pedido DESC',
      [status_pedido],
    );
    return result.rows;
  }

  async findByDateRange(dataInicio: Date, dataFim: Date): Promise<OrderRow[]> {
    const result = await this.pg.query<OrderRow>(
      `
      SELECT * FROM pedidos
      WHERE data_pedido >= $1 AND data_pedido <= $2
      ORDER BY data_pedido DESC
      `,
      [dataInicio, dataFim],
    );
    return result.rows;
  }

  async getTotalsByPeriod(dataInicio: Date, dataFim: Date): Promise<any> {
    const result = await this.pg.query(
      `
      SELECT
        COUNT(*) as total_pedidos,
        SUM(valor_total) as valor_total_periodo,
        AVG(valor_total) as ticket_medio
      FROM pedidos
      WHERE data_pedido >= $1 AND data_pedido <= $2
      `,
      [dataInicio, dataFim],
    );

    return {
      total_pedidos: parseInt(result.rows[0].total_pedidos, 10),
      valor_total_periodo: parseFloat(result.rows[0].valor_total_periodo || '0'),
      ticket_medio: parseFloat(result.rows[0].ticket_medio || '0'),
    };
  }

  async getTopCustomers(limit: number = 5): Promise<any[]> {
    const { rows } = await this.pg.query(
      `
        SELECT
            c.id_cliente,
            c.nome,
            c.email,
            SUM(p.valor_total) AS faturamento_total
        FROM
            clientes c
        JOIN
            pedidos p ON c.id_cliente = p.id_cliente
        WHERE
            p.data_pedido >= NOW() - INTERVAL '6 months'
            AND p.status_pedido IN ('Entregue', 'Enviado')
        GROUP BY
            c.id_cliente, c.nome, c.email
        ORDER BY faturamento_total DESC
        LIMIT $1;
      `,
      [limit],
    );
    return rows;
  }

  async getMonthlyBillingByCategory(): Promise<
    { mes: string; categoria: string; faturamento: string }[]
    // eslint-disable-next-line indent
  > {
    const { rows } = await this.pg.query(`
      SELECT
        to_char(p.data_pedido, 'YYYY-MM') as mes,
        coalesce(cat.nome, 'Sem categoria') as categoria,
        SUM(ip.subtotal)::numeric(12,2) as faturamento
      FROM itens_pedido ip
      JOIN pedidos p ON ip.id_pedido = p.id_pedido
      LEFT JOIN categorias cat ON ip.id_categoria = cat.id_categoria
      WHERE p.status_pedido IN ('Entregue', 'Enviado')
      GROUP BY mes, categoria
      ORDER BY mes, categoria
    `);
    return rows.map((row: any) => ({
      mes: row.mes,
      categoria: row.categoria,
      faturamento: row.faturamento,
    }));
  }
}
