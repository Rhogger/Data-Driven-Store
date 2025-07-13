import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { City } from '@repositories/city/CityInterfaces';

export class CityRepository {
  private pg: Pool;

  constructor(fastify: FastifyInstance) {
    this.pg = fastify.pg;
  }

  async findAll(): Promise<City[]> {
    const query = 'SELECT * FROM cidades ORDER BY nome ASC';
    const result = await this.pg.query<City>(query);
    return result.rows;
  }
}
