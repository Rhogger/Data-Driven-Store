export const healthCheckSchemas = {
  check: () => ({
    tags: ['Health Check'],
    summary: 'Verificar status da aplicação',
    description: 'Retorna o status de funcionamento da aplicação e conexões com bancos de dados',
    response: {
      200: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Status da aplicação',
            enum: ['ok'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp da verificação',
          },
          mongodb: {
            type: 'string',
            description: 'Status da conexão com MongoDB',
            enum: ['connected', 'disconnected'],
          },
          postgres: {
            type: 'string',
            description: 'Status da conexão com PostgreSQL',
            enum: ['connected', 'disconnected'],
          },
          redis: {
            type: 'string',
            description: 'Status da conexão com Redis',
            enum: ['connected', 'disconnected'],
          },
        },
        required: ['status', 'timestamp', 'mongodb', 'postgres', 'redis'],
      },
      500: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
        },
        required: ['success', 'error'],
      },
    },
  }),
};
