import { Pool } from 'pg';

export class TopCustomersReportRepository {
  // Recebe o pool de conexões para poder interagir com o banco
  constructor(private pg: Pool) {}

  /**
   * Busca os 5 clientes com maior faturamento nos últimos 6 meses.
   */
  async generate() {
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
        LIMIT 5;
      `,
    );
    return rows;
  }
}
