// Helpers para respostas padrão
const successResponse = (dataSchema?: any) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', default: true },
    ...(dataSchema && { data: dataSchema }),
  },
  required: ['success'],
});

const errorResponse = () => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', default: false },
    error: { type: 'string' },
  },
  required: ['success', 'error'],
});

const paginatedResponse = (itemSchema: any) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', default: true },
    data: {
      type: 'array',
      items: itemSchema,
    },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        pageSize: { type: 'integer', minimum: 1 },
        hasMore: { type: 'boolean' },
      },
      required: ['page', 'pageSize', 'hasMore'],
    },
  },
  required: ['success', 'data', 'pagination'],
});

// Schema para uma única avaliação
const reviewSchema = {
  type: 'object',
  properties: {
    id_cliente: { type: 'integer', description: 'ID do cliente que fez a avaliação' },
    nota: { type: 'number', minimum: 1, maximum: 5, description: 'Nota da avaliação (1 a 5)' },
    comentario: { type: 'string', description: 'Comentário da avaliação' },
    data_avaliacao: { type: 'string', format: 'date-time', description: 'Data da avaliação' },
  },
  required: ['id_cliente', 'nota', 'data_avaliacao'],
};

// Schema base do produto
const productSchema = {
  type: 'object',
  additionalProperties: true, // Permitir campos dinâmicos como 'em_promocao'
  properties: {
    _id: { type: 'string', description: 'ID único do produto' },
    id_produto: { type: 'string', description: 'ID único do produto (mapeado de _id)' },
    nome: { type: 'string', description: 'Nome do produto' },
    descricao: { type: 'string', description: 'Descrição do produto' },
    marca: { type: 'string', description: 'Marca do produto' },
    preco: { type: 'number', minimum: 0, description: 'Preço do produto' },
    categorias: {
      type: 'array',
      items: { type: 'integer', minimum: 1 },
      description: 'Array de IDs das categorias',
    },
    estoque: { type: 'integer', minimum: 0, description: 'Quantidade em estoque' },
    reservado: { type: 'integer', minimum: 0, description: 'Quantidade reservada' },
    disponivel: { type: 'integer', minimum: 0, description: 'Quantidade disponível' },
    atributos: {
      type: 'object',
      description: 'Atributos específicos do produto',
      additionalProperties: true,
    },
    avaliacoes: {
      type: 'object',
      description: 'Avaliações do produto',
      additionalProperties: true,
    },
    created_at: { type: 'string', format: 'date-time', description: 'Data de criação' },
    updated_at: { type: 'string', format: 'date-time', description: 'Data de atualização' },
  },
  required: ['nome', 'preco', 'categorias', 'estoque', 'reservado', 'disponivel'],
  oneOf: [{ required: ['_id'] }, { required: ['id_produto'] }],
};

// Schema para criação de produto
const createProductBodySchema = {
  type: 'object',
  required: ['nome', 'preco', 'categorias', 'estoque'],
  properties: {
    nome: { type: 'string', minLength: 1, maxLength: 200, description: 'Nome do produto' },
    descricao: { type: 'string', maxLength: 1000, description: 'Descrição do produto' },
    marca: { type: 'string', maxLength: 100, description: 'Marca do produto (opcional)' },
    preco: { type: 'number', minimum: 0, description: 'Preço do produto' },
    categorias: {
      type: 'array',
      items: { type: 'integer', minimum: 1 },
      description: 'Array de IDs das categorias',
    },
    estoque: { type: 'integer', minimum: 0, description: 'Quantidade em estoque' },
    atributos: {
      type: 'object',
      description:
        'Atributos específicos do produto (opcional). Campos reservado, disponivel e avaliacoes não são permitidos.',
      additionalProperties: true,
    },
  },
  additionalProperties: false,
};

// Schema para atualização de produto
const updateProductBodySchema = {
  type: 'object',
  properties: {
    nome: { type: 'string', minLength: 1, maxLength: 200, description: 'Nome do produto' },
    descricao: { type: 'string', maxLength: 1000, description: 'Descrição do produto' },
    marca: { type: 'string', maxLength: 100, description: 'Marca do produto' },
    preco: { type: 'number', minimum: 0, description: 'Preço do produto' },
    categorias: {
      type: 'array',
      items: { type: 'integer', minimum: 1 },
      description: 'Array de IDs das categorias',
    },
    atributos: {
      type: 'object',
      description:
        'Atributos específicos do produto. Campos estoque, reservado, disponivel e avaliacoes não são permitidos.',
      additionalProperties: true,
    },
  },
  additionalProperties: false,
  minProperties: 1,
};

// Schema de parâmetros de ID
const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', description: 'ID do produto' },
  },
};

// Schema de query para paginação
const paginationQuerySchema = {
  type: 'object',
  properties: {
    page: {
      type: 'string',
      pattern: '^[1-9][0-9]*$',
      description: 'Número da página (padrão: 1)',
    },
    pageSize: {
      type: 'string',
      pattern: '^[1-9][0-9]*$',
      description: 'Itens por página (padrão: 20, máximo: 100)',
    },
  },
};

const lowStockSchema = {
  querystring: {
    type: 'object',
    properties: {
      limiar: { type: 'integer', minimum: 0, default: 10, description: 'Valor limite do estoque' },
    },
    required: ['limiar'],
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id_produto: { type: 'string', description: 'ID do produto' },
          nome: { type: 'string' },
          estoque: { type: 'integer' },
          reservado: { type: 'integer' },
          disponivel: { type: 'integer' },
          categorias: {
            type: 'array',
            items: { type: 'integer' },
          },
          // adicione outros campos se quiser
        },
        required: ['id_produto', 'nome', 'estoque', 'reservado', 'disponivel'],
      },
    },
  },
};

export const productSchemas = {
  create: () => ({
    tags: ['Products'],
    summary: 'Criar produto',
    description:
      'Cria um novo produto no sistema. Campos não permitidos: reservado, disponivel, avaliacoes (são gerenciados automaticamente).',
    body: createProductBodySchema,
    response: {
      201: successResponse(productSchema),
      400: errorResponse(),
      500: errorResponse(),
    },
  }),

  getById: () => ({
    tags: ['Products'],
    summary: 'Buscar produto por ID',
    description: 'Busca um produto específico pelo seu ID',
    params: idParamSchema,
    response: {
      200: successResponse(productSchema),
      404: errorResponse(),
      500: errorResponse(),
    },
  }),

  list: () => ({
    tags: ['Products'],
    summary: 'Listar produtos',
    description: 'Lista produtos com paginação',
    querystring: paginationQuerySchema,
    response: {
      200: paginatedResponse(productSchema),
      400: errorResponse(),
      500: errorResponse(),
    },
  }),

  update: () => ({
    tags: ['Products'],
    summary: 'Atualizar produto',
    description:
      'Atualiza um produto existente. Campos não permitidos: estoque, reservado, disponivel, avaliacoes (são gerenciados automaticamente).',
    params: idParamSchema,
    body: updateProductBodySchema,
    response: {
      200: successResponse(productSchema),
      400: errorResponse(),
      404: errorResponse(),
      500: errorResponse(),
    },
  }),

  lowStock: () => ({
    tags: ['Products'],
    summary: 'Listar produtos com estoque abaixo do limiar',
    description: 'Retorna todos os produtos cujo estoque está abaixo do valor informado.',
    ...lowStockSchema,
  }),

  getAveragePriceByBrand: () => ({
    tags: ['Products', 'Reports'],
    summary: 'Calcular média de preço por marca',
    description:
      'Usa o Aggregation Framework do MongoDB para calcular o preço médio de produtos, agrupado por marca.',
    response: {
      200: successResponse({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            marca: { type: 'string', description: 'Nome da marca' },
            preco_medio: { type: 'number', description: 'Preço médio dos produtos da marca' },
            total_produtos: { type: 'integer', description: 'Total de produtos da marca' },
          },
          required: ['marca', 'preco_medio', 'total_produtos'],
        },
      }),
      500: errorResponse(),
    },
  }),

  search: () => ({
    tags: ['Products'],
    summary: 'Buscar produtos por atributos e preço',
    description:
      'Busca avançada de produtos. Permite filtrar por atributos específicos (e.g., processador, cor) e por uma faixa de preço. A busca de atributos é case-insensitive para strings.',
    body: {
      type: 'object',
      properties: {
        atributos: {
          type: 'object',
          description:
            'Objeto com os atributos a serem filtrados. Ex: {"processador": "i7", "ram": "16GB"}',
          additionalProperties: true,
        },
        preco_min: {
          type: 'number',
          minimum: 0,
          description: 'Preço mínimo do produto',
        },
        preco_max: {
          type: 'number',
          minimum: 0,
          description: 'Preço máximo do produto',
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1,
          description: 'Número da página',
        },
        pageSize: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
          description: 'Itens por página',
        },
      },
      additionalProperties: false,
    },
    response: {
      200: paginatedResponse(productSchema),
      400: errorResponse(),
      500: errorResponse(),
    },
  }),

  addFieldByCategory: () => ({
    tags: ['Products', 'Bulk Operations'],
    summary: 'Adicionar/Atualizar campo em produtos de uma categoria (PUT)',
    description:
      'Adiciona ou atualiza um campo com um valor específico para todos os produtos de uma categoria. Retorna a lista de produtos que foram modificados. Esta é uma operação em massa e pode afetar múltiplos documentos. Campos protegidos como _id, estoque, etc., não podem ser alterados.',
    params: {
      type: 'object',
      required: ['categoryId'],
      properties: {
        categoryId: {
          type: 'string',
          pattern: '^[1-9][0-9]*$',
          description: 'ID da categoria (do PostgreSQL) cujos produtos serão atualizados.',
        },
      },
    },
    body: {
      type: 'object',
      required: ['field_name', 'field_value'],
      properties: {
        field_name: {
          type: 'string',
          description: 'O nome do campo a ser adicionado/atualizado. Ex: "promocao_ativa"',
        },
        field_value: {
          description:
            'O valor a ser atribuído ao campo. Pode ser qualquer tipo JSON válido (string, number, boolean, object, array). Ex: true',
        },
      },
      additionalProperties: false,
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          updated_count: { type: 'integer', description: 'Número de produtos atualizados' },
          data: {
            type: 'array',
            items: productSchema,
            description: 'Lista dos produtos que foram atualizados',
          },
        },
        required: ['success', 'updated_count', 'data'],
      },
      400: errorResponse(),
      404: errorResponse(),
      500: errorResponse(),
    },
  }),

  listReviews: () => ({
    tags: ['Products', 'Reviews'],
    summary: 'Listar avaliações de um produto',
    description:
      'Lista todas as avaliações de um produto específico, ordenadas por data (mais recentes primeiro) e com paginação.',
    params: idParamSchema,
    querystring: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          pattern: '^[1-9][0-9]*$',
          default: '1',
          description: 'Número da página',
        },
        pageSize: {
          type: 'string',
          pattern: '^[1-9][0-9]*$',
          default: '10',
          description: 'Itens por página (máximo: 50)',
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: { type: 'array', items: reviewSchema },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', minimum: 1 },
              pageSize: { type: 'integer', minimum: 0 },
              totalItems: { type: 'integer', minimum: 0 },
              totalPages: { type: 'integer', minimum: 0 },
              hasMore: { type: 'boolean' },
            },
            required: ['page', 'pageSize', 'totalItems', 'totalPages', 'hasMore'],
          },
        },
        required: ['success', 'data', 'pagination'],
      },
      400: errorResponse(),
      404: errorResponse(),
      500: errorResponse(),
    },
  }),
};
