import { FastifyPluginAsync } from 'fastify';
import { productSchemas } from '@routes/products/schema/product.schemas';
import { CreateProductService } from '@services/products/create_product';

const createProductRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/products', {
    schema: productSchemas.create(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const service = new CreateProductService(fastify);
        const product = await service.createProductAtomic(request.body);
        return reply.status(201).send({ success: true, data: product });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ success: false, error: error.message });
      }
    },
  });
};

export default createProductRoutes;
