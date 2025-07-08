import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    jwtVerify: () => Promise<void>;
  }
}
