import { FastifyInstance } from 'fastify';
import createAddressRoute from '@routes/addresses/endpoints/create_address.routes';
import getAddressByIdRoute from '@routes/addresses/endpoints/get_address_by_id.routes';
import getAddressesByCustomerIdRoute from '@/routes/addresses/endpoints/get_addresses_by_customer_id.routes';
import updateAddressRoute from '@routes/addresses/endpoints/update_address.routes';
import deleteAddressRoute from './endpoints/delete_address.routes';

const addressRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(createAddressRoute);
  await fastify.register(getAddressByIdRoute);
  await fastify.register(getAddressesByCustomerIdRoute);
  await fastify.register(updateAddressRoute);
  await fastify.register(deleteAddressRoute);
};

export default addressRoutes;
