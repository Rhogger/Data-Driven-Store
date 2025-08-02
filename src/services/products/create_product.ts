import { FastifyInstance } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { BrandRepository } from '@repositories/brand/BrandRepository';
import { CategoryRepository } from '@repositories/category/CategoryRepository';

export class CreateProductService {
  constructor(
    private fastify: FastifyInstance,
    private productRepository = new ProductRepository(fastify),
    private brandRepository = new BrandRepository(fastify),
    private categoryRepository = new CategoryRepository(fastify),
  ) {}

  async createProductAtomic(productInput: any) {
    const product = await this.productRepository.create(productInput);
    const session = this.fastify.neo4j.session();
    const tx = session.beginTransaction();
    try {
      let brandNode = await this.brandRepository.findByName(product.marca, tx);
      if (!brandNode) {
        const created = await this.brandRepository.createBrand(product.marca, tx);
        if (!created) throw new Error('Erro ao criar marca no Neo4j');
        brandNode = await this.brandRepository.findByName(product.marca, tx);
      }

      for (const categoriaId of product.categorias) {
        const categoriaNode = await this.categoryRepository.findByIdNeo4j(String(categoriaId), tx);
        if (!categoriaNode) {
          const categoriaPg = await this.categoryRepository.findById(Number(categoriaId));
          if (!categoriaPg) throw new Error(`Categoria ${categoriaId} não existe`);
          await this.categoryRepository.createCategoryNode(
            {
              id_categoria: String(categoriaPg.id_categoria),
              nome: categoriaPg.nome,
            },
            tx,
          );
        }
      }

      await this.productRepository.createProductNodeNeo4j(product, tx);

      for (const categoriaId of product.categorias) {
        await this.productRepository.createRelationships(
          product.id_produto!,
          String(categoriaId),
          brandNode!.nome,
          tx,
        );
      }

      await tx.commit();
      await session.close();
      return product;
    } catch (err) {
      await tx.rollback();
      await session.close();
      await this.productRepository.delete(product.id_produto!);
      throw err;
    }
  }
}
