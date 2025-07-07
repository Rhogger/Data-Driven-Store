export const productRankingSchemas = {
  getRanking: {
    description: 'Buscar ranking dos produtos mais vistos',
    tags: ['Products'],
    querystring: {
      type: 'object',
      properties: {
        limit: {
          type: 'string',
          description: 'Limite de produtos no ranking (máximo 100)',
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              ranking: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id_produto: { type: 'string' },
                    visualizacoes: { type: 'number' },
                  },
                },
              },
              total_produtos: { type: 'number' },
              limite_aplicado: { type: 'number' },
            },
          },
        },
      },
    },
  },

  incrementView: {
    description: 'Incrementar visualização de produto',
    tags: ['Products'],
    params: {
      type: 'object',
      required: ['id_produto'],
      properties: {
        id_produto: {
          type: 'string',
          description: 'ID do produto',
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id_produto: { type: 'string' },
              total_visualizacoes: { type: 'number' },
              posicao_ranking: { type: 'number' },
            },
          },
        },
      },
    },
  },
};
