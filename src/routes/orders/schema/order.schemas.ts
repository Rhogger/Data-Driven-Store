export const orderSchemas = {
  create: () => ({
    tags: ['Orders'],
    security: [{ bearerAuth: [] }],
    summary: 'Criar pedido',
    description:
      'Cria um novo pedido no sistema. Valida estoque dos produtos, cria o pedido no PostgreSQL e atualiza o estoque no MongoDB.',
    body: {
      type: 'object',
      required: ['id_endereco', 'itens'],
      properties: {
        id_endereco: { type: 'integer', minimum: 1, description: 'ID do endereço de entrega' },
        itens: {
          type: 'array',
          minItems: 1,
          description: 'Lista de itens do pedido',
          items: {
            type: 'object',
            required: ['id_produto', 'quantidade'],
            properties: {
              id_produto: {
                type: 'string',
                description: 'ID do produto (ObjectId do MongoDB)',
                pattern: '^[0-9a-fA-F]{24}$',
              },
              quantidade: {
                type: 'integer',
                minimum: 1,
                description: 'Quantidade do produto',
              },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: {
            type: 'object',
            properties: {
              id_pedido: { type: 'integer', description: 'ID único do pedido' },
              id_cliente: { type: 'integer', description: 'ID do cliente' },
              id_endereco: { type: 'integer', description: 'ID do endereço de entrega' },
              valor_total: {
                type: 'string',
                description: 'Valor total do pedido (NUMERIC retornado como string)',
              },
              data_pedido: {
                type: 'string',
                format: 'date-time',
                description: 'Data e hora do pedido',
              },
              status_pedido: {
                type: 'string',
                enum: ['Pendente', 'Processando', 'Enviado', 'Entregue', 'Cancelado'],
                description: 'Status atual do pedido',
              },
            },
            required: [
              'id_pedido',
              'id_cliente',
              'id_endereco',
              'valor_total',
              'data_pedido',
              'status_pedido',
            ],
          },
        },
        required: ['success', 'data'],
      },
      400: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          message: { type: 'string' },
        },
        required: ['success', 'message'],
      },
      500: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          message: { type: 'string' },
        },
        required: ['success', 'message'],
      },
    },
  }),

  listByCustomer: () => ({
    tags: ['Orders'],
    security: [{ bearerAuth: [] }],
    summary: 'Listar pedidos de um cliente',
    description: 'Lista todos os pedidos de um cliente, incluindo o valor total.',
    params: {
      type: 'object',
      properties: {
        id_cliente: { type: 'integer', description: 'ID do cliente', default: 0 },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: true },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id_pedido: { type: 'integer' },
                data_pedido: { type: 'string', format: 'date-time' },
                valor_total: { type: 'string' },
                status_pedido: { type: 'string' },
              },
              required: ['id_pedido', 'data_pedido', 'valor_total', 'status_pedido'],
            },
          },
        },
        required: ['success', 'data'],
      },
    },
  }),
};
