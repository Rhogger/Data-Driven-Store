import { FastifyInstance } from 'fastify';
import redisPingRoute from '@/routes/database_tests/endpoints/redis_ping.routes';
import postgresPingRoute from '@/routes/database_tests/endpoints/postgres_ping.routes';
import mongodbPingRoute from '@/routes/database_tests/endpoints/mongodb_ping.routes';
import neo4jPingRoute from '@/routes/database_tests/endpoints/neo4j_ping.routes';
import cassandraPingRoute from '@/routes/database_tests/endpoints/cassandra_ping.routes';

export default async function databaseTestRoutes(fastify: FastifyInstance) {
  await redisPingRoute(fastify);
  await postgresPingRoute(fastify);
  await mongodbPingRoute(fastify);
  await neo4jPingRoute(fastify);
  await cassandraPingRoute(fastify);
}
