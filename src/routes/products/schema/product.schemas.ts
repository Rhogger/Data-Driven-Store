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

// Schema base do produto
const productSchema = {
  type: 'object',
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
};
