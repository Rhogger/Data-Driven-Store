const errorResponse = () => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', default: false },
    error: { type: 'string' },
  },
  required: ['success', 'error'],
});

const topCustomersReportSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id_cliente: { type: 'integer', description: 'ID do cliente' },
      nome: { type: 'string', description: 'Nome do cliente' },
      total_gasto: {
        type: 'string',
        description: 'Total gasto pelo cliente (NUMERIC retornado como string)',
      },
      total_pedidos: { type: 'string', description: 'Total de pedidos do cliente' },
      ticket_medio: {
        type: 'string',
        description: 'Ticket médio do cliente (NUMERIC retornado como string)',
      },
    },
    required: ['id_cliente', 'nome', 'total_gasto', 'total_pedidos', 'ticket_medio'],
  },
};

const billingByCategoryReportSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      mes: { type: 'string', description: 'Ano e mês (YYYY-MM)' },
      categoria: { type: 'string', description: 'ID da categoria' },
      faturamento: { type: 'string', description: 'Faturamento total da categoria no mês' },
    },
    required: ['mes', 'categoria', 'faturamento'],
  },
};

export const reportSchemas = {
  topCustomers: () => ({
    tags: ['Reports'],
    security: [{ bearerAuth: [] }],
    summary: 'Relatório dos 5 melhores clientes',
    description:
      'Gera um relatório dos 5 clientes com maior faturamento, incluindo total gasto, número de pedidos e ticket médio.',
    response: {
      200: topCustomersReportSchema,
      500: errorResponse(),
    },
  }),
  billingByCategory: () => ({
    tags: ['Reports'],
    security: [{ bearerAuth: [] }],
    summary: 'Relatório de faturamento mensal por categoria',
    description: 'Gera um relatório do faturamento mensal agrupado por categoria.',
    response: {
      200: billingByCategoryReportSchema,
      500: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      },
    },
  }),

  findByPreference: () => ({
    tags: ['Reports'],
    security: [{ bearerAuth: [] }],
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
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: {
            type: 'array',
            items: customerSchema,
          },
        },
        required: ['success', 'data'],
      },
      400: errorResponse(),
      404: errorResponse(),
      500: errorResponse(),
    },
  }),
};

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
