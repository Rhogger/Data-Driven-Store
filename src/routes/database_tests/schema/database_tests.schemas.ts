export const databaseTestsSchemas = {
  mongodbPing: () => ({
    tags: ['Database Tests'],
    summary: 'Testa conexão com MongoDB',
    description: 'Endpoint para verificar se a conexão com MongoDB está funcionando',
    response: {
      200: {
        type: 'object',
        properties: {
          ping: { type: 'string', example: 'pong' },
          status: { type: 'string', example: 'ok' },
        },
        required: ['ping', 'status'],
      },
      500: {
        type: 'object',
        properties: {
          ping: { type: 'string', example: 'error' },
          error: { type: 'string' },
        },
        required: ['ping', 'error'],
      },
    },
  }),

  redisPing: () => ({
    tags: ['Database Tests'],
    summary: 'Testa conexão com Redis',
    description: 'Endpoint para verificar se a conexão com Redis está funcionando',
    response: {
      200: {
        type: 'object',
        properties: {
          ping: { type: 'string', example: 'PONG' },
          status: { type: 'string', example: 'ok' },
        },
        required: ['ping', 'status'],
      },
      500: {
        type: 'object',
        properties: {
          ping: { type: 'string', example: 'error' },
          error: { type: 'string' },
        },
        required: ['ping', 'error'],
      },
    },
  }),

  postgresPing: () => ({
    tags: ['Database Tests'],
    summary: 'Testa conexão com PostgreSQL',
    description: 'Endpoint para verificar se a conexão com PostgreSQL está funcionando',
    response: {
      200: {
        type: 'object',
        properties: {
          ping: { type: 'string', example: 'pong' },
          status: { type: 'string', example: 'ok' },
        },
        required: ['ping', 'status'],
      },
      500: {
        type: 'object',
        properties: {
          ping: { type: 'string', example: 'error' },
          error: { type: 'string' },
        },
        required: ['ping', 'error'],
      },
    },
  }),

  neo4jPing: () => ({
    tags: ['Database Tests'],
    summary: 'Testa conexão com Neo4j',
    description: 'Endpoint para verificar se a conexão com Neo4j está funcionando',
    response: {
      200: {
        type: 'object',
        properties: {
          ping: { type: 'string', example: 'pong' },
          status: { type: 'string', example: 'ok' },
        },
        required: ['ping', 'status'],
      },
      500: {
        type: 'object',
        properties: {
          ping: { type: 'string', example: 'error' },
          error: { type: 'string' },
        },
        required: ['ping', 'error'],
      },
    },
  }),

  cassandraPing: () => ({
    tags: ['Database Tests'],
    summary: 'Testa conexão com Cassandra',
    description: 'Endpoint para verificar se a conexão com Cassandra está funcionando',
    response: {
      200: {
        type: 'object',
        properties: {
          ping: { type: 'string', example: 'pong' },
          status: { type: 'string', example: 'ok' },
        },
        required: ['ping', 'status'],
      },
      500: {
        type: 'object',
        properties: {
          ping: { type: 'string', example: 'error' },
          error: { type: 'string' },
        },
        required: ['ping', 'error'],
      },
    },
  }),
};
