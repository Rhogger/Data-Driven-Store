import { Driver, Session } from 'neo4j-driver';
import {
  Customer,
  CreateNodeResult,
  CreateRelationshipResult,
  ViewRelation,
  PurchaseRelation,
  EvaluationRelation,
} from '../interfaces/ModelInterfaces';

export class ClienteRepository {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Criar um nó de Cliente
   */
  async createCliente(cliente: Customer): Promise<CreateNodeResult> {
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
   * Criar a relação VISUALIZOU de Cliente para Produto
   */
  async createVisualizacaoRelation(
    id_cliente: string,
    id_produto: string,
    dadosVisualizacao: ViewRelation,
  ): Promise<CreateRelationshipResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (c:Cliente {id_cliente: $id_cliente})
        MATCH (p:Produto {id_produto: $id_produto})
        MERGE (c)-[r:VISUALIZOU]->(p)
        ON CREATE SET
          r.data_visualizacao = $data_visualizacao,
          r.duracao_segundos = $duracao_segundos,
          r.origem = $origem
        ON MATCH SET
          r.data_visualizacao = $data_visualizacao,
          r.duracao_segundos = $duracao_segundos,
          r.origem = $origem
        RETURN c.id_cliente as cliente_id, p.id_produto as produto_id
      `;

      const result = await session.run(query, {
        id_cliente,
        id_produto,
        data_visualizacao: dadosVisualizacao.data_visualizacao,
        duracao_segundos: dadosVisualizacao.duracao_segundos || null,
        origem: dadosVisualizacao.origem || null,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          relationship_created: true,
          message: 'Relação de visualização criada com sucesso',
          from_node: id_cliente,
          to_node: id_produto,
          relationship_type: 'VISUALIZOU',
        };
      }

      return {
        success: false,
        relationship_created: false,
        message: 'Falha ao criar relação de visualização - Cliente ou Produto não encontrado',
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'VISUALIZOU',
      };
    } catch (error: any) {
      return {
        success: false,
        relationship_created: false,
        message: `Erro ao criar relação de visualização: ${error.message}`,
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'VISUALIZOU',
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Criar a relação COMPROU de Cliente para Produto
   */
  async createCompraRelation(
    id_cliente: string,
    id_produto: string,
    dadosCompra: PurchaseRelation,
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
        RETURN c.id_cliente as cliente_id, p.id_produto as produto_id
      `;

      const result = await session.run(query, {
        id_cliente,
        id_produto,
        data_pedido: dadosCompra.data_pedido,
        quantidade: dadosCompra.quantidade,
        preco_unitario: dadosCompra.preco_unitario,
        desconto: dadosCompra.desconto || null,
        id_pedido: dadosCompra.id_pedido,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          relationship_created: true,
          message: 'Relação de compra criada com sucesso',
          from_node: id_cliente,
          to_node: id_produto,
          relationship_type: 'COMPROU',
        };
      }

      return {
        success: false,
        relationship_created: false,
        message: 'Falha ao criar relação de compra - Cliente ou Produto não encontrado',
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'COMPROU',
      };
    } catch (error: any) {
      return {
        success: false,
        relationship_created: false,
        message: `Erro ao criar relação de compra: ${error.message}`,
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'COMPROU',
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Criar a relação AVALIOU de Cliente para Produto
   */
  async createAvaliacaoRelation(
    id_cliente: string,
    id_produto: string,
    dadosAvaliacao: EvaluationRelation,
  ): Promise<CreateRelationshipResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (c:Cliente {id_cliente: $id_cliente})
        MATCH (p:Produto {id_produto: $id_produto})
        MERGE (c)-[r:AVALIOU]->(p)
        ON CREATE SET
          r.nota = $nota,
          r.comentario = $comentario,
          r.data = $data,
          r.verificada = $verificada
        ON MATCH SET
          r.nota = $nota,
          r.comentario = $comentario,
          r.data = $data,
          r.verificada = $verificada
        RETURN c.id_cliente as cliente_id, p.id_produto as produto_id
      `;

      const result = await session.run(query, {
        id_cliente,
        id_produto,
        nota: dadosAvaliacao.nota,
        comentario: dadosAvaliacao.comentario || null,
        data: dadosAvaliacao.data,
        verificada: dadosAvaliacao.verificada || false,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          relationship_created: true,
          message: 'Relação de avaliação criada com sucesso',
          from_node: id_cliente,
          to_node: id_produto,
          relationship_type: 'AVALIOU',
        };
      }

      return {
        success: false,
        relationship_created: false,
        message: 'Falha ao criar relação de avaliação - Cliente ou Produto não encontrado',
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'AVALIOU',
      };
    } catch (error: any) {
      return {
        success: false,
        relationship_created: false,
        message: `Erro ao criar relação de avaliação: ${error.message}`,
        from_node: id_cliente,
        to_node: id_produto,
        relationship_type: 'AVALIOU',
      };
    } finally {
      await session.close();
    }
  }
}
