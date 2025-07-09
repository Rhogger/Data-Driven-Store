const successResponse = (dataSchema?: any) => {
  if (!dataSchema) {
    return {
      type: 'object',
      properties: {
        success: { type: 'boolean', default: true },
      },
      required: ['success'],
    };
  }
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', default: true },
      data: {
        type: 'object',
        ...dataSchema,
      },
    },
    required: ['success', 'data'],
  };
};

const errorResponse = () => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', default: false },
    error: { type: 'string' },
  },
  required: ['success', 'error'],
});

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

const productSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
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
      type: 'array',
      description: 'Avaliações do produto',
      items: {
        type: 'object',
        properties: {
          id_cliente: { type: 'integer' },
          nota: { type: 'integer' },
          comentario: { type: 'string' },
        },
        required: ['id_cliente', 'nota', 'comentario'],
      },
    },
    created_at: { type: 'string', format: 'date-time', description: 'Data de criação' },
    updated_at: { type: 'string', format: 'date-time', description: 'Data de atualização' },
  },
  required: ['nome', 'preco', 'categorias', 'estoque', 'reservado', 'disponivel'],
  oneOf: [{ required: ['id_produto'] }],
};

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

const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', description: 'ID do produto' },
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
        },
        required: ['id_produto', 'nome', 'estoque', 'reservado', 'disponivel'],
      },
    },
  },
};

export const productSchemas = {
  create: () => ({
    tags: ['Products'],
    security: [{ bearerAuth: [] }],
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
    security: [{ bearerAuth: [] }],
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
    security: [{ bearerAuth: [] }],
    summary: 'Listar produtos',
    description: 'Lista todos os produtos',
    response: {
      200: successResponse({
        type: 'array',
        items: productSchema,
      }),
      500: errorResponse(),
    },
  }),

  update: () => ({
    tags: ['Products'],
    security: [{ bearerAuth: [] }],
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
    security: [{ bearerAuth: [] }],
    summary: 'Listar produtos com estoque abaixo do limiar',
    description: 'Retorna todos os produtos cujo estoque está abaixo do valor informado.',
    ...lowStockSchema,
  }),

  getAveragePriceByBrand: () => ({
    tags: ['Products'],
    security: [{ bearerAuth: [] }],
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
    security: [{ bearerAuth: [] }],
    summary: 'Buscar produtos por atributos e preço',
    description:
      'Busca avançada de produtos. Permite filtrar por atributos específicos (via query params dinâmicos) e por uma faixa de preço. A busca de atributos é case-insensitive para strings.',
    querystring: {
      type: 'object',
      description:
        'Busca produtos por atributos dinâmicos. O campo atributos deve ser um JSON válido passado como string (ex: {"processador": "i5", "ram": "16GB"}). Exemplo de uso: /api/products/search?preco_min=0&preco_max=1000&atributos={"processador":"i7","ram":"16GB"}',
      properties: {
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
        atributos: {
          type: 'string',
          description:
            'Atributos dinâmicos do produto como string JSON (ex: {"processador": "i5", "ram": "16GB"})',
        },
      },
      required: [],
    },
    response: {
      200: successResponse({
        type: 'array',
        items: productSchema,
      }),
      400: errorResponse(),
      500: errorResponse(),
    },
  }),

  addFieldByCategory: () => ({
    tags: ['Products'],
    security: [{ bearerAuth: [] }],
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
    tags: ['Products'],
    security: [{ bearerAuth: [] }],
    summary: 'Listar avaliações de um produto',
    description:
      'Lista todas as avaliações de um produto específico, ordenadas por data (mais recentes primeiro).',
    params: idParamSchema,
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: { type: 'array', items: reviewSchema },
        },
        required: ['success', 'data'],
      },
      400: errorResponse(),
      404: errorResponse(),
      500: errorResponse(),
    },
  }),
};
