export const productRecommendationSchemas = {
  frequentlyBoughtTogether: () => ({
    tags: ['Product Recommendations'],
    summary: 'Produtos frequentemente comprados juntos',
    description:
      'Filtragem colaborativa item-item: encontra produtos que são frequentemente comprados junto com um produto específico',
    params: {
      type: 'object',
      properties: {
        produtoId: {
          type: 'string',
          description: 'ID do produto para encontrar recomendações',
          example: 'PROD001',
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
              algoritmo: {
                type: 'string',
                enum: ['frequencia'],
                description: 'Tipo de algoritmo utilizado',
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
                      description: 'Score de recomendação (frequência ou peso)',
                    },
                    clientes_em_comum: {
                      type: 'integer',
                      description: 'Número de clientes que compraram ambos os produtos',
                    },
                  },
                  required: [
                    'id_produto',
                    'nome',
                    'marca',
                    'categoria',
                    'score',
                    'clientes_em_comum',
                  ],
                },
              },
            },
            required: ['produto_base', 'total_recomendacoes', 'algoritmo', 'recomendacoes'],
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
    summary: 'Recomendações baseadas em clientes similares',
    description:
      'Filtragem colaborativa user-user: encontra clientes com histórico similar e recomenda produtos que eles compraram',
    params: {
      type: 'object',
      properties: {
        clienteId: {
          type: 'string',
          description: 'ID do cliente para encontrar recomendações',
          example: 'CLI001',
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
                      description: 'Score de recomendação baseado na similaridade dos clientes',
                    },
                    recomendado_por: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id_cliente: {
                            type: 'string',
                            description: 'ID do cliente similar',
                          },
                          produtos_em_comum: {
                            type: 'integer',
                            description: 'Número de produtos em comum',
                          },
                          total_produtos_cliente: {
                            type: 'integer',
                            description: 'Total de produtos do cliente similar',
                          },
                          similaridade: {
                            type: 'number',
                            description: 'Score de similaridade com o cliente base',
                          },
                        },
                        required: [
                          'id_cliente',
                          'produtos_em_comum',
                          'total_produtos_cliente',
                          'similaridade',
                        ],
                      },
                    },
                  },
                  required: [
                    'id_produto',
                    'nome',
                    'marca',
                    'categoria',
                    'score',
                    'recomendado_por',
                  ],
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
    summary: 'Caminho mais curto entre produtos',
    description:
      'Encontra o caminho mais curto entre dois produtos através de suas categorias e marcas usando algoritmos de grafos',
    params: {
      type: 'object',
      properties: {
        produtoOrigemId: {
          type: 'string',
          description: 'ID do produto de origem',
          example: 'PROD001',
        },
        produtoDestinoId: {
          type: 'string',
          description: 'ID do produto de destino',
          example: 'PROD002',
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
        algoritmo: {
          type: 'string',
          enum: ['shortest_path', 'categories_only'],
          default: 'shortest_path',
          description:
            'Algoritmo a ser usado: shortest_path (usa categorias e marcas) ou categories_only (apenas categorias)',
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
              algoritmo_usado: {
                type: 'string',
                description: 'Método utilizado para encontrar o caminho',
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
                  },
                  required: ['tipo', 'id', 'nome', 'posicao_no_caminho'],
                },
              },
            },
            required: [
              'produto_origem',
              'produto_destino',
              'caminho_encontrado',
              'distancia',
              'algoritmo_usado',
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
                    total_avaliacoes: {
                      type: 'integer',
                      description: 'Total de avaliações feitas pelo cliente',
                    },
                    avaliacoes_positivas: {
                      type: 'integer',
                      description: 'Número de avaliações positivas (nota >= 4)',
                    },
                    taxa_avaliacoes_positivas: {
                      type: 'number',
                      description: 'Percentual de avaliações positivas',
                    },
                    produtos_avaliados: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Lista de IDs dos produtos avaliados',
                    },
                    impacto_vendas: {
                      type: 'object',
                      properties: {
                        vendas_antes_avaliacao: {
                          type: 'integer',
                          description: 'Total de vendas antes das avaliações',
                        },
                        vendas_depois_avaliacao: {
                          type: 'integer',
                          description: 'Total de vendas depois das avaliações',
                        },
                        aumento_percentual: {
                          type: 'number',
                          description: 'Percentual de aumento nas vendas',
                        },
                      },
                      required: [
                        'vendas_antes_avaliacao',
                        'vendas_depois_avaliacao',
                        'aumento_percentual',
                      ],
                    },
                    score_influencia: {
                      type: 'number',
                      description: 'Score geral de influência do cliente',
                    },
                    produtos_impactados: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id_produto: { type: 'string' },
                          nome_produto: { type: 'string' },
                          nota_avaliacao: { type: 'number' },
                          data_avaliacao: { type: 'string' },
                          vendas_30_dias_antes: { type: 'integer' },
                          vendas_30_dias_depois: { type: 'integer' },
                          aumento_vendas: { type: 'integer' },
                          percentual_aumento: { type: 'number' },
                        },
                        required: [
                          'id_produto',
                          'nome_produto',
                          'nota_avaliacao',
                          'data_avaliacao',
                          'vendas_30_dias_antes',
                          'vendas_30_dias_depois',
                          'aumento_vendas',
                          'percentual_aumento',
                        ],
                      },
                    },
                  },
                  required: [
                    'id_cliente',
                    'total_avaliacoes',
                    'avaliacoes_positivas',
                    'taxa_avaliacoes_positivas',
                    'produtos_avaliados',
                    'impacto_vendas',
                    'score_influencia',
                    'produtos_impactados',
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
    tags: ['Client Recommendations'],
    summary: 'Recomendações baseadas em categorias visualizadas',
    description:
      'Recomenda produtos de categorias que um cliente visualizou, mas das quais ainda não comprou',
    params: {
      type: 'object',
      properties: {
        clienteId: {
          type: 'string',
          description: 'ID do cliente para recomendações',
          example: 'CLI001',
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
              algoritmo: {
                type: 'string',
                enum: ['categoria_visualizada'],
                description: 'Algoritmo utilizado',
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
              'algoritmo',
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
