import { FastifyInstance } from 'fastify';
import loginRoute from '@routes/auth/endpoints/login.routes';
import registerRoute from '@routes/auth/endpoints/register.routes';

const authRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(loginRoute);
  await fastify.register(registerRoute);
};

export default authRoutes;
