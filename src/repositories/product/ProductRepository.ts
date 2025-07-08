import { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { Driver } from 'neo4j-driver';
import { Redis } from 'ioredis';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
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
      return cached; // O cache já armazena o objeto normalizado
    }

    // Buscar no MongoDB
    const productFromDb = (await this.mongoCollection.findOne({
      _id: new ObjectId(id),
    })) as any;

    if (productFromDb) {
      const normalizedProduct = this.normalizeProduct(productFromDb); // Normaliza o produto do DB
      // Salvar a versão normalizada e completa no cache
      await this.saveToCache(normalizedProduct);
      return normalizedProduct;
    }

    return null;
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

    return products.map((product: any) => this.normalizeProduct(product));
  }

  /**
   * Buscar produtos com estoque baixo
   */
  async findLowStock(limiar: number): Promise<any[]> {
    const products = await this.mongoCollection.find({ estoque: { $lt: limiar } }).toArray();

    return products.map((product: any) => this.normalizeProduct(product));
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

  // ===== AGGREGATION OPERATIONS =====

  /**
   * Calcular o preço médio por marca usando Aggregation Framework
   */
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

  /**
   * Buscar produtos por atributos e faixa de preço
   */
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

    // Adicionar filtro de atributos
    if (filters.atributos && Object.keys(filters.atributos).length > 0) {
      for (const key in filters.atributos) {
        const value = filters.atributos[key];
        // Usar 'i' para case-insensitive se o valor for string
        if (typeof value === 'string') {
          query.$and.push({ [`atributos.${key}`]: { $regex: new RegExp(`^${value}$`, 'i') } });
        } else {
          query.$and.push({ [`atributos.${key}`]: value });
        }
      }
    }

    // Adicionar filtro de preço
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

    // Se não houver filtros, remover o $and vazio para buscar todos
    if (query.$and.length === 0) {
      delete query.$and;
    }

    const products = await this.mongoCollection.find(query).skip(skip).limit(limit).toArray();
    return products.map((product: any) => this.normalizeProduct(product));
  }

  /**
   * Adiciona um novo campo a todos os produtos de uma categoria específica.
   * @param categoryId - O ID da categoria (do PostgreSQL).
   * @param fieldName - O nome do campo a ser adicionado.
   * @param fieldValue - O valor do campo a ser adicionado.
   * @returns O número de produtos atualizados.
   */
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

    // Após a atualização, buscar os documentos modificados para retorná-los
    const updatedDocs = await this.mongoCollection.find(filter).toArray();

    // Invalidar o cache para cada produto atualizado
    const invalidationPromises = updatedDocs.map((doc) => this.invalidateCache(doc._id.toString()));
    await Promise.all(invalidationPromises);

    return updatedDocs.map((doc: any) => this.normalizeProduct(doc));
  }

  // ===== HELPER METHODS =====

  /**
   * Normaliza o produto para o formato do schema (id_produto, campos calculados, etc.)
   */
  private normalizeProduct(product: any): Product {
    const estoque = product.estoque ?? 0;
    const reservado = product.reservado ?? 0;
    const id_string = product._id?.toString();

    // Cria uma cópia e remove o _id original (que é um ObjectId) para evitar conflitos
    const restOfProduct = { ...product };
    delete restOfProduct._id;

    return {
      ...restOfProduct,
      _id: id_string, // Garante que _id seja uma string para conformidade com o schema
      id_produto: id_string, // Garante que id_produto também seja a string
      estoque: estoque,
      reservado: reservado,
      disponivel: estoque - reservado,
      categorias: Array.isArray(product.categorias) ? product.categorias : [],
      atributos: product.atributos || {},
      avaliacoes: product.avaliacoes || [],
    };
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
  private async getFromCache(id: string): Promise<Product | null> {
    const cacheKey = `produto:${id}`;
    const cached = await this.redis.get(cacheKey);

    if (!cached) return null;

    try {
      // Refresh TTL no acesso
      await this.redis.expire(cacheKey, this.PRODUCT_CACHE_TTL);
      // O cache agora armazena o objeto Product completo.
      return JSON.parse(cached) as Product;
    } catch {
      await this.redis.del(cacheKey);
      return null;
    }
  }

  /**
   * Salvar produto no cache
   */
  private async saveToCache(product: Product): Promise<void> {
    const productId = product.id_produto || product._id?.toString();
    if (!productId) {
      this.fastify.log.warn({ product }, 'Tentativa de salvar produto no cache sem um ID válido.');
      return;
    }

    const cacheKey = `produto:${productId}`;
    // Salva o objeto Product completo, preservando todos os campos dinâmicos.
    await this.redis.setex(cacheKey, this.PRODUCT_CACHE_TTL, JSON.stringify(product));
  }

  /**
   * Invalidar cache do produto
   */
  private async invalidateCache(id: string): Promise<void> {
    await this.redis.del(`produto:${id}`);
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
