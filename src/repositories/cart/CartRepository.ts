import { Redis } from 'ioredis';
import { CartData } from './CartInterfaces';

export class CartRepository {
  private redis: Redis;
  private readonly CART_TTL = 129600;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async create(id_cliente: string): Promise<void> {
    const cartKey = `carrinho:${id_cliente}`;
    await this.redis.del(cartKey);
    await this.redis.expire(cartKey, this.CART_TTL);
  }

  async addProduct(id_cliente: string, id_produto: string, quantidade: number = 1): Promise<void> {
    const cartKey = `carrinho:${id_cliente}`;

    const currentQuantity = await this.redis.hget(cartKey, id_produto);
    const newQuantity = currentQuantity ? parseInt(currentQuantity, 10) + quantidade : quantidade;

    await this.redis.hset(cartKey, id_produto, newQuantity);
    await this.redis.expire(cartKey, this.CART_TTL);
  }

  async removeProduct(id_cliente: string, id_produto: string): Promise<void> {
    const cartKey = `carrinho:${id_cliente}`;
    await this.redis.hdel(cartKey, id_produto);
  }

  async updateProductQuantity(
    id_cliente: string,
    id_produto: string,
    quantidade: number,
  ): Promise<void> {
    const cartKey = `carrinho:${id_cliente}`;

    if (quantidade <= 0) {
      await this.removeProduct(id_cliente, id_produto);
    } else {
      await this.redis.hset(cartKey, id_produto, quantidade);
      await this.redis.expire(cartKey, this.CART_TTL);
    }
  }

  async findByClientId(id_cliente: string): Promise<CartData | null> {
    const cartKey = `carrinho:${id_cliente}`;
    const produtos = await this.redis.hgetall(cartKey);

    if (Object.keys(produtos).length === 0) {
      return null;
    }

    const produtosWithQuantity: Record<string, number> = {};
    for (const [id_produto, quantidade] of Object.entries(produtos)) {
      produtosWithQuantity[id_produto] = parseInt(quantidade, 10);
    }

    return {
      id_cliente,
      produtos: produtosWithQuantity,
    };
  }

  async clear(id_cliente: string): Promise<void> {
    const cartKey = `carrinho:${id_cliente}`;
    await this.redis.del(cartKey);
  }
}
