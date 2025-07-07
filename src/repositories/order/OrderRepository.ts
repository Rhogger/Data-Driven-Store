import { FastifyInstance } from 'fastify';
import { Pool, PoolClient } from 'pg';
import {
  OrderInput,
  CreatedOrder,
  OrderRow,
  OrderItemRow,
  OrderWithItems,
} from './OrderInterfaces';
import { ProductRepository } from '../product/ProductRepository';

export class OrderRepository {
  private pg: Pool;
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.pg = fastify.pg;
  }

  async create(orderData: OrderInput): Promise<CreatedOrder> {
    const client: PoolClient = await this.pg.connect();

    try {
      await client.query('BEGIN');

      // 1. Inserir o pedido
      const orderQuery = `
        INSERT INTO pedidos (id_cliente, valor_total, status_pedido, data_pedido)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;

      const orderResult = await client.query<CreatedOrder>(orderQuery, [
        orderData.id_cliente,
        orderData.valor_total,
        orderData.status_pedido,
      ]);

      const createdOrder = orderResult.rows[0];

      // 2. Inserir os itens do pedido
      for (const item of orderData.itens) {
        const itemQuery = `
          INSERT INTO itens_pedido (id_pedido, id_produto, quantidade, preco_unitario, subtotal)
          VALUES ($1, $2, $3, $4, $5)
        `;

        await client.query(itemQuery, [
          createdOrder.id_pedido,
          item.id_produto,
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

  /**
   * Busca os top clientes com maior faturamento nos últimos 6 meses
   */
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

  /**
   * Relatório de faturamento por categoria
   */
  async getBillingByCategory(): Promise<any[]> {
    const productRepo = new ProductRepository(this.fastify, this.fastify.neo4j, this.fastify.redis);

    // 1. Buscar todos os itens de pedidos entregues/enviados
    const { rows: itens } = await this.pg.query(`
      SELECT
        ip.id_produto,
        ip.subtotal,
        p.data_pedido
      FROM itens_pedido ip
      JOIN pedidos p ON ip.id_pedido = p.id_pedido
      WHERE p.status_pedido IN ('Entregue', 'Enviado')
    `);

    // 2. Buscar todos os produtos do MongoDB
    const produtos = await productRepo.findAll();
    const produtosMap = new Map(produtos.map((p: any) => [String(p._id), p]));

    // 3. Agrupar por mês e categoria
    const resultado: Record<string, Record<string, number>> = {};

    for (const item of itens) {
      const produto = produtosMap.get(item.id_produto);
      if (!produto) continue;

      const mes = item.data_pedido.toISOString().slice(0, 7); // YYYY-MM
      const categoria = (produto as any).id_categoria?.toString() || 'Sem categoria';

      if (!resultado[mes]) resultado[mes] = {};
      if (!resultado[mes][categoria]) resultado[mes][categoria] = 0;

      resultado[mes][categoria] += Number(item.subtotal);
    }

    // 4. Transformar em array para resposta
    const resposta = [];
    for (const mes of Object.keys(resultado)) {
      for (const categoria of Object.keys(resultado[mes])) {
        resposta.push({
          mes,
          categoria,
          faturamento: resultado[mes][categoria].toFixed(2),
        });
      }
    }

    return resposta.sort((a, b) => a.mes.localeCompare(b.mes));
  }
}
