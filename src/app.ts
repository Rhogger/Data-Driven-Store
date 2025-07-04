import Fastify from 'fastify';
import postgresConnector from '@plugins/postgresConnector';
import apiRoutes from '@routes/index';

const app = Fastify({
  logger: true,
});

app.register(postgresConnector);

app.register(apiRoutes, { prefix: '/api' });

export default app;
