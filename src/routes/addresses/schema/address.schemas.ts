export const addressSchemas = {
  create: () => ({
    summary: 'Criar novo endereço',
    description:
      'Cria um novo endereço para um cliente específico. Valida dados obrigatórios como CEP, logradouro e tipo de endereço.',
    tags: ['Addresses'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['id_cidade', 'logradouro', 'numero', 'cep', 'tipo_endereco'],
      properties: {
        id_cidade: { type: 'number' },
        logradouro: { type: 'string' },
        numero: { type: 'string' },
        complemento: { type: 'string' },
        bairro: { type: 'string' },
        cep: { type: 'string' },
        tipo_endereco: {
          type: 'string',
          enum: ['Residencial', 'Comercial', 'Entrega', 'Cobranca'],
        },
      },
    },
    response: {
      201: {
        description: 'Endereço criado com sucesso',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id_endereco: { type: 'number' },
              id_cliente: { type: 'number' },
              id_cidade: { type: 'number' },
              logradouro: { type: 'string' },
              numero: { type: 'string' },
              complemento: { type: 'string' },
              bairro: { type: 'string' },
              cep: { type: 'string' },
              tipo_endereco: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  }),

  update: () => ({
    summary: 'Atualizar endereço',
    description: 'Atualiza um endereço existente do cliente autenticado.',
    tags: ['Addresses'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' },
      },
    },
    body: {
      type: 'object',
      properties: {
        id_cidade: { type: 'number' },
        logradouro: { type: 'string' },
        numero: { type: 'string' },
        complemento: { type: 'string' },
        bairro: { type: 'string' },
        cep: { type: 'string' },
        tipo_endereco: {
          type: 'string',
          enum: ['Residencial', 'Comercial', 'Entrega', 'Cobranca'],
        },
      },
      additionalProperties: false,
    },
    response: {
      200: {
        description: 'Endereço atualizado com sucesso',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id_endereco: { type: 'number' },
              id_cliente: { type: 'number' },
              id_cidade: { type: 'number' },
              logradouro: { type: 'string' },
              numero: { type: 'string' },
              complemento: { type: 'string' },
              bairro: { type: 'string' },
              cep: { type: 'string' },
              tipo_endereco: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      404: {
        description: 'Endereço não encontrado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    },
  }),

  remove: () => ({
    summary: 'Excluir endereço',
    description: 'Exclui um endereço do cliente autenticado.',
    tags: ['Addresses'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' },
      },
    },
    response: {
      200: {
        description: 'Endereço excluído com sucesso',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      403: {
        description: 'Acesso negado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      404: {
        description: 'Endereço não encontrado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    },
  }),

  findById: () => ({
    summary: 'Buscar endereço por ID',
    description: 'Busca um endereço específico pelo seu ID único no sistema.',
    tags: ['Addresses'],
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'number' },
      },
    },
    response: {
      200: {
        description: 'Endereço encontrado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id_endereco: { type: 'number' },
              id_cliente: { type: 'number' },
              logradouro: { type: 'string' },
              numero: { type: 'string' },
              complemento: { type: 'string' },
              bairro: { type: 'string' },
              cep: { type: 'string' },
              tipo_endereco: { type: 'string' },
              cidade: { type: 'string' },
              estado: { type: 'string' },
              uf: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      404: {
        description: 'Endereço não encontrado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    },
  }),

  findByClientId: () => ({
    summary: 'Buscar endereços por cliente',
    description:
      'Lista todos os endereços cadastrados para um cliente específico, se não informar o id_cliente, lista todos os endereços do cliente autenticado.',
    tags: ['Addresses'],
    security: [{ bearerAuth: [] }],
    querystring: {
      type: 'object',
      properties: {
        id_cliente: { type: 'number' },
      },
    },
    response: {
      200: {
        description: 'Endereços encontrados',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id_endereco: { type: 'number' },
                id_cliente: { type: 'number' },
                logradouro: { type: 'string' },
                numero: { type: 'string' },
                complemento: { type: 'string' },
                bairro: { type: 'string' },
                cep: { type: 'string' },
                tipo_endereco: { type: 'string' },
                cidade: { type: 'string' },
                estado: { type: 'string' },
                uf: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }),
};
