import { FastifyInstance } from 'fastify';
import getConversionFunnelRoute from '@routes/analytics/endpoints/conversion_funnel.routes';
import getWeeklyViewsRoute from '@routes/analytics/endpoints/weekly_views.routes';
import getTopSearchTermsRoute from '@routes/analytics/endpoints/top_search_terms.routes';
import getCampaignCTRRoute from '@routes/analytics/endpoints/campaign_ctr.routes';
import getUsersByUtmSourceRoute from '@routes/analytics/endpoints/users_by_utm.routes';
import topCustomersReportRoutes from '@/routes/analytics/endpoints/top_customers_report.routes';
import billingByCategoryReportRoutes from '@/routes/analytics/endpoints/billing_by_category_report.routes';
import findByPreferenceRoutes from '@/routes/analytics/endpoints/find_by_preference.routes';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  await fastify.register(getConversionFunnelRoute);
  await fastify.register(getWeeklyViewsRoute);
  await fastify.register(getTopSearchTermsRoute);
  await fastify.register(getCampaignCTRRoute);
  await fastify.register(getUsersByUtmSourceRoute);
  await fastify.register(topCustomersReportRoutes);
  await fastify.register(billingByCategoryReportRoutes);
  await fastify.register(findByPreferenceRoutes);
}
