import { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { Driver } from 'neo4j-driver';
import { Redis } from 'ioredis';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductCacheData,
  ProductViewData,
} from './ProductInterfaces';

export class ProductRepository {
  private fastify: FastifyInstance;
  private neo4jDriver: Driver;
  private redis: Redis;
  private readonly PRODUCT_CACHE_TTL = 300; // 5 minutos
  private readonly RANKING_TTL = 604800; // 1 semana

  constructor(fastify: FastifyInstance, neo4jDriver: Driver, redis: Redis) {
    this.fastify = fastify;
    this.neo4jDriver = neo4jDriver;
    this.redis = redis;
  }

  // MongoDB Collection
  private get mongoCollection() {
    return this.fastify.mongodb.db.collection('products');
  }

  // ===== MONGODB OPERATIONS =====

  /**
   * Criar produto no MongoDB
   */
  async create(product: CreateProductInput): Promise<Product> {
    const productData = {
      ...product,
      reservado: 0, // Campo calculado
      disponivel: product.estoque || 0, // estoque - reservado
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await this.mongoCollection.insertOne(productData);
    const createdProduct = {
      ...productData,
      _id: result.insertedId,
      id_produto: result.insertedId.toString(), // Mapear para id_produto
    };

    // Invalidar cache se existir
    if (result.insertedId) {
      await this.invalidateCache(result.insertedId.toString());
    }

    return createdProduct;
  }

  /**
   * Buscar produto por ID no MongoDB (com cache)
   */
  async findById(id: string): Promise<Product | null> {
    // Tentar buscar no cache primeiro
    const cached = await this.getFromCache(id);
    if (cached) {
      return this.cacheToProduct(cached);
    }

    // Buscar no MongoDB
    const product = (await this.mongoCollection.findOne({
      _id: new ObjectId(id),
    })) as any;

    if (product) {
      // Garantir que tenha os campos obrigatórios
      product.reservado = product.reservado ?? 0;
      product.disponivel = product.disponivel ?? (product.estoque || 0);
      product.id_produto = product._id?.toString(); // Mapear para id_produto

      // Salvar no cache
      await this.saveToCache(product as Product);
    }

    return product as Product | null;
  }

  /**
   * Atualizar produto no MongoDB
   */
  async update(id: string, update: UpdateProductInput): Promise<Product | null> {
    const updateData = {
      ...update,
      updated_at: new Date(),
    };

    await this.mongoCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updatedProduct = await this.findById(id);

    if (updatedProduct) {
      // Atualizar cache
      await this.saveToCache(updatedProduct);
    }

    return updatedProduct;
  }

  /**
   * Listar produtos com paginação
   */
  async findAll(limit = 20, skip = 0): Promise<Product[]> {
    const products = await this.mongoCollection.find({}).skip(skip).limit(limit).toArray();

    // Garantir que todos os produtos tenham os campos obrigatórios
    return products.map((product: any) => ({
      ...product,
      id_produto: product._id?.toString(), // Mapear para id_produto
      reservado: product.reservado ?? 0,
      disponivel: product.disponivel ?? (product.estoque || 0),
    })) as Product[];
  }

  /**
   * Buscar produtos com estoque baixo
   */
  async findLowStock(limiar: number): Promise<any[]> {
    const products = await this.mongoCollection.find({ estoque: { $lt: limiar } }).toArray();

    // Mapear _id para id_produto e garantir campos obrigatórios
    return products.map((product: any) => ({
      ...product,
      id_produto: product._id?.toString(),
      reservado: product.reservado ?? 0,
      disponivel: product.disponivel ?? (product.estoque || 0),
    }));
  }

  /**
   * Deletar produto
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.mongoCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      // Limpar cache
      await this.invalidateCache(id);
      // Limpar visualizações
      await this.clearProductViews(id);
    }

    return result.deletedCount > 0;
  }

  // ===== NEO4J OPERATIONS =====

  /**
   * Criar relacionamentos no Neo4j
   */
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

  /**
   * Buscar produtos relacionados
   */
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

  /**
   * Buscar produto do cache
   */
  private async getFromCache(id: string): Promise<ProductCacheData | null> {
    const cacheKey = `produto:${id}`;
    const cached = await this.redis.get(cacheKey);

    if (!cached) return null;

    try {
      // Refresh TTL no acesso
      await this.redis.expire(cacheKey, this.PRODUCT_CACHE_TTL);
      return JSON.parse(cached) as ProductCacheData;
    } catch {
      await this.redis.del(cacheKey);
      return null;
    }
  }

  /**
   * Salvar produto no cache
   */
  private async saveToCache(product: Product): Promise<void> {
    const cacheData: ProductCacheData = {
      id_produto: product._id?.toString() || product.id || '',
      nome: product.nome,
      descricao: product.descricao,
      preco: product.preco,
      marca: product.marca,
      id_categoria: 1, // TODO: mapear categoria string para ID
      atributos: product.atributos || {},
      avaliacoes: product.avaliacoes || [],
    };

    const cacheKey = `produto:${cacheData.id_produto}`;
    await this.redis.setex(cacheKey, this.PRODUCT_CACHE_TTL, JSON.stringify(cacheData));
  }

  /**
   * Invalidar cache do produto
   */
  private async invalidateCache(id: string): Promise<void> {
    await this.redis.del(`produto:${id}`);
  }

  /**
   * Converter cache para produto
   */
  private cacheToProduct(cached: ProductCacheData): Product {
    return {
      id: cached.id_produto,
      nome: cached.nome,
      descricao: cached.descricao,
      preco: cached.preco,
      marca: cached.marca,
      categorias: cached.id_categoria ? [cached.id_categoria] : [],
      atributos: cached.atributos,
      avaliacoes: cached.avaliacoes,
    };
  }

  // ===== PRODUCT VIEWS OPERATIONS =====

  /**
   * Incrementar visualização de produto
   */
  async incrementView(id_produto: string): Promise<number> {
    const viewKey = `visualizacoes:${id_produto}`;
    const rankingKey = 'ranking:produtos_mais_vistos';

    const newCount = await this.redis.incr(viewKey);
    await this.redis.zadd(rankingKey, newCount, id_produto);
    await this.redis.expire(rankingKey, this.RANKING_TTL);

    return newCount;
  }

  /**
   * Buscar visualizações de um produto
   */
  async getViews(id_produto: string): Promise<number> {
    const viewKey = `visualizacoes:${id_produto}`;
    const views = await this.redis.get(viewKey);
    return views ? parseInt(views, 10) : 0;
  }

  /**
   * Buscar ranking dos produtos mais vistos
   */
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

  /**
   * Buscar posição no ranking
   */
  async getProductRank(id_produto: string): Promise<number | null> {
    const rankingKey = 'ranking:produtos_mais_vistos';
    const rank = await this.redis.zrevrank(rankingKey, id_produto);
    return rank !== null ? rank + 1 : null;
  }

  /**
   * Limpar visualizações de um produto
   */
  private async clearProductViews(id_produto: string): Promise<void> {
    const viewKey = `visualizacoes:${id_produto}`;
    const rankingKey = 'ranking:produtos_mais_vistos';

    await this.redis.del(viewKey);
    await this.redis.zrem(rankingKey, id_produto);
  }
}
