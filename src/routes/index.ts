import { FastifyInstance } from 'fastify';

// Health-Check
import healthCheckRoutes from '@routes/health-check/health-check.routes';

// Database Tests
import databaseTestRoutes from '@routes/database-tests/database-tests.routes';

// Auth
import authRoutes from '@routes/auth/auth.routes';

// Address
import addressRoutes from '@routes/addresses/address.routes';

// Categories
import categoryRoutes from '@routes/categories/category.routes';

// Products
import productRoutes from '@routes/products/product.routes';

// Orders
import orderRoutes from '@routes/orders/order.routes';

// Product Recommendations
import recommendationRoutes from '@routes/recommendations/recommendation.routes';

// Customer Recommendations - TODO: Implementar

// Analytics
import userRoutes from '@routes/users/user.routes';
import topCustomersReportRoutes from '@routes/reports/top-customers-report.routes';
import analyticsRoutes from '@routes/analytics/analytics.routes';

export default async function apiRoutes(fastify: FastifyInstance) {
  // Health-Check
  fastify.register(healthCheckRoutes);

  // Database Tests
  fastify.register(databaseTestRoutes);

  // Auth
  fastify.register(authRoutes);

  // Address
  fastify.register(addressRoutes);

  // Categories
  fastify.register(categoryRoutes);

  // Products
  fastify.register(productRoutes);

  // Orders
  fastify.register(orderRoutes);

  // Product Recommendations
  fastify.register(recommendationRoutes);

  // Analytics
  fastify.register(userRoutes);
  fastify.register(topCustomersReportRoutes);
  fastify.register(analyticsRoutes);
}
