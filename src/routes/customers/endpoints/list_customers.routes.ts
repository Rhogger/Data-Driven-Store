import { FastifyPluginAsync } from 'fastify';
import { CustomerRepository } from '@repositories/customer/CustomerRepository';
import { customerSchemas } from '@routes/customers/schema/customer.schemas';

const listCustomersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/customers', {
    schema: customerSchemas.list(),
    handler: async (_request, reply) => {
      const customerRepository = new CustomerRepository(fastify);
      const customers = await customerRepository.findAll();
      return reply.send({ success: true, data: customers });
    },
  });
};

export default listCustomersRoutes;
