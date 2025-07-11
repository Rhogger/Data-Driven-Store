export const cassandraAnalyticsSchemas = {
  // Funil de conversão geral
  getConversionFunnel: () => ({
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
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
              usuarios_compraram: {
                type: 'integer',
                description: 'Usuários que compraram',
              },
              taxa_visualizacao_ate_carrinho: {
                type: 'number',
                description: 'Taxa (%) de usuários que visualizaram e adicionaram ao carrinho',
              },
              taxa_carrinho_ate_compra: {
                type: 'number',
                description: 'Taxa (%) de usuários que adicionaram ao carrinho e compraram',
              },
              taxa_visualizacao_ate_compra: {
                type: 'number',
                description: 'Taxa (%) de usuários que visualizaram e compraram',
              },
              usuarios_somente_visualizaram: {
                type: 'integer',
                description: 'Usuários que só visualizaram e não seguiram adiante',
              },
              usuarios_visualizaram_e_carrinho: {
                type: 'integer',
                description:
                  'Usuários que visualizaram e adicionaram ao carrinho, mas não compraram',
              },
              usuarios_completaram_funil: {
                type: 'integer',
                description: 'Usuários que visualizaram, adicionaram ao carrinho e compraram',
              },
              usuarios_abandonaram_carrinho: {
                type: 'integer',
                description: 'Usuários que adicionaram ao carrinho mas não compraram',
              },
            },
            additionalProperties: true,
          },
        },
      },
    },
  }),

  // Funil de conversão por usuário
  getConversionFunnelByUser: () => ({
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
    summary: 'Funil de conversão agrupado por usuário',
    description:
      'Retorna um array de objetos, cada um com estatísticas detalhadas do funil de conversão para um usuário: totais, taxas e flags.',
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id_usuario: {
                  type: 'integer',
                  description: 'ID do usuário',
                },
                visualizou: {
                  type: 'integer',
                  description: 'Total de visualizações',
                },
                adicionou_carrinho: {
                  type: 'integer',
                  description: 'Total de adições ao carrinho',
                },
                comprou: {
                  type: 'integer',
                  description: 'Total de compras',
                },
                taxa_visualizacao_ate_carrinho: {
                  type: 'number',
                  description: 'Taxa (%) de visualizações que viraram adição ao carrinho',
                },
                taxa_carrinho_ate_compra: {
                  type: 'number',
                  description: 'Taxa (%) de adições ao carrinho que viraram compra',
                },
                taxa_visualizacao_ate_compra: {
                  type: 'number',
                  description: 'Taxa (%) de visualizações que viraram compra',
                },
                completou_funil: {
                  type: 'boolean',
                  description: 'Se o usuário completou todas as etapas do funil',
                },
                abandonou_carrinho: {
                  type: 'boolean',
                  description: 'Se o usuário abandonou o carrinho (adicionou mas não comprou)',
                },
                somente_visualizou: {
                  type: 'boolean',
                  description: 'Se o usuário apenas visualizou e não seguiu adiante',
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
    },
  }),

  getWeeklyViews: () => ({
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
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

  getTopSearchTerms: () => ({
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
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

  getCampaignCTR: () => ({
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
    summary: 'Taxa de cliques (CTR) de uma campanha',
    description:
      'Calcula a taxa de cliques de uma campanha específica. Permite medir a efetividade das campanhas de marketing.',
    params: {
      type: 'object',
      properties: {
        origemCampanha: {
          type: 'string',
          description: 'Origem da campanha (utm_source, ex: email, facebook, direct, google)',
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
              total_cliques: { type: 'integer', description: 'Total de cliques (compras)' },
            },
          },
        },
      },
    },
  }),

  getUsersByUtmSource: () => ({
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
    summary: 'Usuários de UTM source que realizaram compra',
    description:
      'Lista usuários que vieram de uma utm_source (utm_source, ex: email, facebook, direct, google) específica e realizaram compra. Permite análise de ROI por canal de marketing.',
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
