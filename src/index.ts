import 'dotenv/config';
import app from './app';

const PORT = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 3000;

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