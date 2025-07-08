import { FastifyRequest, FastifyReply } from 'fastify';
import { CustomerRepository } from '@repositories/customer/CustomerRepository';
import { CustomerInput } from '@repositories/customer/CustomerInterfaces';

interface RegisterRequest {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
}

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { nome, email, cpf, telefone } = request.body as RegisterRequest;

    if (!nome || !email || !cpf || !telefone) {
      return reply.status(400).send({
        success: false,
        error: 'Nome, email, CPF e telefone são obrigatórios',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({
        success: false,
        error: 'Email inválido',
      });
    }

    if (nome.trim().length < 2) {
      return reply.status(400).send({
        success: false,
        error: 'Nome deve ter pelo menos 2 caracteres',
      });
    }

    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      return reply.status(400).send({
        success: false,
        error: 'CPF deve ter 11 dígitos',
      });
    }

    const phoneClean = telefone.replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      return reply.status(400).send({
        success: false,
        error: 'Telefone deve ter entre 10 e 11 dígitos',
      });
    }

    const customerRepo = new CustomerRepository(request.server);

    const existingCustomer = await customerRepo.findByEmail(email);
    if (existingCustomer) {
      return reply.status(409).send({
        success: false,
        error: 'Email já está em uso',
      });
    }

    const customerData: CustomerInput = {
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      cpf: cpfClean,
      telefone: phoneClean,
    };

    const newCustomer = await customerRepo.create(customerData);

    return reply.status(201).send({
      success: true,
      data: {
        cliente: {
          id_cliente: newCustomer.id_cliente,
          nome: newCustomer.nome,
          email: newCustomer.email,
          cpf: newCustomer.cpf,
          telefone: newCustomer.telefone,
          created_at: newCustomer.created_at,
        },
      },
      message: 'Cliente cadastrado com sucesso',
    });
  } catch (error: any) {
    request.server.log.error('Erro no cadastro:', error.message);

    if (error.message.includes('Email já está em uso')) {
      return reply.status(409).send({
        success: false,
        error: 'Email já está em uso',
      });
    }

    if (error.message.includes('CPF já está em uso')) {
      return reply.status(409).send({
        success: false,
        error: 'CPF já está em uso',
      });
    }

    if (error.message.includes('Telefone já está em uso')) {
      return reply.status(409).send({
        success: false,
        error: 'Telefone já está em uso',
      });
    }

    return reply.status(500).send({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}
