import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import { SessionData } from './SessionInterfaces';

export class SessionRepository {
  private redis: Redis;
  private readonly TOKEN_TTL = 3600;

  constructor(fastify: FastifyInstance) {
    this.redis = fastify.redis;
  }

  async create(id_cliente: string, token: string): Promise<SessionData> {
    const sessionKey = `sessao:${id_cliente}`;
    const tokenKey = `token:${token}`;

    const sessionObject = {
      token,
    };

    await this.redis.hset(sessionKey, sessionObject);

    await this.redis.setex(tokenKey, this.TOKEN_TTL, id_cliente);

    return {
      id_cliente,
      token,
    };
  }

  async findByClientId(id_cliente: string): Promise<SessionData | null> {
    const sessionKey = `sessao:${id_cliente}`;
    const sessionData = await this.redis.hgetall(sessionKey);

    if (!sessionData.token) {
      return null;
    }

    const tokenKey = `token:${sessionData.token}`;
    const tokenExists = await this.redis.exists(tokenKey);

    if (tokenExists) {
      await this.redis.expire(tokenKey, this.TOKEN_TTL);
      return {
        id_cliente,
        token: sessionData.token,
      };
    }

    await this.redis.del(sessionKey);
    return null;
  }

  async validateToken(token: string): Promise<string | null> {
    const tokenKey = `token:${token}`;
    const id_cliente = await this.redis.get(tokenKey);

    if (id_cliente) {
      await this.redis.expire(tokenKey, this.TOKEN_TTL);
    }

    return id_cliente;
  }
}
