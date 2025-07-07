import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RecommendationRepository } from '@/repositories/recommendation/RecommendationRepository';

interface FrequentlyBoughtTogetherParams {
  produtoId: string;
}

interface FrequentlyBoughtTogetherQuery {
  limite?: number;
}

async function frequentlyBoughtTogetherHandler(
  this: FastifyInstance,
  request: FastifyRequest<{
    Params: FrequentlyBoughtTogetherParams;
    Querystring: FrequentlyBoughtTogetherQuery;
  }>,
  reply: FastifyReply,
) {
  try {
    const { produtoId } = request.params;
    const { limite = 10 } = request.query;

    // Validação básica
    if (!produtoId || produtoId.trim() === '') {
      return reply.code(400).send({
        success: false,
        error: 'ID do produto é obrigatório',
        details: 'O parâmetro produtoId não pode estar vazio',
      });
    }

    if (limite < 1 || limite > 50) {
      return reply.code(400).send({
        success: false,
        error: 'Limite inválido',
        details: 'O limite deve estar entre 1 e 50',
      });
    }

    // Instancia o repository
    const recommendationRepository = new RecommendationRepository(this);

    // Executa a recomendação baseada no tipo de algoritmo
    const recomendacoes = await recommendationRepository.getFrequentlyBoughtTogether(
      produtoId,
      limite,
    );

    // Verifica se encontrou recomendações
    if (recomendacoes.length === 0) {
      return reply.code(404).send({
        success: false,
        error: 'Nenhuma recomendação encontrada',
      });
    }

    // Resposta de sucesso
    reply.code(200).send({
      success: true,
      data: {
        produto_base: produtoId,
        total_recomendacoes: recomendacoes.length,
        algoritmo: 'frequencia',
        recomendacoes,
      },
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor ao processar recomendações',
    });
  }
}

export { frequentlyBoughtTogetherHandler };
