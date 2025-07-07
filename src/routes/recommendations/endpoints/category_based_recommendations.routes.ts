import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ProductRecommendationRepository } from '@/repositories/neo4j/recommendations/ProductRecommendationRepository';

interface CategoryBasedRecommendationParams {
  clienteId: string;
}

interface CategoryBasedRecommendationQuery {
  limite?: number;
  diasAnalise?: number;
}

async function categoryBasedRecommendationsHandler(
  this: FastifyInstance,
  request: FastifyRequest<{
    Params: CategoryBasedRecommendationParams;
    Querystring: CategoryBasedRecommendationQuery;
  }>,
  reply: FastifyReply,
) {
  try {
    const { clienteId } = request.params;
    const { limite = 10, diasAnalise = 30 } = request.query;

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

    if (diasAnalise < 7 || diasAnalise > 90) {
      return reply.code(400).send({
        success: false,
        error: 'Período de análise inválido',
        details: 'O período de análise deve estar entre 7 e 90 dias',
      });
    }

    // Instancia o repository
    const recommendationRepository = new ProductRecommendationRepository(this.neo4j);

    // Executa a recomendação baseada em categorias visualizadas
    const recomendacoes = await recommendationRepository.findCategoryBasedRecommendations(
      clienteId,
      limite,
      diasAnalise,
    );

    // Verifica se encontrou recomendações
    if (recomendacoes.length === 0) {
      return reply.code(404).send({
        success: false,
        error: 'Nenhuma recomendação encontrada',
        details: 'Cliente não visualizou categorias recentemente ou não há produtos disponíveis',
      });
    }

    // Resposta de sucesso
    reply.code(200).send({
      success: true,
      data: {
        cliente_id: clienteId,
        total_recomendacoes: recomendacoes.length,
        periodo_analise_dias: diasAnalise,
        algoritmo: 'categoria_visualizada',
        recomendacoes,
      },
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor ao processar recomendações baseadas em categorias',
    });
  }
}

export { categoryBasedRecommendationsHandler };
