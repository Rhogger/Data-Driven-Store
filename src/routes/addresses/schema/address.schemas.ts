export const addressSchemas = {
  create: () => ({
    summary: 'Criar novo endereço',
    description:
      'Cria um novo endereço para um cliente específico. Valida dados obrigatórios como CEP, logradouro e tipo de endereço.',
    tags: ['Addresses'],
    body: {
      type: 'object',
      required: ['id_cliente', 'id_cidade', 'logradouro', 'numero', 'cep', 'tipo_endereco'],
      properties: {
        id_cliente: { type: 'number' },
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
      400: {
        description: 'Erro de validação',
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
    description: 'Lista todos os endereços cadastrados para um cliente específico.',
    tags: ['Addresses'],
    params: {
      type: 'object',
      required: ['clientId'],
      properties: {
        clientId: { type: 'number' },
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
