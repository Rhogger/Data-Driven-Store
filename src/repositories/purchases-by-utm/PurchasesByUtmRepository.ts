import { Client } from 'cassandra-driver';
import { PurchaseByUtm, CreatePurchaseByUtmInput } from './PurchaseByUtmInterfaces';
import { FastifyInstance } from 'fastify';

export class PurchasesByUtmRepository {
  private client: Client;
  private keyspace: string = 'datadriven_store';

  constructor(fastify: FastifyInstance) {
    this.client = fastify.cassandra;
  }

  async create(compra: CreatePurchaseByUtmInput): Promise<void> {
    const query = `
      INSERT INTO ${this.keyspace}.compras_por_utm_source (
        origem_campanha,
        timestamp_evento,
        id_usuario,
        id_produto,
        id_pedido,
        tipo_evento
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      compra.origem_campanha,
      compra.timestamp_evento,
      compra.id_usuario, // number
      compra.id_produto,
      compra.id_pedido,
      compra.tipo_evento,
    ];

    try {
      await this.client.execute(query, params, { prepare: true });
    } catch (error: any) {
      throw new Error(`Erro ao criar compra por UTM source: ${error.message}`);
    }
  }

  async findByCampaignSource(origemCampanha: string): Promise<PurchaseByUtm[]> {
    const query = `
      SELECT * FROM ${this.keyspace}.compras_por_utm_source
      WHERE origem_campanha = ?
    `;

    try {
      const result = await this.client.execute(query, [origemCampanha], { prepare: true });
      return result.rows.map((row) => ({
        origem_campanha: row.origem_campanha,
        timestamp_evento: row.timestamp_evento,
        id_usuario: row.id_usuario, // number
        id_produto: row.id_produto,
        id_pedido: row.id_pedido,
        tipo_evento: row.tipo_evento,
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar compras por origem de campanha: ${error.message}`);
    }
  }
}
