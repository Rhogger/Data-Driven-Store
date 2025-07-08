import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { PurchasesByUtmRepository } from '@/repositories/purchases-by-utm/PurchasesByUtmRepository';

interface UsersByUtmParams {
  utmSource: string;
}

interface UsersByUtmQuery {
  limite?: number;
}

const getUsersByUtmSourceRoute = async (fastify: FastifyInstance) => {
  fastify.get('/analytics/users-by-utm/:utmSource', {
    schema: cassandraAnalyticsSchemas.getUsersByUtmSource(),
    handler: async (
      request: FastifyRequest<{ Params: UsersByUtmParams; Querystring: UsersByUtmQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const cassandraClient = request.server.cassandra;
        const purchasesRepo = new PurchasesByUtmRepository(cassandraClient);

        const { utmSource } = request.params;
        const { limite = 20 } = request.query;
        const compras = await purchasesRepo.findByCampaignSource(utmSource);

        const usuariosMap = new Map();

        compras.forEach((compra) => {
          const userId = compra.id_usuario.toString();
          const dataEvento = compra.timestamp_evento;

          if (usuariosMap.has(userId)) {
            const user = usuariosMap.get(userId);
            user.total_compras += 1;
            user.produtos_comprados.push(compra.id_produto);
            if (dataEvento < user.timestamp_primeira_compra) {
              user.timestamp_primeira_compra = dataEvento;
            }
          } else {
            usuariosMap.set(userId, {
              id_usuario: userId,
              timestamp_primeira_compra: dataEvento,
              total_compras: 1,
              produtos_comprados: [compra.id_produto],
            });
          }
        });

        const usuarios = Array.from(usuariosMap.values())
          .sort((a, b) => b.total_compras - a.total_compras)
          .slice(0, limite);

        return reply.code(200).send({
          success: true,
          data: usuarios,
        });
      } catch (error: any) {
        request.log.error('Erro ao buscar usuários por UTM:', error);

        return reply.code(500).send({
          success: false,
          error: {
            message: 'Erro interno do servidor ao buscar usuários por UTM',
            details: error.message,
          },
        });
      }
    },
  });
};

export default getUsersByUtmSourceRoute;
