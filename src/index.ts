import app from './app';

const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000;

const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Servidor Fastify rodando em http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1); 
  }
};

start();