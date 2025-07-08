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

const categorySchema = {
  type: 'object',
  properties: {
    id_categoria: { type: 'integer', description: 'ID único da categoria' },
    nome: { type: 'string', description: 'Nome da categoria' },
    created_at: { type: 'string', format: 'date-time', description: 'Data de criação' },
    updated_at: { type: 'string', format: 'date-time', description: 'Data de atualização' },
  },
  required: ['id_categoria', 'nome', 'created_at'],
};

const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      pattern: '^[1-9][0-9]*$',
      description: 'ID da categoria',
    },
  },
};

const createCategoryBodySchema = {
  type: 'object',
  required: ['nome'],
  properties: {
    nome: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Nome da categoria',
    },
  },
  additionalProperties: false,
};

export const categorySchemas = {
  create: () => ({
    tags: ['Categories'],
    security: [{ bearerAuth: [] }],
    summary: 'Criar categoria',
    description: 'Cria uma nova categoria no sistema',
    body: createCategoryBodySchema,
    response: {
      201: successResponse(categorySchema),
      400: errorResponse(),
      500: errorResponse(),
    },
  }),

  getById: () => ({
    tags: ['Categories'],
    security: [{ bearerAuth: [] }],
    summary: 'Buscar categoria por ID',
    description: 'Busca uma categoria específica pelo seu ID',
    params: idParamSchema,
    response: {
      200: successResponse(categorySchema),
      400: errorResponse(),
      404: errorResponse(),
      500: errorResponse(),
    },
  }),

  list: () => ({
    tags: ['Categories'],
    security: [{ bearerAuth: [] }],
    summary: 'Listar categorias',
    description: 'Lista todas as categorias disponíveis',
    response: {
      200: successResponse({
        type: 'array',
        items: categorySchema,
      }),
      500: errorResponse(),
    },
  }),
};
