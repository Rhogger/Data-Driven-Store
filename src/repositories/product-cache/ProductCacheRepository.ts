import { Redis } from 'ioredis';
import { ProductCacheData } from './ProductCacheInterfaces';

export class ProductCacheRepository {
  private redis: Redis;
  private readonly PRODUCT_TTL = 300;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async set(productData: ProductCacheData): Promise<void> {
    const productKey = `produto:${productData.id_produto}`;
    const serializedData = JSON.stringify(productData);

    await this.redis.set(productKey, serializedData, 'EX', this.PRODUCT_TTL);
  }

  async get(id_produto: string): Promise<ProductCacheData | null> {
    const productKey = `produto:${id_produto}`;
    const cachedData = await this.redis.get(productKey);

    if (!cachedData) {
      return null;
    }

    try {
      await this.redis.expire(productKey, this.PRODUCT_TTL);

      return JSON.parse(cachedData) as ProductCacheData;
    } catch {
      await this.redis.del(productKey);
      return null;
    }
  }

  async exists(id_produto: string): Promise<boolean> {
    const productKey = `produto:${id_produto}`;
    const exists = await this.redis.exists(productKey);
    return exists === 1;
  }
}
