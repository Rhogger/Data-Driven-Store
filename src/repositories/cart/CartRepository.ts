import { Redis } from 'ioredis';
import { CartData } from './CartInterfaces';
import { FastifyInstance } from 'fastify';

export class CartRepository {
  private redis: Redis;
  private readonly CART_TTL = 129600;

  constructor(fastify: FastifyInstance) {
    this.redis = fastify.redis;
  }

  async create(id_cliente: string): Promise<void> {
    const cartKey = `carrinho:${id_cliente}`;
    const emptyCart = JSON.stringify({});
    await this.redis.set(cartKey, emptyCart, 'EX', this.CART_TTL);
  }

  async addProduct(id_cliente: number, id_produto: string, quantidade: number = 1): Promise<void> {
    const cartKey = `carrinho:${id_cliente}`;
    let cart: Record<string, number> = {};
    const cartStr = await this.redis.get(cartKey);
    if (cartStr) {
      try {
        cart = JSON.parse(cartStr);
      } catch {
        cart = {};
      }
    }
    cart[id_produto] = (cart[id_produto] || 0) + quantidade;
    await this.redis.set(cartKey, JSON.stringify(cart), 'EX', this.CART_TTL);
  }

  async removeProduct(id_cliente: number, id_produto: string): Promise<void> {
    const cartKey = `carrinho:${id_cliente}`;
    const cartStr = await this.redis.get(cartKey);
    if (!cartStr) return;
    let cart: Record<string, number> = {};
    try {
      cart = JSON.parse(cartStr);
    } catch {
      return;
    }
    delete cart[id_produto];
    await this.redis.set(cartKey, JSON.stringify(cart), 'EX', this.CART_TTL);
  }

  async updateProductQuantity(
    id_cliente: string,
    id_produto: string,
    quantidade: number,
  ): Promise<void> {
    const cartKey = `carrinho:${id_cliente}`;
    const cartStr = await this.redis.get(cartKey);
    if (!cartStr) return;
    let cart: Record<string, number> = {};
    try {
      cart = JSON.parse(cartStr);
    } catch {
      return;
    }
    if (quantidade <= 0) {
      delete cart[id_produto];
    } else {
      cart[id_produto] = quantidade;
    }
    await this.redis.set(cartKey, JSON.stringify(cart), 'EX', this.CART_TTL);
  }

  async findByClientId(id_cliente: number): Promise<CartData | null> {
    const cartKey = `carrinho:${id_cliente}`;
    const cartStr = await this.redis.get(cartKey);
    if (!cartStr) return null;
    try {
      const parsed = JSON.parse(cartStr);
      const produtos: Record<string, number> = {};
      for (const [id_produto, quantidade] of Object.entries(parsed)) {
        produtos[id_produto] = parseInt(quantidade as string, 10);
      }
      return { id_cliente, produtos };
    } catch {
      return null;
    }
  }

  async clear(id_cliente: number): Promise<void> {
    const cartKey = `carrinho:${id_cliente}`;
    await this.redis.del(cartKey);
  }
  async getAllCarts(): Promise<CartData[]> {
    const keys = await this.redis.keys('carrinho:*');
    const carts: CartData[] = [];
    for (const key of keys) {
      const id_cliente: number = parseInt(key.replace('carrinho:', ''), 10);
      const cart = await this.findByClientId(id_cliente);
      if (cart) carts.push(cart);
    }
    return carts;
  }
}
