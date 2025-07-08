import { FastifyInstance } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { getConversionFunnelHandler } from '@routes/analytics/endpoints/conversion-funnel.routes';
import { getWeeklyViewsHandler } from '@routes/analytics/endpoints/weekly-views.routes';
import { getTopSearchTermsHandler } from '@routes/analytics/endpoints/top-search-terms.routes';
import { getCampaignCTRHandler } from '@routes/analytics/endpoints/campaign-ctr.routes';
import { getUsersByUtmSourceHandler } from '@routes/analytics/endpoints/users-by-utm.routes';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, _reply) => {
    await request.jwtVerify();
  });

  fastify.get('/analytics/conversion-funnel', {
    schema: cassandraAnalyticsSchemas.getConversionFunnel(),
    handler: getConversionFunnelHandler,
  });

  fastify.get('/analytics/weekly-views', {
    schema: cassandraAnalyticsSchemas.getWeeklyViews(),
    handler: getWeeklyViewsHandler,
  });

  fastify.get('/analytics/top-search-terms', {
    schema: cassandraAnalyticsSchemas.getTopSearchTerms(),
    handler: getTopSearchTermsHandler,
  });

  fastify.get('/analytics/campaign-ctr/:origemCampanha', {
    schema: cassandraAnalyticsSchemas.getCampaignCTR(),
    handler: getCampaignCTRHandler,
  });

  fastify.get('/analytics/users-by-utm/:utmSource', {
    schema: cassandraAnalyticsSchemas.getUsersByUtmSource(),
    handler: getUsersByUtmSourceHandler,
  });
}
