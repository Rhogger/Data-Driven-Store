import { Client } from 'cassandra-driver';
import {
  ProductViewAggregated,
  IncrementProductViewInput,
} from './ProductViewAggregatedInterfaces';
import { FastifyInstance } from 'fastify';

export class ProductViewsAggregatedRepository {
  private client: Client;
  private keyspace: string = 'datadriven_store';

  constructor(fastify: FastifyInstance) {
    this.client = fastify.cassandra;
  }

  async increment(input: IncrementProductViewInput): Promise<void> {
    const incremento = input.incremento || 1;
    const query = `
      UPDATE ${this.keyspace}.visualizacoes_produto_agregadas_por_dia
      SET total_visualizacoes = total_visualizacoes + ?
      WHERE data_evento = ? AND id_produto = ?
    `;

    const params = [incremento, input.data_evento, input.id_produto];

    try {
      await this.client.execute(query, params, { prepare: true });
    } catch (error: any) {
      throw new Error(`Erro ao incrementar visualizações do produto: ${error.message}`);
    }
  }

  async findByDate(dataEvento: Date): Promise<ProductViewAggregated[]> {
    const query = `
      SELECT * FROM ${this.keyspace}.visualizacoes_produto_agregadas_por_dia
      WHERE data_evento = ?
    `;

    try {
      const result = await this.client.execute(query, [dataEvento], { prepare: true });
      return result.rows.map((row) => ({
        data_evento: row.data_evento,
        id_produto: row.id_produto,
        total_visualizacoes: row.total_visualizacoes,
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar visualizações por data: ${error.message}`);
    }
  }
}
