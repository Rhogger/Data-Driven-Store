// Helpers para respostas padrão
const errorResponse = () => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', default: false },
    error: { type: 'string' },
  },
  required: ['success', 'error'],
});

// Schema de um cliente (vindo do PostgreSQL)
const customerSchema = {
  type: 'object',
  properties: {
    id_cliente: { type: 'integer' },
    nome: { type: 'string' },
    email: { type: 'string', format: 'email' },
    telefone: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
  required: ['id_cliente', 'nome', 'email', 'telefone'],
};

export const userSchemas = {
  findByPreference: () => ({
    tags: ['Users', 'Reports'],
    summary: 'Encontrar usuários por preferência de categoria',
    description:
      'Busca no MongoDB por perfis de usuários que têm uma preferência por uma categoria específica e retorna os dados completos desses usuários do PostgreSQL.',
    params: {
      type: 'object',
      required: ['categoryId'],
      properties: {
        categoryId: {
          type: 'string',
          pattern: '^[1-9][0-9]*$',
          description: 'ID da categoria (preferência) a ser buscada.',
        },
      },
    },
    querystring: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          pattern: '^[1-9][0-9]*$',
          default: '1',
          description: 'Número da página.',
        },
        pageSize: {
          type: 'string',
          pattern: '^[1-9][0-9]*$',
          default: '20',
          description: 'Itens por página (máximo: 100).',
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: {
            type: 'array',
            items: customerSchema,
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              pageSize: { type: 'integer' },
              totalItems: { type: 'integer' },
              totalPages: { type: 'integer' },
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
