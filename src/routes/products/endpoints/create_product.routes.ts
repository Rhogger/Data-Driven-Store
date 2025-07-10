import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

interface CreateProductInput {
  nome: string;
  descricao: string;
  marca: string;
  preco: number;
  categorias: number[];
  estoque: number;
  atributos?: Record<string, any>;
}

const createProductRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: CreateProductInput;
  }>('/products', {
    schema: productSchemas.create(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const { body } = request;

        if ('reservado' in body) {
          return reply.status(400).send({
            success: false,
            error: 'Campo "reservado" não é permitido na criação. É calculado automaticamente.',
          });
        }

        if ('avaliacoes' in body) {
          return reply.status(400).send({
            success: false,
            error: 'Campo "avaliacoes" não é permitido na criação. É gerenciado automaticamente.',
          });
        }

        const { preco, estoque, categorias } = request.body;

        if (preco <= 0) {
          return reply.status(400).send({
            success: false,
            error: 'Preço deve ser maior que zero',
          });
        }

        if (estoque < 0) {
          return reply.status(400).send({
            success: false,
            error: 'Estoque não pode ser negativo',
          });
        }

        if (!categorias || categorias.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'Produto deve ter pelo menos uma categoria',
          });
        }

        const categoryRepository = new CategoryRepository(fastify);
        for (const categoryId of categorias) {
          const categoryExists = await categoryRepository.exists(categoryId);
          if (!categoryExists) {
            return reply.status(400).send({
              success: false,
              error: `Categoria com ID ${categoryId} não existe`,
            });
          }
        }

        const productRepository = new ProductRepository(fastify);

        fastify.log.info({ body: request.body }, 'Dados para criar produto');

        const product = await productRepository.create(request.body);
        fastify.log.info({ product }, 'Produto criado');

        try {
          const session = fastify.neo4j.session();
          await session.run(
            `MERGE (p:Produto {id_produto: $id_produto})
             SET p.nome = $nome,
                 p.preco = $preco,
                 p.marca = $marca,
                 p.estoque = $estoque,
                 p.criado_em = datetime($criado_em)
            `,
            {
              id_produto: product.id_produto,
              nome: product.nome,
              preco: product.preco,
              marca: product.marca,
              estoque: product.estoque,
              criado_em: (product.created_at || new Date()).toISOString(),
            },
          );

          if (Array.isArray(product.categorias)) {
            for (const categoriaId of product.categorias) {
              await session.run(
                `MERGE (p:Produto {id_produto: $id_produto})
                 MERGE (c:Categoria {id_categoria: $id_categoria})
                 MERGE (p)-[:PERTENCE_A]->(c)`,
                {
                  id_produto: product.id_produto,
                  id_categoria: categoriaId,
                },
              );
            }
          }
          await session.close();
          fastify.log.info(
            { id_produto: product.id_produto },
            'Produto criado/atualizado no Neo4j',
          );
        } catch (err) {
          fastify.log.error({ err }, 'Erro ao criar/atualizar produto no Neo4j');
        }

        return reply.status(201).send({
          success: true,
          data: product,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao criar produto',
        });
      }
    },
  });
};

export default createProductRoutes;
