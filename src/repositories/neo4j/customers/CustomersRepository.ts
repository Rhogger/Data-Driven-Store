import { Driver, Session } from 'neo4j-driver';
import {
  Cliente,
  CreateNodeResult,
  UpdateNodeResult,
  DeleteNodeResult,
  CreateRelationshipResult,
  RelacaoVisualizou,
  RelacaoComprou,
  RelacaoAvaliou,
} from './interfaces/ModelInterfaces';

export class ClienteRepository {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Criar um nó de Cliente
   */
  async createCliente(cliente: Cliente): Promise<CreateNodeResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        CREATE (c:Cliente {
          id_cliente: $id_cliente,
          nome: $nome,
          email: $email,
          telefone: $telefone,
          data_cadastro: $data_cadastro
        })
        RETURN c.id_cliente as id_cliente
      `;

      const result = await session.run(query, {
        id_cliente: cliente.id_cliente,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone || null,
        data_cadastro: cliente.data_cadastro,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          created: true,
          message: 'Cliente criado com sucesso',
          id: result.records[0].get('id_cliente'),
        };
      }

      return {
        success: false,
        created: false,
        message: 'Falha ao criar cliente',
      };
    } catch (error: any) {
      return {
        success: false,
        created: false,
        message: `Erro ao criar cliente: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Buscar cliente por ID
   */
  async getClienteById(id_cliente: string): Promise<Cliente | null> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (c:Cliente {id_cliente: $id_cliente})
        RETURN c.id_cliente as id_cliente,
               c.nome as nome,
               c.email as email,
               c.telefone as telefone,
               c.data_cadastro as data_cadastro
      `;

      const result = await session.run(query, { id_cliente });

      if (result.records.length > 0) {
        const record = result.records[0];
        return {
          id_cliente: record.get('id_cliente'),
          nome: record.get('nome'),
          email: record.get('email'),
          telefone: record.get('telefone'),
          data_cadastro: record.get('data_cadastro'),
        };
      }

      return null;
    } finally {
      await session.close();
    }
  }

  /**
   * Atualizar dados do cliente
   */
  async updateCliente(
    id_cliente: string,
    updates: Partial<Omit<Cliente, 'id_cliente'>>,
  ): Promise<UpdateNodeResult> {
    const session: Session = this.driver.session();

    try {
      const setClause = Object.keys(updates)
        .map((key) => `c.${key} = $${key}`)
        .join(', ');

      const query = `
        MATCH (c:Cliente {id_cliente: $id_cliente})
        SET ${setClause}
        RETURN c.id_cliente as id_cliente
      `;

      const result = await session.run(query, {
        id_cliente,
        ...updates,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          updated: true,
          message: 'Cliente atualizado com sucesso',
          changes: updates,
        };
      }

      return {
        success: false,
        updated: false,
        message: 'Cliente não encontrado',
      };
    } catch (error: any) {
      return {
        success: false,
        updated: false,
        message: `Erro ao atualizar cliente: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Criar relação VISUALIZOU de Cliente para Produto
   */
  async createVisualizacaoRelation(
    id_cliente: string,
    id_produto: string,
    relacao: RelacaoVisualizou,
  ): Promise<CreateRelationshipResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (c:Cliente {id_cliente: $id_cliente})
        MATCH (p:Produto {id_produto: $id_produto})
        CREATE (c)-[r:VISUALIZOU {
          data_visualizacao: $data_visualizacao,
          duracao_segundos: $duracao_segundos,
          origem: $origem
        }]->(p)
        RETURN r
      `;

      const result = await session.run(query, {
        id_cliente,
        id_produto,
        data_visualizacao: relacao.data_visualizacao,
        duracao_segundos: relacao.duracao_segundos || null,
        origem: relacao.origem || null,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          relationship_created: true,
          message: 'Relação VISUALIZOU criada com sucesso',
          from_node: id_cliente,
          to_node: id_produto,
          relationship_type: 'VISUALIZOU',
        };
      }

      return {
        success: false,
        relationship_created: false,
        message: 'Falha ao criar relação VISUALIZOU',
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'VISUALIZOU',
      };
    } catch (error: any) {
      return {
        success: false,
        relationship_created: false,
        message: `Erro ao criar relação VISUALIZOU: ${error.message}`,
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'VISUALIZOU',
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Criar relação COMPROU de Cliente para Produto
   */
  async createCompraRelation(
    id_cliente: string,
    id_produto: string,
    relacao: RelacaoComprou,
  ): Promise<CreateRelationshipResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (c:Cliente {id_cliente: $id_cliente})
        MATCH (p:Produto {id_produto: $id_produto})
        CREATE (c)-[r:COMPROU {
          data_pedido: $data_pedido,
          quantidade: $quantidade,
          preco_unitario: $preco_unitario,
          desconto: $desconto,
          id_pedido: $id_pedido
        }]->(p)
        RETURN r
      `;

      const result = await session.run(query, {
        id_cliente,
        id_produto,
        data_pedido: relacao.data_pedido,
        quantidade: relacao.quantidade,
        preco_unitario: relacao.preco_unitario,
        desconto: relacao.desconto || null,
        id_pedido: relacao.id_pedido,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          relationship_created: true,
          message: 'Relação COMPROU criada com sucesso',
          from_node: id_cliente,
          to_node: id_produto,
          relationship_type: 'COMPROU',
        };
      }

      return {
        success: false,
        relationship_created: false,
        message: 'Falha ao criar relação COMPROU',
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'COMPROU',
      };
    } catch (error: any) {
      return {
        success: false,
        relationship_created: false,
        message: `Erro ao criar relação COMPROU: ${error.message}`,
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'COMPROU',
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Criar relação AVALIOU de Cliente para Produto
   */
  async createAvaliacaoRelation(
    id_cliente: string,
    id_produto: string,
    relacao: RelacaoAvaliou,
  ): Promise<CreateRelationshipResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (c:Cliente {id_cliente: $id_cliente})
        MATCH (p:Produto {id_produto: $id_produto})
        CREATE (c)-[r:AVALIOU {
          nota: $nota,
          comentario: $comentario,
          data: $data,
          verificada: $verificada
        }]->(p)
        RETURN r
      `;

      const result = await session.run(query, {
        id_cliente,
        id_produto,
        nota: relacao.nota,
        comentario: relacao.comentario || null,
        data: relacao.data,
        verificada: relacao.verificada || false,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          relationship_created: true,
          message: 'Relação AVALIOU criada com sucesso',
          from_node: id_cliente,
          to_node: id_produto,
          relationship_type: 'AVALIOU',
        };
      }

      return {
        success: false,
        relationship_created: false,
        message: 'Falha ao criar relação AVALIOU',
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'AVALIOU',
      };
    } catch (error: any) {
      return {
        success: false,
        relationship_created: false,
        message: `Erro ao criar relação AVALIOU: ${error.message}`,
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'AVALIOU',
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Deletar cliente e todas suas relações
   */
  async deleteCliente(id_cliente: string): Promise<DeleteNodeResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (c:Cliente {id_cliente: $id_cliente})
        OPTIONAL MATCH (c)-[r]-()
        WITH c, count(r) as relationships_count
        DETACH DELETE c
        RETURN relationships_count
      `;

      const result = await session.run(query, { id_cliente });

      if (result.records.length > 0) {
        return {
          success: true,
          deleted: true,
          message: 'Cliente deletado com sucesso',
          relationships_deleted: result.records[0].get('relationships_count').toNumber(),
        };
      }

      return {
        success: false,
        deleted: false,
        message: 'Cliente não encontrado',
      };
    } catch (error: any) {
      return {
        success: false,
        deleted: false,
        message: `Erro ao deletar cliente: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }
}
