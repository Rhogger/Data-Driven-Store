export const authSchemas = {
  login: {
    summary: 'Realizar login do usuário',
    description:
      'Autentica um usuário no sistema usando seu email. Retorna os dados do cliente se encontrado.',
    tags: ['Auth'],
    body: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'Email do cliente',
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              cliente: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  nome: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              sessao: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  refresh_token: { type: 'string' },
                },
              },
            },
          },
        },
      },
      404: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
          action: { type: 'string' },
        },
      },
      400: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
        },
      },
    },
  },

  register: {
    summary: 'Cadastrar novo cliente',
    description:
      'Registra um novo cliente no sistema. Valida CPF e dados obrigatórios antes de criar a conta.',
    tags: ['Auth'],
    body: {
      type: 'object',
      required: ['nome', 'email', 'cpf', 'telefone'],
      properties: {
        nome: {
          type: 'string',
          minLength: 2,
          description: 'Nome completo do cliente',
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Email do cliente',
        },
        cpf: {
          type: 'string',
          description: 'CPF do cliente (11 dígitos)',
        },
        telefone: {
          type: 'string',
          description: 'Telefone do cliente (10-11 dígitos)',
        },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              cliente: {
                type: 'object',
                properties: {
                  id_cliente: { type: 'number' },
                  nome: { type: 'string' },
                  email: { type: 'string' },
                  cpf: { type: 'string' },
                  telefone: { type: 'string' },
                  created_at: { type: 'string' },
                },
              },
            },
          },
          message: { type: 'string' },
        },
      },
      400: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
        },
      },
      409: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
        },
      },
    },
  },
};
