import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import { randomBytes } from 'crypto';
import { SessionData } from './SessionInterfaces';

export class SessionRepository {
  private redis: Redis;
  private readonly TOKEN_TTL = 1200; // 20 minutos em segundos
  private readonly REFRESH_TTL = 3600; // 1 hora em segundos

  constructor(fastify: FastifyInstance) {
    this.redis = fastify.redis;
  }

  /**
   * Criar uma nova sessão (gera tokens internamente)
   */
  async create(id_cliente: string): Promise<SessionData> {
    // Gerar tokens internamente
    const token = randomBytes(32).toString('hex');
    const refresh_token = randomBytes(32).toString('hex');

    const sessionKey = `sessao:${id_cliente}`;
    const tokenKey = `token:${token}`;
    const refreshKey = `refresh:${refresh_token}`;

    const sessionObject = {
      token,
      refresh_token,
    };

    // Armazenar sessão principal
    await this.redis.hset(sessionKey, sessionObject);

    // Armazenar token com TTL
    await this.redis.setex(tokenKey, this.TOKEN_TTL, id_cliente);

    // Armazenar refresh token com TTL
    await this.redis.setex(refreshKey, this.REFRESH_TTL, id_cliente);

    return {
      id_cliente,
      token,
      refresh_token,
    };
  }

  /**
   * Buscar sessão por ID do cliente com lógica de refresh automático
   */
  async findByClientId(id_cliente: string): Promise<SessionData | null> {
    const sessionKey = `sessao:${id_cliente}`;
    const sessionData = await this.redis.hgetall(sessionKey);

    if (!sessionData.token || !sessionData.refresh_token) {
      return null;
    }

    // Verificar se o token ainda é válido
    const tokenKey = `token:${sessionData.token}`;
    const tokenExists = await this.redis.exists(tokenKey);

    if (tokenExists) {
      // Token ainda válido, renovar TTL
      await this.redis.expire(tokenKey, this.TOKEN_TTL);
      return {
        id_cliente,
        token: sessionData.token,
        refresh_token: sessionData.refresh_token,
      };
    }

    // Token expirado, verificar refresh token
    const refreshKey = `refresh:${sessionData.refresh_token}`;
    const refreshExists = await this.redis.exists(refreshKey);

    if (refreshExists) {
      // Refresh token válido, gerar novo token
      const newToken = randomBytes(32).toString('hex');
      const newTokenKey = `token:${newToken}`;

      // Atualizar sessão com novo token
      await this.redis.hset(sessionKey, 'token', newToken);
      await this.redis.setex(newTokenKey, this.TOKEN_TTL, id_cliente);

      // Renovar refresh token TTL
      await this.redis.expire(refreshKey, this.REFRESH_TTL);

      return {
        id_cliente,
        token: newToken,
        refresh_token: sessionData.refresh_token,
      };
    }

    // Ambos os tokens expiraram
    await this.redis.del(sessionKey);
    return null;
  }

  /**
   * Validar token
   */
  async validateToken(token: string): Promise<string | null> {
    const tokenKey = `token:${token}`;
    const id_cliente = await this.redis.get(tokenKey);

    if (id_cliente) {
      // Renovar TTL do token válido
      await this.redis.expire(tokenKey, this.TOKEN_TTL);
    }

    return id_cliente;
  }
}
