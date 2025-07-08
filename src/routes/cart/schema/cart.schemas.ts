export const cartSchemas = {
  addItem: () => ({
    summary: 'Adicionar item ao carrinho',
    description:
      'Adiciona um produto ao carrinho do cliente autenticado. Se o produto já existir, incrementa a quantidade.',
    tags: ['Cart'],
    body: {
      type: 'object',
      required: ['id_produto'],
      properties: {
        id_produto: { type: 'string', description: 'ID do produto a ser adicionado' },
        quantidade: {
          type: 'number',
          minimum: 1,
          default: 1,
          description: 'Quantidade a adicionar',
        },
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
    tags: ['Cart'],
    body: {
      type: 'object',
      required: ['id_produto'],
      properties: {
        id_produto: { type: 'string', description: 'ID do produto a ser removido' },
        quantidade: { type: 'number', minimum: 1, default: 1, description: 'Quantidade a remover' },
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
    tags: ['Cart'],
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
};
