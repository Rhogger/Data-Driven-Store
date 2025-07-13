export const citySchemas = {
  list: () => ({
    tags: ['Addresses'],
    summary: 'Listar todas as cidades',
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
                id_cidade: { type: 'integer' },
                nome: { type: 'string' },
                id_estado: { type: 'integer' },
              },
              required: ['id_cidade', 'nome', 'id_estado'],
            },
          },
        },
      },
    },
  }),
};
