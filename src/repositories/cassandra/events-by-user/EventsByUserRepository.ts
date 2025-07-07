import { Client } from 'cassandra-driver';
import { EventByUser, CreateEventByUserInput } from './EventByUserInterfaces';

export class EventsByUserRepository {
  private client: Client;
  private keyspace: string = 'datadriven_store';

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Cria um novo evento na tabela eventos_por_usuario
   */
  async create(evento: CreateEventByUserInput): Promise<void> {
    const query = `
      INSERT INTO ${this.keyspace}.eventos_por_usuario (
        id_usuario,
        timestamp_evento,
        id_evento,
        data_evento,
        tipo_evento,
        id_produto,
        termo_busca,
        url_pagina,
        origem_campanha,
        detalhes_evento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      evento.id_usuario,
      evento.timestamp_evento,
      evento.id_evento,
      evento.data_evento,
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
      throw new Error(`Erro ao criar evento por usuário: ${error.message}`);
    }
  }

  /**
   * Busca eventos por usuário específico
   */
  async findByUser(idUsuario: string): Promise<EventByUser[]> {
    const query = `
      SELECT * FROM ${this.keyspace}.eventos_por_usuario
      WHERE id_usuario = ?
    `;

    try {
      const result = await this.client.execute(query, [idUsuario], { prepare: true });
      return result.rows.map((row) => ({
        id_usuario: row.id_usuario,
        timestamp_evento: row.timestamp_evento,
        id_evento: row.id_evento,
        data_evento: row.data_evento,
        tipo_evento: row.tipo_evento,
        id_produto: row.id_produto,
        termo_busca: row.termo_busca,
        url_pagina: row.url_pagina,
        origem_campanha: row.origem_campanha,
        detalhes_evento: row.detalhes_evento,
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar eventos por usuário: ${error.message}`);
    }
  }
}
