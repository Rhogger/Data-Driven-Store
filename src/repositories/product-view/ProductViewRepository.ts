import { Redis } from 'ioredis';
import { ProductViewData } from './ProductViewInterfaces';

export class ProductViewRepository {
  private redis: Redis;
  private readonly RANKING_TTL = 604800; // 1 semana em segundos

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Incrementar visualização de um produto
   */
  async incrementView(id_produto: string): Promise<number> {
    const viewKey = `visualizacoes:${id_produto}`;
    const rankingKey = 'ranking:produtos_mais_vistos';

    // Incrementa o contador de visualizações
    const newCount = await this.redis.incr(viewKey);

    // Atualiza o ranking (sorted set)
    await this.redis.zadd(rankingKey, newCount, id_produto);

    // Define TTL para o ranking
    await this.redis.expire(rankingKey, this.RANKING_TTL);

    return newCount;
  }

  /**
   * Buscar número de visualizações de um produto
   */
  async getViews(id_produto: string): Promise<number> {
    const viewKey = `visualizacoes:${id_produto}`;
    const views = await this.redis.get(viewKey);
    return views ? parseInt(views, 10) : 0;
  }

  /**
   * Buscar ranking dos produtos mais vistos
   */
  async getTopViewed(limit: number = 10): Promise<ProductViewData[]> {
    const rankingKey = 'ranking:produtos_mais_vistos';

    // Busca os produtos ordenados por visualizações (decrescente)
    const results = await this.redis.zrevrange(rankingKey, 0, limit - 1, 'WITHSCORES');

    const ranking: ProductViewData[] = [];

    // Processa os resultados (produto, score, produto, score...)
    for (let i = 0; i < results.length; i += 2) {
      const id_produto = results[i];
      const visualizacoes = parseInt(results[i + 1], 10);

      ranking.push({
        id_produto,
        visualizacoes,
      });
    }

    return ranking;
  }

  /**
   * Buscar posição de um produto no ranking
   */
  async getProductRank(id_produto: string): Promise<number | null> {
    const rankingKey = 'ranking:produtos_mais_vistos';
    const rank = await this.redis.zrevrank(rankingKey, id_produto);

    // zrevrank retorna null se o produto não estiver no ranking
    // Adiciona 1 porque o rank começa em 0
    return rank !== null ? rank + 1 : null;
  }
}
