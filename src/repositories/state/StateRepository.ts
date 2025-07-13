import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { State } from '@repositories/state/StateInterfaces';

export class StateRepository {
  private pg: Pool;

  constructor(fastify: FastifyInstance) {
    this.pg = fastify.pg;
  }

  async findAll(): Promise<State[]> {
    const query = 'SELECT * FROM estados ORDER BY nome ASC';
    const result = await this.pg.query<State>(query);
    return result.rows;
  }
}
