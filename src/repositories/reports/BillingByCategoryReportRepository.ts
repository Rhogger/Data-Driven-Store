import { Pool } from 'pg';
import { FastifyInstance } from 'fastify';
import { ProductRepository } from '@repositories/mongodb/ProductRepository';

export class BillingByCategoryReportRepository {
  constructor(private fastify: FastifyInstance) {}

  async generate() {
    const pg: Pool = this.fastify.pg;
    const productRepo = new ProductRepository(this.fastify);

    // 1. Buscar todos os itens de pedidos entregues/enviados
    const { rows: itens } = await pg.query(`
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
    const produtosMap = new Map(produtos.map((p) => [String(p._id), p]));

    // 3. Agrupar por mês e categoria
    const resultado: Record<string, Record<string, number>> = {};

    for (const item of itens) {
      const produto = produtosMap.get(item.id_produto);
      if (!produto) continue;

      const mes = item.data_pedido.toISOString().slice(0, 7); // YYYY-MM
      const categoria = produto.id_categoria?.toString() || 'Sem categoria';

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

    return resposta;
  }
}
