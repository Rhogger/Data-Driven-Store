import { FastifyInstance } from 'fastify';

export class CacheService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Armazena um valor no cache com TTL opcional
   */
  async set(key: string, value: any, ttlInSeconds?: number): Promise<void> {
    const stringValue = JSON.stringify(value);

    if (ttlInSeconds) {
      await this.fastify.redis.setex(key, ttlInSeconds, stringValue);
    } else {
      await this.fastify.redis.set(key, stringValue);
    }
  }

  /**
   * Recupera um valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.fastify.redis.get(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.fastify.log.error('Erro ao fazer parse do valor do cache:', error);
      return null;
    }
  }

  /**
   * Remove um valor do cache
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.fastify.redis.del(key);
    return result === 1;
  }

  /**
   * Verifica se uma chave existe no cache
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.fastify.redis.exists(key);
    return result === 1;
  }

  /**
   * Define um TTL para uma chave existente
   */
  async expire(key: string, ttlInSeconds: number): Promise<boolean> {
    const result = await this.fastify.redis.expire(key, ttlInSeconds);
    return result === 1;
  }

  /**
   * Incrementa um valor numérico no cache
   */
  async increment(key: string, increment: number = 1): Promise<number> {
    return await this.fastify.redis.incrby(key, increment);
  }

  /**
   * Limpa todas as chaves do cache (use com cuidado!)
   */
  async flush(): Promise<void> {
    await this.fastify.redis.flushdb();
  }

  /**
   * Obtém informações sobre o Redis
   */
  async getInfo(): Promise<string> {
    return await this.fastify.redis.info();
  }
}
