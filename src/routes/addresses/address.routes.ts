import { FastifyInstance } from 'fastify';
import createAddressRoute from '@routes/addresses/endpoints/create_address.routes';
import getAddressByIdRoute from '@routes/addresses/endpoints/get_address_by_id.routes';
import getAddressesByClientIdRoute from '@routes/addresses/endpoints/get_addresses_by_client_id.routes';

const addressRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook('onRequest', async (request, _reply) => {
    await request.jwtVerify();
  });
  await fastify.register(createAddressRoute);
  await fastify.register(getAddressByIdRoute);
  await fastify.register(getAddressesByClientIdRoute);
};

export default addressRoutes;
