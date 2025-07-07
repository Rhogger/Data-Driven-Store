import { Driver, Session } from 'neo4j-driver';
import {
  Brand,
  CreateNodeResult,
  UpdateNodeResult,
  DeleteNodeResult,
} from '../interfaces/ModelInterfaces';

export class MarcaRepository {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Criar o nó de Marca
   */
  async createMarca(marca: Brand): Promise<CreateNodeResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        CREATE (m:Marca {
          id_marca: $id_marca,
          nome: $nome,
          descricao: $descricao,
          ativa: $ativa
        })
        RETURN m.id_marca as id_marca
      `;

      const result = await session.run(query, {
        id_marca: marca.id_marca,
        nome: marca.nome,
        descricao: marca.descricao || null,
        ativa: marca.ativa,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          created: true,
          message: 'Marca criada com sucesso',
          id: result.records[0].get('id_marca'),
        };
      }

      return {
        success: false,
        created: false,
        message: 'Falha ao criar marca',
      };
    } catch (error: any) {
      return {
        success: false,
        created: false,
        message: `Erro ao criar marca: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Editar o nome da marca
   */
  async editarNomeMarca(id_marca: string, novo_nome: string): Promise<UpdateNodeResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (m:Marca {id_marca: $id_marca})
        SET m.nome = $novo_nome
        RETURN m.id_marca as id_marca, m.nome as nome
      `;

      const result = await session.run(query, {
        id_marca,
        novo_nome,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          updated: true,
          message: 'Nome da marca atualizado com sucesso',
          changes: { nome: novo_nome },
        };
      }

      return {
        success: false,
        updated: false,
        message: 'Marca não encontrada',
      };
    } catch (error: any) {
      return {
        success: false,
        updated: false,
        message: `Erro ao editar nome da marca: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Deletar Marca (SOMENTE se não tiver relação com nenhum produto)
   */
  async deleteMarca(id_marca: string): Promise<DeleteNodeResult> {
    const session: Session = this.driver.session();

    try {
      // Primeiro verifica se a marca tem relações com produtos
      const checkQuery = `
        MATCH (m:Marca {id_marca: $id_marca})
        OPTIONAL MATCH (p:Produto)-[:PRODUZIDO_POR]->(m)
        RETURN m, count(p) as product_count
      `;

      const checkResult = await session.run(checkQuery, { id_marca });

      if (checkResult.records.length === 0) {
        return {
          success: false,
          deleted: false,
          message: 'Marca não encontrada',
        };
      }

      const productCount = checkResult.records[0].get('product_count');

      if (productCount > 0) {
        return {
          success: false,
          deleted: false,
          message: `Não é possível deletar a marca. Existe(m) ${productCount} produto(s) relacionado(s)`,
        };
      }

      // Se não tem produtos relacionados, pode deletar
      const deleteQuery = `
        MATCH (m:Marca {id_marca: $id_marca})
        DETACH DELETE m
        RETURN count(m) as deleted_count
      `;

      const deleteResult = await session.run(deleteQuery, { id_marca });
      const deletedCount = deleteResult.records[0].get('deleted_count');

      if (deletedCount > 0) {
        return {
          success: true,
          deleted: true,
          message: 'Marca deletada com sucesso',
        };
      }

      return {
        success: false,
        deleted: false,
        message: 'Falha ao deletar marca',
      };
    } catch (error: any) {
      return {
        success: false,
        deleted: false,
        message: `Erro ao deletar marca: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }
}
