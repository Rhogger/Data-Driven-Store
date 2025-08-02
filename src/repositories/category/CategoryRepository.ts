import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { Driver, Session, Transaction } from 'neo4j-driver';
import { CategoryRow, CategoryCreateInput, Category, DeleteNodeResult } from './CategoryInterfaces';

export class CategoryRepository {
  private pg: Pool;
  private neo4jDriver: Driver;

  constructor(fastify: FastifyInstance) {
    this.pg = fastify.pg;
    this.neo4jDriver = fastify.neo4j;
  }

  // ============================================================================
  // PostgreSQL Operations (Dados estruturais e hierarquia)
  // ============================================================================

  async create(categoryData: CategoryCreateInput): Promise<CategoryRow> {
    const sql = `
      INSERT INTO categorias (nome)
      VALUES ($1)
      RETURNING *
    `;
    const result = await this.pg.query<CategoryRow>(sql, [categoryData.nome]);
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

  // ============================================================================
  // Neo4j Operations (Relacionamentos e análises)
  // ============================================================================

  async createCategoryNode(category: Category, tx?: Session | Transaction): Promise<void> {
    const session = tx || this.neo4jDriver.session();
    try {
      const query = 'CREATE (c:Categoria {id_categoria: $id_categoria, nome: $nome}) RETURN c';
      await session.run(query, {
        id_categoria: category.id_categoria,
        nome: category.nome,
      });
    } finally {
      if (!tx) await (session as Session).close();
    }
  }

  async deleteCategoryNode(id_categoria: string): Promise<DeleteNodeResult> {
    const session: Session = this.neo4jDriver.session();

    try {
      const checkQuery = `
        MATCH (c:Categoria {id_categoria: $id_categoria})
        OPTIONAL MATCH (c)<-[:PERTENCE_A]-(p:Produto)
        RETURN count(p) as produto_count
      `;

      const checkResult = await session.run(checkQuery, { id_categoria });

      if (checkResult.records.length > 0) {
        const produtoCount = checkResult.records[0].get('produto_count').toNumber();

        if (produtoCount > 0) {
          return {
            success: false,
            deleted: false,
            message: `Categoria não pode ser deletada pois possui ${produtoCount} produto(s) relacionado(s)`,
          };
        }
      }

      const deleteQuery = `
        MATCH (c:Categoria {id_categoria: $id_categoria})
        DETACH DELETE c
        RETURN count(c) as deleted_count
      `;

      const deleteResult = await session.run(deleteQuery, { id_categoria });

      if (deleteResult.records.length > 0) {
        const deletedCount = deleteResult.records[0].get('deleted_count').toNumber();

        if (deletedCount > 0) {
          return {
            success: true,
            deleted: true,
            message: 'Categoria deletada com sucesso',
          };
        }
      }

      return {
        success: false,
        deleted: false,
        message: 'Falha ao deletar categoria',
      };
    } catch (error: any) {
      return {
        success: false,
        deleted: false,
        message: `Erro ao deletar categoria: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }

  async findByIdNeo4j(id_categoria: string, tx?: Session | Transaction): Promise<Category | null> {
    const session = tx || this.neo4jDriver.session();
    try {
      const query = 'MATCH (c:Categoria {id_categoria: $id_categoria}) RETURN c';
      const result = await session.run(query, { id_categoria });
      if (result.records.length > 0) {
        const catNode = result.records[0].get('c').properties;
        return {
          id_categoria: catNode.id_categoria,
          nome: catNode.nome,
        };
      }
      return null;
    } finally {
      if (!tx) await (session as Session).close();
    }
  }
}
