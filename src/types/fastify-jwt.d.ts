import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id_cliente: number; [key: string]: any };
    user: { id_cliente: number; [key: string]: any };
  }
}
