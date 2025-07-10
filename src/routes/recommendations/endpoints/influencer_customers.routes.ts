import { FastifyPluginAsync } from 'fastify';
import { RecommendationRepository } from '@repositories/recommendation/RecommendationRepository';
import { CustomerRepository } from '@repositories/customer/CustomerRepository';
import { productRecommendationSchemas } from '@routes/recommendations/schema/recommendation.schemas';

interface InfluencerCustomersQuery {
  limite?: number;
  minAvaliacoes?: number;
  periodoAnalise?: number;
}

const influencerCustomersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Querystring: InfluencerCustomersQuery;
  }>('/recommendations/influencers', {
    schema: productRecommendationSchemas.influencerCustomers(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const { limite = 10, minAvaliacoes = 5, periodoAnalise = 30 } = request.query;

        if (limite < 1 || limite > 100) {
          return reply.code(400).send({
            success: false,
            error: 'Limite inválido',
            details: 'O limite deve estar entre 1 e 100',
          });
        }

        if (minAvaliacoes < 1 || minAvaliacoes > 50) {
          return reply.code(400).send({
            success: false,
            error: 'Número mínimo de avaliações inválido',
            details: 'O número mínimo de avaliações deve estar entre 1 e 50',
          });
        }

        if (periodoAnalise < 7 || periodoAnalise > 90) {
          return reply.code(400).send({
            success: false,
            error: 'Período de análise inválido',
            details: 'O período de análise deve estar entre 7 e 90 dias',
          });
        }

        const recommendationRepository = new RecommendationRepository(fastify);
        const customerRepository = new CustomerRepository(fastify);

        const influenciadores = await recommendationRepository.getInfluencerCustomers(limite);

        if (influenciadores.length === 0) {
          return reply.code(404).send({
            success: false,
            error: 'Nenhum cliente influenciador encontrado com os critérios especificados',
          });
        }

        const ids = influenciadores.map((i) => Number(i.id_cliente));
        const clientes = await customerRepository.findByIds(ids);
        const nomesPorId = new Map(clientes.map((c) => [String(c.id_cliente), c.nome]));

        const influenciadoresComNome = influenciadores.map((i) => ({
          ...i,
          nome: nomesPorId.get(String(i.id_cliente)) || null,
        }));

        reply.code(200).send({
          success: true,
          data: {
            total_influenciadores: influenciadoresComNome.length,
            criterios_analise: {
              min_avaliacoes: minAvaliacoes,
              periodo_analise_dias: periodoAnalise,
            },
            influenciadores: influenciadoresComNome,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          error: 'Erro interno do servidor ao identificar clientes influenciadores',
        });
      }
    },
  });
};

export default influencerCustomersRoutes;
