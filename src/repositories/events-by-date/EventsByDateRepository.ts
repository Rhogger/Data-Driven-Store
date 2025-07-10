import { Client } from 'cassandra-driver';
import { EventByDate, CreateEventByDateInput } from './EventByDateInterfaces';
import { FastifyInstance } from 'fastify';

export class EventsByDateRepository {
  private client: Client;
  private keyspace: string = 'datadriven_store';

  constructor(fastify: FastifyInstance) {
    this.client = fastify.cassandra;
  }

  async create(evento: CreateEventByDateInput): Promise<void> {
    const query = `
      INSERT INTO ${this.keyspace}.eventos_por_data (
        data_evento,
        timestamp_evento,
        id_evento,
        id_usuario,
        tipo_evento,
        id_produto,
        termo_busca,
        url_pagina,
        origem_campanha,
        detalhes_evento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      evento.data_evento,
      evento.timestamp_evento,
      evento.id_evento,
      evento.id_usuario,
      evento.tipo_evento,
      evento.id_produto || null,
      evento.termo_busca || null,
      evento.url_pagina || null,
      evento.origem_campanha || null,
      evento.detalhes_evento || null,
    ];

    try {
      await this.client.execute(query, params, { prepare: true });
    } catch (error: any) {
      throw new Error(`Erro ao criar evento por data: ${error.message}`);
    }
  }

  async findByDate(dataEvento: Date): Promise<EventByDate[]> {
    const query = `
      SELECT * FROM ${this.keyspace}.eventos_por_data
      WHERE data_evento = ?
    `;

    try {
      const result = await this.client.execute(query, [dataEvento], { prepare: true });
      return result.rows.map((row) => ({
        data_evento: row.data_evento,
        timestamp_evento: row.timestamp_evento,
        id_evento: row.id_evento,
        id_usuario: row.id_usuario,
        tipo_evento: row.tipo_evento,
        id_produto: row.id_produto,
        termo_busca: row.termo_busca,
        url_pagina: row.url_pagina,
        origem_campanha: row.origem_campanha,
        detalhes_evento: row.detalhes_evento,
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar eventos por data: ${error.message}`);
    }
  }
}
