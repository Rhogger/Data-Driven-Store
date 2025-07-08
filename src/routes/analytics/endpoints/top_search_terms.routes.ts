import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cassandraAnalyticsSchemas } from '@routes/analytics/schema/cassandra-analytics.schemas';
import { SearchTermsAggregatedRepository } from '@/repositories/search-terms-aggregated/SearchTermsAggregatedRepository';

const getTopSearchTermsRoute = async (fastify: FastifyInstance) => {
  fastify.get('/analytics/top-search-terms', {
    schema: cassandraAnalyticsSchemas.getTopSearchTerms(),
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const cassandraClient = request.server.cassandra;
        const searchTermsRepo = new SearchTermsAggregatedRepository(cassandraClient);

        const termosMap = new Map<string, number>();
        const hoje = new Date();

        for (let i = 0; i < 30; i++) {
          const data = new Date();

          data.setDate(hoje.getDate() - i);

          const termosDia = await searchTermsRepo.findByDate(data);

          termosDia.forEach((termo) => {
            const termoAtual = termo.termo_busca;

            const contagem = Number(termo.total_contagem);

            if (termosMap.has(termoAtual))
              termosMap.set(termoAtual, termosMap.get(termoAtual)! + contagem);
            else termosMap.set(termoAtual, contagem);
          });
        }

        const termosOrdenados = Array.from(termosMap.entries())
          .map(([termo, total]) => ({ termo_busca: termo, total_buscas: total }))
          .sort((a, b) => b.total_buscas - a.total_buscas)
          .slice(0, 10)
          .map((termo, index) => ({ ...termo, posicao_ranking: index + 1 }));

        return reply.code(200).send({
          success: true,
          data: termosOrdenados,
        });
      } catch (error: any) {
        request.log.error('Erro ao buscar termos de busca:', error);

        return reply.code(500).send({
          success: false,
          error: {
            message: 'Erro interno do servidor ao buscar termos de busca',
            details: error.message,
          },
        });
      }
    },
  });
};

export default getTopSearchTermsRoute;
