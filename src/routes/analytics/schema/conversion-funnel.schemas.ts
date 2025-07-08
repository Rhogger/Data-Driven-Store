export const conversionFunnelSchemas = {
  getConversionFunnelStats: () => ({
    tags: ['Reports'],
    summary: 'Estatísticas gerais do funil de conversão',
    description:
      'Retorna estatísticas agregadas do funil de conversão (visualizou -> adicionou ao carrinho -> comprou). Analisa efetividade das conversões.',
    response: {
      200: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            default: true,
          },
          data: {
            type: 'object',
            properties: {
              total_usuarios: {
                type: 'integer',
                description: 'Total de usuários únicos no funil',
              },
              visualizaram: {
                type: 'integer',
                description: 'Total de visualizações',
              },
              adicionaram_carrinho: {
                type: 'integer',
                description: 'Total que adicionaram ao carrinho',
              },
              compraram: {
                type: 'integer',
                description: 'Total que compraram',
              },
              taxa_visualizacao_para_carrinho: {
                type: 'number',
                description: 'Taxa de conversão de visualização para carrinho (%)',
              },
              taxa_carrinho_para_compra: {
                type: 'number',
                description: 'Taxa de conversão de carrinho para compra (%)',
              },
              taxa_conversao_total: {
                type: 'number',
                description: 'Taxa de conversão total de visualização para compra (%)',
              },
            },
            required: [
              'total_usuarios',
              'visualizaram',
              'adicionaram_carrinho',
              'compraram',
              'taxa_visualizacao_para_carrinho',
              'taxa_carrinho_para_compra',
              'taxa_conversao_total',
            ],
          },
        },
        required: ['success', 'data'],
      },
    },
  }),

  getConversionFunnelByProduct: () => ({
    tags: ['Reports'],
    summary: 'Funil de conversão por produto específico',
    description:
      'Retorna estatísticas do funil de conversão para um produto específico. Permite análise de performance individual de produtos.',
    params: {
      type: 'object',
      properties: {
        produtoId: {
          type: 'string',
          description: 'ID do produto',
        },
      },
      required: ['produtoId'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            default: true,
          },
          data: {
            type: 'object',
            properties: {
              id_produto: {
                type: 'string',
                description: 'ID do produto analisado',
              },
              total_usuarios: {
                type: 'integer',
                description: 'Total de usuários únicos que interagiram com o produto',
              },
              visualizaram: {
                type: 'integer',
                description: 'Total de visualizações do produto',
              },
              adicionaram_carrinho: {
                type: 'integer',
                description: 'Total que adicionaram o produto ao carrinho',
              },
              compraram: {
                type: 'integer',
                description: 'Total que compraram o produto',
              },
              taxa_visualizacao_para_carrinho: {
                type: 'number',
                description: 'Taxa de conversão de visualização para carrinho (%)',
              },
              taxa_carrinho_para_compra: {
                type: 'number',
                description: 'Taxa de conversão de carrinho para compra (%)',
              },
              taxa_conversao_total: {
                type: 'number',
                description: 'Taxa de conversão total de visualização para compra (%)',
              },
            },
            required: [
              'id_produto',
              'total_usuarios',
              'visualizaram',
              'adicionaram_carrinho',
              'compraram',
              'taxa_visualizacao_para_carrinho',
              'taxa_carrinho_para_compra',
              'taxa_conversao_total',
            ],
          },
        },
        required: ['success', 'data'],
      },
    },
  }),
};
