import '@fastify/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id_cliente: string;
      email?: string;
      nome?: string;
      [key: string]: any;
    };
    jwtVerify: () => Promise<void>;
  }
}
