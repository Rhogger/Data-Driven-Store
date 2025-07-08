export const cassandraAnalyticsSchemas = {
  // 1. Funil de conversão
  getConversionFunnel: () => ({
    tags: ['Reports'],
    summary: 'Consulta de funil de conversão',
    description:
      'Consulta estatísticas do funil de conversão (visualizou -> adicionou ao carrinho -> comprou). Analisa o comportamento dos usuários através do funil de vendas.',
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: {
            type: 'object',
            properties: {
              total_usuarios: { type: 'integer', description: 'Total de usuários únicos' },
              usuarios_visualizaram: {
                type: 'integer',
                description: 'Usuários que visualizaram produtos',
              },
              usuarios_adicionaram_carrinho: {
                type: 'integer',
                description: 'Usuários que adicionaram ao carrinho',
              },
              usuarios_compraram: { type: 'integer', description: 'Usuários que compraram' },
              taxa_conversao_carrinho: {
                type: 'number',
                description: 'Taxa de conversão para carrinho (%)',
              },
              taxa_conversao_compra: {
                type: 'number',
                description: 'Taxa de conversão para compra (%)',
              },
            },
          },
        },
      },
    },
  }),

  // 2. Visualizações por dia na última semana
  getWeeklyViews: () => ({
    tags: ['Reports'],
    summary: 'Visualizações por dia na última semana',
    description:
      'Calcula o número de eventos de "visualização" por dia nos últimos 7 dias. Permite análise de tendências de engajamento.',
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: {
            type: 'object',
            properties: {
              periodo: { type: 'string', description: 'Período analisado' },
              total_visualizacoes: {
                type: 'integer',
                description: 'Total de visualizações no período',
              },
              visualizacoes_por_dia: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    data: { type: 'string', format: 'date' },
                    total_visualizacoes: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  // 3. Top 10 termos de busca
  getTopSearchTerms: () => ({
    tags: ['Reports'],
    summary: 'Top 10 termos de busca mais utilizados',
    description:
      'Identifica os 10 termos de busca mais utilizados. Ajuda a entender o comportamento de busca dos usuários.',
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: {
            type: 'object',
            properties: {
              total_termos_analisados: { type: 'integer' },
              termos_mais_buscados: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    termo_busca: { type: 'string' },
                    total_buscas: { type: 'integer' },
                    posicao_ranking: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  // 4. Taxa de cliques (CTR) de campanha
  getCampaignCTR: () => ({
    tags: ['Reports'],
    summary: 'Taxa de cliques (CTR) de uma campanha',
    description:
      'Calcula a taxa de cliques de uma campanha específica. Permite medir a efetividade das campanhas de marketing.',
    params: {
      type: 'object',
      properties: {
        origemCampanha: {
          type: 'string',
          description: 'Origem da campanha (utm_source)',
        },
      },
      required: ['origemCampanha'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: {
            type: 'object',
            properties: {
              origem_campanha: { type: 'string' },
              total_visualizacoes: {
                type: 'integer',
                description: 'Total de visualizações da campanha',
              },
              total_cliques: { type: 'integer', description: 'Total de cliques (compras)' },
              ctr_percentual: { type: 'number', description: 'Taxa de cliques em %' },
              periodo_analise: { type: 'string' },
            },
          },
        },
      },
    },
  }),

  // 5. Usuários por UTM source que compraram
  getUsersByUtmSource: () => ({
    tags: ['Reports'],
    summary: 'Usuários de UTM source que realizaram compra',
    description:
      'Lista usuários que vieram de uma utm_source específica e realizaram compra. Permite análise de ROI por canal de marketing.',
    params: {
      type: 'object',
      properties: {
        utmSource: {
          type: 'string',
          description: 'UTM Source específica',
        },
      },
      required: ['utmSource'],
    },
    querystring: {
      type: 'object',
      properties: {
        limite: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
          description: 'Número máximo de usuários retornados',
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: {
            type: 'object',
            properties: {
              utm_source: { type: 'string' },
              total_usuarios_compraram: { type: 'integer' },
              usuarios: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id_usuario: { type: 'string' },
                    timestamp_primeira_compra: { type: 'string', format: 'date-time' },
                    total_compras: { type: 'integer' },
                    produtos_comprados: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }),
};
