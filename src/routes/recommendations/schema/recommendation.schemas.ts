export const productRecommendationSchemas = {
  frequentlyBoughtTogether: () => ({
    tags: ['Product Recommendations'],
    security: [{ bearerAuth: [] }],
    summary: 'Produtos frequentemente comprados juntos',
    description:
      'Filtragem colaborativa item-item: encontra produtos que são frequentemente comprados junto com um produto específico',
    params: {
      type: 'object',
      properties: {
        produtoId: {
          type: 'string',
          description: 'ID do produto para encontrar recomendações',
        },
      },
      required: ['produtoId'],
    },
    querystring: {
      type: 'object',
      properties: {
        limite: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 10,
          description: 'Número máximo de produtos recomendados',
        },
      },
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
              produto_base: {
                type: 'string',
                description: 'ID do produto usado como base para recomendação',
              },
              total_recomendacoes: {
                type: 'integer',
                description: 'Número total de produtos recomendados',
              },
              recomendacoes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id_produto: {
                      type: 'string',
                      description: 'ID do produto recomendado',
                    },
                    nome: {
                      type: 'string',
                      description: 'Nome do produto',
                    },
                    score: {
                      type: 'number',
                      description: 'Score de recomendação (frequência ou peso)',
                    },
                    motivo_recomendacao: {
                      type: 'string',
                      description: 'Motivo da recomendação',
                    },
                  },
                  required: ['id_produto', 'nome', 'score'],
                },
              },
            },
            required: ['produto_base', 'total_recomendacoes', 'recomendacoes'],
          },
        },
        required: ['success', 'data'],
      },
      400: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
          details: { type: 'string' },
        },
        required: ['success', 'error'],
      },
      404: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
        },
        required: ['success', 'error'],
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

  userBasedRecommendations: () => ({
    tags: ['Product Recommendations'],
    security: [{ bearerAuth: [] }],
    summary: 'Recomendações baseadas em clientes similares',
    description:
      'Filtragem colaborativa user-user: encontra clientes com histórico similar e recomenda produtos que eles compraram',
    params: {
      type: 'object',
      properties: {
        clienteId: {
          type: 'string',
          description: 'ID do cliente para encontrar recomendações',
        },
      },
      required: ['clienteId'],
    },
    querystring: {
      type: 'object',
      properties: {
        limite: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 10,
          description: 'Número máximo de produtos recomendados',
        },
        minSimilaridade: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.1,
          description: 'Similaridade mínima entre clientes (0-1)',
        },
      },
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
              cliente_base: {
                type: 'string',
                description: 'ID do cliente usado como base para recomendação',
              },
              total_recomendacoes: {
                type: 'integer',
                description: 'Número total de produtos recomendados',
              },
              min_similaridade: {
                type: 'number',
                description: 'Similaridade mínima utilizada no filtro',
              },
              recomendacoes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id_produto: {
                      type: 'string',
                      description: 'ID do produto recomendado',
                    },
                    nome: {
                      type: 'string',
                      description: 'Nome do produto',
                    },
                    score: {
                      type: 'number',
                      description: 'Score de recomendação baseado na similaridade dos clientes',
                    },
                  },
                  required: ['id_produto', 'nome', 'score'],
                },
              },
            },
            required: ['cliente_base', 'total_recomendacoes', 'min_similaridade', 'recomendacoes'],
          },
        },
        required: ['success', 'data'],
      },
      400: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
          details: { type: 'string' },
        },
        required: ['success', 'error'],
      },
      404: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
        },
        required: ['success', 'error'],
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

  shortestPath: () => ({
    tags: ['Product Recommendations'],
    security: [{ bearerAuth: [] }],
    summary: 'Caminho mais curto entre produtos',
    description:
      'Encontra o caminho mais curto entre dois produtos através de suas categorias e marcas usando algoritmos de grafos',
    params: {
      type: 'object',
      properties: {
        produtoOrigemId: {
          type: 'string',
          description: 'ID do produto de origem',
          // example: 'PROD001',
        },
        produtoDestinoId: {
          type: 'string',
          description: 'ID do produto de destino',
          // example: 'PROD002',
        },
      },
      required: ['produtoOrigemId', 'produtoDestinoId'],
    },
    querystring: {
      type: 'object',
      properties: {
        maxDistancia: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          default: 6,
          description: 'Distância máxima permitida no caminho',
        },
      },
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
              produto_origem: {
                type: 'object',
                properties: {
                  id_produto: {
                    type: 'string',
                    description: 'ID do produto de origem',
                  },
                  nome: {
                    type: 'string',
                    description: 'Nome do produto de origem',
                  },
                },
                required: ['id_produto', 'nome'],
              },
              produto_destino: {
                type: 'object',
                properties: {
                  id_produto: {
                    type: 'string',
                    description: 'ID do produto de destino',
                  },
                  nome: {
                    type: 'string',
                    description: 'Nome do produto de destino',
                  },
                },
                required: ['id_produto', 'nome'],
              },
              caminho_encontrado: {
                type: 'boolean',
                description: 'Se foi possível encontrar um caminho',
              },
              distancia: {
                type: 'integer',
                description: 'Distância do caminho encontrado (-1 se não encontrado)',
              },
              caminho: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    tipo: {
                      type: 'string',
                      enum: ['produto', 'categoria', 'marca'],
                      description: 'Tipo do nó no caminho',
                    },
                    id: {
                      type: 'string',
                      description: 'ID do nó',
                    },
                    nome: {
                      type: 'string',
                      description: 'Nome do nó',
                    },
                    posicao_no_caminho: {
                      type: 'integer',
                      description: 'Posição do nó no caminho (0-based)',
                    },
                    produto: {
                      type: 'string',
                      description: 'Nome do produto relacionado à marca (se aplicável)',
                    },
                  },
                  required: ['tipo', 'nome', 'posicao_no_caminho'],
                  allOf: [
                    {
                      if: { properties: { tipo: { const: 'produto' } } },
                      then: { required: ['id'] },
                    },
                    {
                      if: { properties: { tipo: { const: 'categoria' } } },
                      then: { required: ['id'] },
                    },
                  ],
                },
              },
            },
            required: [
              'produto_origem',
              'produto_destino',
              'caminho_encontrado',
              'distancia',
              'caminho',
            ],
          },
        },
        required: ['success', 'data'],
      },
      400: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
          details: { type: 'string' },
        },
        required: ['success', 'error'],
      },
      404: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
        },
        required: ['success', 'error'],
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

  influencerCustomers: () => ({
    tags: ['Product Recommendations'],
    security: [{ bearerAuth: [] }],
    summary: 'Clientes influenciadores',
    description:
      'Identifica clientes cujas avaliações positivas se correlacionam com aumento nas vendas dos produtos avaliados',
    querystring: {
      type: 'object',
      properties: {
        limite: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
          description: 'Número máximo de influenciadores a retornar',
        },
        minAvaliacoes: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 5,
          description: 'Número mínimo de avaliações para considerar como influenciador',
        },
        periodoAnalise: {
          type: 'integer',
          minimum: 7,
          maximum: 90,
          default: 30,
          description: 'Período em dias para análise do impacto nas vendas',
        },
      },
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
              total_influenciadores: {
                type: 'integer',
                description: 'Número total de influenciadores encontrados',
              },
              criterios_analise: {
                type: 'object',
                properties: {
                  min_avaliacoes: { type: 'integer' },
                  periodo_analise_dias: { type: 'integer' },
                },
                required: ['min_avaliacoes', 'periodo_analise_dias'],
              },
              influenciadores: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id_cliente: {
                      type: 'string',
                      description: 'ID do cliente influenciador',
                    },
                    nome: {
                      type: 'string',
                      description: 'Nome do cliente influenciador',
                    },
                    total_avaliacoes: {
                      type: 'integer',
                      description: 'Total de avaliações feitas pelo cliente',
                    },
                    media_notas: {
                      type: 'number',
                      description: 'Média das notas dadas pelo cliente',
                    },
                    produtos_avaliados: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Lista de IDs dos produtos avaliados',
                    },
                    influencia_score: {
                      type: 'integer',
                      description: 'Score geral de influência do cliente',
                    },
                  },
                  required: [
                    'id_cliente',
                    'nome',
                    'total_avaliacoes',
                    'media_notas',
                    'produtos_avaliados',
                    'influencia_score',
                  ],
                },
              },
            },
            required: ['total_influenciadores', 'criterios_analise', 'influenciadores'],
          },
        },
        required: ['success', 'data'],
      },
      400: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
          details: { type: 'string' },
        },
        required: ['success', 'error'],
      },
      404: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
        },
        required: ['success', 'error'],
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

  categoryBasedRecommendations: () => ({
    tags: ['Customer Recommendations'],
    security: [{ bearerAuth: [] }],
    summary: 'Recomendações baseadas em categorias visualizadas',
    description:
      'Recomenda produtos de categorias que um cliente visualizou, mas das quais ainda não comprou',
    params: {
      type: 'object',
      properties: {
        clienteId: {
          type: 'string',
          description: 'ID do cliente para recomendações',
          // example: 'CLI001',
        },
      },
      required: ['clienteId'],
    },
    querystring: {
      type: 'object',
      properties: {
        limite: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 10,
          description: 'Número máximo de produtos recomendados',
        },
        diasAnalise: {
          type: 'integer',
          minimum: 7,
          maximum: 90,
          default: 30,
          description: 'Período em dias para análise das visualizações',
        },
      },
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
              cliente_id: {
                type: 'string',
                description: 'ID do cliente base',
              },
              total_recomendacoes: {
                type: 'integer',
                description: 'Número total de produtos recomendados',
              },
              periodo_analise_dias: {
                type: 'integer',
                description: 'Período em dias usado para análise',
              },
              recomendacoes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id_produto: {
                      type: 'string',
                      description: 'ID do produto recomendado',
                    },
                    nome: {
                      type: 'string',
                      description: 'Nome do produto',
                    },
                    marca: {
                      type: 'string',
                      description: 'Marca do produto',
                    },
                    categoria: {
                      type: 'string',
                      description: 'Categoria do produto',
                    },
                    score: {
                      type: 'number',
                      description: 'Score de recomendação baseado em visualizações',
                    },
                    categoria_visualizada: {
                      type: 'object',
                      properties: {
                        id_categoria: {
                          type: 'string',
                          description: 'ID da categoria visualizada',
                        },
                        nome_categoria: {
                          type: 'string',
                          description: 'Nome da categoria visualizada',
                        },
                        total_visualizacoes: {
                          type: 'integer',
                          description: 'Total de visualizações da categoria',
                        },
                      },
                      required: ['id_categoria', 'nome_categoria', 'total_visualizacoes'],
                    },
                  },
                  required: [
                    'id_produto',
                    'nome',
                    'marca',
                    'categoria',
                    'score',
                    'categoria_visualizada',
                  ],
                },
              },
            },
            required: [
              'cliente_id',
              'total_recomendacoes',
              'periodo_analise_dias',
              'recomendacoes',
            ],
          },
        },
        required: ['success', 'data'],
      },
      400: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
          details: { type: 'string' },
        },
        required: ['success', 'error'],
      },
      404: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
          details: { type: 'string' },
        },
        required: ['success', 'error'],
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
