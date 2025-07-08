import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CustomerRepository } from '@repositories/customer/CustomerRepository';
import { CustomerInput } from '@repositories/customer/CustomerInterfaces';
import { authSchemas } from '@routes/auth/schema/auth.schemas';
import { PreferencesRepository } from '@repositories/preferences/PreferencesRepository';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
interface RegisterRequest {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
}

const registerRoute = async (fastify: FastifyInstance) => {
  fastify.post('/auth/register', {
    schema: authSchemas.register(),
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { nome, email, cpf, telefone, preferencias } = request.body as RegisterRequest & {
          preferencias: number[];
        };

        if (!nome || !email || !cpf || !telefone || !preferencias)
          return reply.status(400).send({
            success: false,
            error: 'Nome, email, CPF, telefone e preferencias são obrigatórios',
          });

        if (!Array.isArray(preferencias) || preferencias.length < 5)
          return reply.status(400).send({
            success: false,
            error: 'É obrigatório informar pelo menos 5 categorias de preferências',
          });

        const preferenciasSet = new Set(preferencias);
        if (preferenciasSet.size !== preferencias.length)
          return reply.status(400).send({
            success: false,
            error: 'Não é permitido repetir categorias nas preferências',
          });

        const categoryRepo = new CategoryRepository(fastify);

        const categoriasExistentes = (await categoryRepo.findAll()).map((cat) => cat.id_categoria);

        const categoriasExistentesSet = new Set(categoriasExistentes);

        const categoriasInvalidas = preferencias.filter((id) => !categoriasExistentesSet.has(id));

        if (categoriasInvalidas.length > 0)
          return reply.status(400).send({
            success: false,
            error: `As seguintes categorias não existem: ${categoriasInvalidas.join(', ')}`,
          });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
          return reply.status(400).send({
            success: false,
            error: 'Email inválido',
          });

        if (nome.trim().length < 2)
          return reply.status(400).send({
            success: false,
            error: 'Nome deve ter pelo menos 2 caracteres',
          });

        const cpfClean = cpf.replace(/\D/g, '');

        if (cpfClean.length !== 11)
          return reply.status(400).send({
            success: false,
            error: 'CPF deve ter 11 dígitos',
          });

        const phoneClean = telefone.replace(/\D/g, '');

        if (phoneClean.length < 10 || phoneClean.length > 11)
          return reply.status(400).send({
            success: false,
            error: 'Telefone deve ter entre 10 e 11 dígitos',
          });

        const customerRepo = new CustomerRepository(request.server);
        const existingCustomerByEmail = await customerRepo.findByEmail(email);
        if (existingCustomerByEmail)
          return reply.status(409).send({
            success: false,
            error: 'Email já está em uso',
          });

        const cpfExists = await customerRepo.existsByCpf(cpfClean);
        if (cpfExists)
          return reply.status(409).send({
            success: false,
            error: 'CPF já está em uso',
          });

        const telefoneExists = await customerRepo.existsByTelefone(phoneClean);
        if (telefoneExists)
          return reply.status(409).send({
            success: false,
            error: 'Telefone já está em uso',
          });

        const customerData: CustomerInput = {
          nome: nome.trim(),
          email: email.toLowerCase().trim(),
          cpf: cpfClean,
          telefone: phoneClean,
        };

        const newCustomer = await customerRepo.create(customerData);

        const preferencesRepo = new PreferencesRepository(request.server);
        await preferencesRepo.createOrUpdate({
          id_cliente: newCustomer.id_cliente,
          preferencias,
        });

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
        request.server.log.error(
          {
            err: error,
            message: error?.message,
            stack: error?.stack,
            body: request.body,
          },
          'Erro no cadastro detalhado',
        );

        if (error?.message?.includes('Email já está em uso'))
          return reply.status(409).send({
            success: false,
            error: 'Email já está em uso',
          });

        if (error?.message?.includes('CPF já está em uso'))
          return reply.status(409).send({
            success: false,
            error: 'CPF já está em uso',
          });

        if (error?.message?.includes('Telefone já está em uso'))
          return reply.status(409).send({
            success: false,
            error: 'Telefone já está em uso',
          });

        return reply.status(500).send({
          success: false,
          error: 'Erro interno do servidor',
        });
      }
    },
  });
};

export default registerRoute;
