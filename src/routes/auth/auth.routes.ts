import { FastifyInstance } from 'fastify';
import { authSchemas } from '@routes/auth/schema/auth.schemas';
import { loginHandler } from '@routes/auth/endpoints/login.routes';
import { registerHandler } from '@routes/auth/endpoints/register.routes';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/login', {
    schema: authSchemas.login,
    handler: loginHandler,
  });

  fastify.post('/auth/register', {
    schema: authSchemas.register,
    handler: registerHandler,
  });
}
