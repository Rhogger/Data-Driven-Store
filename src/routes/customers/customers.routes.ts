import { FastifyPluginAsync } from 'fastify';
import listCustomersRoutes from './endpoints/list_customers.routes';
import getCustomerByIdRoutes from './endpoints/get_customer_by_id.routes';

const customersRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(listCustomersRoutes);
  await fastify.register(getCustomerByIdRoutes);
};

export default customersRoutes;
