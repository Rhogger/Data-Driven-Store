import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { Driver, Session } from 'neo4j-driver';
import {
  CustomerInput,
  CustomerRow,
  CustomerLoginResult,
  Customer,
  ViewRelation,
  PurchaseRelation,
  EvaluationRelation,
  CreateNodeResult,
  CreateRelationshipResult,
} from './CustomerInterfaces';
// import bcrypt from 'bcrypt'; // TODO: Instalar bcrypt

export class CustomerRepository {
  private pg: Pool;
  private neo4jDriver: Driver;

  constructor(fastify: FastifyInstance) {
    this.pg = fastify.pg;
    this.neo4jDriver = fastify.neo4j;
  }

  // ============================================================================
  // PostgreSQL Operations (Autenticação e dados básicos)
  // ============================================================================

  async create(customerData: CustomerInput): Promise<CustomerRow> {
    const sql = `
      INSERT INTO clientes (nome, email, cpf, telefone)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.pg.query<CustomerRow>(sql, [
      customerData.nome,
      customerData.email,
      customerData.cpf,
      customerData.telefone,
    ]);

    return result.rows[0];
  }

  async findByEmail(email: string): Promise<CustomerRow | null> {
    const result = await this.pg.query<CustomerRow>('SELECT * FROM clientes WHERE email = $1', [
      email,
    ]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<CustomerRow | null> {
    const result = await this.pg.query<CustomerRow>(
      'SELECT * FROM clientes WHERE id_cliente = $1',
      [id],
    );
    return result.rows[0] || null;
  }

  /**
   * Buscar múltiplos clientes por um array de IDs.
   * @param ids - Array de IDs de clientes.
   * @returns Uma lista de clientes.
   */
  async findByIds(ids: number[]): Promise<CustomerRow[]> {
    if (ids.length === 0) {
      return [];
    }

    const query = `
      SELECT * FROM clientes
      WHERE id_cliente = ANY($1::int[])
    `;

    const result = await this.pg.query<CustomerRow>(query, [ids]);
    return result.rows;
  }

  async validateLogin(email: string): Promise<CustomerLoginResult> {
    const customer = await this.findByEmail(email);

    if (!customer) {
      return {
        success: false,
        message: 'Cliente não encontrado',
      };
    }

    return {
      success: true,
      customer,
      message: 'Login realizado com sucesso',
    };
  }

  async existsByCpf(cpf: string): Promise<boolean> {
    const result = await this.pg.query('SELECT 1 FROM clientes WHERE cpf = $1', [cpf]);
    return result.rows.length > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.pg.query('SELECT 1 FROM clientes WHERE email = $1', [email]);
    return result.rows.length > 0;
  }

  // ============================================================================
  // Neo4j Operations (Relacionamentos e comportamentos)
  // ============================================================================

  async createCustomerNode(customer: Customer): Promise<CreateNodeResult> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        CREATE (c:Cliente {
          id_cliente: $id_cliente,
          nome: $nome,
          email: $email,
          data_nascimento: $data_nascimento,
          cidade: $cidade,
          preferencias: $preferencias
        })
        RETURN c.id_cliente as id_cliente
      `;

      const result = await session.run(query, {
        id_cliente: customer.id_cliente,
        nome: customer.nome,
        email: customer.email,
        data_nascimento: customer.data_nascimento,
        cidade: customer.cidade,
        preferencias: customer.preferencias,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          created: true,
          message: 'Cliente criado com sucesso no Neo4j',
          id: result.records[0].get('id_cliente'),
        };
      }

      return {
        success: false,
        created: false,
        message: 'Falha ao criar cliente no Neo4j',
      };
    } catch (error: any) {
      return {
        success: false,
        created: false,
        message: `Erro ao criar cliente no Neo4j: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }

  async createViewRelation(
    id_cliente: string,
    id_produto: string,
    dadosVisualizacao: ViewRelation,
  ): Promise<CreateRelationshipResult> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (c:Cliente {id_cliente: $id_cliente})
        MATCH (p:Produto {id_produto: $id_produto})
        CREATE (c)-[r:VISUALIZOU {
          data: $data,
          timestamp: $timestamp,
          navegador: $navegador,
          dispositivo: $dispositivo
        }]->(p)
        RETURN c.id_cliente as cliente_id, p.id_produto as produto_id
      `;

      const result = await session.run(query, {
        id_cliente,
        id_produto,
        data: dadosVisualizacao.data,
        timestamp: dadosVisualizacao.timestamp,
        navegador: dadosVisualizacao.navegador || null,
        dispositivo: dadosVisualizacao.dispositivo || null,
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

  async createPurchaseRelation(
    id_cliente: string,
    id_produto: string,
    dadosCompra: PurchaseRelation,
  ): Promise<CreateRelationshipResult> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (c:Cliente {id_cliente: $id_cliente})
        MATCH (p:Produto {id_produto: $id_produto})
        CREATE (c)-[r:COMPROU {
          data: $data,
          valor: $valor,
          quantidade: $quantidade,
          desconto: $desconto
        }]->(p)
        RETURN c.id_cliente as cliente_id, p.id_produto as produto_id
      `;

      const result = await session.run(query, {
        id_cliente,
        id_produto,
        data: dadosCompra.data,
        valor: dadosCompra.valor,
        quantidade: dadosCompra.quantidade,
        desconto: dadosCompra.desconto || null,
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

  async createEvaluationRelation(
    id_cliente: string,
    id_produto: string,
    dadosAvaliacao: EvaluationRelation,
  ): Promise<CreateRelationshipResult> {
    const session: Session = this.neo4jDriver.session();

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
        RETURN c.id_cliente as cliente_id, p.id_produto as produto_id
      `;

      const result = await session.run(query, {
        id_cliente,
        id_produto,
        nota: dadosAvaliacao.nota,
        comentario: dadosAvaliacao.comentario || null,
        data: dadosAvaliacao.data,
        verificada: dadosAvaliacao.verificada,
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
}
