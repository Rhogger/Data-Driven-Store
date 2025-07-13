export const stateSchemas = {
  list: () => ({
    tags: ['Addresses'],
    summary: 'Listar todos os estados',
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
                id_estado: { type: 'integer' },
                nome: { type: 'string' },
                uf: { type: 'string' },
              },
              required: ['id_estado', 'nome', 'uf'],
            },
          },
        },
      },
    },
  }),
};
