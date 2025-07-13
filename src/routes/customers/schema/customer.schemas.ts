export const customerSchemas = {
  list: () => ({
    tags: ['Customers'],
    summary: 'Listar todos os clientes',
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id_cliente: { type: 'integer' },
                nome: { type: 'string' },
                email: { type: 'string' },
                cpf: { type: 'string' },
                telefone: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
              required: [
                'id_cliente',
                'nome',
                'email',
                'cpf',
                'telefone',
                'created_at',
                'updated_at',
              ],
            },
          },
        },
      },
    },
  }),
  getById: () => ({
    tags: ['Customers'],
    summary: 'Buscar cliente por ID',
    params: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
      },
      required: ['id'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id_cliente: { type: 'integer' },
              nome: { type: 'string' },
              email: { type: 'string' },
              cpf: { type: 'string' },
              telefone: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
            required: [
              'id_cliente',
              'nome',
              'email',
              'cpf',
              'telefone',
              'created_at',
              'updated_at',
            ],
          },
        },
      },
      404: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    },
  }),
};
