import { FastifyInstance } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { BrandRepository } from '@repositories/brand/BrandRepository';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { MongoSession, Neo4jTransaction } from '@/types/transactions';

interface UpdateProductInput {
  nome?: string;
  descricao?: string;
  marca?: string;
  preco?: number;
  categorias?: number[];
  atributos?: Record<string, any>;
}

export class UpdateProductService {
  constructor(
    private fastify: FastifyInstance,
    private productRepository = new ProductRepository(fastify),
    private brandRepository = new BrandRepository(fastify),
    private categoryRepository = new CategoryRepository(fastify),
  ) {}

  async updateProductAtomic(productId: string, updateInput: UpdateProductInput) {
    // Check if product exists
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new Error('Produto não encontrado');
    }

    // Check if brand or categories changed
    const brandChanged = updateInput.marca && updateInput.marca !== existingProduct.marca;
    const categoriesChanged =
      updateInput.categorias &&
      JSON.stringify(updateInput.categorias.sort()) !==
        JSON.stringify(existingProduct.categorias.sort());

    // If neither brand nor categories changed, just update MongoDB
    if (!brandChanged && !categoriesChanged) {
      return await this.productRepository.update(productId, updateInput);
    }

    // Start MongoDB transaction
    const mongoSession: MongoSession = await this.productRepository.startMongoTransaction();

    // Start Neo4j transaction for relationship updates
    const session = this.fastify.neo4j.session();
    const tx: Neo4jTransaction = session.beginTransaction();

    try {
      // Handle brand change
      if (brandChanged) {
        await this.updateProductBrand(productId, updateInput.marca!, tx);
      }

      // Handle categories change
      if (categoriesChanged) {
        await this.updateProductCategories(
          productId,
          existingProduct.categorias,
          updateInput.categorias!,
          tx,
        );
      }

      // Commit Neo4j transaction first
      await tx.commit();
      await session.close();

      // Update MongoDB with transaction only after Neo4j success
      const updatedProduct = await this.productRepository.update(
        productId,
        updateInput,
        mongoSession,
      );
      if (!updatedProduct) {
        throw new Error('Falha ao atualizar produto no MongoDB');
      }

      // Commit MongoDB transaction
      await this.productRepository.commitMongoTransaction(mongoSession);

      return updatedProduct;
    } catch (error) {
      // Rollback both transactions
      try {
        await tx.rollback();
        await session.close();
      } catch {
        // Ignore rollback errors
      }

      try {
        await this.productRepository.rollbackMongoTransaction(mongoSession);
      } catch {
        // Ignore rollback errors
      }

      throw error;
    }
  }

  private async updateProductBrand(productId: string, newBrandName: string, tx: Neo4jTransaction) {
    // Check if new brand exists, create if not
    let brandNode = await this.brandRepository.findByName(newBrandName, tx);
    if (!brandNode) {
      const created = await this.brandRepository.createBrand(newBrandName, tx);
      if (!created) throw new Error('Falha ao criar nova marca no Neo4j');
      brandNode = await this.brandRepository.findByName(newBrandName, tx);
    }

    // Remove old brand relationship and create new one
    await this.productRepository.deleteProductRelationshipsByType(productId, 'PRODUZIDO_POR', tx);
    await this.productRepository.createProductBrandRelationship(productId, brandNode!.nome, tx);
  }

  private async updateProductCategories(
    productId: string,
    oldCategories: number[],
    newCategories: number[],
    tx: Neo4jTransaction,
  ) {
    const oldCategoryIds = oldCategories.map(String);
    const newCategoryIds = newCategories.map(String);

    // Find categories to remove and add
    const categoriesToRemove = oldCategoryIds.filter((id) => !newCategoryIds.includes(id));
    const categoriesToAdd = newCategoryIds.filter((id) => !oldCategoryIds.includes(id));

    // Remove relationships for categories no longer used
    for (const categoryId of categoriesToRemove) {
      await tx.run(
        `
        MATCH (p:Produto {id_produto: $productId})-[r:PERTENCE_A]->(c:Categoria {id_categoria: $categoryId})
        DELETE r
        `,
        { productId, categoryId: Number(categoryId) },
      );
    }

    // Add relationships for new categories
    for (const categoryId of categoriesToAdd) {
      // Check if category exists in Neo4j, create if not
      const categoryNode = await this.categoryRepository.findByIdNeo4j(Number(categoryId), tx);
      if (!categoryNode) {
        const categoryFromPg = await this.categoryRepository.findById(Number(categoryId));
        if (!categoryFromPg) throw new Error(`Categoria ${categoryId} não existe`);

        await this.categoryRepository.createCategoryNode(categoryFromPg.id_categoria, tx);
      }

      // Create relationship
      await this.productRepository.createProductCategoryRelationship(
        productId,
        Number(categoryId),
        tx,
      );
    }
  }
}
