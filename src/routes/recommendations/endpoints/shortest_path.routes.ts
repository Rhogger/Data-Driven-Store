import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RecommendationRepository } from '@/repositories/recommendation/RecommendationRepository';

interface ShortestPathParams {
  produtoOrigemId: string;
  produtoDestinoId: string;
}

interface ShortestPathQuery {
  maxDistancia?: number;
  algoritmo?: 'shortest_path' | 'categories_only';
}

async function shortestPathHandler(
  this: FastifyInstance,
  request: FastifyRequest<{
    Params: ShortestPathParams;
    Querystring: ShortestPathQuery;
  }>,
  reply: FastifyReply,
) {
  try {
    const { produtoOrigemId, produtoDestinoId } = request.params;
    const { maxDistancia = 6, algoritmo = 'shortest_path' } = request.query;

    // Validação básica
    if (!produtoOrigemId || produtoOrigemId.trim() === '') {
      return reply.code(400).send({
        success: false,
        error: 'ID do produto de origem é obrigatório',
        details: 'O parâmetro produtoOrigemId não pode estar vazio',
      });
    }

    if (!produtoDestinoId || produtoDestinoId.trim() === '') {
      return reply.code(400).send({
        success: false,
        error: 'ID do produto de destino é obrigatório',
        details: 'O parâmetro produtoDestinoId não pode estar vazio',
      });
    }

    if (produtoOrigemId === produtoDestinoId) {
      return reply.code(400).send({
        success: false,
        error: 'Produtos de origem e destino devem ser diferentes',
        details: 'Não é possível calcular caminho entre o mesmo produto',
      });
    }

    if (maxDistancia < 1 || maxDistancia > 10) {
      return reply.code(400).send({
        success: false,
        error: 'Distância máxima inválida',
        details: 'A distância máxima deve estar entre 1 e 10',
      });
    }

    if (!['shortest_path', 'categories_only'].includes(algoritmo)) {
      return reply.code(400).send({
        success: false,
        error: 'Algoritmo inválido',
        details: 'O algoritmo deve ser "shortest_path" ou "categories_only"',
      });
    }

    // Instancia o repository
    const recommendationRepository = new RecommendationRepository(this);

    // Executa o algoritmo baseado no tipo escolhido
    const caminho = await recommendationRepository.getShortestPath(
      produtoOrigemId,
      produtoDestinoId,
      maxDistancia,
    );

    // Verifica se encontrou um caminho
    if (!caminho.caminho_encontrado) {
      return reply.code(404).send({
        success: false,
        error: 'Nenhum caminho encontrado entre os produtos especificados',
      });
    }

    // Resposta de sucesso
    reply.code(200).send({
      success: true,
      data: caminho,
    });
  } catch (error) {
    this.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor ao calcular caminho mais curto',
    });
  }
}

export { shortestPathHandler };
