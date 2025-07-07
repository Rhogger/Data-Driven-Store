import { FastifyRequest, FastifyReply } from 'fastify';
import { SearchTermsAggregatedRepository } from '@repositories/cassandra/search-terms-aggregated/SearchTermsAggregatedRepository';

export async function getTopSearchTermsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const cassandraClient = request.server.cassandra;
    const searchTermsRepo = new SearchTermsAggregatedRepository(cassandraClient);

    // Buscar termos dos últimos 30 dias
    const termosMap = new Map<string, number>();
    const hoje = new Date();

    for (let i = 0; i < 30; i++) {
      const data = new Date();
      data.setDate(hoje.getDate() - i);

      const termosDia = await searchTermsRepo.findByDate(data);

      termosDia.forEach((termo) => {
        const termoAtual = termo.termo_busca;
        const contagem = Number(termo.total_contagem);

        if (termosMap.has(termoAtual)) {
          termosMap.set(termoAtual, termosMap.get(termoAtual)! + contagem);
        } else {
          termosMap.set(termoAtual, contagem);
        }
      });
    }

    // Converter para array e ordenar
    const termosOrdenados = Array.from(termosMap.entries())
      .map(([termo, total]) => ({ termo_busca: termo, total_buscas: total }))
      .sort((a, b) => b.total_buscas - a.total_buscas)
      .slice(0, 10) // Top 10
      .map((termo, index) => ({
        ...termo,
        posicao_ranking: index + 1,
      }));

    return reply.code(200).send({
      success: true,
      data: {
        total_termos_analisados: termosMap.size,
        termos_mais_buscados: termosOrdenados,
      },
    });
  } catch (error: any) {
    request.log.error('Erro ao buscar top termos de busca:', error);
    return reply.code(500).send({
      success: false,
      error: {
        message: 'Erro interno do servidor ao buscar termos de busca',
        details: error.message,
      },
    });
  }
}
