import { FastifyInstance } from 'fastify';
import { authSchemas } from './schema/auth.schemas';
import { loginHandler } from './endpoints/login.routes';
import { registerHandler } from './endpoints/register.routes';

export default async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/auth/login', {
    schema: authSchemas.login,
    handler: loginHandler,
  });

  // Cadastro
  fastify.post('/auth/register', {
    schema: authSchemas.register,
    handler: registerHandler,
  });
}
