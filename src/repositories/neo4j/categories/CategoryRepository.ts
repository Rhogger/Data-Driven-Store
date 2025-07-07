import { Driver, Session } from 'neo4j-driver';
import {
  Categoria,
  CreateNodeResult,
  UpdateNodeResult,
  DeleteNodeResult,
} from '../interfaces/ModelInterfaces';

export class CategoryRepository {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Criar um nó de Categoria
   */
  async createCategoria(categoria: Categoria): Promise<CreateNodeResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        CREATE (c:Categoria {
          id_categoria: $id_categoria,
          nome: $nome,
          descricao: $descricao,
          ativa: $ativa
        })
        RETURN c.id_categoria as id_categoria
      `;

      const result = await session.run(query, {
        id_categoria: categoria.id_categoria,
        nome: categoria.nome,
        descricao: categoria.descricao || null,
        ativa: categoria.ativa,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          created: true,
          message: 'Categoria criada com sucesso',
          id: result.records[0].get('id_categoria'),
        };
      }

      return {
        success: false,
        created: false,
        message: 'Falha ao criar categoria',
      };
    } catch (error: any) {
      return {
        success: false,
        created: false,
        message: `Erro ao criar categoria: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Buscar categoria por ID
   */
  async getCategoriaById(id_categoria: string): Promise<Categoria | null> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (c:Categoria {id_categoria: $id_categoria})
        RETURN c.id_categoria as id_categoria,
               c.nome as nome,
               c.descricao as descricao,
               c.ativa as ativa
      `;

      const result = await session.run(query, { id_categoria });

      if (result.records.length > 0) {
        const record = result.records[0];
        return {
          id_categoria: record.get('id_categoria'),
          nome: record.get('nome'),
          descricao: record.get('descricao'),
          ativa: record.get('ativa'),
        };
      }

      return null;
    } finally {
      await session.close();
    }
  }

  /**
   * Listar todas as categorias
   */
  async listCategorias(ativas_apenas: boolean = false): Promise<Categoria[]> {
    const session: Session = this.driver.session();

    try {
      const whereClause = ativas_apenas ? 'WHERE c.ativa = true' : '';
      const query = `
        MATCH (c:Categoria)
        ${whereClause}
        RETURN c.id_categoria as id_categoria,
               c.nome as nome,
               c.descricao as descricao,
               c.ativa as ativa
        ORDER BY c.nome ASC
      `;

      const result = await session.run(query);

      return result.records.map((record) => ({
        id_categoria: record.get('id_categoria'),
        nome: record.get('nome'),
        descricao: record.get('descricao'),
        ativa: record.get('ativa'),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Atualizar categoria
   */
  async updateCategoria(
    id_categoria: string,
    updates: Partial<Omit<Categoria, 'id_categoria'>>,
  ): Promise<UpdateNodeResult> {
    const session: Session = this.driver.session();

    try {
      const setClause = Object.keys(updates)
        .map((key) => `c.${key} = $${key}`)
        .join(', ');

      const query = `
        MATCH (c:Categoria {id_categoria: $id_categoria})
        SET ${setClause}
        RETURN c.id_categoria as id_categoria
      `;

      const result = await session.run(query, {
        id_categoria,
        ...updates,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          updated: true,
          message: 'Categoria atualizada com sucesso',
          changes: updates,
        };
      }

      return {
        success: false,
        updated: false,
        message: 'Categoria não encontrada',
      };
    } catch (error: any) {
      return {
        success: false,
        updated: false,
        message: `Erro ao atualizar categoria: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Deletar categoria (apenas se não houver produtos associados)
   */
  async deleteCategoria(id_categoria: string, force: boolean = false): Promise<DeleteNodeResult> {
    const session: Session = this.driver.session();

    try {
      if (!force) {
        // Verifica se há produtos associados
        const checkQuery = `
          MATCH (c:Categoria {id_categoria: $id_categoria})
          OPTIONAL MATCH (p:Produto)-[:PERTENCE_A]->(c)
          RETURN count(p) as produtos_count
        `;

        const checkResult = await session.run(checkQuery, { id_categoria });
        const produtosCount = checkResult.records[0]?.get('produtos_count').toNumber() || 0;

        if (produtosCount > 0) {
          return {
            success: false,
            deleted: false,
            message: `Não é possível deletar categoria. Há ${produtosCount} produto(s) associado(s).`,
          };
        }
      }

      const query = `
        MATCH (c:Categoria {id_categoria: $id_categoria})
        OPTIONAL MATCH (c)-[r]-()
        WITH c, count(r) as relationships_count
        DETACH DELETE c
        RETURN relationships_count
      `;

      const result = await session.run(query, { id_categoria });

      if (result.records.length > 0) {
        return {
          success: true,
          deleted: true,
          message: 'Categoria deletada com sucesso',
          relationships_deleted: result.records[0].get('relationships_count').toNumber(),
        };
      }

      return {
        success: false,
        deleted: false,
        message: 'Categoria não encontrada',
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
}
