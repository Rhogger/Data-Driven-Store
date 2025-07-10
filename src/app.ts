import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import authenticate from '@/plugins/authenticate';
import postgresConnector from '@plugins/postgresConnector';
import mongodbConnector from '@plugins/mongodbConnector';
import redisConnector from '@plugins/redisConnector';
import neo4jConnector from '@plugins/neo4jConnector';
import cassandraConnector from '@plugins/cassandraConnector';
import apiRoutes from '@routes/index';

const app = Fastify({
  logger: true,
  pluginTimeout: 60000,
});

app.register(authenticate);
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

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
      { name: 'Database Tests', description: 'Endpoints para testar conexões com bancos de dados' },
      { name: 'Auth', description: 'Autenticação e autorização de usuários' },
      { name: 'Addresses', description: 'Gerenciamento de endereços de clientes' },
      { name: 'Categories', description: 'Operações relacionadas a categorias' },
      { name: 'Products', description: 'Operações relacionadas a produtos' },
      { name: 'Carts', description: 'Operações relacionadas a carrinhos de compras' },
      { name: 'Orders', description: 'Operações relacionadas a pedidos' },
      {
        name: 'Product Recommendations',
        description: 'Endpoints para recomendações de produtos',
      },
      {
        name: 'Customer Recommendations',
        description: 'Endpoints para recomendações de clientes',
      },
      { name: 'Analytics', description: 'Relatórios e análises de dados' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {},
    },
    security: [{ bearerAuth: [] }],
  },
});

app.register(import('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'none',
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
