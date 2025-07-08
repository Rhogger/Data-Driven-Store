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

  /**
   * Encontra IDs de clientes que têm uma preferência de categoria específica.
   * @param categoryId - O ID da categoria a ser buscada.
   * @param limit - O número de resultados a retornar.
   * @param skip - O número de resultados a pular (para paginação).
   * @returns Um objeto contendo a lista de IDs de clientes e o total de correspondências.
   */
  async findClientIdsByPreference(
    categoryId: number,
    limit: number,
    skip: number,
  ): Promise<{ clientIds: number[]; total: number }> {
    const query = { preferencias: categoryId };

    const total = await this.mongoCollection.countDocuments(query);

    if (total === 0) {
      return { clientIds: [], total: 0 };
    }

    const preferences = await this.mongoCollection
      .find<UserPreference>(query, { projection: { id_cliente: 1, _id: 0 } })
      .skip(skip)
      .limit(limit)
      .toArray();

    const clientIds = preferences.map((p) => p.id_cliente);

    return { clientIds, total };
  }
}
