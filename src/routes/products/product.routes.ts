import { FastifyPluginAsync } from 'fastify';
import listProductsRoutes from '@routes/products/endpoints/list_products.routes';
import getProductByIdRoutes from '@routes/products/endpoints/get_product_by_id.routes';
import createProductRoutes from '@routes/products/endpoints/create_product.routes';
import updateProductRoutes from '@routes/products/endpoints/update_product.routes';
import lowStockProductsRoutes from '@routes/products/endpoints/low_stock_products.routes';
import averagePriceByBrandRoutes from '@routes/products/endpoints/average_price_by_brand.routes';
import searchProductsRoutes from '@routes/products/endpoints/search_products.routes';
import addFieldByCategoryRoutes from '@routes/products/endpoints/add_field_by_category.routes';
import listProductReviewsRoutes from '@routes/products/endpoints/list_product_reviews.routes';
import { productRankingSchemas } from './schema/product-ranking.schemas';
import {
  getProductRankingHandler,
  incrementProductViewHandler,
} from './endpoints/product-ranking.routes';

const productRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(listProductsRoutes);
  await fastify.register(getProductByIdRoutes);
  await fastify.register(createProductRoutes);
  await fastify.register(updateProductRoutes);
  await fastify.register(lowStockProductsRoutes);
  await fastify.register(averagePriceByBrandRoutes);
  await fastify.register(searchProductsRoutes);
  await fastify.register(addFieldByCategoryRoutes);
  await fastify.register(listProductReviewsRoutes);

  // Ranking de produtos
  fastify.get('/products/ranking', {
    schema: productRankingSchemas.getRanking,
    handler: getProductRankingHandler,
  });

  // Incrementar visualização de produto
  fastify.post('/products/:id_produto/view', {
    schema: productRankingSchemas.incrementView,
    handler: incrementProductViewHandler,
  });
};

export default productRoutes;
