import { FastifyInstance } from 'fastify';
import { PreferencesInput, PreferencesDocument } from './PreferencesInterfaces';
import { Collection, Db } from 'mongodb';

export class PreferencesRepository {
  private collection: Collection<PreferencesDocument>;

  constructor(fastify: FastifyInstance) {
    const db: Db = fastify.mongodb.db;
    this.collection = db.collection<PreferencesDocument>('perfis_usuario');
  }

  async createOrUpdate({ id_cliente, preferencias }: PreferencesInput): Promise<void> {
    await this.collection.updateOne({ id_cliente }, { $set: { preferencias } }, { upsert: true });
  }

  async getByClientId(id_cliente: number): Promise<PreferencesDocument | null> {
    return this.collection.findOne({ id_cliente });
  }
}
