import { FastifyPluginAsync } from 'fastify';
import { CustomerRepository } from '@repositories/customer/CustomerRepository';
import { customerSchemas } from '@routes/customers/schema/customer.schemas';

const getCustomerByIdRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/customers/:id', {
    schema: customerSchemas.getById(),
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };

      const customerRepository = new CustomerRepository(fastify);

      const customer = await customerRepository.findById(id);

      if (!customer)
        return reply.status(404).send({ success: false, message: 'Cliente não encontrado' });

      return reply.send({ success: true, data: customer });
    },
  });
};

export default getCustomerByIdRoutes;
