import { FastifyRequest, FastifyReply } from 'fastify';
import { PurchasesByUtmRepository } from '@/repositories/purchases-by-utm/PurchasesByUtmRepository';
import { EventsByDateRepository } from '@/repositories/events-by-date/EventsByDateRepository';

interface CampaignCTRParams {
  origemCampanha: string;
}

export async function getCampaignCTRHandler(
  request: FastifyRequest<{ Params: CampaignCTRParams }>,
  reply: FastifyReply,
) {
  try {
    const cassandraClient = request.server.cassandra;
    const purchasesRepo = new PurchasesByUtmRepository(cassandraClient);
    const eventsRepo = new EventsByDateRepository(cassandraClient);

    const { origemCampanha } = request.params;

    // Buscar compras da campanha
    const compras = await purchasesRepo.findByCampaignSource(origemCampanha);
    const totalCliques = compras.length;

    // Buscar visualizações da campanha nos últimos 30 dias
    let totalVisualizacoes = 0;
    const hoje = new Date();

    for (let i = 0; i < 30; i++) {
      const data = new Date();
      data.setDate(hoje.getDate() - i);

      const eventosDia = await eventsRepo.findByDate(data);
      const visualizacoesCampanha = eventosDia.filter(
        (evento) =>
          evento.origem_campanha === origemCampanha && evento.tipo_evento === 'visualizacao',
      );

      totalVisualizacoes += visualizacoesCampanha.length;
    }

    // Calcular CTR
    const ctrPercentual = totalVisualizacoes > 0 ? (totalCliques / totalVisualizacoes) * 100 : 0;

    const dataInicio = new Date();
    dataInicio.setDate(hoje.getDate() - 30);

    return reply.code(200).send({
      success: true,
      data: {
        origem_campanha: origemCampanha,
        total_visualizacoes: totalVisualizacoes,
        total_cliques: totalCliques,
        ctr_percentual: Number(ctrPercentual.toFixed(2)),
        periodo_analise: `${dataInicio.toISOString().split('T')[0]} até ${hoje.toISOString().split('T')[0]}`,
      },
    });
  } catch (error: any) {
    request.log.error('Erro ao calcular CTR da campanha:', error);
    return reply.code(500).send({
      success: false,
      error: {
        message: 'Erro interno do servidor ao calcular CTR da campanha',
        details: error.message,
      },
    });
  }
}
