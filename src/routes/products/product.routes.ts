import { FastifyPluginAsync } from 'fastify';
import listProductsRoutes from '@routes/products/endpoints/list_products.routes';
import getProductByIdRoutes from '@routes/products/endpoints/get_product_by_id.routes';
import createProductRoutes from '@routes/products/endpoints/create_product.routes';
import updateProductRoutes from '@routes/products/endpoints/update_product.routes';
import lowStockProductsRoutes from '@routes/products/endpoints/low_stock_products.routes';
import getProductRankingRoute from '@routes/products/endpoints/get_product_ranking.routes';
import incrementProductViewRoute from '@routes/products/endpoints/increment_product_view.routes';

const productRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(listProductsRoutes);
  await fastify.register(getProductByIdRoutes);
  await fastify.register(createProductRoutes);
  await fastify.register(updateProductRoutes);
  await fastify.register(lowStockProductsRoutes);
  await fastify.register(getProductRankingRoute);
  await fastify.register(incrementProductViewRoute);
};

export default productRoutes;
