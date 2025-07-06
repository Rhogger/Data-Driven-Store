import { FastifyInstance } from 'fastify';
import { Client as CassandraClient } from 'cassandra-driver';
import { Pool } from 'pg';
import { Db, MongoClient } from 'mongodb';
import { Driver } from 'neo4j-driver';
import { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    cassandra: CassandraClient;
    pg: Pool;
    mongodb: { client: MongoClient; db: Db };
    neo4j: Driver;
    redis: Redis;
  }
}

export default async function databaseTestRoutes(fastify: FastifyInstance) {
  // Redis Ping
  fastify.get(
    '/redis/ping',
    {
      schema: {
        tags: ['Database Tests'],
        summary: 'Testa conexão com Redis',
        description: 'Endpoint para verificar se a conexão com Redis está funcionando',
        response: {
          200: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'PONG' },
              status: { type: 'string', example: 'ok' },
            },
          },
          500: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'error' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await fastify.redis.ping();
        return { ping: result, status: 'ok' };
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  );

  // PostgreSQL Ping
  fastify.get(
    '/postgres/ping',
    {
      schema: {
        tags: ['Database Tests'],
        summary: 'Testa conexão com PostgreSQL',
        description: 'Endpoint para verificar se a conexão com PostgreSQL está funcionando',
        response: {
          200: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'pong' },
              status: { type: 'string', example: 'ok' },
            },
          },
          500: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'error' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        await fastify.pg.query('SELECT 1');
        return { ping: 'pong', status: 'ok' };
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  );

  // MongoDB Ping
  fastify.get(
    '/mongodb/ping',
    {
      schema: {
        tags: ['Database Tests'],
        summary: 'Testa conexão com MongoDB',
        description: 'Endpoint para verificar se a conexão com MongoDB está funcionando',
        response: {
          200: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'pong' },
              status: { type: 'string', example: 'ok' },
            },
          },
          500: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'error' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        await fastify.mongodb.client.db().admin().ping();
        return { ping: 'pong', status: 'ok' };
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  );

  // Neo4j Ping
  fastify.get(
    '/neo4j/ping',
    {
      schema: {
        tags: ['Database Tests'],
        summary: 'Testa conexão com Neo4j',
        description: 'Endpoint para verificar se a conexão com Neo4j está funcionando',
        response: {
          200: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'pong' },
              status: { type: 'string', example: 'ok' },
            },
          },
          500: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'error' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        await fastify.neo4j.executeQuery('RETURN 1 as ping');
        return { ping: 'pong', status: 'ok' };
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  );

  // Cassandra Ping
  fastify.get(
    '/cassandra/ping',
    {
      schema: {
        tags: ['Database Tests'],
        summary: 'Testa conexão com Cassandra',
        description: 'Endpoint para verificar se a conexão com Cassandra está funcionando',
        response: {
          200: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'pong' },
              status: { type: 'string', example: 'ok' },
            },
          },
          500: {
            type: 'object',
            properties: {
              ping: { type: 'string', example: 'error' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        await fastify.cassandra.execute('SELECT now() FROM system.local');
        return { ping: 'pong', status: 'ok' };
      } catch (err: any) {
        return reply.status(500).send({ ping: 'error', error: err?.message || 'Unknown error' });
      }
    },
  );
}
