import { FastifyInstance } from 'fastify';
import { productRecommendationSchemas } from '@routes/recommendations/schema/recommendation.schemas';
import { frequentlyBoughtTogetherHandler } from '@routes/recommendations/endpoints/frequently_bought_together.routes';
import { userBasedRecommendationsHandler } from '@routes/recommendations/endpoints/user_based_recommendations.routes';
import { categoryBasedRecommendationsHandler } from '@routes/recommendations/endpoints/category_based_recommendations.routes';
import { shortestPathHandler } from '@routes/recommendations/endpoints/shortest_path.routes';
import { influencerCustomersHandler } from '@routes/recommendations/endpoints/influencer_customers.routes';

export default async function recommendationRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, message: 'Token inválido ou ausente.' });
    }
  });

  fastify.get('/recommendations/:produtoId/frequently-bought-together', {
    schema: productRecommendationSchemas.frequentlyBoughtTogether(),
    preHandler: fastify.authenticate,
    handler: frequentlyBoughtTogetherHandler,
  });

  fastify.get('/recommendations/customers/:clienteId/user-based', {
    schema: productRecommendationSchemas.userBasedRecommendations(),
    preHandler: fastify.authenticate,
    handler: userBasedRecommendationsHandler,
  });

  fastify.get('/recommendations/customers/:clienteId/category-based', {
    schema: productRecommendationSchemas.categoryBasedRecommendations(),
    preHandler: fastify.authenticate,
    handler: categoryBasedRecommendationsHandler,
  });

  fastify.get('/recommendations/shortest-path/:produtoOrigemId/:produtoDestinoId', {
    schema: productRecommendationSchemas.shortestPath(),
    preHandler: fastify.authenticate,
    handler: shortestPathHandler,
  });

  fastify.get('/recommendations/influencers', {
    schema: productRecommendationSchemas.influencerCustomers(),
    preHandler: fastify.authenticate,
    handler: influencerCustomersHandler,
  });
}
