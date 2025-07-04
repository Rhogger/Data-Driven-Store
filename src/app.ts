import Fastify from 'fastify';
import postgresConnector from '@plugins/postgresConnector';
import mongodbConnector from '@plugins/mongodbConnector';
import apiRoutes from '@routes/index';

const app = Fastify({
  logger: true,
});

app.register(postgresConnector);
app.register(mongodbConnector);

app.register(apiRoutes, { prefix: '/api' });

export default app;
