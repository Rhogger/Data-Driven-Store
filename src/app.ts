import Fastify from 'fastify';

const app = Fastify({
  logger: true
});

app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

export default app;