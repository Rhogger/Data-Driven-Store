import { FastifyRequest, FastifyReply } from 'fastify';
import { CustomerRepository } from '@repositories/customer/CustomerRepository';
import { SessionRepository } from '@repositories/session/SessionRepository';

interface LoginRequest {
  email: string;
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email } = request.body as LoginRequest;

    if (!email) {
      return reply.status(400).send({
        success: false,
        error: 'Email é obrigatório',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({
        success: false,
        error: 'Email inválido',
      });
    }

    const customerRepo = new CustomerRepository(request.server);
    const sessionRepo = new SessionRepository(request.server);

    const customer = await customerRepo.findByEmail(email);

    if (!customer) {
      return reply.status(404).send({
        success: false,
        error: 'Cliente não encontrado. É necessário criar uma conta.',
        action: 'create_account',
      });
    }

    const sessionData = await sessionRepo.create(customer.id_cliente.toString());

    return reply.send({
      success: true,
      data: {
        cliente: {
          email,
        },
        sessao: {
          token: sessionData.token,
          refresh_token: sessionData.refresh_token,
        },
      },
      message: 'Login realizado com sucesso',
    });
  } catch (error: any) {
    request.server.log.error('Erro no login:', error.message);
    return reply.status(500).send({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}
