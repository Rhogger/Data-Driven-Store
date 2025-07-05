import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

interface CreateNodeRequest {
  Body: {
    label: string;
    properties: Record<string, any>;
  };
}

interface FindNodesRequest {
  Params: {
    label: string;
  };
}

interface DeleteNodeRequest {
  Params: {
    id: string;
  };
}

async function createNodeHandler(
  this: FastifyInstance,
  request: FastifyRequest<CreateNodeRequest>,
  reply: FastifyReply,
) {
  const session = this.neo4j.session();

  try {
    const { label, properties } = request.body;

    // Criar query dinâmica
    const propKeys = Object.keys(properties);
    const propParams = propKeys.map((key) => `${key}: $${key}`).join(', ');

    const query = `CREATE (n:${label} {${propParams}}) RETURN n`;

    const result = await session.run(query, properties);
    const createdNode = result.records[0]?.get('n');

    reply.code(201).send({
      success: true,
      message: 'Nó criado com sucesso',
      node: {
        id: createdNode.identity.toString(),
        labels: createdNode.labels,
        properties: createdNode.properties,
      },
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro ao criar nó no Neo4j',
    });
  } finally {
    await session.close();
  }
}

async function findNodesHandler(
  this: FastifyInstance,
  request: FastifyRequest<FindNodesRequest>,
  reply: FastifyReply,
) {
  const session = this.neo4j.session();

  try {
    const { label } = request.params;

    const query = `MATCH (n:${label}) RETURN n LIMIT 100`;
    const result = await session.run(query);

    const nodes = result.records.map((record) => {
      const node = record.get('n');
      return {
        id: node.identity.toString(),
        labels: node.labels,
        properties: node.properties,
      };
    });

    reply.code(200).send({
      success: true,
      count: nodes.length,
      nodes,
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro ao buscar nós no Neo4j',
    });
  } finally {
    await session.close();
  }
}

async function deleteNodeHandler(
  this: FastifyInstance,
  request: FastifyRequest<DeleteNodeRequest>,
  reply: FastifyReply,
) {
  const session = this.neo4j.session();

  try {
    const { id } = request.params;

    const query = 'MATCH (n) WHERE ID(n) = $id DELETE n RETURN count(n) as deleted';
    const result = await session.run(query, { id: parseInt(id) });

    const deletedCount = result.records[0]?.get('deleted').toNumber() || 0;

    if (deletedCount > 0) {
      reply.code(200).send({
        success: true,
        message: 'Nó deletado com sucesso',
      });
    } else {
      reply.code(404).send({
        success: false,
        error: 'Nó não encontrado',
      });
    }
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro ao deletar nó no Neo4j',
    });
  } finally {
    await session.close();
  }
}

async function getDatabaseInfoHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const session = this.neo4j.session();

  try {
    // Obter informações da versão
    const versionResult = await session.run('CALL dbms.components()');
    const versionInfo = versionResult.records.map((record) => ({
      name: record.get('name'),
      versions: record.get('versions'),
      edition: record.get('edition'),
    }));

    // Contar nós e relacionamentos
    const countResult = await session.run(`
      MATCH (n)
      OPTIONAL MATCH ()-[r]-()
      RETURN count(DISTINCT n) as nodes, count(DISTINCT r)/2 as relationships
    `);

    const counts = countResult.records[0];

    reply.code(200).send({
      success: true,
      database_info: {
        version: versionInfo,
        statistics: {
          nodes: counts.get('nodes').toNumber(),
          relationships: counts.get('relationships').toNumber(),
        },
      },
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro ao obter informações do Neo4j',
    });
  } finally {
    await session.close();
  }
}

async function initStructureHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { GraphAnalyticsRepository } = await import(
      '../../repositories/neo4j/GraphAnalyticsRepository.js'
    );
    const graphRepo = new GraphAnalyticsRepository(this);

    const result = await graphRepo.inicializarEstrutura();

    reply.code(200).send({
      success: true,
      message: result,
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro ao inicializar estrutura do Neo4j',
    });
  }
}

async function clearDataHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { GraphAnalyticsRepository } = await import(
      '../../repositories/neo4j/GraphAnalyticsRepository.js'
    );
    const graphRepo = new GraphAnalyticsRepository(this);

    const result = await graphRepo.limparDados();

    reply.code(200).send({
      success: true,
      message: result,
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro ao limpar dados do Neo4j',
    });
  }
}

export default async function neo4jTestRoutes(fastify: FastifyInstance) {
  fastify.post('/neo4j/nodes', {
    schema: {
      tags: ['Neo4j Test'],
      summary: 'Criar um novo nó',
      body: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
            description: 'Label do nó (ex: Person, Product, etc.)',
          },
          properties: {
            type: 'object',
            description: 'Propriedades do nó',
          },
        },
        required: ['label', 'properties'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            node: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                labels: { type: 'array', items: { type: 'string' } },
                properties: { type: 'object' },
              },
            },
          },
        },
      },
    },
    handler: createNodeHandler,
  });

  fastify.get('/neo4j/nodes/:label', {
    schema: {
      tags: ['Neo4j Test'],
      summary: 'Buscar nós por label',
      params: {
        type: 'object',
        properties: {
          label: { type: 'string' },
        },
        required: ['label'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            count: { type: 'integer' },
            nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  labels: { type: 'array', items: { type: 'string' } },
                  properties: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    handler: findNodesHandler,
  });

  fastify.delete('/neo4j/nodes/:id', {
    schema: {
      tags: ['Neo4j Test'],
      summary: 'Deletar um nó por ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
      },
    },
    handler: deleteNodeHandler,
  });

  fastify.get('/neo4j/database-info', {
    schema: {
      tags: ['Neo4j Test'],
      summary: 'Obter informações do banco Neo4j',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            database_info: {
              type: 'object',
              properties: {
                version: { type: 'array' },
                statistics: {
                  type: 'object',
                  properties: {
                    nodes: { type: 'integer' },
                    relationships: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: getDatabaseInfoHandler,
  });

  fastify.post('/neo4j/init-structure', {
    schema: {
      tags: ['Neo4j Admin'],
      summary: 'Inicializar estrutura do banco Neo4j',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: initStructureHandler,
  });

  fastify.post('/neo4j/clear-data', {
    schema: {
      tags: ['Neo4j Admin'],
      summary: 'Limpar dados do banco Neo4j',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: clearDataHandler,
  });
}
