import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

async function healthCheckHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    reply.code(200).send({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({ message: 'Erro interno do servidor.' });
  }
}

export default async function healthCheckRoutes(fastify: FastifyInstance) {
  fastify.get('/health-check', healthCheckHandler);
}
