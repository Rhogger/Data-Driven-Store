export const cartSchemas = {
  addItem: () => ({
    summary: 'Adicionar item ao carrinho',
    description:
      'Adiciona um produto ao carrinho do cliente autenticado. Se o produto já existir, incrementa a quantidade.',
    tags: ['Carts'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['id_produto'],
      properties: {
        id_produto: { type: 'string', description: 'ID do produto a ser adicionado' },
      },
    },
    response: {
      200: {
        description: 'Item adicionado ao carrinho',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      400: {
        description: 'Erro de validação',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      401: {
        description: 'Usuário não autenticado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    },
  }),

  removeItem: () => ({
    summary: 'Remover item do carrinho',
    description:
      'Remove ou decrementa a quantidade de um produto do carrinho do cliente autenticado.',
    tags: ['Carts'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['id_produto'],
      properties: {
        id_produto: { type: 'string', description: 'ID do produto a ser removido' },
      },
    },
    response: {
      200: {
        description: 'Item removido do carrinho',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      400: {
        description: 'Erro de validação',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      401: {
        description: 'Usuário não autenticado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      404: {
        description: 'Produto não encontrado no carrinho',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    },
  }),

  clear: () => ({
    summary: 'Limpar carrinho',
    description: 'Remove todos os itens do carrinho do cliente autenticado.',
    tags: ['Carts'],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: 'Carrinho limpo com sucesso',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      401: {
        description: 'Usuário não autenticado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    },
  }),
  getCartByClient: () => ({
    summary: 'Obter carrinho do cliente autenticado',
    description: 'Retorna o carrinho do cliente autenticado (id_cliente extraído do JWT).',
    tags: ['Carts'],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: 'Carrinho encontrado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id_cliente: { type: 'integer' },
              produtos: {
                type: 'object',
                additionalProperties: { type: 'integer' },
              },
            },
          },
        },
      },
      404: {
        description: 'Carrinho não encontrado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
        },
      },
    },
  }),

  getAllCarts: () => ({
    summary: 'Listar todos os carrinhos',
    description: 'Retorna todos os carrinhos cadastrados no sistema.',
    tags: ['Carts'],
    response: {
      200: {
        description: 'Lista de carrinhos',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id_cliente: { type: 'integer' },
                produtos: {
                  type: 'object',
                  additionalProperties: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
  }),
};
