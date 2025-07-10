import { FastifyInstance } from 'fastify';
import { UserPreference } from './UserPreferenceInterfaces';
import { Db, MongoClient } from 'mongodb';

export class UserPreferenceRepository {
  private mongodb: {
    client: MongoClient;
    db: Db;
  };

  constructor(fastify: FastifyInstance) {
    this.mongodb = fastify.mongodb;
  }

  private get mongoCollection() {
    return this.mongodb.db.collection('user_preferences');
  }

  async findClientIdsByPreference(categoryId: number): Promise<number[]> {
    const query = { preferencias: categoryId };
    const preferences = await this.mongoCollection
      .find<UserPreference>(query, { projection: { id_cliente: 1, _id: 0 } })
      .toArray();
    return preferences.map((p) => p.id_cliente);
  }
}
