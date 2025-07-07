import { FastifyInstance } from 'fastify';
import { cassandraAnalyticsSchemas } from './schema/cassandra-analytics.schemas';
import { getConversionFunnelHandler } from './endpoints/conversion-funnel.routes';
import { getWeeklyViewsHandler } from './endpoints/weekly-views.routes';
import { getTopSearchTermsHandler } from './endpoints/top-search-terms.routes';
import { getCampaignCTRHandler } from './endpoints/campaign-ctr.routes';
import { getUsersByUtmSourceHandler } from './endpoints/users-by-utm.routes';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  // 1. Funil de conversão
  fastify.get('/analytics/conversion-funnel', {
    schema: cassandraAnalyticsSchemas.getConversionFunnel(),
    handler: getConversionFunnelHandler,
  });

  // 2. Visualizações por dia na última semana
  fastify.get('/analytics/weekly-views', {
    schema: cassandraAnalyticsSchemas.getWeeklyViews(),
    handler: getWeeklyViewsHandler,
  });

  // 3. Top 10 termos de busca
  fastify.get('/analytics/top-search-terms', {
    schema: cassandraAnalyticsSchemas.getTopSearchTerms(),
    handler: getTopSearchTermsHandler,
  });

  // 4. Taxa de cliques (CTR) de campanha
  fastify.get('/analytics/campaign-ctr/:origemCampanha', {
    schema: cassandraAnalyticsSchemas.getCampaignCTR(),
    handler: getCampaignCTRHandler,
  });

  // 5. Usuários por UTM source que compraram
  fastify.get('/analytics/users-by-utm/:utmSource', {
    schema: cassandraAnalyticsSchemas.getUsersByUtmSource(),
    handler: getUsersByUtmSourceHandler,
  });
}
