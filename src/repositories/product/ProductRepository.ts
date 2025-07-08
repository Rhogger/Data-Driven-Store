import { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { Driver } from 'neo4j-driver';
import { Redis } from 'ioredis';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductViewData,
  ProductCacheData,
} from './ProductInterfaces';

export class ProductRepository {
  private fastify: FastifyInstance;
  private neo4jDriver: Driver;
  private redis: Redis;
  private readonly PRODUCT_CACHE_TTL = 300;
  private readonly RANKING_TTL = 604800;

  constructor(fastify: FastifyInstance, neo4jDriver: Driver, redis: Redis) {
    this.fastify = fastify;
    this.neo4jDriver = neo4jDriver;
    this.redis = redis;
  }

  private get mongoCollection() {
    return this.fastify.mongodb.db.collection('products');
  }

  // ===== MONGODB OPERATIONS =====

  async create(product: CreateProductInput): Promise<Product> {
    const productData = {
      ...product,
      reservado: 0,
      disponivel: product.estoque,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await this.mongoCollection.insertOne(productData);
    const createdProduct = {
      ...productData,
      _id: result.insertedId,
      id_produto: result.insertedId.toString(),
    };

    if (result.insertedId) {
      await this.invalidateCache(result.insertedId.toString());
    }

    return createdProduct;
  }

  async findById(id: string): Promise<Product | null> {
    const cached = await this.getFromCache(id);
    if (cached) {
      return cached;
    }

    const product = (await this.mongoCollection.findOne({
      _id: new ObjectId(id),
    })) as any;

    if (product) {
      const normalized = this.normalizeProduct(product);
      await this.saveToCache(normalized);
      return normalized;
    }

    return null;
  }

  async update(id: string, update: UpdateProductInput): Promise<Product | null> {
    const updateData = {
      ...update,
      updated_at: new Date(),
    };

    await this.mongoCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updatedProduct = await this.findById(id);

    if (updatedProduct) {
      await this.saveToCache(updatedProduct);
    }

    return updatedProduct;
  }

  async findAll(): Promise<Product[]> {
    const products = await this.mongoCollection.find({}).toArray();
    return products.map((product: any) => ({
      ...product,
      id_produto: product._id?.toString(),
      reservado: product.reservado ?? 0,
      disponivel: product.disponivel ?? (product.estoque || 0),
    })) as Product[];
  }

  async findLowStock(limiar: number): Promise<any[]> {
    const products = await this.mongoCollection.find({ estoque: { $lt: limiar } }).toArray();

    return products.map((product: any) => this.normalizeProduct(product));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.mongoCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      await this.invalidateCache(id);
      await this.clearProductViews(id);
    }

    return result.deletedCount > 0;
  }

  // ===== AGGREGATION OPERATIONS =====

  async getAveragePriceByBrand(): Promise<any[]> {
    const pipeline = [
      {
        $group: {
          _id: '$marca',
          preco_medio: { $avg: '$preco' },
          total_produtos: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          marca: '$_id',
          preco_medio: { $round: ['$preco_medio', 2] },
          total_produtos: 1,
        },
      },
      { $sort: { marca: 1 } },
    ];

    return this.mongoCollection.aggregate(pipeline).toArray();
  }

  async findByAttributesAndPriceRange(
    filters: {
      atributos?: Record<string, any>;
      preco_min?: number;
      preco_max?: number;
    },
    limit = 20,
    skip = 0,
  ): Promise<Product[]> {
    const query: any = { $and: [] };

    if (filters.atributos && Object.keys(filters.atributos).length > 0) {
      for (const key in filters.atributos) {
        const value = filters.atributos[key];
        if (typeof value === 'string') {
          query.$and.push({ [`atributos.${key}`]: { $regex: new RegExp(`^${value}$`, 'i') } });
        } else {
          query.$and.push({ [`atributos.${key}`]: value });
        }
      }
    }

    const priceFilter: any = {};
    if (filters.preco_min !== undefined) {
      priceFilter.$gte = filters.preco_min;
    }
    if (filters.preco_max !== undefined) {
      priceFilter.$lte = filters.preco_max;
    }

    if (Object.keys(priceFilter).length > 0) {
      query.$and.push({ preco: priceFilter });
    }

    if (query.$and.length === 0) {
      delete query.$and;
    }

    const products = await this.mongoCollection.find(query).skip(skip).limit(limit).toArray();
    return products.map((product: any) => this.normalizeProduct(product));
  }

  async addFieldToProductsByCategory(
    categoryId: number,
    fieldName: string,
    fieldValue: any,
  ): Promise<Product[]> {
    const filter = { categorias: categoryId };
    const update = {
      $set: {
        [fieldName]: fieldValue,
        updated_at: new Date(),
      },
    };

    const result = await this.mongoCollection.updateMany(filter, update);

    if (result.modifiedCount === 0) {
      return [];
    }

    const updatedDocs = await this.mongoCollection.find(filter).toArray();

    const invalidationPromises = updatedDocs.map((doc) => this.invalidateCache(doc._id.toString()));
    await Promise.all(invalidationPromises);

    return updatedDocs.map((doc: any) => this.normalizeProduct(doc));
  }

  async getProductReviews(productId: string): Promise<{ reviews: any[] } | null> {
    const pipeline = [
      { $match: { _id: new ObjectId(productId) } },
      {
        $project: {
          _id: 0,
          reviews: {
            $sortArray: {
              input: { $ifNull: ['$avaliacoes', []] },
              sortBy: { data_avaliacao: -1 },
            },
          },
        },
      },
    ];

    const result = await this.mongoCollection.aggregate<{ reviews: any[] }>(pipeline).toArray();

    return result.length > 0 ? result[0] : null;
  }

  // ===== HELPER METHODS =====

  private normalizeProduct(product: any): Product {
    return {
      ...product,
      id_produto: product.id_produto || product._id?.toString() || product.id || '',
      _id: product._id?.toString?.() || undefined,
      estoque: product.estoque ?? 0,
      reservado: product.reservado ?? 0,
      disponivel: (product.estoque ?? 0) - (product.reservado ?? 0),
      categorias: Array.isArray(product.categorias)
        ? product.categorias
        : product.categorias
          ? [product.categorias]
          : [],
      atributos: product.atributos || {},
      avaliacoes: Array.isArray(product.avaliacoes)
        ? product.avaliacoes
        : product.avaliacoes && typeof product.avaliacoes === 'object'
          ? Object.values(product.avaliacoes)
          : [],
    };
  }

  // ===== NEO4J OPERATIONS =====

  async createRelationships(productId: string, categoryId: string, brandId: string): Promise<void> {
    const session = this.neo4jDriver.session();

    try {
      await session.run(
        `
        MERGE (p:Product {id: $productId})
        MERGE (c:Category {id: $categoryId})
        MERGE (b:Brand {id: $brandId})
        MERGE (p)-[:BELONGS_TO]->(c)
        MERGE (p)-[:MADE_BY]->(b)
        `,
        { productId, categoryId, brandId },
      );
    } finally {
      await session.close();
    }
  }

  async findRelatedProducts(productId: string, limit = 5): Promise<string[]> {
    const session = this.neo4jDriver.session();

    try {
      const result = await session.run(
        `
        MATCH (p:Product {id: $productId})-[:BELONGS_TO]->(c:Category)
        MATCH (related:Product)-[:BELONGS_TO]->(c)
        WHERE related.id <> $productId
        RETURN related.id as id
        LIMIT $limit
        `,
        { productId, limit },
      );

      return result.records.map((record) => record.get('id'));
    } finally {
      await session.close();
    }
  }

  // ===== REDIS CACHE OPERATIONS =====

  private async getFromCache(id: string): Promise<ProductCacheData | null> {
    const cacheKey = `produto:${id}`;
    const cached = await this.redis.get(cacheKey);

    if (!cached) return null;

    try {
      await this.redis.expire(cacheKey, this.PRODUCT_CACHE_TTL);
      return JSON.parse(cached);
    } catch {
      await this.redis.del(cacheKey);
      return null;
    }
  }

  private async saveToCache(product: Product): Promise<void> {
    const productId = product.id_produto || product._id?.toString();

    if (!productId) {
      this.fastify.log.warn({ product }, 'Tentativa de salvar produto no cache sem um ID válido.');
      return;
    }

    const cacheKey = `produto:${productId}`;
    await this.redis.setex(cacheKey, this.PRODUCT_CACHE_TTL, JSON.stringify(product));
  }

  private async invalidateCache(id: string): Promise<void> {
    await this.redis.del(`produto:${id}`);
  }

  // ===== PRODUCT VIEWS OPERATIONS =====

  async incrementView(id_produto: string): Promise<number> {
    const viewKey = `visualizacoes:${id_produto}`;
    const rankingKey = 'ranking:produtos_mais_vistos';

    const newCount = await this.redis.incr(viewKey);
    await this.redis.zadd(rankingKey, newCount, id_produto);
    await this.redis.expire(rankingKey, this.RANKING_TTL);

    return newCount;
  }

  async getViews(id_produto: string): Promise<number> {
    const viewKey = `visualizacoes:${id_produto}`;
    const views = await this.redis.get(viewKey);
    return views ? parseInt(views, 10) : 0;
  }

  async getTopViewed(limit = 10): Promise<ProductViewData[]> {
    const rankingKey = 'ranking:produtos_mais_vistos';
    const results = await this.redis.zrevrange(rankingKey, 0, limit - 1, 'WITHSCORES');

    const ranking: ProductViewData[] = [];
    for (let i = 0; i < results.length; i += 2) {
      ranking.push({
        id_produto: results[i],
        visualizacoes: parseInt(results[i + 1], 10),
      });
    }

    return ranking;
  }

  async getProductRank(id_produto: string): Promise<number | null> {
    const rankingKey = 'ranking:produtos_mais_vistos';
    const rank = await this.redis.zrevrank(rankingKey, id_produto);
    return rank !== null ? rank + 1 : null;
  }

  private async clearProductViews(id_produto: string): Promise<void> {
    const viewKey = `visualizacoes:${id_produto}`;
    const rankingKey = 'ranking:produtos_mais_vistos';

    await this.redis.del(viewKey);
    await this.redis.zrem(rankingKey, id_produto);
  }
}
