import { FastifyInstance } from 'fastify';
import getConversionFunnelRoute from '@routes/analytics/endpoints/conversion_funnel.routes';
import getWeeklyViewsRoute from '@routes/analytics/endpoints/weekly_views.routes';
import getTopSearchTermsRoute from '@routes/analytics/endpoints/top_search_terms.routes';
import getCampaignCTRRoute from '@routes/analytics/endpoints/campaign_ctr.routes';
import getUsersByUtmSourceRoute from '@routes/analytics/endpoints/users_by_utm.routes';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, message: 'Token inválido ou ausente.' });
    }
  });
  await fastify.register(getConversionFunnelRoute);
  await fastify.register(getWeeklyViewsRoute);
  await fastify.register(getTopSearchTermsRoute);
  await fastify.register(getCampaignCTRRoute);
  await fastify.register(getUsersByUtmSourceRoute);
}
