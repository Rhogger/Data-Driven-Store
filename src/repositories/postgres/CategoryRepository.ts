import { FastifyInstance } from 'fastify';
import { Client as PostgresClient } from 'pg';
import fs from 'fs/promises';
import path from 'path';

interface CategoryRow {
  id_categoria: number;
  nome: string;
  created_at: Date;
  updated_at: Date;
}

export class CategoryRepository {
  private pg: PostgresClient;
  private baseQueriesPath: string;

  constructor(fastify: FastifyInstance) {
    this.pg = fastify.pg;
    this.baseQueriesPath = path.join(process.cwd(), 'src', 'repositories', 'postgres', 'queries');
  }

  async create(nome: string): Promise<CategoryRow> {
    const queryPath = path.join(this.baseQueriesPath, 'categories', 'create.sql');
    const sql = await fs.readFile(queryPath, 'utf-8');

    const result = await this.pg.query<CategoryRow>(sql, [nome]);
    return result.rows[0];
  }
}