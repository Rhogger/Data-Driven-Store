import { FastifyPluginAsync } from 'fastify';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { productSchemas } from '@routes/products/schema/product.schemas';

const searchProductsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/products/search', {
    schema: productSchemas.search(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const { preco_min, preco_max, atributos } = request.query as Record<string, any>;

        const precoMinNum = preco_min !== undefined ? Number(preco_min) : undefined;
        const precoMaxNum = preco_max !== undefined ? Number(preco_max) : undefined;

        if (precoMinNum !== undefined && precoMaxNum !== undefined && precoMinNum > precoMaxNum) {
          return reply.status(400).send({
            success: false,
            error: 'O preço mínimo não pode ser maior que o preço máximo.',
          });
        }

        let atributosObj: Record<string, any> | undefined = undefined;
        if (atributos) {
          try {
            atributosObj = JSON.parse(atributos);
            if (typeof atributosObj !== 'object' || Array.isArray(atributosObj)) {
              return reply.status(400).send({
                success: false,
                error: 'O campo atributos deve ser um objeto JSON válido.',
              });
            }
          } catch {
            return reply.status(400).send({
              success: false,
              error:
                'O campo atributos deve ser um JSON válido. Exemplo: atributos={"processador":"i5"}',
            });
          }
        }

        const productRepository = new ProductRepository(fastify, fastify.neo4j, fastify.redis);
        const products = await productRepository.findByAttributesAndPriceRange({
          atributos: atributosObj,
          preco_min: precoMinNum,
          preco_max: precoMaxNum,
        });

        return reply.send({
          success: true,
          data: products,
        });
      } catch (error) {
        fastify.log.error(error, 'Erro ao buscar produtos');
        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor ao buscar produtos',
        });
      }
    },
  });
};

export default searchProductsRoutes;
