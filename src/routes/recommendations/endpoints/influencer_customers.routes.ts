import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RecommendationRepository } from '@/repositories/recommendation/RecommendationRepository';

interface InfluencerCustomersQuery {
  limite?: number;
  minAvaliacoes?: number;
  periodoAnalise?: number;
}

async function influencerCustomersHandler(
  this: FastifyInstance,
  request: FastifyRequest<{
    Querystring: InfluencerCustomersQuery;
  }>,
  reply: FastifyReply,
) {
  try {
    const { limite = 10, minAvaliacoes = 5, periodoAnalise = 30 } = request.query;

    // Validação básica
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

    // Instancia o repository
    const recommendationRepository = new RecommendationRepository(this);

    // Busca clientes influenciadores
    const influenciadores = await recommendationRepository.getInfluencerCustomers(limite);

    // Verifica se encontrou influenciadores
    if (influenciadores.length === 0) {
      return reply.code(404).send({
        success: false,
        error: 'Nenhum cliente influenciador encontrado com os critérios especificados',
      });
    }

    // Resposta de sucesso
    reply.code(200).send({
      success: true,
      data: {
        total_influenciadores: influenciadores.length,
        criterios_analise: {
          min_avaliacoes: minAvaliacoes,
          periodo_analise_dias: periodoAnalise,
        },
        influenciadores,
      },
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor ao identificar clientes influenciadores',
    });
  }
}

export { influencerCustomersHandler };
