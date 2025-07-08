import { FastifyInstance } from 'fastify';
import { UserPreference } from './UserPreferenceInterfaces';

export class UserPreferenceRepository {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  private get mongoCollection() {
    return this.fastify.mongodb.db.collection('user_preferences');
  }

  async findClientIdsByPreference(categoryId: number): Promise<number[]> {
    const query = { preferencias: categoryId };
    const preferences = await this.mongoCollection
      .find<UserPreference>(query, { projection: { id_cliente: 1, _id: 0 } })
      .toArray();
    return preferences.map((p) => p.id_cliente);
  }
}
