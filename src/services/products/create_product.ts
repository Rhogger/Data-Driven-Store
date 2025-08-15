import { FastifyInstance } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { BrandRepository } from '@repositories/brand/BrandRepository';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { MongoSession, Neo4jTransaction } from '@/types/transactions';

export class CreateProductService {
  constructor(
    private fastify: FastifyInstance,
    private productRepository = new ProductRepository(fastify),
    private brandRepository = new BrandRepository(fastify),
    private categoryRepository = new CategoryRepository(fastify),
  ) {}

  async createProductAtomic(productInput: any) {
    for (const categoriaId of productInput.categorias) {
      const categoriaPg = await this.categoryRepository.findById(Number(categoriaId));
      if (!categoriaPg) throw new Error(`Categoria ${categoriaId} não existe`);
    }

    const mongoSession: MongoSession = await this.productRepository.startMongoTransaction();
    const neo4jSession = this.fastify.neo4j.session();
    const neo4jTx: Neo4jTransaction = neo4jSession.beginTransaction();

    try {
      let brandNode = await this.brandRepository.findByName(productInput.marca, neo4jTx);
      if (!brandNode) {
        const created = await this.brandRepository.createBrand(productInput.marca, neo4jTx);
        if (!created) throw new Error('Falha ao criar marca no Neo4j');
        brandNode = await this.brandRepository.findByName(productInput.marca, neo4jTx);
      }

      for (const categoriaId of productInput.categorias) {
        const categoriaNode = await this.categoryRepository.findByIdNeo4j(categoriaId, neo4jTx);
        if (!categoriaNode) {
          await this.categoryRepository.createCategoryNode(categoriaId, neo4jTx);
        }
      }

      const product = await this.productRepository.create(productInput, mongoSession);

      await this.productRepository.createProductNodeNeo4j(product.id_produto!, neo4jTx);

      for (const categoriaId of product.categorias) {
        await this.productRepository.createRelationships(
          product.id_produto!,
          categoriaId,
          brandNode!.nome,
          neo4jTx,
        );
      }

      await neo4jTx.commit();
      await neo4jSession.close();
      await this.productRepository.commitMongoTransaction(mongoSession);

      return product;
    } catch (err) {
      await neo4jTx.rollback();
      await neo4jSession.close();
      await this.productRepository.rollbackMongoTransaction(mongoSession);
      throw err;
    }
  }
}
