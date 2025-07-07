import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductViewRepository } from '@/repositories/product-view/ProductViewRepository';

interface RankingQuery {
  limit?: string;
}

export async function getProductRankingHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { limit } = request.query as RankingQuery;

    // Validar e definir limite (padrão: 10, máximo: 100)
    let limitNumber = 10;
    if (limit) {
      limitNumber = parseInt(limit, 10);
      if (isNaN(limitNumber) || limitNumber < 1) {
        return reply.status(400).send({
          success: false,
          error: 'Limite deve ser um número maior que 0',
        });
      }
      if (limitNumber > 100) {
        limitNumber = 100;
      }
    }

    const productViewRepo = new ProductViewRepository((request.server as any).redis);

    // Buscar ranking dos produtos mais vistos
    const ranking = await productViewRepo.getTopViewed(limitNumber);

    return reply.send({
      success: true,
      data: {
        ranking,
        total_produtos: ranking.length,
        limite_aplicado: limitNumber,
      },
    });
  } catch (error: any) {
    request.server.log.error('Erro ao buscar ranking de produtos:', error.message);
    return reply.status(500).send({
      success: false,
      error: 'Erro interno do servidor ao buscar ranking',
    });
  }
}

/**
 * Handler para incrementar visualização de produto
 */
export async function incrementProductViewHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id_produto } = request.params as { id_produto: string };

    if (!id_produto) {
      return reply.status(400).send({
        success: false,
        error: 'ID do produto é obrigatório',
      });
    }

    const productViewRepo = new ProductViewRepository((request.server as any).redis);

    // Incrementar visualização
    const newViewCount = await productViewRepo.incrementView(id_produto);

    // Buscar posição atual no ranking
    const currentRank = await productViewRepo.getProductRank(id_produto);

    return reply.send({
      success: true,
      data: {
        id_produto,
        total_visualizacoes: newViewCount,
        posicao_ranking: currentRank,
      },
    });
  } catch (error: any) {
    request.server.log.error('Erro ao incrementar visualização:', error.message);
    return reply.status(500).send({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}
