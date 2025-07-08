import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';

export default fp(async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      fastify.log.info({ user: request.user }, 'Payload JWT');
      if (!request.user || typeof request.user.id_cliente !== 'number') {
        fastify.log.warn({ user: request.user }, 'JWT inválido ou id_cliente ausente');
        return reply
          .status(401)
          .send({ success: false, message: 'Token inválido ou usuário não autenticado.' });
      }
    } catch {
      return reply
        .status(401)
        .send({ success: false, message: 'Token inválido ou usuário não autenticado.' });
    }
  });
});
