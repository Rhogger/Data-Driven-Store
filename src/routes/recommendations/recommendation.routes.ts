import { FastifyInstance } from 'fastify';
import frequentlyBoughtTogetherRoutes from '@routes/recommendations/endpoints/frequently_bought_together.routes';
import userBasedRecommendationsRoutes from '@routes/recommendations/endpoints/user_based_recommendations.routes';
import categoryBasedRecommendationsRoutes from '@routes/recommendations/endpoints/category_based_recommendations.routes';
import shortestPathRoutes from '@routes/recommendations/endpoints/shortest_path.routes';
import influencerCustomersRoutes from '@routes/recommendations/endpoints/influencer_customers.routes';

export default async function recommendationRoutes(fastify: FastifyInstance) {
  fastify.register(frequentlyBoughtTogetherRoutes);

  fastify.register(userBasedRecommendationsRoutes);

  fastify.register(categoryBasedRecommendationsRoutes);

  fastify.register(shortestPathRoutes);

  fastify.register(influencerCustomersRoutes);
}
