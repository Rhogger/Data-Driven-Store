import Fastify from 'fastify';
import postgresConnector from '@plugins/postgresConnector';
import mongodbConnector from '@plugins/mongodbConnector';
import apiRoutes from '@routes/index';

const app = Fastify({
  logger: true,
});

// Registrar Swagger
app.register(import('@fastify/swagger'), {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Data Driven Store API',
      description: 'API para uma loja orientada por dados com múltiplos bancos de dados',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
    ],
    tags: [
      { name: 'Health Check', description: 'Endpoints de verificação de saúde' },
      { name: 'Categories', description: 'Operações relacionadas a categorias' },
      { name: 'Products', description: 'Operações relacionadas a produtos' },
    ],
  },
});

// Registrar Swagger UI
app.register(import('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  staticCSP: true,
});

app.register(postgresConnector);
app.register(mongodbConnector);

app.register(apiRoutes, { prefix: '/api' });

export default app;
