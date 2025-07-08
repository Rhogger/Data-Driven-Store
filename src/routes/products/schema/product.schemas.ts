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

const productSchema = {
  type: 'object',
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
};
