import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RecommendationRepository } from '@/repositories/recommendation/RecommendationRepository';

interface UserBasedRecommendationsParams {
  clienteId: string;
}

interface UserBasedRecommendationsQuery {
  limite?: number;
  minSimilaridade?: number;
}

async function userBasedRecommendationsHandler(
  this: FastifyInstance,
  request: FastifyRequest<{
    Params: UserBasedRecommendationsParams;
    Querystring: UserBasedRecommendationsQuery;
  }>,
  reply: FastifyReply,
) {
  try {
    const { clienteId } = request.params;
    const { limite = 10, minSimilaridade = 0.1 } = request.query;

    // Validação básica
    if (!clienteId || clienteId.trim() === '') {
      return reply.code(400).send({
        success: false,
        error: 'ID do cliente é obrigatório',
        details: 'O parâmetro clienteId não pode estar vazio',
      });
    }

    if (limite < 1 || limite > 50) {
      return reply.code(400).send({
        success: false,
        error: 'Limite inválido',
        details: 'O limite deve estar entre 1 e 50',
      });
    }

    if (minSimilaridade < 0 || minSimilaridade > 1) {
      return reply.code(400).send({
        success: false,
        error: 'Similaridade mínima inválida',
        details: 'A similaridade mínima deve estar entre 0 e 1',
      });
    }

    // Instancia o repository
    const recommendationRepository = new RecommendationRepository(this);

    // Executa a recomendação baseada em clientes similares
    const recomendacoes = await recommendationRepository.getUserBasedRecommendations(
      clienteId,
      limite,
      minSimilaridade,
    );

    // Verifica se encontrou recomendações
    if (recomendacoes.length === 0) {
      return reply.code(404).send({
        success: false,
        error: 'Nenhuma recomendação encontrada para este cliente',
      });
    }

    // Resposta de sucesso
    reply.code(200).send({
      success: true,
      data: {
        cliente_base: clienteId,
        total_recomendacoes: recomendacoes.length,
        min_similaridade: minSimilaridade,
        recomendacoes,
      },
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor ao processar recomendações user-based',
    });
  }
}

export { userBasedRecommendationsHandler };
