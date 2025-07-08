import { FastifyInstance } from 'fastify';

import addItemToCartRoutes from '@routes/cart/endpoints/add_item_to_cart.routes';
import removeItemFromCartRoutes from '@routes/cart/endpoints/remove_item_from_cart.routes';
import clearCartRoutes from '@routes/cart/endpoints/clear_cart.routes';
import getCartByClientRoute from '@routes/cart/endpoints/get_cart_by_client.routes';
import getAllCartsRoute from '@routes/cart/endpoints/get_all_carts.routes';

export default async function cartRoutes(fastify: FastifyInstance) {
  fastify.register(addItemToCartRoutes);
  fastify.register(removeItemFromCartRoutes);
  fastify.register(clearCartRoutes);
  fastify.register(getCartByClientRoute);
  fastify.register(getAllCartsRoute);
}
