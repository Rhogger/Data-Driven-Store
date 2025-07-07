import { Driver, Session } from 'neo4j-driver';
import { Category, CreateNodeResult, DeleteNodeResult } from '../interfaces/ModelInterfaces';

export class CategoriaRepository {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Criar um nó de Categoria
   */
  async createCategoria(categoria: Category): Promise<CreateNodeResult> {
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
   * Deletar Categorias (SOMENTE se não tiver relações com nenhum produto)
   */
  async deleteCategoria(id_categoria: string): Promise<DeleteNodeResult> {
    const session: Session = this.driver.session();

    try {
      // Primeiro verifica se a categoria tem relações com produtos
      const checkQuery = `
        MATCH (c:Categoria {id_categoria: $id_categoria})
        OPTIONAL MATCH (p:Produto)-[:PERTENCE_A]->(c)
        RETURN c, count(p) as product_count
      `;

      const checkResult = await session.run(checkQuery, { id_categoria });

      if (checkResult.records.length === 0) {
        return {
          success: false,
          deleted: false,
          message: 'Categoria não encontrada',
        };
      }

      const productCount = checkResult.records[0].get('product_count');

      if (productCount > 0) {
        return {
          success: false,
          deleted: false,
          message: `Não é possível deletar a categoria. Existe(m) ${productCount} produto(s) relacionado(s)`,
        };
      }

      // Se não tem produtos relacionados, pode deletar
      const deleteQuery = `
        MATCH (c:Categoria {id_categoria: $id_categoria})
        DETACH DELETE c
        RETURN count(c) as deleted_count
      `;

      const deleteResult = await session.run(deleteQuery, { id_categoria });
      const deletedCount = deleteResult.records[0].get('deleted_count');

      if (deletedCount > 0) {
        return {
          success: true,
          deleted: true,
          message: 'Categoria deletada com sucesso',
        };
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
}
