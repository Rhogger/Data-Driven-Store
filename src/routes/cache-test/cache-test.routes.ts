import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CacheService } from '../../services/cacheService';

interface CacheTestRequest {
  Body: {
    key: string;
    value: any;
    ttl?: number;
  };
}

interface CacheGetRequest {
  Params: {
    key: string;
  };
}

async function cacheSetHandler(
  this: FastifyInstance,
  request: FastifyRequest<CacheTestRequest>,
  reply: FastifyReply,
) {
  try {
    const { key, value, ttl } = request.body;
    const cacheService = new CacheService(this);

    await cacheService.set(key, value, ttl);

    reply.code(200).send({
      success: true,
      message: 'Valor armazenado no cache com sucesso',
      key,
      ttl: ttl || 'sem expiração',
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro ao armazenar no cache',
    });
  }
}

async function cacheGetHandler(
  this: FastifyInstance,
  request: FastifyRequest<CacheGetRequest>,
  reply: FastifyReply,
) {
  try {
    const { key } = request.params;
    const cacheService = new CacheService(this);

    const value = await cacheService.get(key);

    reply.code(200).send({
      success: true,
      key,
      value,
      found: value !== null,
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro ao recuperar do cache',
    });
  }
}

async function cacheInfoHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const cacheService = new CacheService(this);
    const info = await cacheService.getInfo();

    reply.code(200).send({
      success: true,
      redis_info: info,
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro ao obter informações do Redis',
    });
  }
}

export default async function cacheTestRoutes(fastify: FastifyInstance) {
  fastify.post('/cache/set', {
    schema: {
      tags: ['Cache Test'],
      summary: 'Armazenar valor no cache',
      body: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: {
            description: 'Valor a ser armazenado (pode ser qualquer tipo)',
          },
          ttl: {
            type: 'integer',
            description: 'Tempo de vida em segundos (opcional)',
          },
        },
        required: ['key', 'value'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            key: { type: 'string' },
            ttl: {
              oneOf: [{ type: 'integer' }, { type: 'string' }],
            },
          },
        },
      },
    },
    handler: cacheSetHandler,
  });

  fastify.get('/cache/get/:key', {
    schema: {
      tags: ['Cache Test'],
      summary: 'Recuperar valor do cache',
      params: {
        type: 'object',
        properties: {
          key: { type: 'string' },
        },
        required: ['key'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            key: { type: 'string' },
            value: {
              description: 'Valor recuperado do cache',
            },
            found: { type: 'boolean' },
          },
        },
      },
    },
    handler: cacheGetHandler,
  });

  fastify.get('/cache/info', {
    schema: {
      tags: ['Cache Test'],
      summary: 'Obter informações do Redis',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            redis_info: { type: 'string' },
          },
        },
      },
    },
    handler: cacheInfoHandler,
  });
}
