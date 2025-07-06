import Fastify from 'fastify';
import postgresConnector from '@plugins/postgresConnector';
import mongodbConnector from '@plugins/mongodbConnector';
import redisConnector from '@plugins/redisConnector';
import neo4jConnector from '@plugins/neo4jConnector';
import cassandraConnector from '@plugins/cassandraConnector';
import apiRoutes from '@routes/index';

const app = Fastify({
  logger: true,
  pluginTimeout: 60000, // 60 segundos para plugins (permite retry do Cassandra)
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
      { name: 'Orders', description: 'Operações relacionadas a pedidos' },
      { name: 'Reports', description: 'Relatórios e análises' },
      { name: 'Database Tests', description: 'Endpoints para testar conexões com bancos de dados' },
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
app.register(redisConnector);
app.register(neo4jConnector);
app.register(cassandraConnector);

app.register(apiRoutes, { prefix: '/api' });

export default app;
