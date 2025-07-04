import { FastifyPluginAsync } from 'fastify';
import getProductRoutes from './get_product.routes';
import createProductRoutes from './create_product.routes';
import updateProductRoutes from './update_product.routes';

const productRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(getProductRoutes);
  await fastify.register(createProductRoutes);
  await fastify.register(updateProductRoutes);
};

export default productRoutes;
