export const authSchemas = {
  login: () => ({
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
        description: 'Login realizado com sucesso',
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
      400: {
        description: 'Erro de validação',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
        },
      },
      404: {
        description: 'Usuário não encontrado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
          action: { type: 'string' },
        },
      },
    },
  }),

  register: () => ({
    summary: 'Cadastrar novo cliente',
    description:
      'Registra um novo cliente no sistema. Valida CPF e dados obrigatórios antes de criar a conta. As preferências devem ser informadas como um array de IDs de categorias, são obrigatórias e deve ser inserida pela menos 5.',
    tags: ['Auth'],
    body: {
      type: 'object',
      required: ['nome', 'email', 'cpf', 'telefone', 'preferencias'],
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
        preferencias: {
          type: 'array',
          minItems: 5,
          items: { type: 'integer', minimum: 1 },
          description:
            'Array de IDs de categorias preferidas do cliente. Obrigatório informar pelo menos 5 categorias. Cada valor deve ser um inteiro positivo.',
        },
      },
      additionalProperties: false,
    },
    response: {
      201: {
        description: 'Cliente cadastrado com sucesso',
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
        description: 'Erro de validação',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
        },
      },
      409: {
        description: 'Conflito de dados (email ou CPF já cadastrado)',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
        },
      },
    },
  }),
};
