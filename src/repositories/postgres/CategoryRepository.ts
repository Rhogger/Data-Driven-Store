import { FastifyInstance } from 'fastify';

interface CategoryRow {
  id_categoria: number;
  nome: string;
  created_at: Date;
  updated_at: Date;
}

export class CategoryRepository {
  constructor(private fastify: FastifyInstance) {}

  private get pg() {
    return this.fastify.pg;
  }

  async create(nome: string): Promise<CategoryRow> {
    const sql = `
      INSERT INTO categorias (nome)
      VALUES ($1)
      RETURNING *
    `;
    const result = await this.pg.query<CategoryRow>(sql, [nome]);
    return result.rows[0];
  }

  async findById(id: number): Promise<CategoryRow | null> {
    const result = await this.pg.query<CategoryRow>(
      'SELECT * FROM categorias WHERE id_categoria = $1',
      [id],
    );
    return result.rows[0] || null;
  }

  async findAll(): Promise<CategoryRow[]> {
    const result = await this.pg.query<CategoryRow>(
      'SELECT * FROM categorias ORDER BY created_at DESC',
    );
    return result.rows;
  }

  async exists(id: number): Promise<boolean> {
    const result = await this.pg.query('SELECT 1 FROM categorias WHERE id_categoria = $1', [id]);
    return result.rows.length > 0;
  }
}
