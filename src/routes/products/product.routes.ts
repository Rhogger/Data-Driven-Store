import { FastifyPluginAsync } from 'fastify';
import { ProductRepository, Product } from '@repositories/mongodb/ProductRepository';

interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  stock: number;
  tags?: string[];
}

interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  stock?: number;
  tags?: string[];
}

const productRoutes: FastifyPluginAsync = async (fastify) => {
  // Criar produto
  fastify.post<{
    Body: CreateProductInput;
  }>('/products', async (request, reply) => {
    try {
      const { price, stock } = request.body;

      // Validações diretas na rota
      if (price <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Preço deve ser maior que zero',
        });
      }

      if (stock < 0) {
        return reply.status(400).send({
          success: false,
          error: 'Estoque não pode ser negativo',
        });
      }

      const productRepository = new ProductRepository(fastify);
      const product = await productRepository.create(request.body);

      return reply.status(201).send({
        success: true,
        data: product,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar produto',
      });
    }
  });

  // Buscar produto por ID
  fastify.get<{
    Params: { id: string };
  }>('/products/:id', async (request, reply) => {
    try {
      const productRepository = new ProductRepository(fastify);
      const product = await productRepository.findById(request.params.id);

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: 'Produto não encontrado',
        });
      }

      return reply.send({
        success: true,
        data: product,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar produto',
      });
    }
  });

  // Listar produtos com paginação
  fastify.get<{
    Querystring: { page?: string; pageSize?: string };
  }>('/products', async (request, reply) => {
    try {
      const page = parseInt(request.query.page || '1', 10);
      const pageSize = parseInt(request.query.pageSize || '10', 10);
      const skip = (page - 1) * pageSize;

      const productRepository = new ProductRepository(fastify);
      const products = await productRepository.findAll(pageSize, skip);

      return reply.send({
        success: true,
        data: products,
        pagination: {
          page,
          pageSize,
          hasMore: products.length === pageSize,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar produtos',
      });
    }
  });

  // Buscar produtos por categoria
  fastify.get<{
    Params: { categoryId: string };
    Querystring: { limit?: string };
  }>('/products/category/:categoryId', async (request, reply) => {
    try {
      const limit = parseInt(request.query.limit || '10', 10);
      const productRepository = new ProductRepository(fastify);
      const products = await productRepository.findByCategoryId(request.params.categoryId, limit);

      return reply.send({
        success: true,
        data: products,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar produtos por categoria',
      });
    }
  });

  // Atualizar produto
  fastify.put<{
    Params: { id: string };
    Body: UpdateProductInput;
  }>('/products/:id', async (request, reply) => {
    try {
      const { price, stock } = request.body;

      // Validações diretas na rota
      if (price !== undefined && price <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Preço deve ser maior que zero',
        });
      }

      if (stock !== undefined && stock < 0) {
        return reply.status(400).send({
          success: false,
          error: 'Estoque não pode ser negativo',
        });
      }

      const productRepository = new ProductRepository(fastify);
      const product = await productRepository.update(request.params.id, request.body);

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: 'Produto não encontrado',
        });
      }

      return reply.send({
        success: true,
        data: product,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar produto',
      });
    }
  });

  // Deletar produto
  fastify.delete<{
    Params: { id: string };
  }>('/products/:id', async (request, reply) => {
    try {
      const productRepository = new ProductRepository(fastify);
      
      // Verificar se o produto existe antes de deletar
      const existingProduct = await productRepository.findById(request.params.id);
      if (!existingProduct) {
        return reply.status(404).send({
          success: false,
          error: 'Produto não encontrado',
        });
      }

      const deleted = await productRepository.delete(request.params.id);

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: 'Produto não encontrado',
        });
      }

      return reply.send({
        success: true,
        message: 'Produto deletado com sucesso',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar produto',
      });
    }
  });

  // Buscar produtos por nome
  fastify.get<{
    Querystring: { q: string; limit?: string };
  }>('/products/search', async (request, reply) => {
    try {
      // Validação direta na rota
      if (!request.query.q || !request.query.q.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Termo de busca não pode estar vazio',
        });
      }

      const limit = parseInt(request.query.limit || '10', 10);
      const productRepository = new ProductRepository(fastify);
      const products = await productRepository.searchByName(request.query.q, limit);

      return reply.send({
        success: true,
        data: products,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar produtos',
      });
    }
  });

  // Buscar produtos por tags
  fastify.post<{
    Body: { tags: string[]; limit?: number };
  }>('/products/by-tags', async (request, reply) => {
    try {
      const { tags, limit = 10 } = request.body;

      // Validação direta na rota
      if (!tags || !tags.length) {
        return reply.status(400).send({
          success: false,
          error: 'Pelo menos uma tag deve ser fornecida',
        });
      }

      const productRepository = new ProductRepository(fastify);
      const products = await productRepository.findByTags(tags, limit);

      return reply.send({
        success: true,
        data: products,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar produtos por tags',
      });
    }
  });

  // Estatísticas por categoria
  fastify.get('/products/stats/by-category', async (request, reply) => {
    try {
      const productRepository = new ProductRepository(fastify);
      const result = await productRepository.countByCategory();
      
      // Transformar o resultado para manter compatibilidade
      const stats = result.map((item) => ({
        categoryId: item._id,
        count: item.count,
      }));

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas',
      });
    }
  });

  // Ajustar estoque
  fastify.patch<{
    Params: { id: string };
    Body: { quantity: number };
  }>('/products/:id/stock', async (request, reply) => {
    try {
      const productRepository = new ProductRepository(fastify);
      
      // Verificar se o produto existe
      const existingProduct = await productRepository.findById(request.params.id);
      if (!existingProduct) {
        return reply.status(404).send({
          success: false,
          error: 'Produto não encontrado',
        });
      }

      // Calcular novo estoque e validar
      const newStock = existingProduct.stock + request.body.quantity;
      if (newStock < 0) {
        return reply.status(400).send({
          success: false,
          error: 'Estoque resultante não pode ser negativo',
        });
      }

      const product = await productRepository.update(request.params.id, { stock: newStock });

      return reply.send({
        success: true,
        data: product,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao ajustar estoque',
      });
    }
  });
};

export default productRoutes;
