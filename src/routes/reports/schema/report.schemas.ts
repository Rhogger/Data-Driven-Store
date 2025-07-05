// Helpers para respostas padrão
const errorResponse = () => ({
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
});

// Schema para o relatório de top clientes
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

// Schema para o relatório de faturamento mensal por categoria
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
};
