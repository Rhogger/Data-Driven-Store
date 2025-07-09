export const productRankingSchemas = {
  getRanking: () => ({
    summary: 'Buscar ranking dos produtos mais vistos',
    description: 'Retorna o ranking dos produtos mais visualizados, com limite configurável.',
    tags: ['Products'],
    security: [{ bearerAuth: [] }],
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
        description: 'Ranking retornado com sucesso',
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
  }),

  incrementView: () => ({
    summary: 'Incrementar visualização de produto',
    description: 'Incrementa o contador de visualizações de um produto.',
    tags: ['Products'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id_produto'],
      properties: {
        id_produto: { type: 'string', description: 'ID do produto' },
      },
    },
    response: {
      200: {
        description: 'Visualização incrementada com sucesso',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id_produto: { type: 'string' },
              total_visualizacoes: { type: 'integer' },
            },
            required: ['id_produto', 'total_visualizacoes'],
          },
        },
        required: ['success', 'data'],
      },
      404: {
        description: 'Produto não encontrado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    },
  }),
};
