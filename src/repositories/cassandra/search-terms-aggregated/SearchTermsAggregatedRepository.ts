import { Client } from 'cassandra-driver';
import { SearchTermAggregated, IncrementSearchTermInput } from './SearchTermAggregatedInterfaces';

export class SearchTermsAggregatedRepository {
  private client: Client;
  private keyspace: string = 'datadriven_store';

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Incrementa o contador de um termo de busca para uma data específica
   */
  async increment(input: IncrementSearchTermInput): Promise<void> {
    const incremento = input.incremento || 1;
    const query = `
      UPDATE ${this.keyspace}.termos_busca_agregados_por_dia
      SET total_contagem = total_contagem + ?
      WHERE data_evento = ? AND termo_busca = ?
    `;

    const params = [incremento, input.data_evento, input.termo_busca];

    try {
      await this.client.execute(query, params, { prepare: true });
    } catch (error: any) {
      throw new Error(`Erro ao incrementar termo de busca: ${error.message}`);
    }
  }

  /**
   * Busca termos de busca por data específica
   */
  async findByDate(dataEvento: Date): Promise<SearchTermAggregated[]> {
    const query = `
      SELECT * FROM ${this.keyspace}.termos_busca_agregados_por_dia
      WHERE data_evento = ?
    `;

    try {
      const result = await this.client.execute(query, [dataEvento], { prepare: true });
      return result.rows.map((row) => ({
        data_evento: row.data_evento,
        termo_busca: row.termo_busca,
        total_contagem: row.total_contagem,
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar termos de busca por data: ${error.message}`);
    }
  }
}
