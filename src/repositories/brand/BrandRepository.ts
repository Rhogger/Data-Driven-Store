import { FastifyInstance } from 'fastify';
import { Driver, Session } from 'neo4j-driver';
import { Brand, CreateNodeResult, UpdateNodeResult, DeleteNodeResult } from './BrandInterfaces';

export class BrandRepository {
  private neo4jDriver: Driver;

  constructor(fastify: FastifyInstance) {
    this.neo4jDriver = fastify.neo4j;
  }

  async createBrand(brand: Brand): Promise<CreateNodeResult> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        CREATE (m:Marca {
          id_marca: $id_marca,
          nome: $nome,
          descricao: $descricao,
          pais_origem: $pais_origem,
          ativa: $ativa
        })
        RETURN m.id_marca as id_marca
      `;

      const result = await session.run(query, {
        id_marca: brand.id_marca,
        nome: brand.nome,
        descricao: brand.descricao || null,
        pais_origem: brand.pais_origem || null,
        ativa: brand.ativa,
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

  async updateBrand(id_marca: string, updateData: Partial<Brand>): Promise<UpdateNodeResult> {
    const session: Session = this.neo4jDriver.session();

    try {
      const setClause = Object.keys(updateData)
        .map((key) => `m.${key} = $${key}`)
        .join(', ');

      const query = `
        MATCH (m:Marca {id_marca: $id_marca})
        SET ${setClause}
        RETURN m.id_marca as id_marca
      `;

      const params = { id_marca, ...updateData };
      const result = await session.run(query, params);

      if (result.records.length > 0) {
        return {
          success: true,
          updated: true,
          message: 'Marca atualizada com sucesso',
        };
      }

      return {
        success: false,
        updated: false,
        message: 'Marca não encontrada para atualização',
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
   * Deletar Marca (SOMENTE se não tiver relações com nenhum produto)
   */
  async deleteBrand(id_marca: string): Promise<DeleteNodeResult> {
    const session: Session = this.neo4jDriver.session();

    try {
      // Verificar se há produtos relacionados a esta marca
      const checkQuery = `
        MATCH (m:Marca {id_marca: $id_marca})
        OPTIONAL MATCH (m)<-[:PRODUZIDO_POR]-(p:Produto)
        RETURN count(p) as produto_count
      `;

      const checkResult = await session.run(checkQuery, { id_marca });

      if (checkResult.records.length > 0) {
        const produtoCount = checkResult.records[0].get('produto_count').toNumber();

        if (produtoCount > 0) {
          return {
            success: false,
            deleted: false,
            message: `Marca não pode ser deletada pois possui ${produtoCount} produto(s) relacionado(s)`,
          };
        }
      }

      // Se não há produtos relacionados, deletar a marca
      const deleteQuery = `
        MATCH (m:Marca {id_marca: $id_marca})
        DETACH DELETE m
        RETURN count(m) as deleted_count
      `;

      const deleteResult = await session.run(deleteQuery, { id_marca });

      if (deleteResult.records.length > 0) {
        const deletedCount = deleteResult.records[0].get('deleted_count').toNumber();

        if (deletedCount > 0) {
          return {
            success: true,
            deleted: true,
            message: 'Marca deletada com sucesso',
          };
        }
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

  async findById(id_marca: string): Promise<Brand | null> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (m:Marca {id_marca: $id_marca})
        RETURN m
      `;

      const result = await session.run(query, { id_marca });

      if (result.records.length > 0) {
        const marcaNode = result.records[0].get('m').properties;
        return {
          id_marca: marcaNode.id_marca,
          nome: marcaNode.nome,
          descricao: marcaNode.descricao,
          pais_origem: marcaNode.pais_origem,
          ativa: marcaNode.ativa,
        };
      }

      return null;
    } catch {
      return null;
    } finally {
      await session.close();
    }
  }

  async findAll(limit: number = 50): Promise<Brand[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (m:Marca)
        RETURN m
        ORDER BY m.nome
        LIMIT $limit
      `;

      const result = await session.run(query, { limit });

      return result.records.map((record) => {
        const marcaNode = record.get('m').properties;
        return {
          id_marca: marcaNode.id_marca,
          nome: marcaNode.nome,
          descricao: marcaNode.descricao,
          pais_origem: marcaNode.pais_origem,
          ativa: marcaNode.ativa,
        };
      });
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Buscar marcas mais populares (com mais produtos vendidos)
   */
  async getMostPopularBrands(limit: number = 10): Promise<any[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (m:Marca)<-[:PRODUZIDO_POR]-(p:Produto)<-[comprou:COMPROU]-(cliente:Cliente)
        RETURN m.id_marca as id_marca,
               m.nome as nome,
               count(comprou) as total_vendas,
               sum(comprou.valor) as valor_total
        ORDER BY total_vendas DESC
        LIMIT $limit
      `;

      const result = await session.run(query, { limit });

      return result.records.map((record) => ({
        id_marca: record.get('id_marca'),
        nome: record.get('nome'),
        total_vendas: record.get('total_vendas').toNumber(),
        valor_total: record.get('valor_total').toNumber(),
      }));
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }
}
