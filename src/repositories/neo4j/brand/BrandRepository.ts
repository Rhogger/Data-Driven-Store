import { Driver, Session } from 'neo4j-driver';
import {
  Marca,
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
   * Criar um nó de Marca
   */
  async createMarca(marca: Marca): Promise<CreateNodeResult> {
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
   * Buscar marca por ID
   */
  async getMarcaById(id_marca: string): Promise<Marca | null> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (m:Marca {id_marca: $id_marca})
        RETURN m.id_marca as id_marca,
               m.nome as nome,
               m.descricao as descricao,
               m.ativa as ativa
      `;

      const result = await session.run(query, { id_marca });

      if (result.records.length > 0) {
        const record = result.records[0];
        return {
          id_marca: record.get('id_marca'),
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
   * Listar todas as marcas
   */
  async listMarcas(ativas_apenas: boolean = false): Promise<Marca[]> {
    const session: Session = this.driver.session();

    try {
      const whereClause = ativas_apenas ? 'WHERE m.ativa = true' : '';
      const query = `
        MATCH (m:Marca)
        ${whereClause}
        RETURN m.id_marca as id_marca,
               m.nome as nome,
               m.descricao as descricao,
               m.ativa as ativa
        ORDER BY m.nome ASC
      `;

      const result = await session.run(query);

      return result.records.map((record) => ({
        id_marca: record.get('id_marca'),
        nome: record.get('nome'),
        descricao: record.get('descricao'),
        ativa: record.get('ativa'),
      }));
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
   * Atualizar marca
   */
  async updateMarca(
    id_marca: string,
    updates: Partial<Omit<Marca, 'id_marca'>>,
  ): Promise<UpdateNodeResult> {
    const session: Session = this.driver.session();

    try {
      const setClause = Object.keys(updates)
        .map((key) => `m.${key} = $${key}`)
        .join(', ');

      const query = `
        MATCH (m:Marca {id_marca: $id_marca})
        SET ${setClause}
        RETURN m.id_marca as id_marca
      `;

      const result = await session.run(query, {
        id_marca,
        ...updates,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          updated: true,
          message: 'Marca atualizada com sucesso',
          changes: updates,
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
        message: `Erro ao atualizar marca: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Deletar marca (apenas se não houver produtos associados)
   */
  async deleteMarca(id_marca: string, force: boolean = false): Promise<DeleteNodeResult> {
    const session: Session = this.driver.session();

    try {
      if (!force) {
        // Verifica se há produtos associados
        const checkQuery = `
          MATCH (m:Marca {id_marca: $id_marca})
          OPTIONAL MATCH (p:Produto)-[:PRODUZIDO_POR]->(m)
          RETURN count(p) as produtos_count
        `;

        const checkResult = await session.run(checkQuery, { id_marca });
        const produtosCount = checkResult.records[0]?.get('produtos_count').toNumber() || 0;

        if (produtosCount > 0) {
          return {
            success: false,
            deleted: false,
            message: `Não é possível deletar marca. Há ${produtosCount} produto(s) associado(s).`,
          };
        }
      }

      const query = `
        MATCH (m:Marca {id_marca: $id_marca})
        OPTIONAL MATCH (m)-[r]-()
        WITH m, count(r) as relationships_count
        DETACH DELETE m
        RETURN relationships_count
      `;

      const result = await session.run(query, { id_marca });

      if (result.records.length > 0) {
        return {
          success: true,
          deleted: true,
          message: 'Marca deletada com sucesso',
          relationships_deleted: result.records[0].get('relationships_count').toNumber(),
        };
      }

      return {
        success: false,
        deleted: false,
        message: 'Marca não encontrada',
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
