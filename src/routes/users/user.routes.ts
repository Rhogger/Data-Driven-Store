import { FastifyInstance } from 'fastify';
import findByPreferenceRoutes from './endpoints/find_by_preference.routes';

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.register(findByPreferenceRoutes);
}
