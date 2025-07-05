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

// Schema da categoria
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

// Schema para criação de categoria
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
    summary: 'Criar categoria',
    description: 'Cria uma nova categoria no sistema',
    body: createCategoryBodySchema,
    response: {
      201: successResponse(categorySchema),
      400: errorResponse(),
      500: errorResponse(),
    },
  }),

  list: () => ({
    tags: ['Categories'],
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
