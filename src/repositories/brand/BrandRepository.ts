import { FastifyInstance } from 'fastify';
import { Driver, Session, Transaction } from 'neo4j-driver';

export class BrandRepository {
  private neo4jDriver: Driver;

  constructor(fastify: FastifyInstance) {
    this.neo4jDriver = fastify.neo4j;
  }

  async createBrand(nome: string, tx?: Session | Transaction): Promise<boolean> {
    const session = tx || this.neo4jDriver.session();
    try {
      const query = 'CREATE (m:Marca {nome: $nome}) RETURN m';
      const result = await session.run(query, { nome });
      return result.records.length > 0;
    } finally {
      if (!tx) await (session as Session).close();
    }
  }

  async findByName(nome: string, tx?: Session | Transaction): Promise<{ nome: string } | null> {
    const session = tx || this.neo4jDriver.session();
    try {
      const query = 'MATCH (m:Marca {nome: $nome}) RETURN m';
      const result = await session.run(query, { nome });
      if (result.records.length > 0) {
        const marcaNode = result.records[0].get('m').properties;
        return { nome: marcaNode.nome };
      }
      return null;
    } finally {
      if (!tx) await (session as Session).close();
    }
  }
}
